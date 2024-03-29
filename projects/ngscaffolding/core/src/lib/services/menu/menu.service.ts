import { RolesService } from '../rolesService/roles.service';
import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { timeout, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { LoggingService } from '../logging/logging.service';
import { AppSettingsQuery } from '../appSettings/appSettings.query';
import { UserAuthenticationQuery } from '../userAuthentication/userAuthentication.query';
import { MenuStore } from './menu.store';
import { MenuQuery } from './menu.query';
import { AppSettings } from '@ngscaffolding/models';
import {
  CoreMenuItem,
  MenuTypes,
} from '@ngscaffolding/models';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  routeSubject = new BehaviorSubject<Array<Route>>([]);

  private readonly methodName = 'MenuService';
  private masterListMenu: Array<CoreMenuItem> = [];
  private routes: Array<Route> = [];

  private menuItems: CoreMenuItem[] = [];

  private apiHome: string;


  private httpInFlight = false;
  private lockCount = 0;
  private menuDownloaded = false;

  constructor(
    private http: HttpClient,
    private menuStore: MenuStore,
    private menuQuery: MenuQuery,
    private appSettingsQuery: AppSettingsQuery,
    private authQuery: UserAuthenticationQuery,
    private log: LoggingService,
    public rolesService: RolesService
  ) {
    // Wait for settings, then load from server
    combineLatest([
      this.authQuery.authenticated$,
      this.appSettingsQuery.selectEntity(AppSettings.apiHome),
      this.appSettingsQuery.selectEntity(AppSettings.isMobile),
    ]).subscribe(([authenticated, apiHome, isMobile]) => {
      if (authenticated && apiHome && isMobile && !this.menuDownloaded) {
        this.apiHome = apiHome.value;
        if (!this.httpInFlight) {
          this.downloadMenuItems(isMobile.value || false);
        }
      } else if (!authenticated) {
        this.menuDownloaded = false;
        this.lockCount = 0;
      }
    });
  }

  public setCurrent(name: string): void {
    this.menuStore.setActive(name);
  }

  public reset(): void {
    this.menuStore.setActive(null);
  }

  public addMenuItemsFromCode(
    menuItems: CoreMenuItem[],
    roles: string[] = null
  ): void {
    this.addLock();
    this.log.info('Adding MenuItems menuItems', this.methodName, menuItems);

    // Wait till user authorised
    this.authQuery.authenticated$.subscribe((authorised) => {
      if (authorised) {
        // Save for later use
        this.addMenuItems(menuItems);
        this.removeLock();
      }
    });
  }

  public getFolders(): CoreMenuItem[] {
    return this.menuQuery.getAll({
      filterBy: [(entity) => entity.type === MenuTypes.Folder],
    });
  }

  public delete(menuItem: CoreMenuItem): Observable<any> {
    return new Observable<any>((observer) => {
      const obs = this.http.delete(
        `${this.apiHome}/api/v1/menuitems/${menuItem.name}`
      );
      obs.subscribe(
        () => {
          // Remove from our store
          this.menuStore.remove(menuItem.name);

          // Remove from Tree
          const existingMenus = JSON.parse(
            JSON.stringify(this.menuQuery.getValue())
          ).menuItems;
          let parentMenu: CoreMenuItem;
          if (menuItem.parent) {
            parentMenu = existingMenus.find(
              (menu) =>
                menu.name &&
                menu.name.toLowerCase() === menuItem.parent.toLowerCase()
            );
          }

          const foundIndex = (parentMenu.items as CoreMenuItem[]).findIndex(
            (childMenu) => childMenu.name && childMenu.name === menuItem.name
          );
          parentMenu.items.splice(foundIndex, 1);

          // Update tree and tell the world
          this.menuStore.update({ menuItems: existingMenus });
          observer.next();
          observer.complete();
        },
        (err) => {
          observer.error(err);
        }
      );
    });
  }

  public saveMenuItem(menuItem: CoreMenuItem): Observable<any> {
    return this.http.post<CoreMenuItem>(
      this.apiHome + '/api/v1/menuitems',
      menuItem
    );
  }

  public updateExistingMenuItem(menuItem: CoreMenuItem): void {
    // Is this existing?
    const existing = this.menuQuery.hasEntity(menuItem.name);
    if (existing) {
      this.menuStore.upsert(menuItem.name, menuItem);
    } else {
      // Add to reference list of menus
      this.menuStore.add(menuItem);
    }

    const existingMenus = JSON.parse(JSON.stringify(this.menuQuery.getAll()));
    let parentMenu: CoreMenuItem;
    if (menuItem.parent) {
      parentMenu = existingMenus.find(
        (menu) => menu.name.toLowerCase() === menuItem.parent.toLowerCase()
      );
    }
    // Add to treeview for menu rendering
    if (!parentMenu.items || !Array.isArray(parentMenu.items)) {
      parentMenu.items = [];
    }
    if (existing) {
      const foundIndex = (parentMenu.items as CoreMenuItem[]).findIndex(
        (childMenu) => childMenu.name === menuItem.name
      );
      parentMenu.items[foundIndex] = menuItem;
    } else {
      (parentMenu.items as CoreMenuItem[]).push(menuItem);
    }

    // Update tree and tell the world
    this.menuStore.update({ menuItems: existingMenus });
  }

  public addRoute(route: Route, roles: string[] = null): void {
    this.log.info(`Adding Route ${JSON.stringify(route)}`);
    this.routes.push(route);

    if (roles !== null) {
      this.rolesService.addRouteRoles(route.path, roles);
    }
  }

  public downloadMenuItems(isMobile: boolean): void {
    // Mark loading status
    this.addLock();
    this.httpInFlight = true;

    const newMenuItems: CoreMenuItem[] = [];

    this.http
      .get<Array<CoreMenuItem>>(
        `${this.apiHome}/api/v1/menuitems?mobile=${isMobile}`
      )
      .pipe(
        timeout(60000),
        finalize(() => {
          this.httpInFlight = false;
          this.removeLock();
        })
      )
      .subscribe(
        (downloadedMenuItems) => {
          this.log.info(`Downloaded MenuItems`);
          this.menuDownloaded = true;

          this.addMenuItems(downloadedMenuItems);
        },
        (err) => {
          this.log.error('Failed to download Menu');
        }
      );
  }

  public addMenuItems(newMenuItems: CoreMenuItem[], findInTree = false): void {
    // Clone so we can amend
    const fetchedMenuItems = this.menuQuery.getValue().menuItems || [];
    this.menuItems = JSON.parse(JSON.stringify(fetchedMenuItems));

    this.calculateRouterLinks(newMenuItems);

    // Add to flat reference List
    this.addMenuItemsToReferenceList(newMenuItems);
    if (findInTree) {
      newMenuItems.forEach((loopMenuItem) => {
        this.upsertMenuItemToExistingTree(loopMenuItem);
      });
    } else {
      newMenuItems.forEach((loopMenuItem) => {
        if (loopMenuItem.isQuickAdd || loopMenuItem.isQuickMenu) {
          this.addNewQuickMenu(loopMenuItem);
        } else {
          this.addNewMenuItemToEntities(this.menuItems, loopMenuItem);
        }
      });
    }

    // Remove the unatuhorised
    this.menuItems = this.removeUnauthorisedMenuItems(this.menuItems);

    this.menuStore.update({ menuItems: this.menuItems });
  }

  private calculateRouterLinks(menuItems: CoreMenuItem[]): void {
    if (menuItems) {
      menuItems.forEach((menuItem) => {
        if (!menuItem.routerLink) {
          // Need to create our routerLink
          switch (menuItem.type) {
            case MenuTypes.Dashboard: {
              menuItem.routerLink = `dashboard/dash/${menuItem.name}`;
              break;
            }
            case MenuTypes.Datagrid: {
              menuItem.routerLink = `datagrid/grid/${menuItem.name}`;
              break;
            }
            case MenuTypes.Folder: {
              // No router link here
              break;
            }
            default: {
              menuItem.routerLink = menuItem.name;
            }
          }
        }
        if (menuItem.items) {
          this.calculateRouterLinks(menuItem.items as CoreMenuItem[]);
        }
      });
    }
  }

  private removeLock(): void {
    this.lockCount--;
    this.log.info(
      `MENU Service: Locks on Loading`,
      this.methodName,
      this.lockCount
    );

    if (this.lockCount === 0) {
      this.menuStore.setLoading(false);
    }
  }
  private addLock(): void {
    this.lockCount++;
    this.log.info(
      `MENU Service: Locks on Loading`,
      this.methodName,
      this.lockCount
    );
    this.menuStore.setLoading(true);
  }
  // Iterative Call
  private addMenuItemsToReferenceList(menuItems: CoreMenuItem[]): void {
    menuItems.forEach((menuItem) => {
      // Add to Entity Store
      this.menuStore.upsert(menuItem.name, menuItem);
      if (menuItem.items && Array.isArray(menuItem.items)) {
        this.addMenuItemsToReferenceList(menuItem.items as Array<CoreMenuItem>);
      }
    });
  }

  private removeUnauthorisedMenuItems(
    menuItems: CoreMenuItem[]
  ): CoreMenuItem[] {
    const user = this.authQuery.getValue();
    let userRoles: string[] = [];
    if (user && user.userDetails) {
      userRoles = user.userDetails.role;
    }

    const removingMenus: string[] = [];
    let returnMenus: CoreMenuItem[] = JSON.parse(JSON.stringify(menuItems));

    returnMenus.forEach(menuItem => {

      let removingThis = false;

      // makes sure roles is array
      let checkingRoles = [];

      if (!menuItem.roles) {
        checkingRoles = [];
      } else if (Array.isArray(menuItem.roles)) {
        checkingRoles = [...menuItem.roles];
      } else {
        checkingRoles = [menuItem.roles];
      }

      // Is this role protected
      if (checkingRoles && checkingRoles.length > 0) {
        if (
          userRoles &&
          checkingRoles.filter(
            (allowedRole) => userRoles.indexOf(allowedRole) !== -1
          ).length === 0
        ) {
          // No Authority. Remove
          removingThis = true;
          removingMenus.push(menuItem.name);
        }
      }

      if (!removingThis && menuItem.items) {
        menuItem.items = this.removeUnauthorisedMenuItems(
          menuItem.items as CoreMenuItem[]
        );
      }

    });

    if (removingMenus.length > 0) {
      returnMenus = menuItems.filter(
        (menu) =>
          removingMenus.findIndex((remove) => remove === menu.name) === -1
      );
    }

    return returnMenus;
  }


  private upsertMenuItemToExistingTree(newMenuItem: CoreMenuItem): void {
    const menuItems = [...this.menuItems];
    if (!newMenuItem.parent || newMenuItem.parent === '') {
      // Root menu item
      let existing = menuItems.find((menu) => menu.name === newMenuItem.name);
      if (existing) {
        existing = { ...newMenuItem };
      } else {
        menuItems.push({ ...newMenuItem });
      }
    } else {
      // Submenu item
      const parent = menuItems.find((menu) => menu.name === newMenuItem.parent);
      if (parent) {
        let existing = (parent.items as CoreMenuItem[]).find(
          (menu) => menu.name === newMenuItem.name
        );
        if (existing) {
          existing = { ...newMenuItem };
        } else {
          (parent.items as CoreMenuItem[]).push({ ...newMenuItem });
        }
      }
    }
    this.menuItems = menuItems;
  }

  private addNewQuickMenu(newMenuItem: CoreMenuItem): void {
    let calcRouterLink: string | string[];
    // Router bits
    if (
      newMenuItem.routerLink &&
      (newMenuItem.routerLink as string).indexOf(',') > -1
    ) {
      calcRouterLink = (newMenuItem.routerLink as string).split(',');
    } else {
      calcRouterLink = newMenuItem.routerLink;
    }

    const createdMenuItem: CoreMenuItem = {
      ...newMenuItem,
      routerLink: calcRouterLink,
    };

    if (newMenuItem.isQuickAdd) {
      const quickAdds = this.menuQuery.getValue().addItems || [];
      this.menuStore.update(state => ({
        addItems: [...quickAdds, createdMenuItem]
      }));
    } else {
      const quickItems = this.menuQuery.getValue().quickItems || [];
      this.menuStore.update(state => ({
        quickItems: [...quickItems, createdMenuItem]
      }));
    }
  }

  private addNewMenuItemToEntities(
    targetMenu: CoreMenuItem[],
    newMenuItem: CoreMenuItem
  ): void {
    let calcRouterLink: string | string[];

    // Don't add if we already know about this
    if (
      targetMenu &&
      !targetMenu.find((menu) => menu.name === newMenuItem.name)
    ) {
      // Router bits
      if (
        newMenuItem.routerLink &&
        (newMenuItem.routerLink as string).indexOf(',') > -1
      ) {
        calcRouterLink = (newMenuItem.routerLink as string).split(',');
      } else {
        calcRouterLink = newMenuItem.routerLink;
      }

      const createdMenuItem: CoreMenuItem = {
        ...newMenuItem,
        routerLink: calcRouterLink,
      };

      targetMenu.push(createdMenuItem);

      if (newMenuItem.items && newMenuItem.items.length > 0) {
        createdMenuItem.items = [];
        const castItems = newMenuItem.items as CoreMenuItem[];
        castItems.forEach((menuItem) => {
          this.addNewMenuItemToEntities(
            createdMenuItem.items as CoreMenuItem[],
            menuItem
          );
        });
      }
    }
  }
}

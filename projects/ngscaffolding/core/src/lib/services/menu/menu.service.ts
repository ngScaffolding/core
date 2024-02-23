import { RolesService } from '../rolesService/roles.service';
import { Injectable } from '@angular/core';
import { Route } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { timeout, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { LoggingService } from '../logging/logging.service';

import { AppSettings } from '@ngscaffolding/models';
import { CoreMenuItem, MenuTypes } from '@ngscaffolding/models';
import { UserAuthenticationService } from '../userAuthentication/userAuthentication.service';
import { AppSettingsService } from '../appSettings/appSettings.service';
import { BaseStateService } from '../base-state.service';

export interface MenuState {
  menuItems?: CoreMenuItem[];
  addItems?: CoreMenuItem[];
  quickItems?: CoreMenuItem[];
  referenceMenuItems?: CoreMenuItem[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuService extends BaseStateService<MenuState> {
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
    private log: LoggingService,
    public rolesService: RolesService,
    public authService: UserAuthenticationService,
    public appSettingsService: AppSettingsService
  ) {
    super({
      menuItems: [],
      addItems: [],
      quickItems: [],
      referenceMenuItems: [],
    } as MenuState);

    // Wait for settings, then load from server
    combineLatest([
      this.authService.authenticated$,
      this.appSettingsService.select(AppSettings.apiHome),
      this.appSettingsService.select(AppSettings.isMobile),
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

  public addMenuItemsFromCode(
    menuItems: CoreMenuItem[],
    roles: string[] = null
  ): void {
    this.addLock();
    this.log.info('Adding MenuItems menuItems', this.methodName, menuItems);

    // Wait till user authorised
    this.authService.authenticated$.subscribe((authorised) => {
      if (authorised) {
        // Save for later use
        this.addMenuItems(menuItems);
        this.removeLock();
      }
    });
  }

  public getFolders(): CoreMenuItem[] {
    return this.menuItems.filter((entity) => entity.type === MenuTypes.Folder);
  }

  public saveMenuItem(menuItem: CoreMenuItem): Observable<any> {
    return this.http.post<CoreMenuItem>(
      this.apiHome + '/api/v1/menuitems',
      menuItem
    );
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
    const fetchedMenuItems = this.menuItems || [];
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

    this.setState({ menuItems: this.menuItems });
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
      this.setLoading(false);
    }
  }
  private addLock(): void {
    this.lockCount++;
    this.log.info(
      `MENU Service: Locks on Loading`,
      this.methodName,
      this.lockCount
    );
    this.setLoading(true);
  }
  // Iterative Call
  private addMenuItemsToReferenceList(menuItems: CoreMenuItem[]): void {
    menuItems.forEach((menuItem) => {
      // Add to Entity Store
      const existing = this.getState().referenceMenuItems || [];
      existing.push(menuItem);
      this.updateState({referenceMenuItems: existing});
      if (menuItem.items && Array.isArray(menuItem.items)) {
        this.addMenuItemsToReferenceList(menuItem.items as Array<CoreMenuItem>);
      }
    });
  }

  private removeUnauthorisedMenuItems(
    menuItems: CoreMenuItem[]
  ): CoreMenuItem[] {
    const user = this.authService.getState();
    let userRoles: string[] = [];
    if (user && user.userDetails) {
      userRoles = user.userDetails.role;
    }

    const removingMenus: string[] = [];
    let returnMenus: CoreMenuItem[] = JSON.parse(JSON.stringify(menuItems));

    returnMenus.forEach((menuItem) => {
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
      const quickAdds = this.getState().addItems || [];
      this.updateState({
        addItems: [...quickAdds, createdMenuItem],
      });
    } else {
      const quickItems = this.getState().quickItems || [];
      this.updateState({
        quickItems: [...quickItems, createdMenuItem],
      });
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

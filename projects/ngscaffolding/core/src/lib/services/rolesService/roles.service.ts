import { Injectable } from '@angular/core';
import { UserAuthenticationQuery } from '../userAuthentication/userAuthentication.query';
import { RolesQuery } from './roles.query';
import { RolesStore } from './roles.store';
import { AppSettingsQuery } from '../appSettings/appSettings.query';
import { combineLatest } from 'rxjs';
import { take, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { DataSourceService } from '../dataSource/dataSource.service';
import { AppSettings } from '@ngscaffolding/models';
import { SystemDataSourceNames } from '@ngscaffolding/models';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private routeRoles = new Map<string, string[]>();
  private apiHome: string;

  constructor(
    private http: HttpClient,
    private rolesQuery: RolesQuery,
    private appSettingsQuery: AppSettingsQuery,
    private dataSourceService: DataSourceService,
    private rolesStore: RolesStore,
    public authQuery: UserAuthenticationQuery
  ) {
    // First Time load away
    this.rolesStore.setLoading(false);

    // Wait for settings, then load from server
    combineLatest(this.authQuery.authenticated$, this.appSettingsQuery.selectEntity(AppSettings.apiHome))
      .subscribe(([authenticated, apiHome]) => {
        if (authenticated && apiHome) {
          this.apiHome = apiHome.value;
          this.rolesQuery
            .selectLoading()
            .pipe(take(1))
            .subscribe(loading => {
              if (!loading) {
                this.downloadRoles();
              }
            });
        } else if (!authenticated) {
          this.rolesStore.remove();
        }
      });
  }

  public downloadRoles() {
    // Mark loading status
    this.rolesStore.setLoading(true);

    this.dataSourceService
      .getDataSource({ name: SystemDataSourceNames.ROLES_SELECT })
      .pipe(
        finalize(() => {
          this.rolesStore.setLoading(false);
        })
      )
      .subscribe(results => {
        if (results && !results.error) {
          this.rolesStore.add(results.jsonData);
          this.rolesStore.setLoading(false);
        }
      });
  }

  // Checks if the current user is in this role.
  public isInRole(role: string): boolean {
    const currentUser = this.authQuery.getValue().userDetails;
    if (currentUser && currentUser.role) {
      return currentUser.role.indexOf(role) > -1;
    } else {
      return false;
    }
  }

  // Checks if the current user is in one of these roles.
  public isInRoles(roles: string[]): boolean {
    let result = false;
    const currentUser = this.authQuery.getValue().userDetails;
    if (currentUser && currentUser.role) {
      roles.forEach(role => {
        if (currentUser.role.indexOf(role) > -1) {
          result = true;
        }
      });
    }
    return result;
  }

  // Repository of Roles: Routes
  public addRouteRoles(route: string, roles: string[]) {
    this.routeRoles.set(route, roles);
  }

  public getRouteRoles(route: string): string[] {
    return this.routeRoles.get(route);
  }
}

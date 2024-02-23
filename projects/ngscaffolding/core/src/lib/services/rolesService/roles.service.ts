import { Injectable } from '@angular/core';

import { combineLatest } from 'rxjs';
import { take, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { DataSourceService } from '../dataSource/dataSource.service';
import { AppSettings, Role } from '@ngscaffolding/models';
import { SystemDataSourceNames } from '@ngscaffolding/models';
import { BaseStateArrayService } from '../base-state-array.service';
import { UserAuthenticationService } from '../userAuthentication/userAuthentication.service';
import { AppSettingsService } from '../appSettings/appSettings.service';

@Injectable({
  providedIn: 'root'
})
export class RolesService extends BaseStateArrayService<Role> {
  private routeRoles = new Map<string, string[]>();
  private apiHome: string;

  constructor(
    private http: HttpClient,
    private dataSourceService: DataSourceService,
    public authService: UserAuthenticationService,
    public appSettingsService: AppSettingsService
  ) {
    super([], 'name');
    // First Time load away
    this.setLoading(false);

    // Wait for settings, then load from server
    combineLatest(this.authService.authenticated$, this.appSettingsService.getValue(AppSettings.apiHome))
      .subscribe(([authenticated, apiHome]) => {
        if (authenticated && apiHome) {
          this.apiHome = apiHome.toString()
          this.selectLoading()
            .pipe(take(1))
            .subscribe(loading => {
              if (!loading) {
                this.downloadRoles();
              }
            });
        } else if (!authenticated) {
          this.resetState();
        }
      });
  }

  public downloadRoles() {
    // Mark loading status
    this.setLoading(true);

    this.dataSourceService
      .getDataSource({ name: SystemDataSourceNames.ROLES_SELECT })
      .pipe(
        finalize(() => {
          this.setLoading(false);
        })
      )
      .subscribe(results => {
        if (results && !results.error) {
          this.setState(results.jsonData);
          this.setLoading(false);
        }
      });
  }

  // Checks if the current user is in this role.
  public isInRole(role: string): boolean {
    const currentUser = this.authService.getState().userDetails;
    if (currentUser && currentUser.role) {
      return currentUser.role.indexOf(role) > -1;
    } else {
      return false;
    }
  }

  // Checks if the current user is in one of these roles.
  public isInRoles(roles: string[]): boolean {
    let result = false;
    const currentUser = this.authService.getState().userDetails;
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

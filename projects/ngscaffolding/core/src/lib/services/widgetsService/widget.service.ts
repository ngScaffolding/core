import { RolesService } from '@ngscaffolding/core';
import { Injectable } from '@angular/core';
import { combineLatest } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { LoggingService } from '@ngscaffolding/core';

import { AppSettings } from '@ngscaffolding/models';
import { WidgetModelBase } from '@ngscaffolding/models';
import { BaseStateArrayService } from '../base-state-array.service';
import { AppSettingsService } from '@ngscaffolding/core';
import { UserAuthenticationService } from '@ngscaffolding/core';


@Injectable({
  providedIn: 'root'
})
export class WidgetService extends BaseStateArrayService<WidgetModelBase> {
  private className = 'core.WidgetService';

  private apiHome = '';

  constructor(
    private http: HttpClient,

    private AppSettingsService: AppSettingsService,
    private authService: UserAuthenticationService,
    private log: LoggingService,
    public rolesService: RolesService
  ) {
    super([], 'name','Widget');

    // First Time load away
    this.setLoading(false);

    // Wait for settings, then load from server
    combineLatest(this.authService.authenticated$, this.AppSettingsService.getValue(AppSettings.apiHome))
      .subscribe(([authenticated, apiHome]) => {
        if (authenticated && apiHome) {
          this.apiHome = apiHome.toString();
          this.selectLoading()
            .pipe(take(1))
            .subscribe(loading => {
              if (!loading) {
                this.downloadWidgetItems();
              }
            });
        } else if (!authenticated) {
          this.resetState();
        }
      });
  }
  public downloadWidgetItems() {
    // Mark loading status
    this.setLoading(true);

    this.http
      .get<Array<WidgetModelBase>>(this.apiHome + '/api/v1/widgets')
      .pipe(
        finalize(() => {
          this.setLoading(false);
        })
      )
      .subscribe(widgetItems => {
        this.setAllState(widgetItems);
      });
  }
}

import { Injectable, Type } from '@angular/core';

import { LoggingService } from '../logging/logging.service';
import { HttpClient } from '@angular/common/http';
import { AppSettingsStore } from './appSettings.store';
import { AppSettingsQuery } from './appSettings.query';
import { Observable } from 'rxjs';
import { timeout, retry } from 'rxjs/operators';
import {
  AppSettings,
  AppSettingsValue,
} from '@ngscaffolding/models';

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {

  public loading$: Observable<boolean>;

  private className = 'AppSettingsService';

  constructor(
    private appSettingsStore: AppSettingsStore,
    private appSettingsQuery: AppSettingsQuery,
    private logger: LoggingService,
    private http: HttpClient
  ) {
    console.log('AppSettingsService Constructor');
  }

  public setValue(name: string, value: any): void {
    if (this.appSettingsQuery.hasEntity(name)) {
      this.appSettingsStore.update(name, { name, value });
    } else {
      this.appSettingsStore.add({ name, value });
    }

    if (name === AppSettings.apiHome) {
      this.loadFromServer(value.toString());
    }
  }

  public getValue(name: string): any {
    if (this.appSettingsQuery.hasEntity(name)) {
      return this.appSettingsQuery.getEntity(name).value;
    } else {
      return null;
    }
  }

  public setValues(settings: any): void {
    // Mark store as loading
    this.appSettingsStore.setLoading(true);
    this.appSettingsStore.update({ isInitialised: false });

    // Load values
    if (settings) {
      Object.keys(settings).forEach((key) => {
        // Setting Value Here
        this.logger.info(
          `[${this.className}.loadSettings] Setting Value ${key} = ${settings[key]}`
        );
        this.setValue(key, settings[key]);
      });
    }

    this.appSettingsStore.setLoading(false);
    this.appSettingsStore.update({ isInitialised: true });
  }

  public getBoolean(name: string): Observable<boolean> {
    return this.appSettingsQuery.selectEntity(name, (entity) => entity.value);
  }

  public getString(name: string): Observable<string> {
    return this.appSettingsQuery.selectEntity(name, (entity) => entity.value);
  }

  private loadFromServer(apiHome: string) {
    // Mark store as loading
    this.appSettingsStore.setLoading(true);

    // Load values from Server
    this.http
      .get<Array<AppSettingsValue>>(`${apiHome}/api/v1/appSettings`)
      .pipe(timeout(20000), retry(3))
      .subscribe(
        (appValues) => {
          if (appValues) {
            appValues.forEach((appValue) => {
              this.setValue(appValue.name, appValue.value);
            });
          }
          this.appSettingsStore.setLoading(false);
          this.appSettingsStore.update({ isInitialised: true });
        },
        (err) => {
          this.appSettingsStore.setLoading(false);
        }
      );
  }
}

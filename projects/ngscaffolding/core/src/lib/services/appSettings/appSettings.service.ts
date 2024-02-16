import { Injectable, Type } from '@angular/core';

import { LoggingService } from '../logging/logging.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout, retry, map } from 'rxjs/operators';
import { BaseStateService } from '../base-state.service';
import { AppSettings, AppSettingsValue } from '@ngscaffolding/models';

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService extends BaseStateService<AppSettingsValue> {

  private className = 'AppSettingsService';

  constructor(private logger: LoggingService, private http: HttpClient) {
    console.log('AppSettingsService Constructor');
    super({ value: {} });
  }

  public setValue(name: string, value: any): void {
    this.state[name] = value;
    this.stateUpdated.next(this.state);

    if (name === AppSettings.apiHome) {
      this.loadFromServer(value.toString());
    }
  }

  public getValue(name: string): any {
    if (this.state[name]) {
      return this.state[name];
    }
  }

  public setValues(settings: any): void {
    // Mark store as loading
    this.setLoading(true);

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

    this.setLoading(false);
  }

  public getBoolean(name: string): Observable<boolean> {
    return this.stateUpdated$.pipe(map((state) => state[name] as boolean));
  }

  public getString(name: string): Observable<string> {
    return this.stateUpdated$.pipe(map((state) => state[name] as string));
  }

  private loadFromServer(apiHome: string) {
    // Mark store as loading
    this.setLoading(true);

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
          this.setLoading(false);
        },
        (err) => {
          this.setLoading(false);
        }
      );
  }
}

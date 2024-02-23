import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest } from 'rxjs';

import { AppSettingsService } from '../appSettings/appSettings.service';

// Models
import { LoggingService } from '../logging/logging.service';
import { AppSettings } from '@ngscaffolding/models';
import {
  UserPreferenceValue,
  UserPreferenceDefinition,
} from '@ngscaffolding/models';
import { UserAuthenticationService } from '../userAuthentication/userAuthentication.service';
import { BaseStateArrayService } from '../base-state-array.service';

@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService extends BaseStateArrayService<UserPreferenceValue> {
  private readonly className = 'UserPreferencesService';
  private readonly prefix = 'preference_';
  private readonly storageKey = 'UserPreferences';

  private apiHome: string;
  private valuesDownloaded = false;
  private definitionsDownloaded = false;
  private httpInFlight = 0;

  constructor(
    private http: HttpClient,
    private logger: LoggingService,
    private userAuthService: UserAuthenticationService,
    private userPrefsService: UserPreferencesService,
    private appSettingsService: AppSettingsService
  ) {
    super([], 'name');
    // Wait for settings, then load from server
    combineLatest([
      this.userAuthService.authenticated$,
      this.appSettingsService.select(AppSettings.apiHome),
    ]).subscribe(([authenticated, apiHome]) => {
      if (
        authenticated &&
        apiHome &&
        !this.valuesDownloaded &&
        !this.definitionsDownloaded
      ) {
        this.apiHome = apiHome;
        if (!this.httpInFlight) {
          // Load User Prefs from Localstorage
          this.loadFromLocal();

          // Load Pref Defs from server
          this.getDefinitions();

          // Load User Prefs from Server
          this.getValues();
        }
      } else if (!authenticated) {
        // Clear Here as we logoff
        this.clearValues();
      }
    });
  }

  public deleteValue(name: string) {
    return new Observable<any>((observer) => {
      this.http
        .delete(
          `${this.appSettingsService.getValue(
            AppSettings.apiHome
          )}/api/v1/userpreferencevalue/${name}`
        )
        .subscribe(
          () => {
            // Remove and tell the world
            this.userPrefsService.remove(name);

            localStorage.removeItem(this.storageKey);
            this.saveToLocal();

            observer.next();
            observer.complete();
          },
          (err) => {
            observer.error(err);
          }
        );
    });
  }

  public getValues() {
    // Load values from Server
    this.httpInFlight++;
    this.http
      .get<Array<UserPreferenceValue>>(
        `${this.appSettingsService.getValue(
          AppSettings.apiHome
        )}/api/v1/userpreferencevalue`
      )
      .subscribe(
        (prefValues) => {
          if (prefValues) {
            prefValues.forEach((prefValue) => {
              this.userPrefsService.setState(prefValue);
            });
            this.userPrefsService.setLoading(false);
            this.httpInFlight--;
            this.valuesDownloaded = true;
          }
        },
        (err) => {
          this.httpInFlight--;
          this.logger.error(err, this.className, true);
        }
      );
  }

  public setValue(key: string, value: any): Observable<any> {
    return new Observable<any>((observer) => {
      this.http
        .post(
          `${this.appSettingsService.getValue(
            AppSettings.apiHome
          )}/api/v1/userpreferencevalue`,
          { name: key, value }
        )
        .subscribe(
          () => {
            const existingEntity = this.userPrefsService.getEntity(key);
            let newEntity: UserPreferenceValue = { userId: '', value: null };

            if (existingEntity) {
              newEntity = JSON.parse(JSON.stringify(existingEntity));
            } else {
              newEntity.name = key;
              newEntity.userId = this.userAuthService.getState().userDetails.userId;
            }

            newEntity.value = value;
            this.userPrefsService.setState(newEntity);

            observer.next();
            observer.complete();
          },
          (err) => {
            observer.error(err);
          }
        );
    });
  }

  private getDefinitions() {
    this.httpInFlight++;
    this.http
      .get<Array<UserPreferenceDefinition>>(
        `${this.appSettingsService.getValue(
          AppSettings.apiHome
        )}/api/v1/UserPreferenceDefinition`
      )
      .subscribe(
        (prefDefinitions) => {
          if (prefDefinitions && prefDefinitions.length > 0) {
            const defns = [];
            prefDefinitions.forEach((definition) => {
              defns.push(definition);
            });
            this.httpInFlight--;
            this.definitionsDownloaded = true;
            this.setAllState(defns);
          }
        },
        (err) => {
          this.httpInFlight--;
        }
      );
  }

  private loadFromLocal() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      const map: Array<UserPreferenceValue> = JSON.parse(stored);
      if (map && map.length > 0) {
        map.forEach((value) => {
          // this.userPrefsStore.upsert(value.name, value.value);
        });
      }
    }
  }

  private saveToLocal(): void {
    // Save to LocalStorage
    const serial = JSON.stringify(this.getAll());

    localStorage.setItem(this.storageKey, serial);
  }

  private clearValues() {
    this.userPrefsService.resetState();

    // Save to LocalStorage
    localStorage.removeItem(this.storageKey);
  }
}

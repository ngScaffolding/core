import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AppSettingsService } from '../appSettings/appSettings.service';
import { LoggingService } from '../logging/logging.service';

import { timeout, retry, tap } from 'rxjs/operators';
import { AppSettings } from '@ngscaffolding/models';
import { ReferenceValue } from '@ngscaffolding/models';
import { SocketService } from '../socket/socket.service';
import { BaseStateArrayService } from '../base-state-array.service';

@Injectable({
  providedIn: 'root',
})
export class ReferenceValuesService extends BaseStateArrayService<ReferenceValue> {
  private className = 'ReferenceValuesService';

  private requestsInFlight = new Map<string, Observable<ReferenceValue>>();

  constructor(
    private http: HttpClient,
    private appSettingsService: AppSettingsService,
    private logger: LoggingService,
    private socketService: SocketService
  ) {
    super([], 'compositeKey');
    socketService.cacheFlush$.subscribe((refValue) => {
      this.clearReferenceValue(refValue, false);
    });
  }

  lookupValue(name: string, lookupValue: any): Observable<string> {
    return new Observable<string>((observer) => {
      this.getReferenceValue(name)
        .pipe(
          tap((refVal) => {
            const foundVal = refVal.referenceValueItems.find(
              (val) => val.value == lookupValue
            );
            observer.next(
              refVal.referenceValueItems.find((val) => val.value == lookupValue)
                ?.display
            );
            observer.complete();
          })
        )
        .subscribe();
    });
  }

  //
  // Get a single string value from References
  //
  getValue(name: string, group: string): Observable<string> {
    return new Observable<string>((observer) => {
      this.getReferenceValue(name, group).subscribe((reference) => {
        if (reference) {
          observer.next(reference.value);
        } else {
          observer.next(null);
        }
        observer.complete();
      });
    });
  }

  // Clear all Reference values with this name contains
  clearReferenceValue(clearNames: string | Array<string>, notifyOthers = true) {
    let namesArray: Array<string>;
    if (Array.isArray(clearNames)) {
      namesArray = clearNames;
    } else {
      namesArray = [clearNames];
    }

    for (const loopName of namesArray) {
      const list = this.getAll().filter((entity) =>
        entity?.name?.toLowerCase().includes(loopName.toLowerCase())
      );

      if (notifyOthers) {
        this.socketService.sendCacheClear(loopName);
      }

      for (const refValue of list) {
        this.remove(refValue.compositeKey);
      }
    }
  }

  setReferenceValue(referenceValue: ReferenceValue) {
    referenceValue.compositeKey = this.getKey(referenceValue.name, '');
    this.setState(referenceValue);
  }

  //
  // Get a complex ReferenceValue (May include multiple values)
  //
  getReferenceValue(
    name: string,
    seed = '',
    childDepth = 0
  ): Observable<ReferenceValue> {
    if (this.hasEntity(this.getKey(name, seed))) {
      const cacheValue = this.getEntity(this.getKey(name, seed));
      if (this.isExpired(cacheValue)) {
        // Expired cache value. Go get a new one
        return this.downloadRefValue(name, seed);
      }

      // If we get one from Cache, thats handy to use
      this.logger.info(`Reference Values From Cache ${name}::${seed}`);
      return new Observable<ReferenceValue>((observer) => {
        observer.next(this.getEntity(this.getKey(name, seed)));
        observer.complete();
      });
    } else if (childDepth > 0) {
      const refValue = this.getEntity(this.getKey(name, ''));
      if (refValue) {
        const parentRef = refValue.referenceValueItems.find(
          (parent) => parent.value === seed
        );
        if (parentRef) {
          const clone = { ...refValue };
          clone.referenceValueItems = parentRef.referenceValueItems;

          return new Observable<ReferenceValue>((observer) => {
            observer.next(clone);
            observer.complete();
          });
        }
      }
    } else {
      return this.downloadRefValue(name, seed);
    }
    return of(null);
  }

  private downloadRefValue(
    name: string,
    seed: string
  ): Observable<ReferenceValue> {
    // Nothing in the Cache

    if (this.requestsInFlight.has(this.getKey(name, seed))) {
      // We have already asked for this, return our existing Observable
      return this.requestsInFlight.get(this.getKey(name, seed));
    } else {
      const wrapper = new Observable<ReferenceValue>((observer) => {
        // Call HTTP Here
        this.logger.info(`Reference Values From HTTP ${name}::${seed}`);
        const httpRequest = this.http
          .get<ReferenceValue>(
            `${this.appSettingsService.getValue(
              AppSettings.apiHome
            )}/api/v1/referencevalues?name=${name}&seed=${seed}`
          )
          .pipe(timeout(40000), retry(1));
        httpRequest.subscribe(
          (value) => {
            value.compositeKey = this.getKey(name, seed);
            value.whenStored = new Date();

            this.setState(value);
            this.requestsInFlight.delete(this.getKey(name, seed));

            observer.next(value);
            observer.complete();
          },
          (err) => {
            // Error here. If we have a valid value, respond with that
            if (this.hasEntity(this.getKey(name, seed))) {
              this.logger.info(
                `Reference Values From HTTP Failed using last Cache ${name}::${seed}`
              );
              observer.next(
                this.getEntity(this.getKey(name, seed))
              );
              observer.complete();
            } else {
              observer.error(err);
            }
          }
        );
      });

      this.requestsInFlight.set(this.getKey(name, seed), wrapper);
      return wrapper;
    }
  }

  private getKey(name: string, seed: string): string {
    return `${name}::${seed}`;
  }

  private isExpired(refVal: ReferenceValue): boolean {
    const cacheSeconds = refVal.cacheSeconds || 31556952; // Default to a year
    const nowDate = new Date();
    const expires = new Date(refVal.whenStored);

    expires.setSeconds(expires.getSeconds() + cacheSeconds);
    return nowDate > expires;
  }
}

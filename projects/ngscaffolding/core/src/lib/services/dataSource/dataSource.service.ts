import { Observable, forkJoin, throwError, of } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AppSettingsService } from '../appSettings/appSettings.service';

import { LoggingService } from '../logging/logging.service';
import { DataSourceStore } from './dataSource.store';
import { DataSourceQuery } from './dataSource.query';
import { AppAuditService } from '../appAudit/appAudit.service';
import { ApplicationLog } from '@ngscaffolding/models';
import { AppSettings } from '@ngscaffolding/models';
import { DataSourceRequest } from '@ngscaffolding/models';
import { DataResults } from '@ngscaffolding/models';

@Injectable({
  providedIn: 'root',
})
export class DataSourceService {
  private className = 'DataSourceService';
  private inflightRequests = new Map<string, Observable<DataResults>>();

  constructor(
    private http: HttpClient,
    private dataSourceStore: DataSourceStore,
    private dataSourceQuery: DataSourceQuery,
    private appSettingsService: AppSettingsService,
    private appAuditService: AppAuditService,
    private logger: LoggingService
  ) {}

  decorateInput(inputDetails: any): any {
    return null;
  }

  getDataSource(dataRequest: DataSourceRequest): Observable<DataResults> {
    const key = this.getKey(dataRequest);

    if (dataRequest.forceRefresh) {
      this.dataSourceStore.remove(key);
    }

    const currentCacheValue = this.dataSourceQuery.getEntity(key);
    if (currentCacheValue) {
      if (currentCacheValue.expiresWhen > new Date()) {
        // Return good cached value
        return of(currentCacheValue);
      } else {
        // Expired - Bad cache
        this.dataSourceStore.remove(key);
      }
    }

    if (this.inflightRequests.has(key)) {
      return this.inflightRequests.get(key);
    }

    if(!dataRequest.inputData){
      dataRequest.inputData = {};
    }

    // Make HTTP Request
    const formData: FormData = new FormData();
    formData.append('dataSourceRequest', JSON.stringify(dataRequest));

    // Add Files if passed
    if (dataRequest.fileNames) {
      let fileCount = 0;
      dataRequest.fileNames.forEach((file) => {
        formData.append(`file-${fileCount++}`, file, file.name);
      });
    }

    const logEntry: ApplicationLog = {
      entity: 'DataSource Call',
      action: key,
      values: {
        filterValues: dataRequest.filterValues,
        inputData: dataRequest.inputData,
      },
    };

    this.logger.info(
      `Calling Datasource ${dataRequest.name}`,
      null,
      logEntry.values
    );

    this.inflightRequests.set(
      key,
      new Observable<DataResults>((observer) => {
        this.http
          .post<DataResults>(
            `${this.appSettingsService.getValue(
              AppSettings.apiHome
            )}/api/v1/datasource`,
            formData
          )
          .pipe(timeout(240000))
          .subscribe(
            (values) => {
              const expiryNow = new Date();

              // If expires Seconds not provided set long expiry
              const expiresSeconds =
                values.expiresSeconds > 0 ? values.expiresSeconds : 99999999;
              const expiresWhen = new Date(
                expiryNow.getTime() + expiresSeconds * 10000
              );
              const newResults: DataResults = {
                expiresWhen,
                rowCount: values.rowCount,
                jsonData: values.jsonData,
                results: values.results,
              };

              // Log Datasource Success
              // this.appAuditService.RecordLog({
              //   ...logEntry,
              //   result: 'Success',
              // });

              // Update the Store to tell the world we have data
              this.dataSourceStore.update(key, newResults);
              this.inflightRequests.delete(key);
              observer.next(newResults);
              observer.complete();
            },
            (err) => {
              // Update the Store to tell the world we failed in every way. Shame.
              const errorResults: DataResults = {
                expiresWhen: new Date(),
                error: err.message,
              };

              // Log Datasource Success
              // this.appAuditService.RecordLog({
              //   ...logEntry,
              //   result: err.message,
              // });

              this.dataSourceStore.update(key, errorResults);
              this.inflightRequests.delete(key);

              this.logger.error(err, 'DataSource.Service.getDataSource', false);
              observer.error(err);
            }
          );
      })
    );

    return this.inflightRequests.get(key);
  }

  private getKey(dataRequest: DataSourceRequest) {
    return `name:${dataRequest.name} seed:${
      dataRequest.seed
    } inputData:${JSON.stringify(dataRequest.inputData)} `;
  }
}

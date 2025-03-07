import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { timeout, retry, finalize } from 'rxjs/operators';

import { v4 as uuidv4 } from 'uuid';
import { ZuluDateHelper } from '@ngscaffolding/models';
import { AppSettings } from '@ngscaffolding/models';
import { AuditLog } from '@ngscaffolding/models';
import { AppSettingsService } from '../appSettings/appSettings.service';
import { UserAuthenticationService } from '../userAuthentication/userAuthentication.service';
import { AppAuditService } from '../appAudit/appAudit.service';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private polling = 30000;
  private retryVal = 3;

  private isSending = false;
  private defaultLog: AuditLog = {};

  constructor(
    private appSettings: AppSettingsService,
    private auditLog: AuditLogService,
    private userService: UserAuthenticationService,
    private http: HttpClient
  ) {
    appSettings.stateUpdated$.subscribe((appSettings) => {
      if (appSettings) {
        this.polling = appSettings.value[AppSettings.mobileDefaultPolling];
        this.retryVal = appSettings.value[AppSettings.mobileDefaultRetries];
      }
    });
    appSettings
      .selectByName(AppSettings.mobileDefaultPolling)
      .subscribe(val => (this.polling = val.value > 0 ? val.value : 30000));
    appSettings
      .selectByName(AppSettings.mobileDefaultRetries)
      .subscribe(val => (this.retryVal = val.value > 0 ? val.value : 3));
    this.startPolling();
  }

  public setDefault(defaultLog: AuditLog) {
    this.defaultLog = defaultLog;
  }

  public recordLog(auditLog: AuditLog): void {
    const workingLog = { ...this.defaultLog, ...auditLog };
    workingLog.id = uuidv4();
    if (!workingLog.logDate) {
      workingLog.logDate = ZuluDateHelper.setGMTDate(new Date()) || undefined;
    }

    if (!workingLog.userID) {
      workingLog.userID = this.userService.getState().userDetails.userId;
    }

    // this.set(workingLog);
    try {
    } catch (err) {
      console.log('Unable to send AppLog, offline?');
    }
  }

  public sendLogEntries() {
    const apiHome = this.appSettings.getEntity(AppSettings.apiHome).value;
    // const logEntries = this.auditLog.auditLog.();

    // if (logEntries && logEntries.length > 0) {
    //   const keys = logEntries.map(log => log.id);
    //   // This post is a fire and forget. Don't have to authorise either
    //   this.http
    //     .post(`${apiHome}/api/v1/auditlog`, logEntries)
    //     .pipe(
    //       timeout(30000),
    //       retry(3),
    //       finalize(() => {
    //         this.isSending = false;
    //       })
    //     )
    //     .subscribe(
    //       data => {
    //         this.auditLogStore.remove(keys);
    //         // keys.forEach(key => this.auditLogStore.remove(({ id }) => id === key));
    //       },
    //       err => {
    //         console.log('Unable to send AppLog, offline?');
    //       }
    //     );
    // } else {
    //   this.isSending = false;
    // }
  }

  private startPolling() {
    setInterval(() => {
      if (!this.isSending) {
        this.isSending = true;
        this.sendLogEntries();
      }
    }, this.polling);
  }
}

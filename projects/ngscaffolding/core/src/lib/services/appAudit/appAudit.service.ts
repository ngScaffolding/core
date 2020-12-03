import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppSettingsQuery } from '../appSettings/appSettings.query';
import { timeout, retry } from 'rxjs/operators';
import { UserAuthenticationQuery } from '../userAuthentication/userAuthentication.query';
import {
  ApplicationLog,
  AppSettings,
  ZuluDateHelper,
} from '@ngscaffolding/models';

@Injectable({
  providedIn: 'root',
})
export class AppAuditService {
  constructor(
    private appSettingsQuery: AppSettingsQuery,
    private userQuery: UserAuthenticationQuery,
    private http: HttpClient
  ) {}

  public RecordLog(appLog: ApplicationLog): void {
    let apiHome = this.appSettingsQuery.getEntity(AppSettings.apiHome).value;

    if (!appLog.logDate) {
      appLog.logDate = ZuluDateHelper.setGMTDate(new Date());
    }

    if (!appLog.userID) {
      appLog.userID = this.userQuery.getUserId();
    }
    try {
      // This post is a fire and forget. Don't have to authorise either
      this.http
        .post(`${apiHome}/api/v1/applicationLog`, appLog)
        .pipe(timeout(30000), retry(3))
        .subscribe(
          (data) => {},
          (err) => {
            console.log('Unable to send AppLog, offline?');
          }
        );
    } catch (err) {
      console.log('Unable to send AppLog, offline?');
    }
  }
}

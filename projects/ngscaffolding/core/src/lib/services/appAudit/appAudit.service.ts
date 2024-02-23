import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout, retry } from 'rxjs/operators';
import { ZuluDateHelper } from '@ngscaffolding/models';
import { ApplicationLog } from '@ngscaffolding/models';
import { AppSettings } from '@ngscaffolding/models';
import { AppSettingsService } from '../appSettings/appSettings.service';
import { UserAuthenticationService } from '../userAuthentication/userAuthentication.service';


@Injectable({
  providedIn: 'root',
})
export class AppAuditService {
  constructor(
    private appSettingsService: AppSettingsService,
    private userService: UserAuthenticationService,
    private http: HttpClient
  ) {}

  public RecordLog(appLog: ApplicationLog): void {
    const apiHome = this.appSettingsService.getValue(AppSettings.apiHome).value;

    if (!appLog.logDate) {
      appLog.logDate = ZuluDateHelper.setGMTDate(new Date());
    }

    if (!appLog.userID) {
      appLog.userID = this.userService.getState().userDetails.userId;
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

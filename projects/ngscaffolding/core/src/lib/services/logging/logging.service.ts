import { Injectable } from '@angular/core';
import { NotificationService } from '../notification/notification.service';
import { HttpClient } from '@angular/common/http';
import { AppSettingsQuery } from '../appSettings/appSettings.query';
import { UserAuthenticationQuery } from '../userAuthentication/userAuthentication.query';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
    constructor(private notification: NotificationService, private appSettingsQuery: AppSettingsQuery,
      private userQuery: UserAuthenticationQuery,
      private http: HttpClient) {}

  public error(err: any, methodName = '', showToast = false): void {
    if (!methodName) {
      console.error(`Method ${methodName}: Error ${err}`);
    } else {
      console.error(`Error ${err}`);
    }

    // TODO: Resume showing toast
    if (showToast) {
      this.notification.showMessage({
        severity: 'error',
        summary: 'Error',
        detail: err.message
      });
    }
  }

  public warning(message: string, methodName = ''): void {
    if (!methodName) {
      console.warn(`Method ${methodName}: Warning ${message}`);
    } else {
      console.warn(`Warning ${message}`);
    }
  }

  public info(message: string, methodName = '', objectInfo: any = null): void {
    if (!methodName) {
      // tslint:disable-next-line:no-console
      console.info(`Info : ${message}`, objectInfo);
    } else {
      // tslint:disable-next-line:no-console
      console.info(`[${methodName}] : ${message}`, objectInfo);
    }
  }
}

import { Injectable } from '@angular/core';
import { NotificationService } from '../notification/notification.service';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
    constructor(private notification: NotificationService) {}

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
      // eslint-disable-next-line no-console
      console.info(`Info : ${message}`, objectInfo);
    } else {
      // eslint-disable-next-line no-console
      console.info(`[${methodName}] : ${message}`, objectInfo);
    }
  }
}

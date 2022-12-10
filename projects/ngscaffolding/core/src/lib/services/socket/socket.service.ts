import { Injectable } from '@angular/core';
import { ReferenceValue } from '@ngscaffolding/models';
import { io, Socket } from 'socket.io-client';
import { AppSettings } from '@ngscaffolding/models';
import { AppSettingsService } from '../appSettings/appSettings.service';
import { LoggingService } from '../logging/logging.service';
import { Subject } from 'rxjs';
import { UserAuthenticationQuery } from '../userAuthentication/userAuthentication.query';
import { NotificationStore } from '../notification/notification.store';

@Injectable({
  providedIn: 'root',
})
export class SocketService {

  public cacheFlush$ = new Subject<string>();
  public generalNotifications$ = new Subject<any>();
  // Our socket connection
  private io: Socket;

  constructor(private appSettingsService: AppSettingsService,
    private logger: LoggingService,
    private notificationStore: NotificationStore,
    private authQuery: UserAuthenticationQuery) {
    this.io = io(this.appSettingsService.getValue(AppSettings.apiHome));

    this.io.on('connect', () => {
      logger.info(`Socket.io Connected ID:${this.io.id}`);

      if (this.authQuery.isAuthenticated()) {
        this.io.emit('logon', this.authQuery.getUserId());
      }
    });

    this.io.prependAny((eventName, ...args) => {
      logger.info(`Socket recv: ${eventName}`, null, args);
      this.notificationStore.add(args[0]);
    });

    this.io.on('cacheFlush', (refName: string) => {
      this.cacheFlush$.next(refName);
    });

    this.authQuery.authenticated$.subscribe(auth => {
      if (auth) {
        this.io.emit('logon', this.authQuery.getUserId());
      }
    });

  }

  send(roomName: string, payload: any) {
    this.io.emit(roomName, payload);
  }

  sendVolitile(roomName: string, payload: any) {
    this.io.volatile.emit(roomName, payload);
  }

  sendCacheClear(refName: string) {
    this.io.emit('cacheFlush', refName);
  }
}

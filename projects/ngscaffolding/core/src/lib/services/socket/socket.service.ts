// import { Injectable } from '@angular/core';
// import { ReferenceValue } from '@ngscaffolding/models';
// import { io, Socket } from 'socket.io-client';
// import { AppSettings } from '@ngscaffolding/models';
// import { AppSettingsService } from '@ngscaffolding/core';
// import { LoggingService } from '@ngscaffolding/core';
// import { Subject } from 'rxjs';
// import { NotificationService } from '@ngscaffolding/core';
// import { UserAuthenticationService } from '@ngscaffolding/core';


// @Injectable({
//   providedIn: 'root',
// })
// export class SocketService {

//   public cacheFlush$ = new Subject<string>();
//   public generalNotifications$ = new Subject<any>();
//   // Our socket connection
//   private io: Socket;

//   constructor(private appSettingsService: AppSettingsService,
//     private logger: LoggingService,
//     private notificationService: NotificationService,
//     private authService: UserAuthenticationService) {
//     this.io = io(this.appSettingsService.getValue(AppSettings.apiHome));

//     this.io.on('connect', () => {
//       logger.info(`Socket.io Connected ID:${this.io.id}`);

//       if (this.authService.isAuthenticated()) {
//         this.io.emit('logon', this.authService.getState().userDetails.userId);
//       }
//     });

//     this.io.prependAny((eventName, ...args) => {
//       logger.info(`Socket recv: ${eventName}`, null, args);
//       this.notificationService.showMessage(args[0]);
//     });

//     this.io.on('cacheFlush', (refName: string) => {
//       this.cacheFlush$.next(refName);
//     });

//     this.authService.authenticated$.subscribe(auth => {
//       if (auth) {
//         this.io.emit('logon', this.authService.getState().userDetails.userId);
//       }
//     });

//   }

//   send(roomName: string, payload: any) {
//     this.io.emit(roomName, payload);
//   }

//   sendVolitile(roomName: string, payload: any) {
//     this.io.volatile.emit(roomName, payload);
//   }

//   sendCacheClear(refName: string) {
//     this.io.emit('cacheFlush', refName);
//   }
// }

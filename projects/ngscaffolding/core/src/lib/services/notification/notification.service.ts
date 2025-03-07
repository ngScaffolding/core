import { Injectable } from '@angular/core';
import { BroadcastService, BroadcastTypes } from '../../../public-api';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private broadcast: BroadcastService) {}

  showMessage(message: any) {
    this.broadcast.broadcast(BroadcastTypes.SHOW_MESSAGE, message);
  }


}

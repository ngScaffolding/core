import { Injectable } from '@angular/core';
import { BroadcastService, BroadcastTypes } from '@ngscaffolding/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private broadcast: BroadcastService) {}

  showMessage(message: any) {
    this.broadcast.broadcast(BroadcastTypes.SHOW_MESSAGE, message);
  }


}

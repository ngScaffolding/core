import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { NotificationUpdate } from '@ngscaffolding/models';

export type NotificationState = EntityState<NotificationUpdate>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'notification', idKey: 'id', resettable: true })
export class NotificationStore extends EntityStore<NotificationState, NotificationUpdate> {

  constructor() {
    super();
    console.log('NotificationStore Constructor');
  }
}


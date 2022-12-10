import { Injectable } from '@angular/core';
import { QueryEntity, QueryConfig, Order } from '@datorama/akita';
import { NotificationState, NotificationStore } from './notification.store';
import { Observable } from 'rxjs';
import { NotificationUpdate } from '@ngscaffolding/models';

@Injectable({
  providedIn: 'root'
})
@QueryConfig({
  sortBy: 'order',
  sortByOrder: Order.ASC // Order.DESC
})
export class NotificationQuery extends QueryEntity<NotificationState, NotificationUpdate> {
  public allUnseenNotifications$: Observable<NotificationUpdate[]>;
  public allNotifications$: Observable<NotificationUpdate[]>;


  constructor(protected store: NotificationStore) {
    super(store);

    this.allUnseenNotifications$ = this.selectAll({
      filterBy: [entity => !entity.isSeen]
    });

    this.allNotifications$ = this.selectAll();

  }
}

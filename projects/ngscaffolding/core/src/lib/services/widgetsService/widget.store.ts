import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { WidgetModelBase } from '../../models/dashboardModels/widget.model';

export interface WidgetState extends EntityState<WidgetModelBase> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'widget', idKey: 'name' })
export class WidgetStore extends EntityStore<WidgetState, WidgetModelBase> {

  constructor() {
    super();
    console.log('WidgetStore Constructor');
  }
}


import { Injectable } from '@angular/core';

import { WidgetModelBase } from '@ngscaffolding/models';
import { WidgetStore, WidgetState } from './widget.store';

@Injectable({
  providedIn: 'root'
})
export class WidgetQuery extends QueryEntity<WidgetState, WidgetModelBase> {
  constructor(protected store: WidgetStore) {
    super(store);
  }
}

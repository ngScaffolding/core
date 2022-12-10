import { Injectable } from '@angular/core';
import { QueryEntity, QueryConfig, Order, Query } from '@datorama/akita';
import { UIStateStore, UIState, PopupContainer } from './ui-state.store';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UIStateQuery extends Query<UIState> {
  public isPopupShown$: Observable<boolean>;
  public popupComponent$: Observable<PopupContainer>;

  constructor(protected store: UIStateStore) {
    super(store);

    this.isPopupShown$ = this.select(state => state.isPopupShown);
    this.popupComponent$ = this.select(state => state.popupComponent);
  }
}

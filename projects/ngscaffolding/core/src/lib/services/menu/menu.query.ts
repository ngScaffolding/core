import { Injectable } from '@angular/core';
import { QueryEntity, QueryConfig, Order } from '@datorama/akita';
import { MenuStore, MenuState } from './menu.store';
import { Observable } from 'rxjs';
import { CoreMenuItem, MenuTypes } from '@ngscaffolding/models';

@Injectable({
  providedIn: 'root'
})
@QueryConfig({
  sortBy: 'order',
  sortByOrder: Order.ASC // Order.DESC
})
export class MenuQuery extends QueryEntity<MenuState, CoreMenuItem> {
  public folders$: Observable<CoreMenuItem[]>;
  public quickItems$: Observable<CoreMenuItem[]>;
  public addItems$: Observable<CoreMenuItem[]>;

  constructor(protected store: MenuStore) {
    super(store);
    this.folders$ = this.selectAll({
      filterBy: [entity => entity.type === MenuTypes.Folder]
    });

    this.quickItems$ = this.select(state => state.quickItems);
    this.addItems$ = this.select(state => state.addItems);
  }
}

import { Injectable } from '@angular/core';
import { QueryEntity, QueryConfig, Order } from '@datorama/akita';
import { MenuStore, MenuState } from './menu.store';
import { Observable } from 'rxjs';
import { CoreMenuItem, MenuTypes } from '../../models/coreModels/coreMenuItem.model';

@Injectable({
    providedIn: 'root'
})
@QueryConfig({
    sortBy: 'order',
    sortByOrder: Order.ASC // Order.DESC
})
export class MenuQuery extends QueryEntity<MenuState, CoreMenuItem> {
    public folders$: Observable<CoreMenuItem[]>;

    constructor(protected store: MenuStore) {
        super(store);
        this.folders$ = this.selectAll({
            filterBy: [entity => entity.type === MenuTypes.Folder]
        });
    }
}

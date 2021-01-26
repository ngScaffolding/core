import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { CoreMenuItem } from '../../models/coreModels/coreMenuItem.model';

export interface MenuState extends EntityState<CoreMenuItem> {
  menuItems: CoreMenuItem[];
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'menu', idKey: 'name' })
export class MenuStore extends EntityStore<MenuState, CoreMenuItem> {

  constructor() {
    super();
    console.log('MenuStore Constructor');
  }
}


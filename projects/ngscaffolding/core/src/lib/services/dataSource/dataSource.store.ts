import { Injectable, Type } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { DataResults } from '../../models/dataSourceModels/dataResults.model';


export interface DataSourceState extends EntityState<DataResults> {
  isInitialised: boolean;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'dataSource', idKey: 'key' })
export class DataSourceStore extends EntityStore<DataSourceState, DataResults> {

  constructor() {
    super({ isInitialised: false});
    console.log('DataSourceStore Constructor');
  }
}


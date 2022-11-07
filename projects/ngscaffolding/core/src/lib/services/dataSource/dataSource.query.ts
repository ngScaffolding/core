import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { DataResults } from '@ngscaffolding/models';
import { DataSourceState, DataSourceStore } from './dataSource.store';

@Injectable({
  providedIn: 'root'
})
export class DataSourceQuery extends QueryEntity<DataSourceState, DataResults> {

  isInitialised$ = this.select(state => state.isInitialised);

  constructor(protected store: DataSourceStore) {
    super(store);
  }


}

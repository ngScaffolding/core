import { Injectable } from '@angular/core';

import { ReferenceValue } from '@ngscaffolding/models';
import { ReferenceValuesStore, ReferenceValuesState } from './referenceValues.store';

@Injectable({
  providedIn: 'root'
})
export class ReferenceValuesQuery extends QueryEntity<ReferenceValuesState, ReferenceValue> {

  isInitialised$ = this.select(state => state.isInitialised);

  constructor(protected store: ReferenceValuesStore) {
    super(store);
  }


}

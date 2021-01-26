import { Injectable, Type } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { ReferenceValue } from '../../models/coreModels/referenceValue.model';


export interface ReferenceValuesState extends EntityState<ReferenceValue> {
  isInitialised: boolean;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'referenceValues', idKey: 'compositeKey' })
export class ReferenceValuesStore extends EntityStore<ReferenceValuesState, ReferenceValue> {

  constructor() {
    super({ isInitialised: false });
    console.log('ReferenceValuesStore Constructor');
  }
}


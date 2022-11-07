import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { UserPreferenceValue } from '@ngscaffolding/models';
import { UserPreferencesStore, UserPreferencesState } from './userPreferences.store';

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesQuery extends QueryEntity<UserPreferencesState, UserPreferenceValue> {

  isInitialised$ = this.select(state => state.isInitialised);

  constructor(protected store: UserPreferencesStore) {
    super(store);
  }


}

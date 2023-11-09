import { Injectable } from '@angular/core';
import { AppSettingsValue } from '@ngscaffolding/models';
import { AppSettingsStore, AppSettingsState } from './appSettings.store';


@Injectable({
  providedIn: 'root'
})
export class AppSettingsQuery extends QueryEntity<AppSettingsState, AppSettingsValue> {

  isInitialised$ = this.select(state => state.isInitialised);

  constructor(protected store: AppSettingsStore) {
    super(store);
  }


}

import { Injectable } from '@angular/core';
import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { CoreMenuItem } from '@ngscaffolding/models';

export interface UIState {
  isPopupShown: boolean;
  popupComponent: PopupContainer;
}

export interface PopupContainer {
  componentName: string;
  data?: any;
  idValue?: any;
  additionalProperties?: any;
  flushReferenceValues?: string;
  dialogStyle?: string;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'uistate' })
export class UIStateStore extends Store<UIState> {

  constructor() {
    super({ isPopupShown: false, popupComponent: null });
    console.log('UIState Constructor');
  }
}


import { Injectable } from '@angular/core';
import { BaseStateService } from '../base-state.service';
import { Observable } from 'rxjs';

export interface UIState {
    isPopupShown: boolean;
    popupComponent: PopupContainer;
    cacheFilled: boolean;
    cacheRequesting: boolean;
    logonUserID?: string;
    logonRememberMe?: boolean;
}

export interface PopupContainer {
    componentName?: string;
    data?: any;
    idValue?: any;
    additionalProperties?: any;
    flushReferenceValues?: string;
    dialogStyle?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UIStateService extends BaseStateService<UIState> {
    public isPopupShown$: Observable<boolean>;
    public popupComponent$: Observable<PopupContainer>;

    constructor() {
        super({ isPopupShown: false, popupComponent: {}, cacheFilled: false, cacheRequesting: false });
        console.log('UIState Constructor');

        this.isPopupShown$ = this.select(state => state.isPopupShown);
        this.popupComponent$ = this.select(state => state.popupComponent);
    }
}

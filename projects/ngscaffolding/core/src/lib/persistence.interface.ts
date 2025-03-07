import { InjectionToken } from '@angular/core';

export const PERSISTENCE_LAYER = new InjectionToken<PersistenceLayer>('PersistenceLayer');
export interface PersistenceLayer {
    get(options: GetOptions): Promise<GetResult>;
    set(options: SetOptions): Promise<void>;
    clear(): Promise<void>;
}

export interface SetOptions {
    key: string;
    value: string;
}
export interface GetOptions {
    key: string;
}
export interface GetResult {
    value: string | null;
}

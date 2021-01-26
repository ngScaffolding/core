import { Injectable, Type } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { AuditLog } from '../../models/coreModels/auditLog.model';


export interface AuditLogState extends EntityState<AuditLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auditLog', idKey: 'id' })
export class AuditLogStore extends EntityStore<AuditLogState, AuditLog> {
    constructor() {
        super({});
        console.log('AuditLogStore Constructor');
    }
}

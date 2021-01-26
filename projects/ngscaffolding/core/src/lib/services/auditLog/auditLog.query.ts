import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AuditLog } from '../../models/coreModels/auditLog.model';
import { AuditLogState, AuditLogStore } from './auditLog.store';


@Injectable({
    providedIn: 'root'
})
export class AuditLogQuery extends QueryEntity<AuditLogState, AuditLog> {
    allAuditLog = this.getAll();

    constructor(protected store: AuditLogStore) {
        super(store);
    }
}

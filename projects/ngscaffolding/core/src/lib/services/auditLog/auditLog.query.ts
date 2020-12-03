import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { AuditLogState, AuditLogStore } from './auditLog.store';
import { AuditLog } from '@ngscaffolding/models';

@Injectable({
    providedIn: 'root'
})
export class AuditLogQuery extends QueryEntity<AuditLogState, AuditLog> {
    allAuditLog = this.getAll();

    constructor(protected store: AuditLogStore) {
        super(store);
    }
}

import { Injectable } from '@angular/core';

import { AuditLog } from '@ngscaffolding/models';
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

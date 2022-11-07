import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { AppSettingsQuery } from '../appSettings/appSettings.query';
import { timeout, retry, finalize } from 'rxjs/operators';
import { UserAuthenticationQuery } from '../userAuthentication/userAuthentication.query';
import { AuditLogStore } from './auditLog.store';
import { AuditLogQuery } from './auditLog.query';
import { v4 as uuid } from 'uuid';
import { ZuluDateHelper } from '@ngscaffolding/models';
import { AppSettings } from '@ngscaffolding/models';
import { AuditLog } from '@ngscaffolding/models';

@Injectable({
    providedIn: 'root'
})
export class AuditLogService {
    private polling = 30000;
    private retryVal = 3;

    private isSending = false;
    private defaultLog: AuditLog = {};

    constructor(
        private auditLogStore: AuditLogStore,
        private auditLogQuery: AuditLogQuery,
        private appSettingsQuery: AppSettingsQuery,
        private userQuery: UserAuthenticationQuery,
        private http: HttpClient
    ) {
        appSettingsQuery
            .selectEntity(AppSettings.mobileDefaultPolling)
            .subscribe(val => (this.polling = val.value > 0 ? val.value : 30000));
        appSettingsQuery
            .selectEntity(AppSettings.mobileDefaultRetries)
            .subscribe(val => (this.retryVal = val.value > 0 ? val.value : 3));
        this.StartPolling();
    }

    public SetDefault(defaultLog: AuditLog) {
        this.defaultLog = defaultLog;
    }

    public RecordLog(auditLog: AuditLog): void {
        const workingLog = {...this.defaultLog, ...auditLog};
        workingLog.id = uuid();
        if (!workingLog.logDate) {
            workingLog.logDate = ZuluDateHelper.setGMTDate(new Date());
        }

        if (!workingLog.userID) {
            workingLog.userID = this.userQuery.getUserId();
        }

        this.auditLogStore.add(workingLog);
        try {
        } catch (err) {
            console.log('Unable to send AppLog, offline?');
        }
    }

    private StartPolling() {
        setInterval(_ => {
            if (!this.isSending) {
                this.isSending = true;
                this.SendLogEntries();
            }
        }, this.polling);
    }

    public SendLogEntries() {
        const apiHome = this.appSettingsQuery.getEntity(AppSettings.apiHome).value;
        const logEntries = this.auditLogQuery.getAll();

        if (logEntries && logEntries.length > 0) {
            const keys = logEntries.map(log => log.id);
            // This post is a fire and forget. Don't have to authorise either
            this.http
                .post(`${apiHome}/api/v1/auditlog`, logEntries)
                .pipe(
                    timeout(30000),
                    retry(3),
                    finalize(() => {
                        this.isSending = false;
                    })
                )
                .subscribe(
                    data => {
                        this.auditLogStore.remove(keys);
                        // keys.forEach(key => this.auditLogStore.remove(({ id }) => id === key));
                    },
                    err => {
                        console.log('Unable to send AppLog, offline?');
                    }
                );
        } else {
            this.isSending = false;
        }
    }
}

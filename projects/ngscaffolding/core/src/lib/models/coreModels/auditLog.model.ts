export interface AuditLog {
    id?: string; // not sent to server, used for Akita
    device?: string; // desktop browser, ios, android
    uniqueId?: string; // identifier for the device
    entity?: string; // User, workitem, widget
    entityId?: string; // UserId, workitemId, widget
    action?: string; // Logon, Logoff, update, delete
    userID?: string;
    application?: string; // Mobile, BackOffice, FieldForce
    version?: string; // software version
    logDate?: Date;
    result?: string;
    values?: object;
}

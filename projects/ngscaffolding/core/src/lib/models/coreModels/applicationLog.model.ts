export interface ApplicationLog {
  entity?: string; // User, workitem, widget
  action?: string; // Logon, Logoff, update, delete
  userID?: string;
  application?: string; // Mobile, BackOffice, FieldForce
  version?: string; // software version
  logDate?: Date;
  result?: string;
  values?: object;
}

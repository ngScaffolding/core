/*
 * Public API Surface of core
 */

export { AppSettingsService } from './lib/services/appSettings/appSettings.service';

export { AppAuditService } from './lib/services/appAudit/appAudit.service';
export { AuditLogService } from './lib/services/auditLog/auditLog.service';

export { BroadcastService, BroadcastTypes } from './lib/services/broadcast/broadcast.service';
export { ComponentLoaderService } from './lib/services/componentLoader.service';
export { CoreErrorHandlerService } from './lib/services/coreErrorHandler/coreErrorHandler.service';
export { DataSourceService } from './lib/services/dataSource/dataSource.service';
export { SocketService } from './lib/services/socket/socket.service';

export { LoggingService } from './lib/services/logging/logging.service';
export { MenuService } from './lib/services/menu/menu.service';

export { NotificationService } from './lib/services/notification/notification.service';
export { ReferenceValuesService } from './lib/services/referenceValues/refrenceValues.service';

export { RolesService } from './lib/services/rolesService/roles.service';

export { SpinnerService } from './lib/services/spinnerService/spinner.service';

export { UserAuthenticationBase } from './lib/services/userAuthentication/UserAuthenticationBase';
export { UserAuthenticationService } from './lib/services/userAuthentication/userAuthentication.service';
export { OAuthService } from './lib/services/userAuthentication/userAuthentication.oauth.service';

export { UserPreferencesService } from './lib/services/userPreferences/userPreferences.service';

export { WidgetService } from './lib/services/widgetsService/widget.service';


export { UserService } from './lib/services/userService/user.service';
export { UserServiceBase } from './lib/services/userService/user.service.base';
export { SoftwareVersion, VersionsService } from './lib/services/versions/versions.service';

export { FillHeightDirective } from './lib/directives/fill-height.directive';
export { ShowAuthDirective } from './lib/directives/show-auth.directive';

// Pipes
export { ButtonColourPipe } from './lib/pipes/buttonColour.pipe';
export { NgsDatePipe } from './lib/pipes/ngsDate.pipe';
export { NgsDateTimePipe } from './lib/pipes/ngsDateTime.pipe';
export { TruncateTextPipe } from './lib/pipes/truncateText.pipe';
export { DateAgoPipe } from './lib/pipes/date-ago.pipe';

// Guards
export { AuthoriseRoleGuard } from './lib/routeGuards/authoriseRoleGuard';

export { DialogWindowComponent } from './lib/components/dialogWindow/dialogWindow.component';

export { CoreModule } from './lib/core.module';

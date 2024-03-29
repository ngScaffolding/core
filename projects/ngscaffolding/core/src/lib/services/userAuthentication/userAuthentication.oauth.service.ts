import { Injectable } from '@angular/core';
import { UserManager, User } from 'oidc-client';
import { UserAuthenticationBase } from './UserAuthenticationBase';
import { AuthenticationStore } from './userAuthentication.store';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UserAuthenticationQuery } from './userAuthentication.query';
import { AppSettingsQuery } from '../appSettings/appSettings.query';
import { BasicUser } from '@ngscaffolding/models';
import { AppSettings } from '@ngscaffolding/models';
import { BaseEntity } from '@ngscaffolding/models';
import { LoggingService } from '../logging/logging.service';

@Injectable({
    providedIn: 'root'
})
export class OAuthService implements UserAuthenticationBase {
    private manager: UserManager;
    private user: User | null;
    private jwtHelper: JwtHelperService;

    constructor(
        private logger: LoggingService,
        private authStore: AuthenticationStore,
        private authQuery: UserAuthenticationQuery,
        private appSettingsQuery: AppSettingsQuery
    ) {
        logger.info('UserAuthorisationService - Constructor');
        this.jwtHelper = new JwtHelperService({});
        appSettingsQuery.selectEntity(AppSettings.authOAuthSettings).subscribe(settings => {
            if (settings) {
                this.manager = new UserManager(settings.value);
                this.manager.getUser().then(user => {
                    if (user) {
                        this.user = user;
                        this.setToken(this.user.access_token);
                    }
                });
            }
        });
    }
    filterItemsByRole(authItems: BaseEntity[]): Array<BaseEntity> {
        const returnItems: BaseEntity[] = [];

        if (authItems) {
            authItems.forEach(authItem => {
                if (this.checkByRoles(authItem)) {
                    returnItems.push(authItem);
                }
            });
        }

        return returnItems;
    }

    // Check if user passes muster
    checkByRoles(authItem: BaseEntity): boolean {
        // No roles = always okay
        if (!authItem.roles) {
            return true;
        }

        let isAllowed = false;
        const user = this.authQuery.getUser();

        if (user.role) {
            user.role.forEach(role => {
                authItem.roles.forEach(authRole => {
                    if (role === authRole) {
                        isAllowed = true;
                    }
                });
            });
        }
        return isAllowed;
    }

    getToken(): string {
        return this.authQuery.getValue().token;
    }
    forceLogon() {
        this.logon();
    }
    logon(userName = '', password = '') {
        return this.manager.signinRedirect();
    }
    async logoff() {
        await this.manager.signoutRedirect();
    }
    async completeAuthentication() {
        this.user = await this.manager.signinRedirectCallback();
        this.setToken(this.user.access_token);
    }
    isAuthenticated(): boolean {
        this.manager.getUser().then(user => {
            this.user = user;
        });
        return this.user != null && !this.user.expired;
    }
    authorizationHeaderValue() {
        return `${this.user.token_type} ${this.user.access_token}`;
    }
    name(): string {
        return this.user != null ? this.user.profile.name : '';
    }

    private setToken(token: any) {
        // New AuthUser Based on Token
        const tokenDetails = this.jwtHelper.decodeToken(token);

        const newUser: BasicUser = { userId: '', email: '', firstName: '', lastName: '', language: '', name: '', role: [] };

        if (tokenDetails['name']) {
            newUser.name = tokenDetails['name'];
        } else if (tokenDetails['firstName'] && tokenDetails['lastName']) {
            newUser.name = tokenDetails['firstName'] + ' ' + tokenDetails['lastName'];
        }

        if (tokenDetails['role']) {
            newUser.role = tokenDetails['role'];
        }

        if (tokenDetails['email']) {
            newUser.userId = tokenDetails['email'];
            newUser.email = tokenDetails['email'];
        }

        this.authStore.update({
            token,
            userDetails: newUser,
            authenticated: true
        });
    }
}

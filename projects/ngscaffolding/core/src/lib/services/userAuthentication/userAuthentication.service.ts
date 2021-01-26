import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { AppSettingsService } from '../appSettings/appSettings.service';
import { LoggingService } from '../logging/logging.service';


import { AuthenticationStore } from './userAuthentication.store';

import { JwtHelperService } from '@auth0/angular-jwt';
import { UserAuthenticationBase } from './UserAuthenticationBase';
import { resetStores } from '@datorama/akita';
import { UserAuthenticationQuery } from './userAuthentication.query';
import { Router } from '@angular/router';
import { BasicUser } from '../../models/authModels/authUser.model';
import { AppSettings } from '../../models/coreModels/appSettings.model';
import { BaseEntity } from '../../models/coreModels/baseEntity.model';

@Injectable({ providedIn: 'root' })
export class UserAuthenticationService implements UserAuthenticationBase {
    private readonly tokenStorageKey = 'USER_TOKEN';

    private jwtHelper: JwtHelperService;

    constructor(
        private logger: LoggingService,
        private http: HttpClient,
        private authStore: AuthenticationStore,
        private authQuery: UserAuthenticationQuery,
        private appSettingsService: AppSettingsService,
        private router: Router
    ) {
        logger.info('UserAuthorisationService - Constructor');
        this.jwtHelper = new JwtHelperService({});
        this.loadUserTokenFromStorage();
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

    completeAuthentication() {}
    isAuthenticated(): boolean {
        const token = this.getToken();
        const tokenDetails = this.jwtHelper.decodeToken(token);

        return tokenDetails && !this.jwtHelper.isTokenExpired(token);
    }
    authorizationHeaderValue() {}
    name(): string {
        return 'Hello World';
    }

    forceLogon(returnUrl: string) {
        this.logoff();
        this.router.navigate(['login'], { queryParams: { returnUrl: returnUrl } });
    }

    getToken(): string {
        return this.authQuery.getValue().token;
    }

    private loadUserTokenFromStorage() {
        const savedToken = localStorage.getItem(this.tokenStorageKey); // Loaded from Saved Storage
        if (savedToken !== null) {
            // New AuthUser Based on Token
            if (!this.jwtHelper.isTokenExpired(savedToken)) {
                // If all Good
                this.logger.info('Token from Storage - Token Loaded and not Expired');
                this.setToken(savedToken);
            } else {
                // Expired Token
                this.logger.info('Token from Storage - Token Expired - Not using');
            }
        } else {
            // No token
            this.logger.info('Token from Storage - No Token Available');
        }
    }

    private setToken(token: any) {
        // New AuthUser Based on Token
        const tokenDetails = this.jwtHelper.decodeToken(token);

        const newUser = new BasicUser();

        if (tokenDetails['firstName'] && tokenDetails['lastName']) {
            newUser.name = tokenDetails['firstName'] + ' ' + tokenDetails['lastName'];
        }

        if (tokenDetails['sub']) {
            newUser.userId = tokenDetails['sub'];
        }

        if (tokenDetails['role']) {
            newUser.role = tokenDetails['role'];
        }

        if (tokenDetails['email']) {
            newUser.email = tokenDetails['email'];
        }

        this.authStore.update({ token: token, userDetails: newUser, authenticated: true });
    }

    public logon(userName: string, password: string): Observable<null> {
        return new Observable<null>(observer => {
            let body = new HttpParams();
            body = body
                .append('username', userName)
                .append('password', password)
                .append('grant_type', 'password')
                .append('client_id', this.appSettingsService.getValue(AppSettings.authClientId))
                .append('client_secret', this.appSettingsService.getValue(AppSettings.authClientSecret))
                .append('scope', this.appSettingsService.getValue(AppSettings.authScope) + ' offline_access openid');

            this.http
                .post(
                    this.appSettingsService.getValue(AppSettings.apiAuth) + this.appSettingsService.getValue(AppSettings.authTokenEndpoint),
                    body,
                    {
                        headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
                    }
                )
                .pipe(timeout(30000))
                .subscribe(
                    response => {
                        // chek if user is is in 'user' role
                        const tokenDetails = this.jwtHelper.decodeToken(response['access_token']);
                        const requiredRole = this.appSettingsService.getValue(AppSettings.authRequiredRole);
                        if (tokenDetails['role']) {
                            if (requiredRole && !tokenDetails['role'].includes(requiredRole)) {
                                observer.error('Unauthorised');
                            } else {
                        // Save Token in Storage if needed
                        if (this.appSettingsService.getValue(AppSettings.authSaveinLocalStorage)) {
                            localStorage.setItem(this.tokenStorageKey, response['access_token']);
                        }

                        // Load our details from this token
                        this.setToken(response['access_token']);

                        if (response['refresh_token']) {
                            // this.refreshToken = response['refresh_token'];
                        }

                        observer.next(null);
                        observer.complete();
                            }
                        }
                    },
                    err => {
                        observer.error(err);
                    }
                );
        });
    }

    public logoff(): void {
        if (this.appSettingsService.getValue(AppSettings.authSaveinLocalStorage)) {
            // Remove token from Local Storage
            localStorage.removeItem(this.tokenStorageKey);
        }

        // Clear Akita Stores
        resetStores({ exclude: ['appSettings'] });

        this.authStore.update({ token: null, userDetails: null, authenticated: false });
    }
}

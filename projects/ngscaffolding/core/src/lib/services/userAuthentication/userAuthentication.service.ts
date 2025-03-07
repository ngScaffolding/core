import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, tap, timeout } from 'rxjs/operators';

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';


import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { BasicUser } from '@ngscaffolding/models';
import { AppSettings } from '@ngscaffolding/models';
import { BaseEntity } from '@ngscaffolding/models';
import { BaseStateService } from '../base-state.service';
import { AppSettingsService } from '../appSettings/appSettings.service';
import { LoggingService } from '../logging/logging.service';
import { PERSISTENCE_LAYER } from '../../persistence.interface';

export interface AuthenticationState {
  authenticated: boolean;
  token: string;
  refreshToken?: string;
  userDetails: BasicUser;
}

@Injectable({ providedIn: 'root' })
export class UserAuthenticationService extends BaseStateService<AuthenticationState> {
  protected authenticatedUpdated = new BehaviorSubject<boolean>(false);

  public authenticated$ = this.authenticatedUpdated.asObservable();
  public currentUser$ = new BehaviorSubject<BasicUser>({});

  private readonly tokenStorageKey = 'USER_TOKEN';
  private jwtHelper: JwtHelperService;

  private accessToken = '';
  private savedLogonResponse: any;

  private preferencesLocal = inject(PERSISTENCE_LAYER);

  constructor(
    private logger: LoggingService,
    private http: HttpClient,
    private appSettingsService: AppSettingsService,
    private router: Router
  ) {
    super({ authenticated: false, token: '', userDetails: {} });
    logger.info('UserAuthorisationService - Constructor');
    this.jwtHelper = new JwtHelperService({});

    this.loadUserTokenFromStorage();

    this.stateUpdated$
      .pipe(
        tap((state) => {
          if (state.authenticated) {
            this.currentUser$.next(state.userDetails);
          }
          this.authenticatedUpdated.next(state.authenticated);
        }),
        distinctUntilChanged()
      )
      .subscribe();
  }

  getUserId(): string {
    return this.getState()?.userDetails?.userId || '';
  }

  filterItemsByRole(authItems: BaseEntity[]): Array<BaseEntity> {
    const returnItems: BaseEntity[] = [];

    if (authItems) {
      authItems.forEach((authItem) => {
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
    const user = this.getState()?.userDetails;

    if (user.role) {
      user.role.forEach((role) => {
        if (authItem.roles) {
          authItem.roles.forEach((authRole) => {
            if (role === authRole) {
              isAllowed = true;
            }
          });
        }
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
    return '';
  }

  forceLogon(returnUrl: string) {
    this.logoff(true);
    this.router.navigate(['login'], { queryParams: { returnUrl } });
  }

  getToken(): string {
    return this.getState()?.token;
  }

  checkMfaCode(userName: string, code: string): Observable<any> {
    let body = { userId: userName, code: code };

    return this.http
      .post<any>(
        this.appSettingsService.getValue(AppSettings.apiHome) +
          '/api/mfa/checkMfaCode',
        body
      )
      .pipe(
        timeout(30000),
        tap((apiResponse) => {
          // Save Token in Storage if needed
          if (
            this.appSettingsService.getValue(AppSettings.authSaveinLocalStorage)
          ) {
            localStorage.setItem(this.tokenStorageKey, this.accessToken);
          }

          // Load our details from this token
          this.setToken(this.accessToken);
        }),
        catchError((err) => {
          return of(new Error('Invalid Code'));
        })
      );
  }

  request2faCode(userName: string, password: string): Observable<any> {
    return this.callLogonAPI(userName + '||mfa', password, true);
  }

  private callLogonAPI(
    userName: string,
    password: string,
    mfa: boolean = false
  ): Observable<any> {
    let body = new HttpParams();
    body = body
      .append('username', userName)
      .append('password', password)
      .append('grant_type', 'password')
      .append(
        'client_id',
        this.appSettingsService.getValue(AppSettings.authClientId)
      )
      .append(
        'client_secret',
        this.appSettingsService.getValue(AppSettings.authClientSecret)
      )
      .append(
        'scope',
        this.appSettingsService.getValue(AppSettings.authScope) +
          ' offline_access openid'
      )
      .append('mfa', mfa ? 'true' : 'false');

    return this.http
      .post<any>(
        this.appSettingsService.getValue(AppSettings.apiHome) +
          this.appSettingsService.getValue(AppSettings.authTokenEndpoint),
        body,
        {
          headers: new HttpHeaders().set(
            'Content-Type',
            'application/x-www-form-urlencoded'
          ),
        }
      )
      .pipe(
        timeout(30000),
        tap((apiResponse) => {
          // check if user is is in 'user' role
          const tokenDetails = this.jwtHelper.decodeToken(
            apiResponse['access_token']
          );
          const requiredRole = this.appSettingsService.getValue(
            AppSettings.authRequiredRole
          );
          if (tokenDetails['role']) {
            if (requiredRole && !tokenDetails['role'].includes(requiredRole)) {
              this.authenticatedUpdated.next(false);
              throwError(() => new Error('Unauthorised'));
            } else {
              this.accessToken = apiResponse['access_token'];
            }
          }
        })
      );
  }

  validateMfaCode(userName: string, code: string): Observable<any> {
    let body = { userId: userName, code: code };

    return this.http
      .post<any>(
        this.appSettingsService.getValue(AppSettings.apiHome) + '/checkMfaCode',
        body,
        {
          headers: new HttpHeaders().set(
            'Content-Type',
            'application/x-www-form-urlencoded'
          ),
        }
      )
      .pipe(
        timeout(30000),
        tap((validationResponse) => {
          this.processTokenResponse(this.savedLogonResponse);
        }),
        catchError((err) => {
          this.authenticatedUpdated.next(false);
          return err;
        })
      );
  }

  logon(userName: string, password: string): Observable<null> {
    return new Observable<null>((observer) => {
      this.callLogonAPI(userName, password).subscribe(
        (apiResponse) => {
          // check if user is is in 'user' role
          const tokenDetails = this.jwtHelper.decodeToken(
            apiResponse['access_token']
          );
          const requiredRole = this.appSettingsService.getValue(
            AppSettings.authRequiredRole
          );
          if (tokenDetails['role']) {
            if (requiredRole && !tokenDetails['role'].includes(requiredRole)) {
              this.authenticatedUpdated.next(false);
              observer.error('Unauthorised');
            } else {
              if (!userName.endsWith('||mfa')) {
                this.processTokenResponse(apiResponse);
              } else {
                this.savedLogonResponse = apiResponse;
              }
              observer.next(null);
              observer.complete();
            }
          }
        },
        (err) => {
          this.authenticatedUpdated.next(false);
          observer.error(err);
        }
      );
    });
  }

  private processTokenResponse(apiResponse: any) {
    // Save Token in Storage if needed
    if (this.appSettingsService.getValue(AppSettings.authSaveinLocalStorage)) {
      localStorage.setItem(this.tokenStorageKey, apiResponse['access_token']);
    }

    // Load our details from this token
    this.setToken(apiResponse['access_token']);

    if (apiResponse['refresh_token']) {
      // this.refreshToken = response['refresh_token'];
    }

    this.authenticatedUpdated.next(true);
  }

  logoff(bypassResetStores = false): void {
    if (this.appSettingsService.getValue(AppSettings.authSaveinLocalStorage)) {
      // Remove token from Local Storage
      localStorage.removeItem(this.tokenStorageKey);
    }

    if (!bypassResetStores) {
      this.resetStores();
    }

    this.setState({
      token: '',
      userDetails: {},
      authenticated: false,
    });

    this.authenticatedUpdated.next(false);
    setTimeout(() => {
      this.router.navigateByUrl('/login');
    }, 100);
  }

  private async resetStores() {
    localStorage.clear();
    await this.preferencesLocal.clear();
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

    const newUser: BasicUser = {
      userId: '',
      email: '',
      firstName: '',
      lastName: '',
      language: '',
      name: '',
      role: [],
    };

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

    if (tokenDetails['language']) {
      newUser.language = tokenDetails['language'];
    }

    this.updateState({ token, userDetails: newUser, authenticated: true });
    this.authenticatedUpdated.next(true);
  }
}

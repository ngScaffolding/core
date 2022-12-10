import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { Injectable } from '@angular/core';
import { UserAuthenticationQuery } from '../services/userAuthentication/userAuthentication.query';
import { UserAuthenticationBase } from '../services/userAuthentication/UserAuthenticationBase';


@Injectable()
export class AuthoriseRoleGuard implements CanActivate {
  constructor(
    private authService: UserAuthenticationBase,
    private authQuery: UserAuthenticationQuery
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    if (this.authQuery.isAuthenticated()) {
      return true;
    }

    // No authority, bye bye.
    this.authService.forceLogon(state.url);
    return false;
  }
}

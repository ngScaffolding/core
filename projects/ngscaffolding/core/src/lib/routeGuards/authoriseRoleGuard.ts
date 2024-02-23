import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { UserAuthenticationBase } from '../services/userAuthentication/UserAuthenticationBase';


@Injectable()
export class AuthoriseRoleGuard  {
  constructor(
    private authService: UserAuthenticationBase,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    if (this.authService.isAuthenticated()) {
      return true;
    }

    // No authority, bye bye.
    this.authService.forceLogon(state.url);
    return false;
  }
}

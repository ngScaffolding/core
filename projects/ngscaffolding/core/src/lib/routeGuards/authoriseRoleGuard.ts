import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { UserAuthenticationService } from '../services/userAuthentication/userAuthentication.service';


@Injectable()
export class AuthoriseRoleGuard  {
  constructor(
    private authService: UserAuthenticationService,
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

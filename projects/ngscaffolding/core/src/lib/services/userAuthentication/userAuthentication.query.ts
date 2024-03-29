import { Injectable } from '@angular/core';
import { Query, toBoolean } from '@datorama/akita';
import { BasicUser } from '@ngscaffolding/models';
import { AuthenticationStore, AuthenticationState } from './userAuthentication.store';

@Injectable({
    providedIn: 'root'
})
export class UserAuthenticationQuery extends Query<AuthenticationState> {
    authenticated$ = this.select(state => state.authenticated);
    currentUser$ = this.select(state => state.userDetails);

    constructor(protected store: AuthenticationStore) {
        super(store);
    }

    isAuthenticated() {
        return toBoolean(this.getValue().authenticated);
    }

    getUserId() {
        if (this.isAuthenticated() && this.getValue().userDetails) {
            return this.getValue().userDetails.userId;
        } else {
            return null;
        }
    }

    getUser(): BasicUser {
        return this.getValue().userDetails;
    }

    hasPermission(permission: string): boolean {
        return this.getValue()?.userDetails?.permissions?.indexOf(permission) > -1;;
    }
}

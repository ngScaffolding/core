import { Injectable } from '@angular/core';
import { BaseEntity } from '@ngscaffolding/models';

@Injectable()
export abstract class UserAuthenticationBase {
    abstract getToken(): string;
    abstract forceLogon(returnUrl: string);
    abstract logon(userName: string, password: string);
    abstract logoff();

    abstract async completeAuthentication();
    abstract isAuthenticated(): boolean;
    abstract authorizationHeaderValue();
    abstract name(): string;

    abstract filterItemsByRole(authItems: BaseEntity[]): BaseEntity[];

    abstract checkByRoles(authItem: BaseEntity): boolean;
}

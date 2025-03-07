import { Injectable } from '@angular/core';
import { BaseEntity } from '@ngscaffolding/models';

@Injectable()
export abstract class UserAuthenticationBase {
    abstract getToken(): string;
    abstract forceLogon(returnUrl: string): void | Promise<void>;
    abstract logon(userName: string, password: string): void | Promise<void>;
    abstract logoff(): void | Promise<void>;

    abstract completeAuthentication(): void | Promise<void>;
    abstract isAuthenticated(): boolean;
    abstract authorizationHeaderValue(): string;
    abstract name(): string;

    abstract filterItemsByRole(authItems: BaseEntity[]): BaseEntity[];

    abstract checkByRoles(authItem: BaseEntity): boolean;
}

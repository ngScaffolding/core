import {
  HostListener,
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { tap, takeUntil } from 'rxjs/operators';
import { LoggingService } from '../services/logging/logging.service';
import { UserAuthenticationQuery } from '../services/userAuthentication/userAuthentication.query';
import { BasicUser } from '@ngscaffolding/models';

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[ngsHasPermission]' })
export class HasPermissionsDirective implements OnInit, OnDestroy {
  private initialDisplay: string;
  private onDestroy$ = new Subject();
  private user: BasicUser;
  private hasView = false;
  private permissions: string[];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authQuery: UserAuthenticationQuery
  ) {
    authQuery.currentUser$
      .pipe(
        tap((user) => {
          this.user = user;
          this.showHide();
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe();
  }

  @Input() set ngsHasPermission(permission: string) {
    this.permissions = permission.split(',');
    this.showHide();
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.onDestroy$.next(null);
    this.onDestroy$.complete();
  }

  private showHide(){
    if (
      this.user?.permissions &&
      this.user.permissions.filter(v => this.permissions.includes(v)).length
    ) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

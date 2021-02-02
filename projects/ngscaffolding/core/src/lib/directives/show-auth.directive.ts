import {
  HostListener,
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { LoggingService } from '../services/logging/logging.service';
import { UserAuthenticationQuery } from '../services/userAuthentication/userAuthentication.query';

@Directive({ selector: '[ngsShowAuth]' })
export class ShowAuthDirective implements AfterViewInit, OnDestroy {
  private authSub: Subscription;
  private initialDisplay: string;

  constructor(
    private el: ElementRef,
    private authQuery: UserAuthenticationQuery
  ) {}

  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    this.initialDisplay = this.el.nativeElement.style.display;

    this.authSub = this.authQuery.authenticated$.subscribe((auth) => {
      if (auth) {
        this.el.nativeElement.style.display = this.initialDisplay;
      } else {
        this.el.nativeElement.style.display = 'none';
      }
    });
  }
}

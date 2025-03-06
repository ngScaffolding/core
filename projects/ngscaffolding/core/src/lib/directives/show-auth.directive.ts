import {
  HostListener,
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { UserAuthenticationService } from '@ngscaffolding/core';

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({
    selector: '[ngsShowAuth]',
    standalone: true
})
export class ShowAuthDirective implements AfterViewInit, OnDestroy {
  private authSub: Subscription | undefined;
  private initialDisplay = '';

  constructor(
    private el: ElementRef,
    private authService: UserAuthenticationService
  ) {}

  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  ngAfterViewInit(): void {
    this.initialDisplay = this.el.nativeElement.style.display;

    this.authSub = this.authService.authenticated$.subscribe((auth) => {
      if (auth) {
        this.el.nativeElement.style.display = this.initialDisplay;
      } else {
        this.el.nativeElement.style.display = 'none';
      }
    });
  }
}

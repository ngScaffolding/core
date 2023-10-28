import {
  HostListener,
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
} from '@angular/core';
import { LoggingService } from '../services/logging/logging.service';

// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({ selector: '[ngsFillHeight]' })
export class FillHeightDirective implements AfterViewInit {
  @Input() fixedHeight: number = 0;
  @Input() relativeToParentPercent = 0;
  @Input() deductValue = 0;

  constructor(private el: ElementRef, private logger: LoggingService) { }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.calculateAndSetElementHeight();
  }

  ngAfterViewInit(): void {
    this.calculateAndSetElementHeight();
  }

  private calculateAndSetElementHeight() {
    if (this.relativeToParentPercent > 0) {
      const parentHeight = this.el.nativeElement.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.offsetHeight;
      if (parentHeight > 0) {
        this.el.nativeElement.style.height = `${parentHeight * (this.relativeToParentPercent / 100)}px`;
      }
    } else if (this.fixedHeight > 0) {
      this.el.nativeElement.style.height = `${this.fixedHeight}px`;
    } else {
      this.el.nativeElement.style.overflow = 'auto';
      let windowHeight = window.innerHeight;
      if (windowHeight === 0) {
        this.logger.error('FillHeight: Window reported zero height');
        windowHeight = 800;
      }
      const elementOffsetTop = this.getElementOffsetTop();
      const elementMarginBottom = this.el.nativeElement.style.marginBottom;
      // const footerElementMargin = this.getfooterElementMargin();

      this.el.nativeElement.style.height = `${windowHeight - elementOffsetTop - 16 - Number(this.deductValue)}px`;
    }
  }

  private getElementOffsetTop() {
    return this.el.nativeElement.getBoundingClientRect().top;
  }

  // private getfooterElementMargin() {
  //   if (!this.footerElement) {
  //     return 0;
  //   }
  //   const footerStyle = window.getComputedStyle(this.footerElement);
  //   return parseInt(footerStyle.height, 10);
  // }
}

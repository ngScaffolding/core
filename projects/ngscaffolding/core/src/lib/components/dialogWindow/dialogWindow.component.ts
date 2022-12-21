import { Component, OnInit, OnChanges, OnDestroy, SimpleChanges, EventEmitter, Output } from '@angular/core';

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'ngs-dialog-window',
    templateUrl: 'dialogWindow.component.html',
    styleUrls: ['dialogWindow.component.scss']
})
export class DialogWindowComponent implements OnInit, OnChanges, OnDestroy {
    @Output() closed = new EventEmitter<any>();
    @Output() saved = new EventEmitter<any>();

    ngOnChanges(changes: SimpleChanges): void {}
    ngOnDestroy(): void {}
    ngOnInit(): void {}

    cancel(event: any) {
        this.closed.emit(null);
    }

    save(event: any) {
        this.saved.emit(event);
    }
}

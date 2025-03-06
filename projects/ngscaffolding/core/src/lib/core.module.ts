import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Pipes
import { ButtonColourPipe } from './pipes/buttonColour.pipe';
import { NgsDateTimePipe } from './pipes/ngsDateTime.pipe';
import { NgsDatePipe } from './pipes/ngsDate.pipe';
import { TruncateTextPipe } from './pipes/truncateText.pipe';
import { DateAgoPipe } from './pipes/date-ago.pipe';

// Directives
import { FillHeightDirective } from './directives/fill-height.directive';

// Services
import { VersionsService } from './services/versions/versions.service';

import { VERSION } from './version';
import { Optional } from '@angular/core';
import { SkipSelf } from '@angular/core';
import { ShowAuthDirective } from './directives/show-auth.directive';

@NgModule({
    imports: [CommonModule, FormsModule, FillHeightDirective,
    ShowAuthDirective,
    ButtonColourPipe,
    NgsDatePipe,
    NgsDateTimePipe,
    TruncateTextPipe,
        DateAgoPipe],
  exports: [
    ButtonColourPipe,
    NgsDatePipe,
    NgsDateTimePipe,
    TruncateTextPipe,
    DateAgoPipe,
    FillHeightDirective,
    ShowAuthDirective,
  ],
})
export class CoreModule {
  constructor(
    versions: VersionsService,
    @Optional() @SkipSelf() parentModule?: CoreModule
  ) {
    if (versions) {
      versions.addVersion('@ngscaffolding/core', VERSION.version);
    }
  }

  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
    };
  }
}

import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Pipes
import { ButtonColourPipe } from './pipes/buttonColour.pipe';
import { NgsDateTimePipe } from './pipes/ngsDateTime.pipe';
import { NgsDatePipe } from './pipes/ngsDate.pipe';
import { TruncateTextPipe } from './pipes/truncateText.pipe';

// Directives
import { FillHeightDirective } from './directives/fill-height.directive';

// Services
import { VersionsService } from './services/versions/versions.service';

// Components
import { DialogWindowComponent } from './components/dialogWindow/dialogWindow.component';

import { VERSION } from './version';
import { Optional } from '@angular/core';
import { SkipSelf } from '@angular/core';
import { ShowAuthDirective } from './directives/show-auth.directive';

@NgModule({
  imports: [CommonModule, FormsModule, HttpClientModule],
  declarations: [
    FillHeightDirective,
    ShowAuthDirective,
    ButtonColourPipe,
    NgsDatePipe,
    NgsDateTimePipe,
    TruncateTextPipe,
    DialogWindowComponent,
  ],
  exports: [
    ButtonColourPipe,
    NgsDatePipe,
    NgsDateTimePipe,
    TruncateTextPipe,
    FillHeightDirective,
    ShowAuthDirective,
    DialogWindowComponent,
  ],
})
export class CoreModule {
  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
    };
  }
  constructor(
    versions: VersionsService,
    @Optional() @SkipSelf() parentModule?: CoreModule
  ) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only'
      );
    }
    versions.addVersion('@ngscaffolding/core', VERSION.version);
  }
}

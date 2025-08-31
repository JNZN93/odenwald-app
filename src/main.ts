import { bootstrapApplication } from '@angular/platform-browser';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Register German locale
registerLocaleData(localeDe);

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    { provide: LOCALE_ID, useValue: 'de' }
  ]
})
  .catch((err) => console.error(err));

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { jwtInterceptor } from './core/auth/jwt.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top', // Scroll immer nach oben (nicht zur vorherigen Position)
        anchorScrolling: 'enabled',       // erlaubt #anchors
      })
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([jwtInterceptor])
    ),
    provideAnimations()
  ]
};

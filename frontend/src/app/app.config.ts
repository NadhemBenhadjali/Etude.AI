import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { tokenInterceptor } from './interceptors/token.interceptor';

import { routes } from './app.routes';

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8083',
        realm: 'etudeai',
        clientId: 'front'
      },
      initOptions: {
        checkLoginIframe: false,
        // Don't check SSO - we use custom direct login
        onLoad: undefined,
        flow: 'standard'
      },
      enableBearerInterceptor: false,
      bearerExcludedUrls: ['/assets', '/api/public']
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),

    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    }
  ]
};

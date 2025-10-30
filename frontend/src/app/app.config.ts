import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { KcAuthService } from './services/kc-auth.service';
import { ProfileSyncService } from './services/profile-sync.service';
import { kcAuthInterceptor } from './services/kc-auth.interceptor';

export function initAll(kc: KcAuthService, sync: ProfileSyncService) {
  return async () => {
    await kc.init();
    await sync.run();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([kcAuthInterceptor])),
    { provide: APP_INITIALIZER, useFactory: initAll, deps: [KcAuthService, ProfileSyncService], multi: true }
  ]
};

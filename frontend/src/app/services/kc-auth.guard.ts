import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { KcAuthService } from './kc-auth.service';

export const kcAuthGuard: CanActivateFn = () => {
  const kc = inject(KcAuthService);
  if (kc.authenticated) return true;
  kc.login();
  return false;
};

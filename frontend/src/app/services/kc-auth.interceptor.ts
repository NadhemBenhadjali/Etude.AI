import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, of, switchMap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { KcAuthService } from './kc-auth.service';

export const kcAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const kc = inject(KcAuthService);
  const isApi = req.url.startsWith(environment.backendBase);
  if (!isApi) return next(req);

  return from(kc.ensureFreshToken(30)).pipe(
    catchError(() => of(null)),
    switchMap(() => {
      const token = kc.getToken();
      const withAuth = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(withAuth);
    })
  );
};

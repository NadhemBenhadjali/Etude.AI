import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {from} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {environment} from '../../environments/environment'; // adjust path if needed

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const apiBaseUrl = environment.apiUrl;

  // 1) Skip Angular assets (icons, scripts, etc.)
  if (req.url.startsWith('assets/')) {
    return next(req);
  }

  // 2) Skip Keycloak token refresh requests (they don't need our token)
  if (req.url.includes('/realms/') || req.url.includes('/protocol/openid-connect/token')) {
    return next(req);
  }

  const isApiCall = req.url === '/api' || req.url.startsWith('/api/');


  if (!isApiCall) {
    return next(req);
  }

  return from(authService.getToken()).pipe(
    switchMap(token => {

      if (!token) {
        console.warn('No authentication token available for request:', req.url);
        // Not logged in or no token → send request as is
        // Backend will return 401 for protected endpoints
        return next(req);
      }

      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next(authReq);
    })
  );
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment'; // adjust path if needed

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const apiBaseUrl = environment.apiUrl ?? 'http://localhost:8081/api';

  // 1) Skip Angular assets (icons, scripts, etc.)
  if (req.url.startsWith('assets/')) {
    return next(req);
  }

  // 2) Only attach tokens to calls going to your backend API
  const isApiCall =
    req.url.startsWith(apiBaseUrl) ||
    req.url.startsWith('http://localhost:8081/api') ||
    req.url.startsWith('/api/');

  if (!isApiCall) {
    return next(req);
  }

  return from(authService.getToken()).pipe(
    switchMap(token => {
      if (!token) {
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

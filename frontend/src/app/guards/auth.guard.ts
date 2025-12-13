import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authenticated = await authService.isLoggedIn();

  if (authenticated) {
    return true;
  }

  // Redirect to your custom signin page, keep returnUrl
  router.navigate(['/signin'], {
    queryParams: { returnUrl: state.url }
  });

  return false;
};

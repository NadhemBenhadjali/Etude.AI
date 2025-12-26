import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class GuestGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    async canActivate(): Promise<boolean | UrlTree> {
        const isLoggedIn = await this.authService.isLoggedIn();

        if (isLoggedIn) {
            // If logged in, redirect to dashboard
            return this.router.createUrlTree(['/dashboard']);
        }

        // If not logged in, allow access to login/signup pages
        return true;
    }
}

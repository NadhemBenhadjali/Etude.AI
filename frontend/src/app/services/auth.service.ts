import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Fallback to localhost:8080/auth in dev if origin is 4200 (Angular) and no proxy
  private readonly keycloakUrl = (environment.production || window.location.origin.includes('8080'))
    ? window.location.origin + '/auth'
    : 'http://localhost:8080/auth';
  private readonly realm = environment.keycloakRealm;
  private readonly clientId = environment.keycloakClientId;

  private readonly TOKEN_KEY = 'etude_access_token';
  private readonly REFRESH_TOKEN_KEY = 'etude_refresh_token';

  constructor(
    private keycloak: KeycloakService, // still useful for SSO login/logout if needed
    private http: HttpClient
  ) { }

  // -------------------------------
  // Token storage
  // -------------------------------

  private saveTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, accessToken);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private getStoredAccessToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private clearStoredTokens(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // -------------------------------
  // JWT helpers
  // -------------------------------

  private decodeJwt(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (e: any) {
      console.error('Failed to decode JWT', e);
      return null;
    }
  }

  private isTokenExpired(token: string, offsetSeconds: number = 0): boolean {
    const decoded = this.decodeJwt(token);
    if (!decoded || !decoded.exp) {
      // If we can’t read exp, treat it as expired
      return true;
    }

    const expMs = decoded.exp * 1000;
    const nowMs = Date.now();

    return expMs <= nowMs + offsetSeconds * 1000;
  }

  // -------------------------------
  // REFRESH
  // -------------------------------

  private async refreshTokens(): Promise<void> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token stored');
    }

    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      refresh_token: refreshToken
    });

    try {
      const response = await firstValueFrom(
        this.http.post<any>(tokenUrl, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );

      const newAccessToken = response.access_token;
      const newRefreshToken = response.refresh_token ?? refreshToken;

      if (!newAccessToken) {
        throw new Error('No access_token in refresh response');
      }

      this.saveTokens(newAccessToken, newRefreshToken);
    } catch (error: any) {
      // Just log the raw error, no ".error" property access
      console.error('Refresh token request failed', error);
      throw error;
    }
  }

  // -------------------------------
  // AUTH FLOW
  // -------------------------------

  /**
   * Direct login using username/password (Direct Access Grants).
   * This is the custom login method for your UI.
   */
  async directLogin(username: string, password: string): Promise<void> {
    const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      username,
      password
    });

    try {
      const response = await firstValueFrom(
        this.http.post<any>(tokenUrl, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );

      if (!response.access_token || !response.refresh_token) {
        throw new Error('Missing tokens in direct login response');
      }

      this.saveTokens(response.access_token, response.refresh_token);
    } catch (error: any) {
      console.error('Direct login failed', error);
      this.clearStoredTokens();
      throw new Error('Authentication failed');
    }
  }

  /**
   * Optional SSO login using Keycloak UI.
   */
  login(redirectUrl?: string): Promise<void> {
    const redirectUri =
      window.location.origin + (redirectUrl ?? window.location.pathname);

    return this.keycloak.login({ redirectUri });
  }

  /**
   * Optional SSO registration using Keycloak UI.
   */
  register(redirectUrl?: string): Promise<void> {
    const redirectUri =
      window.location.origin + (redirectUrl ?? window.location.pathname);

    return this.keycloak.register({ redirectUri });
  }

  /**
   * Lightweight: just check that we still have tokens.
   * NO refresh here (refresh is done in getToken()).
   */
  async isLoggedIn(): Promise<boolean> {
    const accessToken = this.getStoredAccessToken();
    const refreshToken = this.getStoredRefreshToken();

    if (!accessToken || !refreshToken) {
      return false;
    }

    // If we have tokens, treat as logged in; getToken() will handle refresh/fail.
    return true;
  }

  /**
   * Get the current access token.
   * - If still valid → return it
   * - If expired → try refresh
   * - If refresh fails → clear & return null
   */
  async getToken(): Promise<string | null> {
    const accessToken = this.getStoredAccessToken();
    const refreshToken = this.getStoredRefreshToken();

    if (!accessToken || !refreshToken) {
      return null;
    }

    // Still valid for at least 30s? use it.
    if (!this.isTokenExpired(accessToken, 30)) {
      return accessToken;
    }

    // Otherwise, try to refresh
    try {
      await this.refreshTokens();
      return this.getStoredAccessToken();
    } catch (error: any) {
      console.error('Token refresh failed in getToken', error);
      this.clearStoredTokens();
      return null;
    }
  }

  /**
   * Read username from JWT payload.
   */
  getUsername(): string | null {
    const token = this.getStoredAccessToken();
    if (!token) {
      return null;
    }
    const payload = this.decodeJwt(token);
    if (!payload) return null;
    return payload.preferred_username || payload.email || null;
  }

  /**
   * Logout: clear local tokens + attempt SSO logout.
   */
async logout(redirectUrl?: string): Promise<void> {
  const redirectUri = window.location.origin + (redirectUrl ?? '/signin');
  const refreshToken = this.getStoredRefreshToken();

  try {
    if (refreshToken) {
      const logoutUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`;
      const body = new URLSearchParams({
        client_id: this.clientId,
        refresh_token: refreshToken,
      });

      await firstValueFrom(
        this.http.post(logoutUrl, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    }
  } catch (e) {
    // Even if Keycloak logout fails, still clear local tokens
    console.warn('Token-based logout failed', e);
  } finally {
    this.clearStoredTokens();
    window.location.href = redirectUri;
  }
}

}

import { Injectable } from '@angular/core';
import Keycloak, { KeycloakConfig, KeycloakProfile } from 'keycloak-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KcAuthService {
  private kc!: any;
  private ready = false;

  async init(): Promise<void> {
    const cfg: KeycloakConfig = {
      url: environment.kc.url,
      realm: environment.kc.realm,
      clientId: environment.kc.clientId
    };
    this.kc = new (Keycloak as any)(cfg);
    await this.kc.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      silentCheckSsoRedirectUri: `${window.location.origin}/assets/silent-check-sso.html`,
      checkLoginIframe: false
    });
    this.kc.onTokenExpired = () => {
      this.ensureFreshToken(30).catch(() => this.login());
    };
    this.ready = true;
  }

  isReady(): boolean { return this.ready; }
  isAuthenticated(): boolean { return !!this.kc?.authenticated; }

  async ensureFreshToken(minValiditySeconds = 30): Promise<void> {
    if (!this.kc?.authenticated) return;
    try {
      await this.kc.updateToken(minValiditySeconds);
    } catch (e) {
      await this.login();
      throw e;
    }
  }

  login(redirectUri: string = window.location.origin): Promise<void> {
    return this.kc.login({ redirectUri });
  }
  register(redirectUri: string = window.location.origin): Promise<void> {
    return this.kc.register({ redirectUri });
  }
  logout(redirectUri: string = window.location.origin): Promise<void> {
    return this.kc.logout({ redirectUri });
  }

  async loadUserProfile(): Promise<KeycloakProfile> {
    return this.kc.loadUserProfile();
  }

  getToken(): string | undefined { return this.kc?.token; }
  getSubject(): string | undefined { return this.kc?.tokenParsed?.sub; }
  getEmail(): string | undefined { return this.kc?.tokenParsed?.email; }

  get authenticated(): boolean { return this.isAuthenticated(); }
  get token(): string | undefined { return this.getToken(); }
}

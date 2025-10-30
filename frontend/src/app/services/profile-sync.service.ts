// src/app/services/profile-sync.service.ts
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserApiService, CreateUserDto } from './user-api.service';
import { KcAuthService } from './kc-auth.service';

const PENDING_KEY = 'pendingUserProfile';

@Injectable({ providedIn: 'root' })
export class ProfileSyncService {
  constructor(private api: UserApiService, private kc: KcAuthService) {}

  async run(): Promise<void> {
    if (!this.kc.isReady() || !this.kc.isAuthenticated()) return;

    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;

    await this.kc.ensureFreshToken(30);

    const pending = JSON.parse(raw) as Omit<CreateUserDto, 'email'>;
    const email = this.kc.getEmail();
    if (!email) return;

    const payload: CreateUserDto = { ...pending, email };
    try {
      await firstValueFrom(this.api.createUser(payload));  // interceptor adds Bearer
      localStorage.removeItem(PENDING_KEY);
    } catch {
      // keep or clear pending data based on your UX
    }
  }

  savePendingProfile(data: Omit<CreateUserDto, 'email'>): void {
    localStorage.setItem(PENDING_KEY, JSON.stringify(data));
  }
}

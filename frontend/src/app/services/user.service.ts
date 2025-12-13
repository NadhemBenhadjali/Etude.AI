import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDTO {
    id?: string;
    keycloakUserId?: string;
    email: string;
    firstname: string;
    lastname: string;
    birthDate: string;
    level:     'FIRST'| 'SECOND'|  'THIRD'|  'FOURTH'| 'FIFTH'|  'SIXTH'
    elo?: number;
    role?: string;
    avatar?: string;
    totalQuizzes?: number;
    highestScore?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface SessionDTO {
    id: string;
    topic?: string;
    selectedModule?: string;
    notes?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface AchievementDTO {
    id: string;
    name: string;
    icon : string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8081/api/users';

    createUser(user: Partial<UserDTO>): Observable<string> {
        return this.http.post<string>(this.apiUrl, user);
    }

    getCurrentUser(): Observable<UserDTO> {
        return this.http.get<UserDTO>(`${this.apiUrl}/me`);
    }

    updateUser(user: Partial<UserDTO>): Observable<UserDTO> {
        return this.http.put<UserDTO>(`${this.apiUrl}/me`, user);
    }

    deleteUser(): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/me`);
    }

    getUserSessions(page: number = 0, size: number = 10): Observable<PageResponse<SessionDTO>> {
        return this.http.get<PageResponse<SessionDTO>>('http://localhost:8081/api/sessions', {
            params: { page: page.toString(), size: size.toString() }
        });
    }

    getUserAchievements(): Observable<AchievementDTO[]> {
        return this.http.get<AchievementDTO[]>('http://localhost:8081/api/achievements/me');
    }

    registerUser(registrationData: RegistrationData): Observable<string> {
        return this.http.post<string>('http://localhost:8081/api/public/register', registrationData, {
            responseType: 'text' as 'json'
        });
    }
  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/me/change-password`, payload);
  }
}

export interface RegistrationData {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    birthDate?: string;
    level?: string;
}

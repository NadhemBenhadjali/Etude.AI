import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserDTO {
    id?: string;
    keycloakUserId?: string;
    email: string;
    firstname: string;
    lastname: string;
    birthDate: string;
    level: 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FIFTH' | 'SIXTH'
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
    level?: string;
    subject?: string;
    module?: string;
    lesson?: string;
    status: string;
    createdAt?: string;
    startedAt?: string;
    completedAt?: string;
    summaryPointsOfFocus?: string[];
    quizPointsOfFocus?: string[];
    quizScore?: number;
    summary?: string;
    sessionFeedback?: string;
    lessonContent?: string;
    quizElements?: QuizElementDTO[];
    qnaElements?: QnAElementDTO[];
    // Deprecated/Mapped fields locally
    topic?: string;
    selectedModule?: string;
    notes?: string;
    updatedAt?: string;
}

export interface QuizElementDTO {
    id?: string;
    quizType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED' | 'CODING' | 'FILL_IN_THE_BLANK';
    question: string;
    options: string[];
    answer: string;
    answered: boolean;
}

export interface QnAElementDTO {
    id?: string;
    question: string;
    answer: string;
}

export interface AchievementDTO {
    id: string;
    name: string;
    icon: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    createUser(user: Partial<UserDTO>): Observable<string> {
        return this.http.post<string>(this.apiUrl, user);
    }

    getCurrentUser(): Observable<UserDTO> {
        return this.http.get<UserDTO>(`${this.apiUrl}/users/me`);
    }

    updateUser(user: Partial<UserDTO>): Observable<UserDTO> {
        return this.http.put<UserDTO>(`${this.apiUrl}/users/me`, user);
    }

    deleteUser(): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/users/me`);
    }

    getUserSessions(page: number = 0, size: number = 10): Observable<PageResponse<SessionDTO>> {
        return this.http.get<PageResponse<SessionDTO>>(`${this.apiUrl}/sessions`, {
            params: { page: page.toString(), size: size.toString() }
        });
    }

    getUserAchievements(): Observable<AchievementDTO[]> {
        return this.http.get<AchievementDTO[]>(`${this.apiUrl}/achievements/me`);
    }

    registerUser(registrationData: RegistrationData): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/public/register`, registrationData, {
            responseType: 'text' as 'json'
        });
    }
    changePassword(payload: ChangePasswordRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/users/me/change-password`, payload);
    }

    saveSession(session: SessionDTO): Observable<SessionDTO> {
        return this.http.post<SessionDTO>(`${this.apiUrl}/sessions/save`, session);
    }

    getSessionById(id: string): Observable<SessionDTO> {
        return this.http.get<SessionDTO>(`${this.apiUrl}/sessions/${id}`);
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

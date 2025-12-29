import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: string;
    progress?: number; // Add optional progress field (0-100)
    currentValue?: number; // e.g., current quiz count
    targetValue?: number; // e.g., target quiz count
}

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    private apiUrl = `${environment.apiUrl}/achievements`;
    private sessionsUrl = `${environment.apiUrl}/sessions`;

    constructor(private http: HttpClient) { }

    getMyAchievements(): Observable<Achievement[]> {
        return this.http.get<Achievement[]>(`${this.apiUrl}/me`);
    }

    submitQuizResult(score: number, totalQuestions: number, module: string): Observable<void> {
        return this.http.post<void>(`${this.sessionsUrl}/quiz/submit`, {
            score,
            totalQuestions,
            module
        });
    }
}

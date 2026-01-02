import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionDTO, SessionUpdateDTO } from '../model/session.model';
import { UserDTO,ChangePasswordRequest,RegistrationData } from '../model/user.model';
import { PageResponse } from '../model/shared.model';

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

    registerUser(registrationData: RegistrationData): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/public/register`, registrationData, {
            responseType: 'text' as 'json'
        });
    }
    changePassword(payload: ChangePasswordRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/users/me/change-password`, payload);
    }

    saveSession(session: Partial<SessionDTO>): Observable<SessionDTO> {
        return this.http.post<SessionDTO>(`${this.apiUrl}/sessions/save`, session);
    }

    updateSession(id: string, updateData: SessionUpdateDTO): Observable<SessionDTO> {
        return this.http.put<SessionDTO>(`${this.apiUrl}/sessions/${id}`, updateData);
    }

    getSessionById(id: string): Observable<SessionDTO> {
        return this.http.get<SessionDTO>(`${this.apiUrl}/sessions/${id}`);
    }
}

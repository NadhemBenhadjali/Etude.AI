import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export type Level = 'FIRST' | 'SECOND' | 'THIRD';

export interface CreateUserDto {
  email: string;
  firstname: string;
  lastname: string;
  birthDate: string;
  level: Level;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private base = environment.backendBase;

  constructor(private http: HttpClient) {}

  createUser(dto: CreateUserDto): Observable<string> {
    return this.http.post<string>(`${this.base}/api/users`, dto, { withCredentials: true });
  }

  me(): Observable<any> {
    return this.http.get<any>(`${this.base}/api/users/me`, { withCredentials: true });
  }
}

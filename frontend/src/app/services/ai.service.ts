import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface PlanRequest {
    goal: string;
    time: string;
}

export interface QaRequest {
    question: string;
}

export interface SummaryRequest {
    subject: string;
    module: string;
}

export interface TtsRequest {
    text: string;
}

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private apiUrl = environment.apiBase;

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders(): Observable<HttpHeaders> {
        return from(this.authService.getToken()).pipe(
            map(token => new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }))
        );
    }

    generatePlan(goal: string, time: string): Observable<any> {
        return this.getHeaders().pipe(
            switchMap(headers => this.http.post(`${this.apiUrl}/plan`, { goal, time }, { headers }))
        );
    }

    askQuestion(question: string): Observable<any> {
        return this.getHeaders().pipe(
            switchMap(headers => this.http.post(`${this.apiUrl}/qa`, { question }, { headers }))
        );
    }

    generateSummary(subject: string, module: string): Observable<any> {
        return this.getHeaders().pipe(
            switchMap(headers => this.http.post(`${this.apiUrl}/summary`, { subject, module }, { headers }))
        );
    }

    generateQuiz(module: string, num_mc: number, num_tf: number): Observable<any> {
        return this.getHeaders().pipe(
            switchMap(headers => this.http.post(`${this.apiUrl}/quiz`, { module, num_mc, num_tf }, { headers }))
        );
    }

    generateTts(text: string): Observable<Blob> {
        return this.getHeaders().pipe(
            switchMap(headers => this.http.post(`${this.apiUrl}/tts`, { text }, {
                headers,
                responseType: 'blob'
            }))
        );
    }
}

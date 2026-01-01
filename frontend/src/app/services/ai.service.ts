import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { PlanRequest, PlanResponse } from '../model/planner.model';

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private apiUrl = environment.apiBase;

    constructor(private http: HttpClient) { }

    generatePlan(request: PlanRequest): Observable<PlanResponse> {
        return this.http.post<PlanResponse>(`${this.apiUrl}/plan`, request);
    }

    askQuestion(question: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/qa`, { question });
    }

    generateSummary(subject: string, module: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/summary`, { subject, module });
    }

    generateQuiz(module: string, num_mc: number, num_tf: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/quiz`, { module, num_mc, num_tf });
    }

    generateTts(text: string): Observable<Blob> {
        return this.http.post(`${this.apiUrl}/tts`, { text }, {
            responseType: 'blob'
        });
    }
}

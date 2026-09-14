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

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    generatePlan(request: PlanRequest): Observable<PlanResponse> {
        return this.http.post<PlanResponse>(`${this.apiUrl}/plan`, request);
    }

    askQuestion(question: string, sessionId?: string): Observable<any> {
        const headers: any = {};
        if (sessionId) {
            headers['X-Session-ID'] = sessionId;
        }
        return this.http.post(`${this.apiUrl}/qa`, { question }, { headers });
    }

    generateSummaryStream(subject: string, module: string, sessionId?: string): Observable<{ event: string; data: any }> {
        return new Observable(observer => {
            const controller = new AbortController();

            (async () => {
                try {
                    const token = await this.authService.getToken();
                    const headers: Record<string, string> = {
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream'
                    };
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                    if (sessionId) {
                        headers['X-Session-ID'] = sessionId;
                    }

                    const response = await fetch(`${this.apiUrl}/summary`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ subject, module, sessionId }),
                        signal: controller.signal
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const reader = response.body?.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    if (!reader) {
                        observer.error(new Error('No response body'));
                        return;
                    }

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });

                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        let currentEvent = 'message';
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('event:')) {
                                currentEvent = trimmed.replace('event:', '').trim();
                            } else if (trimmed.startsWith('data:')) {
                                const rawData = trimmed.replace('data:', '').trim();
                                try {
                                    const parsed = JSON.parse(rawData);
                                    observer.next({ event: currentEvent, data: parsed });
                                } catch {
                                    observer.next({ event: currentEvent, data: rawData });
                                }
                            }
                        }
                    }
                    observer.complete();
                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        observer.error(err);
                    }
                }
            })();

            return () => controller.abort();
        });
    }

    generateSummary(subject: string, module: string): Observable<any> {
        return new Observable(observer => {
            let lastCompleteData: any = null;
            const sub = this.generateSummaryStream(subject, module).subscribe({
                next: ({ event, data }) => {
                    if (event === 'complete') {
                        lastCompleteData = data;
                    } else if (event === 'error') {
                        observer.error(data);
                    }
                },
                error: (err) => observer.error(err),
                complete: () => {
                    if (lastCompleteData) {
                        observer.next(lastCompleteData);
                        observer.complete();
                    } else {
                        observer.error(new Error('Stream ended without complete event'));
                    }
                }
            });
            return () => sub.unsubscribe();
        });
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

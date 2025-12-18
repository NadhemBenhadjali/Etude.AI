import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SummaryRequest {
  subject: string;
  module:  string;
}

export interface SummaryResponse {
  path: string;
  data: {
    title:  string;
    slides: { [key: string]: string }[];
  };
}

@Injectable({ providedIn: 'root' })
export class SummaryService {
  private readonly url = `${environment.apiBase}/summary`;

  constructor(private http: HttpClient) {}

  generate(req: SummaryRequest): Observable<SummaryResponse> {
    return this.http.post<SummaryResponse>(this.url, req);
  }
}

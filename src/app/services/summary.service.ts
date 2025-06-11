import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private readonly url = '/summary';

  constructor(private http: HttpClient) {}

  generate(req: SummaryRequest): Observable<SummaryResponse> {
    return this.http.post<SummaryResponse>(this.url, req);
  }
}
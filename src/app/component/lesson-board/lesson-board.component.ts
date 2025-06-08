import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule, HttpClient, HttpResponse } from '@angular/common/http';

import fallbackData from '../../../assets/lesson.json';

interface Slide { number: string; text: string; }

@Component({
  selector: 'app-lesson-board',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './lesson-board.component.html',
  styleUrls: ['./lesson-board.component.css']
})
export class LessonBoardComponent implements OnInit {
  title  = fallbackData.title;
  slides: Slide[] = [];
  currentSlideIndex = 0;

  /** Same base you used in Select-Module */
  private readonly backendBase = 'https://7898-34-173-163-152.ngrok-free.app';

  constructor(
    private router: Router,
    private route : ActivatedRoute,
    private http  : HttpClient
  ) {}

  ngOnInit(): void {
    /* 0️⃣ quick ping – remove later if you like */
    this.pingBackend();

    /* ---------- existing code, unchanged except for extra logs ---------- */
    const navState = (this.router.getCurrentNavigation()?.extras.state || history.state) as any;

    if (navState?.summaryData) {
      console.log('✅ using JSON sent in navigation-state');
      this.initFromJson(navState.summaryData);
      return;
    }

    const remotePath =
        this.route.snapshot.queryParamMap.get('path')   // ?path=...
     || navState?.summaryPath;

    if (remotePath) {
      const fullUrl = remotePath.startsWith('/')
        ? this.backendBase + remotePath
        : this.backendBase + '/' + remotePath;

      console.log('📡 fetching:', fullUrl);

      this.http.get<any>(encodeURI(fullUrl))
        .subscribe({
          next : json => this.initFromJson(json),
          error: err  => {
            console.error('⚠️  remote fetch failed', err);
            this.initFromJson(fallbackData);
          }
        });
      return;
    }

    this.initFromJson(fallbackData);   // final safety-net
  }

  /* ------------ helper functions ------------ */

  /** Tiny probe so you immediately know if FastAPI is alive */
  private pingBackend(): void {
    this.http.get(this.backendBase + '/health', { observe: 'response' })
      .subscribe({
        next : (res: HttpResponse<any>) =>
          console.log(`✅ backend alive – HTTP ${res.status}`),
        error: err =>
          console.error('❌ backend unreachable', err)
      });
  }

  private initFromJson(json: any): void {
    this.title  = json.title;
    this.slides = (json.slides || []).map((obj: any) => {
      const key = Object.keys(obj)[0];
      return { number: key, text: obj[key] } as Slide;
    });
  }

  nextSlide(): void { if (this.currentSlideIndex < this.slides.length - 1) this.currentSlideIndex++; }
  prevSlide(): void { if (this.currentSlideIndex > 0) this.currentSlideIndex--; }
  onQuestion(): void {
    this.router.navigate(['/select-mode'], {
      queryParams: {
        mode: 'general',
        context: this.slides[this.currentSlideIndex].text
      }
    });
  }
}

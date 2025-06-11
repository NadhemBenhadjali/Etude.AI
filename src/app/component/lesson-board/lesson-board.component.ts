import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule, HttpClient, HttpResponse } from '@angular/common/http';
import { environment }                   from '../../../environments/environment';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

import fallbackData from '../../../assets/lesson.json';

interface Slide {
  number: string;
  text?: string;
  image?: string | null;
}

@Component({
  selector: 'app-lesson-board',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, AvatarComponent],
  templateUrl: './lesson-board.component.html',
  styleUrls: ['./lesson-board.component.css']
})

export class LessonBoardComponent implements OnInit {
  title = fallbackData.title;
  slides: Slide[] = [];
  currentSlideIndex = 0;

  /** The “board” image always available for the background */
  boardImage = '/assets/images/S.png';

  /** Your FastAPI backend base URL */
  private readonly backendBase = environment.apiBase;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.pingBackend();

    const navState = (this.router.getCurrentNavigation()?.extras.state || history.state) as any;
    if (navState?.summaryData) {
      console.log('✅ using JSON sent in navigation-state');
      this.initFromJson(navState.summaryData);
      return;
    }

    const remotePath =
      this.route.snapshot.queryParamMap.get('path') ||
      navState?.summaryPath;

    if (remotePath) {
      const fullUrl = remotePath.startsWith('/')
        ? `${this.backendBase}${remotePath}`
        : `${this.backendBase}/${remotePath}`;

      console.log('📡 fetching:', fullUrl);
      this.http.get<any>(encodeURI(fullUrl)).subscribe({
        next: json => this.initFromJson(json),
        error: err => {
          console.error('⚠️ remote fetch failed', err);
          this.initFromJson(fallbackData);
        }
      });
      return;
    }

    this.initFromJson(fallbackData);
  }

  private pingBackend(): void {
    this.http.get(this.backendBase + '/health', { observe: 'response' })
      .subscribe({
        next: (res: HttpResponse<any>) =>
          console.log(`✅ backend alive – HTTP ${res.status}`),
        error: err => console.error('❌ backend unreachable', err)
      });
  }

/** Converts **bold** in Markdown to <strong>…</strong> */
private markdownToHtml(md: string): string {
  return md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

private initFromJson(json: any): void {
  this.title = json.title;
  this.slides = (json.slides || []).map((entry: any) => {
    // pull raw text or fallback
    let rawText = entry.number !== undefined
      ? entry.text || ''
      : entry[Object.keys(entry)[0]] || '';

    // convert **bold** → <strong>bold</strong>
    const htmlText = this.markdownToHtml(rawText);

    // determine slide shape
    if (entry.number !== undefined) {
      return {
        number: entry.number,
        text:   htmlText,
        image:  typeof entry.image === 'string' && entry.image.trim().length
                  ? entry.image.trim()
                  : null
      } as Slide;
    }

    const key = Object.keys(entry)[0];
    return {
      number: key,
      text:   htmlText,
      image:  null
    } as Slide;
  });
}

  hasPhoto(slide: Slide): boolean {
  return typeof slide.image === 'string' && slide.image.trim().length > 0;
}



  nextSlide(): void {
    if (this.currentSlideIndex < this.slides.length - 1) {
      this.currentSlideIndex++;
    }
  }

  prevSlide(): void {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  onQuestion(): void {
    this.router.navigate(['/select-mode'], {
      queryParams: {
        mode: 'general',
        context: this.slides[this.currentSlideIndex].text
      }
    });
  }
}
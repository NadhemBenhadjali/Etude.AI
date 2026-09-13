import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../services/user.service';
import { AiService } from '../../services/ai.service';
import { ToastService } from '../../services/toast.service';
import { Slide } from '../../model/shared.model';
import { SessionDTO, SessionType, SessionUpdateDTO } from '../../model/session.model';
import { SummaryElementDTO } from '../../model/summary.model';
import fallbackData from '../../../assets/lesson.json';

@Component({
  selector: 'app-lesson-board',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lesson-board.component.html',
  styleUrls: ['./lesson-board.component.css']
})

export class LessonBoardComponent implements OnInit, OnDestroy {
  title = fallbackData.title;
  slides: Slide[] = [];
  currentSlideIndex = 0;

  /** The board background image */
  boardImage = '/assets/images/S.png';

  private readonly backendBase = environment.apiBase;
  private sessionId: string | null = null;

  // TTS related properties
  audioPlayer: HTMLAudioElement | undefined;
  isPlaying = false;
  private currentAudioUrl: string | null = null;

  // Completion modal
  showCompletionModal = false;
  currentSubject = '';
  currentModule = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private userService: UserService,
    private aiService: AiService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.pingBackend();

    const navState = (this.router.getCurrentNavigation()?.extras.state || history.state) as any;

    this.currentSubject = this.route.snapshot.queryParamMap.get('subject') || navState?.subject || 'أحياء';
    this.currentModule = this.route.snapshot.queryParamMap.get('module') || navState?.module || '';

    // Extract sessionId from navigation state (for planned sessions)
    if (navState?.sessionId) {
      this.sessionId = navState.sessionId;
      console.log('📌 Session ID from planned session:', this.sessionId);
    }

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

  // Lifecycle hook to clean up audio when the component is destroyed
  ngOnDestroy(): void {
    this.stopSummary(); // Stop any playing audio
  }

  private pingBackend(): void {
    this.http.get(this.backendBase + '/health', { observe: 'response' })
      .subscribe({
        next: (res: HttpResponse<any>) =>
          console.log(`✅ backend alive – HTTP ${res.status}`),
        error: err => console.error('❌ backend unreachable', err)
      });
  }

  private normalizeImagePath(img: string | null | undefined): string | null {
    if (!img || typeof img !== 'string') return null;
    let clean = img.trim();
    if (!clean) return null;
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
      return clean;
    }
    clean = clean.replace(/^\/+/, '');
    if (clean.startsWith('assets/book_images/')) {
      return clean;
    }
    if (clean.startsWith('book_images/')) {
      return 'assets/' + clean;
    }
    if (clean.startsWith('assets/')) {
      return clean;
    }
    return 'assets/book_images/' + clean;
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

      let slideImage = this.normalizeImagePath(entry.image);

      // If slideImage is not explicitly set, look for markdown image ![alt](path) in text
      const mdImgMatch = rawText.match(/!\[(.*?)\]\((.*?)\)/);
      if (mdImgMatch) {
        if (!slideImage) {
          slideImage = this.normalizeImagePath(mdImgMatch[2]);
        }
        // Remove markdown image from text so it displays nicely
        rawText = rawText.replace(/!\[(.*?)\]\(.*?\)/g, '').trim();
      }

      // convert **bold** → <strong>bold</strong>
      const htmlText = this.markdownToHtml(rawText);

      // determine slide shape
      if (entry.number !== undefined) {
        return {
          number: entry.number,
          text: htmlText,
          image: slideImage
        } as Slide;
      }

      const key = Object.keys(entry)[0];
      return {
        number: key,
        text: htmlText,
        image: slideImage
      } as Slide;
    });
  }

  hasPhoto(slide: Slide): boolean {
    return typeof slide.image === 'string' && slide.image.trim().length > 0;
  }

  onImageError(slide: Slide): void {
    console.warn('⚠️ Slide image failed to load:', slide.image);
    slide.image = null;
  }

  nextSlide(): void {
    this.stopSummary(); // Stop current audio when navigating
    if (this.currentSlideIndex < this.slides.length - 1) {
      this.currentSlideIndex++;
    }
  }

  prevSlide(): void {
    this.stopSummary(); // Stop current audio when navigating
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  onQuestion(): void {
    this.stopSummary(); // Stop current audio when navigating to a question
    this.router.navigate(['/select-mode'], {
      queryParams: {
        mode: 'general',
        context: this.slides[this.currentSlideIndex].text
      }
    });
  }

  // --- TTS Implementation ---

  async playSummary(): Promise<void> {
    const currentSlideText = this.slides[this.currentSlideIndex]?.text;
    const plainText = currentSlideText ? currentSlideText.replace(/<[^>]*>/g, '').trim() : '';

    if (!plainText) return;

    if (this.isPlaying) {
      this.stopSummary();
      return;
    }

    this.isPlaying = true;

    try {
      console.log('Requesting TTS for text:', plainText);
      const response = await firstValueFrom(this.aiService.generateTts(plainText));

      if (response instanceof Blob && response.size > 100) {
        const audioUrl = URL.createObjectURL(response);
        this.currentAudioUrl = audioUrl;

        if (this.audioPlayer) {
          this.audioPlayer.pause();
          this.audioPlayer.currentTime = 0;
          this.audioPlayer.src = audioUrl;
        } else {
          this.audioPlayer = new Audio(audioUrl);
        }

        this.audioPlayer.onended = () => {
          this.isPlaying = false;
          if (this.currentAudioUrl) {
            URL.revokeObjectURL(this.currentAudioUrl);
            this.currentAudioUrl = null;
          }
        };

        this.audioPlayer.onerror = (err) => {
          console.warn('Audio element playback error, falling back to Web Speech API:', err);
          this.fallbackSpeechSynthesis(plainText);
        };

        await this.audioPlayer.play();
        console.log('Audio playback started.');
        return;
      }

      this.fallbackSpeechSynthesis(plainText);
    } catch (error) {
      console.warn('TTS API error, falling back to Web Speech API:', error);
      this.fallbackSpeechSynthesis(plainText);
    }
  }

  private fallbackSpeechSynthesis(text: string): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-TN';
      utterance.rate = 0.9;
      utterance.pitch = 1.05;

      utterance.onend = () => {
        this.isPlaying = false;
      };
      utterance.onerror = () => {
        this.isPlaying = false;
      };

      window.speechSynthesis.speak(utterance);
    } else {
      this.isPlaying = false;
      this.toastService.info('القراءة الصوتية غير مدعومة في متصفحك.');
    }
  }

  stopSummary(): void {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.stopSummary();
      this.currentSlideIndex = index;
    }
  }

  openCompletionModal(): void {
    this.stopSummary();
    this.showCompletionModal = true;
  }

  closeCompletionModal(): void {
    this.showCompletionModal = false;
  }

  launchQuizFromLesson(): void {
    this.finishLesson(false); // Save session in background
    this.router.navigate(['/select-module'], {
      queryParams: {
        mode: 'quiz',
        subject: this.currentSubject,
        module: this.currentModule
      }
    });
  }

  launchChatFromLesson(): void {
    this.finishLesson(false);
    this.router.navigate(['/chatbot'], {
      queryParams: {
        subject: this.currentSubject,
        module: this.currentModule,
        context: this.slides[this.currentSlideIndex]?.text
      }
    });
  }

  finishLesson(redirect: boolean = true) {
    this.stopSummary();

    // Convert slides to SummaryElementDTO array (including image if present)
    const summaryElements: SummaryElementDTO[] = this.slides.map(slide => {
      let content = slide.text || '';
      if (slide.image) {
        content = `<div class="history-slide-media"><img src="${slide.image}" alt="صورة الدرس" class="history-slide-img" /></div>` + content;
      }
      return { content };
    });

    if (this.sessionId) {
      const updateData: SessionUpdateDTO = {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        sessionType: SessionType.SUMMARY,
        summaryPointsOfFocus: [],
        summaryElements: summaryElements
      };

      this.userService.updateSession(this.sessionId, updateData).subscribe({
        next: () => {
          this.toastService.success('تم حفظ إنجازك بنجاح! 🌟');
          if (redirect) this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error updating session:', err);
          if (redirect) this.router.navigate(['/dashboard']);
        }
      });
    } else {
      const sessionDTO: SessionDTO = {
        level: 'FIRST',
        subject: this.currentSubject || 'General',
        module: this.currentModule || this.title || 'Lesson',
        lesson: this.title || 'Lesson Content',
        status: 'COMPLETED',
        sessionType: SessionType.SUMMARY,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        summaryPointsOfFocus: [],
        summaryElements: summaryElements
      };

      this.userService.saveSession(sessionDTO).subscribe({
        next: () => {
          this.toastService.success('تم حفظ إنجازك بنجاح! 🌟');
          if (redirect) this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error saving lesson:', err);
          if (redirect) this.router.navigate(['/dashboard']);
        }
      });
    }
  }
}

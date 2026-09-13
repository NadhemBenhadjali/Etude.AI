import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AvatarComponent } from "../../shared/avatar/avatar.component";
import { QuizService } from '../../services/quiz.service';
import { AiService } from '../../services/ai.service';
import { AuthService } from '../../services/auth.service';
import { SessionStateService } from '../../services/session-state.service';
import { ModuleOption, SubjectOption } from '../../model/shared.model';

@Component({
  selector: 'app-select-module',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent],
  templateUrl: './select-module.component.html',
  styleUrls: ['./select-module.component.css']
})
export class SelectModuleComponent implements OnInit {
  subjects: SubjectOption[] = [
    {
      name: 'أحياء (إيقاظ علمي)',
      value: 'أحياء',
      color: '#059669',
      icon: '/assets/images/panda.png',
      modules: [
        { name: 'الحواس', value: 'الحواس', icon: '/assets/images/senses-kid.png' },
        { name: 'التنقل', value: 'التنقل', icon: '/assets/images/movement-kid.png' },
        { name: 'مصادر الأغذية', value: 'مصادر الأغذية', icon: '/assets/images/food-kid.png' },
        { name: 'التكاثر', value: 'التكاثر', icon: '/assets/images/growth-kid.png' },
        { name: 'التنفس', value: 'التنفس', icon: '/assets/images/lungs-kid.png' }
      ]
    },
    {
      name: 'فيزياء',
      value: 'فيزياء',
      color: '#3B82F6',
      icon: '/assets/images/science.png',
      modules: [
        { name: 'الزمن', value: 'الزمن', icon: '/assets/images/clock-kid.png' },
        { name: 'المادة', value: 'المادة', icon: '/assets/images/atom-kid.png' },
        { name: 'الطاقة', value: 'الطاقة', icon: '/assets/images/energy-kid.png' }
      ]
    }
  ];

  selectedSubject: SubjectOption | null = null;
  currentMode: string | null = null;

  // SSE Live Streaming State
  isStreaming = false;
  streamStatus = 'جاري البحث في كتابك المدرسي... 🔍';
  streamTokens = '';
  streamStep = 1;
  selectedModuleName = '';
  errorMsg: string | null = null;

  get cleanStreamPreview(): string {
    if (!this.streamTokens) return '';
    // Strip raw JSON keys, syntax, and file paths so children only see clear Arabic sentences
    const text = this.streamTokens
      .replace(/```json|```/gi, '')
      .replace(/"(title|slides|number|text|image)"\s*:\s*/gi, '')
      .replace(/assets\/book_images\/[^\s",}]+/gi, '')
      .replace(/[\{\}\[\]"\\`:]+/g, ' ')
      .replace(/,\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text.length > 220 ? '...' + text.slice(-220) : text;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private quizService: QuizService,
    private aiService: AiService,
    private http: HttpClient,
    private authService: AuthService,
    private sessionStateService: SessionStateService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      this.currentMode = p['mode'] || 'summary';
    });
  }

  selectSubject(subject: SubjectOption) {
    this.selectedSubject = subject;
    this.errorMsg = null;
    this.isStreaming = false;
  }

  selectModule(module: ModuleOption): void {
    if (!this.selectedSubject || !this.currentMode) return;

    this.sessionStateService.setModule(module.name);
    this.selectedModuleName = module.name;

    if (this.currentMode === 'summary') {
      this.isStreaming = true;
      this.streamStatus = 'جاري البحث في كتابك المدرسي... 🔍';
      this.streamTokens = '';
      this.streamStep = 1;
      this.errorMsg = null;

      this.aiService.generateSummaryStream(this.selectedSubject.value, module.name).subscribe({
        next: ({ event, data }) => {
          if (event === 'status') {
            this.streamStatus = data.message || 'الذكاء الاصطناعي يحضر في الدرس بالتونسي... 🪄';
            this.streamStep = 2;
          } else if (event === 'token') {
            if (data.token) {
              this.streamTokens += data.token;
              this.streamStep = 2;
            }
          } else if (event === 'complete') {
            this.streamStatus = 'جاهز يا بطل! 🎉 قاعدين نفتحو في السبورة...';
            this.streamStep = 3;
            setTimeout(() => {
              this.isStreaming = false;
              this.router.navigate(['/lesson'], {
                queryParams: {
                  subject: this.selectedSubject!.value,
                  module: module.value,
                  mode: this.currentMode,
                  path: data.path
                },
                state: {
                  summaryPath: data.path,
                  summaryData: data.data
                }
              });
            }, 700);
          } else if (event === 'error') {
            this.isStreaming = false;
            this.errorMsg = data.message || 'حدث خطأ أثناء تحضير الدرس. حاول مرة أخرى!';
          }
        },
        error: (err) => {
          console.error('SSE stream error:', err);
          this.isStreaming = false;
          if (err?.status === 401) {
            this.errorMsg = 'انتهت الجلسة. الرجاء تسجيل الدخول من جديد.';
            this.authService.logout().then(() => this.router.navigate(['/signin']));
          } else {
            this.errorMsg = 'حدث خطأ في الاتصال بالمعلم الذكي. حاول مرة أخرى! ⚠️';
          }
        }
      });

    } else if (this.currentMode === 'quiz') {
      this.isStreaming = true;
      this.streamStatus = 'قاعدين نجهزو في أسئلة التحدي... 🎯';
      this.streamStep = 2;
      this.errorMsg = null;

      const quizRequest = {
        module: module.name,
        num_mc: 6,
        num_tf: 4
      };

      this.quizService.generateQuiz(quizRequest).subscribe({
        next: (data) => {
          this.isStreaming = false;
          this.router.navigate(['/chatbot-quiz'], {
            queryParams: {
              subject: this.selectedSubject!.value,
              module: module.value,
              mode: this.currentMode
            },
            state: {
              quizData: data.data
            }
          });
        },
        error: (err) => {
          console.error(err);
          this.isStreaming = false;
          this.errorMsg = 'حدث خطأ أثناء توليد الاختبار. حاول مجدداً.';
        }
      });
    }
  }

  cancelStreaming() {
    this.isStreaming = false;
    this.errorMsg = null;
  }

  goBack() {
    this.selectedSubject = null;
    this.isStreaming = false;
    this.errorMsg = null;
  }
}

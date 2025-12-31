import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AvatarComponent } from "../../shared/avatar/avatar.component";
import { QuizService } from '../../services/quiz.service';
import { AiService } from '../../services/ai.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import {SessionStateService} from '../../services/session-state.service';
import {ModuleOption,SubjectOption} from '../../model/shared.model';

@Component({
  selector: 'app-select-module',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent],
  templateUrl: './select-module.component.html',
  styleUrls: ['./select-module.component.css']
})
export class SelectModuleComponent implements OnInit {
  // Friend's Data Structure with Icons
  subjects: SubjectOption[] = [
    {
      name: 'أحياء',
      value: 'أحياء',
      color: '#e53935',
      icon: '/assets/images/panda.png',
      modules: [
        { name: 'الحواس',       value: 'الحواس',      icon: '/assets/images/senses-kid.png' },
        { name: 'التنقل',       value: 'التنقل',    icon: '/assets/images/movement-kid.png' },
        { name: 'مصادر الأغذية', value: 'مصادر الأغذية',   icon: '/assets/images/food-kid.png' },
        { name: 'التكاثر',      value: 'التكاثر', icon: '/assets/images/growth-kid.png' },
        { name: 'التنفس',       value: 'التنفس',  icon: '/assets/images/lungs-kid.png' }
      ]
    },
    {
      name: 'فيزياء',
      value: 'فيزياء',
      color: '#d32f2f',
      icon: '/assets/images/science.png',
      modules: [
        { name: 'الزمن',   value: 'الزمن',   icon: '/assets/images/clock-kid.png' },
        { name: 'المادة',  value: 'المادة', icon: '/assets/images/atom-kid.png'  },
        { name: 'الطاقة',  value: 'الطاقة', icon: '/assets/images/energy-kid.png'}
      ]
    }
  ];

  selectedSubject: SubjectOption | null = null;
  currentMode: string | null = null;

  loading  = false;
  errorMsg : string | null = null;

  // URL from your environment
  private readonly summaryUrl = environment.apiBase + '/summary';

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
      this.currentMode = p['mode'] || null;
    });
  }

  selectSubject(subject: SubjectOption) {
    this.selectedSubject = subject;
    this.loading = false;
    this.errorMsg = null;
  }

  async selectModule(module: ModuleOption): Promise<void> {
    if (!this.selectedSubject || !this.currentMode) return;


    this.sessionStateService.setModule(module.name);

    // --- LOGIC FROM FRONT 1 (Backend Connection) ---
    if (this.currentMode === 'summary') {
      this.loading  = true;
      this.errorMsg = null;

      const payload = {
        subject: this.selectedSubject.value,
        module: module.name // Pass the module name to backend
      };

      try {
        // Use HttpClient instead of fetch to ensure token interceptor works
        const data = await firstValueFrom(
          this.http.post<any>(this.summaryUrl, payload)
        );

        if (data?.data) {
          // Success! Navigate to Lesson Board
          await this.router.navigate(['/lesson'], {
            queryParams: {
              subject: this.selectedSubject.value,
              module:  module.value,
              mode:    this.currentMode,
              path:    data.path
            },
            state: {
              summaryPath: data.path,
              summaryData: data.data // Pass generated slides
            }
          });
        } else {
          throw new Error('No data received');
        }
      } catch (err: any) {
        console.error(err);

        // Check if it's an authentication error
        if (err instanceof HttpErrorResponse && err.status === 401) {
          this.errorMsg = 'انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.';
          // Clear tokens and redirect to login after 2 seconds
          this.authService.logout().then(() => {
            setTimeout(() => {
              this.router.navigate(['/signin']);
            }, 2000);
          });
        } else {
          // If backend fails, you might want to load fallback data here or show error
          this.errorMsg = 'حدث خطأ في توليد الملخص. الرجاء المحاولة لاحقاً.';
        }
      } finally {
        this.loading = false;
      }

    } else if (this.currentMode === 'quiz') {
      // Logic for Quiz Mode
      this.loading = true;
      this.errorMsg = null;

      const quizRequest = {
        module: module.name,
        num_mc: 6,
        num_tf: 4
      };

      this.quizService.generateQuiz(quizRequest).subscribe({
        next: (data) => {
          this.router.navigate(['/chatbot-quiz'], {
            queryParams: {
              subject: this.selectedSubject!.value,
              module:  module.value,
              mode:    this.currentMode
            },
            state: {
              quizData: data.data
            }
          });
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'حدث خطأ في توليد الاختبار.';
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    this.selectedSubject = null;
  }
}

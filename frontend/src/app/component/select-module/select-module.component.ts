import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AvatarComponent } from "../../shared/avatar/avatar.component";
import { QuizService } from '../../services/quiz.service';
import { AiService } from '../../services/ai.service';
import { firstValueFrom } from 'rxjs';

interface ModuleOption {
  name: string;
  value: string;
  icon: string;
}
interface SubjectOption {
  name: string;
  value: string;
  color: string;
  icon: string;
  modules: ModuleOption[];
}

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
    private aiService: AiService // In case you want to use the service instead of raw fetch
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

    // --- LOGIC FROM FRONT 1 (Backend Connection) ---
    if (this.currentMode === 'summary') {
      this.loading  = true;
      this.errorMsg = null;

      const payload = {
        subject: this.selectedSubject.value,
        module: module.name // Pass the module name to backend
      };

      try {
        // Option A: Using fetch (as in your original code)
        const resp = await fetch(this.summaryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.error || 'Server error');
        } else if (data?.data) {
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
        // If backend fails, you might want to load fallback data here or show error
        this.errorMsg = 'حدث خطأ في توليد الملخص. الرجاء المحاولة لاحقاً.';
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

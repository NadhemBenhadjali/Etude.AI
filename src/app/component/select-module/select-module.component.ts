import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { environment }                   from '../../../environments/environment';
import { AvatarComponent } from "../../shared/avatar/avatar.component";

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
  result   : any = null;
  errorMsg : string | null = null;

  private readonly summaryUrl  = environment.apiBase+'/summary';
  private readonly quizUrl    = environment.apiBase+'/quiz';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      this.currentMode = p['mode'] || null;
    });
  }

  selectSubject(subject: SubjectOption) {
    this.selectedSubject = subject;
    this.loading = false;
    this.result  = null;
    this.errorMsg = null;
  }

  async selectModule(module: ModuleOption): Promise<void> {
    if (!this.selectedSubject || !this.currentMode) return;

    const payload = {
      subject: this.selectedSubject.value,
      module: module.name
    };

    if (this.currentMode === 'summary') {
      this.loading  = true;
      this.errorMsg = null;

      try {
        const resp = await fetch(this.summaryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await resp.text();
        let data: any;
        try { data = JSON.parse(text); } catch {}

        if (!resp.ok) {
          this.errorMsg = `HTTP ${resp.status}\n${text}`;
        } else if (data?.data) {
          this.result = data;

          await this.router.navigate(['/lesson'], {
            queryParams: {
              subject: this.selectedSubject.value,
              module:  module.value,
              mode:    this.currentMode,
              path:    data.path
            },
            state: {
              summaryPath: data.path,
              summaryData: data.data
            }
          });
        } else if (data?.error) {
          this.errorMsg = 'Error: ' + data.error;
        } else {
          this.errorMsg = 'Unexpected response:\n' + text;
        }
      } catch (err: any) {
        this.errorMsg = 'Fetch error: ' + err.message;
      } finally {
        this.loading = false;
      }

    } else if (this.currentMode === 'quiz') {
      this.loading  = true;
      this.errorMsg = null;

      try {
        const resp = await fetch(this.quizUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await resp.text();
        let data: any;
        try { data = JSON.parse(text); } catch {}

        if (!resp.ok) {
          this.errorMsg = `HTTP ${resp.status}\n${text}`;
        } else if (data?.data) {
          this.result = data;

          await this.router.navigate(['/chatbot-quiz'], {
            queryParams: {
              subject: this.selectedSubject.value,
              module:  module.value,
              mode:    this.currentMode,
              path:    data.path
            },
            state: {
              quizPath: data.path,
              quizData: data.data
            }
          });
        } else if (data?.error) {
          this.errorMsg = 'Error: ' + data.error;
        } else {
          this.errorMsg = 'Unexpected response:\n' + text;
        }
      } catch (err: any) {
        this.errorMsg = 'Fetch error: ' + err.message;
      } finally {
        this.loading = false;
      }

    }
  }

  goBack() {
    this.selectedSubject = null;
  }
}

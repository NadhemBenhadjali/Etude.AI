import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

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
  imports: [CommonModule, RouterModule],
  templateUrl: './select-module.component.html',
  styleUrls: ['./select-module.component.css']
})
export class SelectModuleComponent implements OnInit {
  subjects: SubjectOption[] = [
    {
      name: 'أحياء',
      value: 'biology',
      color: '#e53935',
      icon: '/assets/images/panda.png',
      modules: [
        { name: 'الحواس والوقاية من الأمراض', value: 'senses',       icon: '/assets/images/senses-kid.png' },
        { name: 'التنقل',                      value: 'movement',     icon: '/assets/images/movement-kid.png' },
        { name: 'التغذية',                     value: 'nutrition',    icon: '/assets/images/food-kid.png'     },
        { name: 'التكاثر والنمو',               value: 'reproduction', icon: '/assets/images/growth-kid.png'  },
        { name: 'التنفس',                      value: 'respiration',  icon: '/assets/images/lungs-kid.png'   }
      ]
    },
    {
      name: 'فيزياء',
      value: 'physics',
      color: '#d32f2f',
      icon: '/assets/images/science.png',
      modules: [
        { name: 'الزمن',  value: 'time',   icon: '/assets/images/clock-kid.png' },
        { name: 'المادة', value: 'matter', icon: '/assets/images/atom-kid.png'  },
        { name: 'الطاقة', value: 'energy', icon: '/assets/images/energy-kid.png'}
      ]
    }
  ];

  selectedSubject: SubjectOption | null = null;
  currentMode: string | null = null;

  loading  = false;
  result   : any = null;
  errorMsg : string | null = null;

  private readonly summaryUrl = 'https://7898-34-173-163-152.ngrok-free.app/summary';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => this.currentMode = p['mode'] || null);
  }

  selectSubject(subject: SubjectOption) {
    this.selectedSubject = subject;
    this.loading = false;
    this.result  = null;
    this.errorMsg = null;
  }

  async selectModule(module: ModuleOption): Promise<void> {
    if (!this.selectedSubject || !this.currentMode) return;

    if (this.currentMode === 'summary') {
      this.loading  = true;
      this.errorMsg = null;

      const payload = { subject: this.selectedSubject.value, module: module.name };

      try {
        const resp = await fetch(this.summaryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:   JSON.stringify(payload)
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
    } else {
      await this.router.navigate(['/chatbot'], {
        queryParams: {
          subject: this.selectedSubject.value,
          module:  module.value,
          mode:    this.currentMode
        }
      });
    }
  }

  goBack() { this.selectedSubject = null; }
}

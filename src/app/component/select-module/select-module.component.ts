import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
        { name: 'الحواس والوقاية من الأمراض', value: 'senses', icon: '/assets/images/senses-kid.png' },
        { name: 'التنقل', value: 'movement', icon: '/assets/images/movement-kid.png' },
        { name: 'التغذية', value: 'nutrition', icon: '/assets/images/food-kid.png' },
        { name: 'التكاثر والنمو', value: 'reproduction', icon: '/assets/images/growth-kid.png' },
        { name: 'التنفس', value: 'respiration', icon: '/assets/images/lungs-kid.png' }
      ]
    },
    {
      name: 'فيزياء',
      value: 'physics',
      color: '#d32f2f',
      icon: '/assets/images/science.png',
      modules: [
        { name: 'الزمن', value: 'time', icon: '/assets/images/clock-kid.png' },
        { name: 'المادة', value: 'matter', icon: '/assets/images/atom-kid.png' },
        { name: 'الطاقة', value: 'energy', icon: '/assets/images/energy-kid.png' }
      ]
    }
  ];

  selectedSubject: SubjectOption | null = null;
  currentMode: string | null = null;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentMode = params['mode'] || null;
    });
  }

  selectSubject(subject: SubjectOption) {
    this.selectedSubject = subject;
  }

  selectModule(module: ModuleOption) {
    if (!this.selectedSubject || !this.currentMode) return;

    if (this.currentMode === 'summary') {
      // Navigate to the lesson-board page after both subject and module are selected
      this.router.navigate(['/lesson'], {
        queryParams: {
          subject: this.selectedSubject.value,
          module: module.value,
          mode: this.currentMode
        }
      });
    } else {
      this.router.navigate(['/chatbot'], {
        queryParams: {
          subject: this.selectedSubject.value,
          module: module.value,
          mode: this.currentMode
        }
      });
    }
  }

  goBack() {
    this.selectedSubject = null;
  }
}

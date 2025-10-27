import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AvatarComponent } from "../../shared/avatar/avatar.component";

@Component({
  selector: 'app-select-subject',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './select-subject.component.html',
  styleUrls: ['./select-subject.component.css']
})
export class SelectSubjectComponent {
  subjects = [
    { name: 'رياضيات', image: 'math.png' },
    { name: 'إيقاظ علمي', image: 'science.png' },
    { name: 'العربية', image: 'arabic.png' },
    { name: 'الفرنسية', image: 'french.png' }
  ];

  colors = ['#5BBCFF', '#FFFAB7', '#FFD1E3', '#7EA1FF'];

  constructor(private router: Router) {}

  selectSubject(subjectName: string) {
    this.router.navigate(['/profile'], {
      queryParams: { subject: subjectName }
    });
  }
}

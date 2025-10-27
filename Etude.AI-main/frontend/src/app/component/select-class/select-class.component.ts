import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-select-class',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-class.component.html',
  styleUrls: ['./select-class.component.css']
})
export class SelectClassComponent {
  classes = [1, 2, 3, 4, 5, 6];

  colors = ['#5BBCFF', '#FFFAB7', '#FFD1E3', '#7EA1FF'];

  constructor(private router: Router) {}

  selectClass(classNumber: number) {
    this.router.navigate(['/select-subject']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
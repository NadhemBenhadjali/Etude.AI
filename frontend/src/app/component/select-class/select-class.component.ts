import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import { SessionStateService } from '../../services/session-state.service';


@Component({
  selector: 'app-select-class',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './select-class.component.html',
  styleUrls: ['./select-class.component.css']
})
export class SelectClassComponent {
  classes = [1, 2, 3, 4, 5, 6];

  colors = ['#5BBCFF', '#FFFAB7', '#FFD1E3', '#7EA1FF'];

  constructor(
    private router: Router,
    private sessionStateService: SessionStateService
  ) {}

  selectClass(classNumber: number) {
    const levelMap: { [key: number]: string } = {
      1: 'FIRST',
      2: 'SECOND',
      3: 'THIRD',
      4: 'FOURTH',
      5: 'FIFTH',
      6: 'SIXTH'
    };

    const level = levelMap[classNumber] || 'FIRST';
    this.sessionStateService.setLevel(level);

    this.router.navigate(['/select-subject']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}

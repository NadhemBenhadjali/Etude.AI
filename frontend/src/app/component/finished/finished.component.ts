import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AvatarComponent } from '../../shared/avatar/avatar.component';


@Component({
  selector: 'app-finished',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './finished.component.html',
  styleUrls: ['./finished.component.css']
})
export class FinishedComponent {
  constructor(private router: Router) { }

  async goHome() {
    await this.router.navigate(['/dashboard']);
  }
}

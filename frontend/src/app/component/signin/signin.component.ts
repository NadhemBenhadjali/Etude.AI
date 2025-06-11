import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent {
  constructor(private router: Router) {}

  goToSignUp(): void {
    this.router.navigate(['/signup']);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    // Here add your authentication logic
    // For demo, we just navigate to landing page
    this.router.navigate(['/landing']);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KcAuthService } from '../../services/kc-auth.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  template: `<button (click)="goToSignIn()">ابدأ</button>`
})
export class LandingComponent {
  constructor(private router: Router, private kc: KcAuthService) {}
  goToSignIn(): void {
    if (this.kc.authenticated) {
      this.router.navigate(['/select-class']);
    } else {
      this.kc.login();
    }
  }
}

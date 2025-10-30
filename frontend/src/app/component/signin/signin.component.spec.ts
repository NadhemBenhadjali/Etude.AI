import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KcAuthService } from '../../services/kc-auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule],
  template: `<button (click)="login()">تسجيل الدخول</button>`
})
export class SigninComponent {
  constructor(private kc: KcAuthService) {}
  login() { this.kc.login(); }
}

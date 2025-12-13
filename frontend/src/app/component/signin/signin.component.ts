import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent {
  // Form fields
  username = '';
  password = '';

  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  /**
   * Called when user submits the login form
   */
  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.loading = true;
    this.errorMessage = '';

    try {
      // Use direct login with username/password
      await this.authService.directLogin(this.username, this.password);

      // Get return URL from query params or default to dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      await this.router.navigate([returnUrl]);
    } catch (error: any) {
      console.error('Login failed', error);
      this.errorMessage = 'اسم المستخدم أو كلمة السر غير صحيحة';
      this.loading = false;
    }
  }

  /**
   * Navigate to signup page
   */
  goToSignUp(): void {
    this.router.navigate(['/signup']);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserService } from '../../services/user.service';


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  lastName = '';
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  birthDate = '';
  level = 'FIRST';
  errorMessage = '';
  successMessage = '';

  // Level options with Arabic labels
  levels = [
    { value: 'FIRST', label: 'السنة الأولى' },
    { value: 'SECOND', label: 'السنة الثانية' },
    { value: 'THIRD', label: 'السنة الثالثة' },
    { value: 'FOURTH', label: 'السنة الرابعة' },
    { value: 'FIFTH', label: 'السنة الخامسة' },
    { value: 'SIXTH', label: 'السنة السادسة' }
  ];

  avatars: string[] = [
    'assets/images/monster.png',
    'assets/images/puss-in-boots.png',
    'assets/images/unicorn.png',
    'assets/images/witch.png',
    'assets/images/wizard.png',
    'assets/images/dino.png',
    'assets/images/thinking.png',
    'assets/images/read.png',
    'assets/images/school.png',
    'assets/images/corgi.png',
    'assets/images/panda.png',
    'assets/images/hi.png',
  ];
  selectedAvatar: string = '';

  constructor(private router: Router, private userService: UserService) { }

  selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
  }

  signup() {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'كلمتا السر غير متطابقتين';
      return;
    }

    if (!this.selectedAvatar) {
      this.errorMessage = 'الرجاء اختيار أفاتار';
      return;
    }

    const registrationData = {
      email: this.email,
      password: this.password,
      firstname: this.name,
      lastname: this.lastName,
      birthDate: this.birthDate,
      level: this.level,
      avatar: this.selectedAvatar
    };

    this.userService.registerUser(registrationData).subscribe({
      next: (response) => {
        this.successMessage = 'تم التسجيل بنجاح! جاري تحويلك لصفحة تسجيل الدخول...';
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 2000);
      },
      error: (err: any) => {
        console.error('Registration failed', err);
        this.errorMessage = err.error || 'فشل التسجيل. حاول مرة أخرى';
      }
    });
  }


  goToSignIn(): void {
    this.router.navigate(['/signin']);
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.signup();
    }
  }

}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { NgForm } from '@angular/forms';


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

  // ✅ Inject the Router
  constructor(private router: Router) {}

  selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
  }

  signup() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (!this.selectedAvatar) {
      alert('Please select an avatar.');
      return;
    }

    console.log('Signed up with:', {
      fullName: `${this.lastName}`,
      email: this.email,
      avatar: this.selectedAvatar
    });

    alert('تم التسجيل بنجاح');
    this.router.navigate(['/signin']);
  }

 
  goToSignIn(): void {
    this.router.navigate(['/signin']);
  }
  onSubmit(form: NgForm) {
  if (form.valid) {
    
    this.router.navigate(['/welcome']);
  }
}

}

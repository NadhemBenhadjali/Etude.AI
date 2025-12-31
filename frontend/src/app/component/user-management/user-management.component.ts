import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { UserService} from '../../services/user.service';
import { UserDTO, ChangePasswordRequest  } from '../../model/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  userForm: FormGroup;
  passwordForm: FormGroup;

  currentUser: UserDTO | null = null;

  loading = false;
  error = '';
  successMessage = '';

  passwordError = '';
  passwordSuccess = '';

  constructor() {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstname: ['', [Validators.required, Validators.maxLength(50)]],
      lastname: ['', [Validators.required, Validators.maxLength(50)]],
      birthDate: ['', [Validators.required]],
      level: ['FIRST', [Validators.required]] // must be one of FIRST..SIXTH
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    this.loadUser();
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (!newPassword || !confirmPassword) {
      return null;
    }
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  loadUser(): void {
    this.loading = true;
    this.error = '';

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.userForm.patchValue({
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
          birthDate: user.birthDate,
          level: user.level
        });
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading user:', err);
        this.error = 'Failed to load user profile. You may need to create your profile first.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const userData: Partial<UserDTO> = this.userForm.value;

    if (this.currentUser) {
      // Update existing user (including email now)
      this.userService.updateUser(userData).subscribe({
        next: (result: UserDTO) => {
          this.successMessage = 'Profile updated successfully!';
          this.loading = false;
          this.currentUser = result;
        },
        error: (err: any) => {
          console.error('Error updating user:', err);
          this.error = 'Failed to update profile. Please try again.';
          this.loading = false;
        }
      });
    } else {
      // Create new user; email now comes from the form
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.successMessage = 'Profile created successfully!';
          this.loading = false;
          this.loadUser();
        },
        error: (err: any) => {
          console.error('Error creating user:', err);
          this.error = 'Failed to create profile. Please try again.';
          this.loading = false;
        }
      });
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordError = '';
    this.passwordSuccess = '';
    this.loading = true;

    const { currentPassword, newPassword } = this.passwordForm.value as {
      currentPassword: string;
      newPassword: string;
    };

    const payload: ChangePasswordRequest = { currentPassword, newPassword };

    this.userService.changePassword(payload).subscribe({
      next: () => {
        this.passwordSuccess = 'تم تغيير كلمة المرور بنجاح ✅';
        this.loading = false;
        this.passwordForm.reset();
      },
      error: (err: any) => {
        console.error('Error changing password:', err);
        this.passwordError = 'فشل تغيير كلمة المرور. تأكد من الكلمة الحالية وحاول مرة أخرى.';
        this.loading = false;
      }
    });
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.loading = true;
      this.error = '';

      this.userService.deleteUser().subscribe({
        next: () => {
          alert('Account deleted successfully. You will be logged out.');
          this.router.navigate(['/']);
        },
        error: (err: any) => {
          console.error('Error deleting user:', err);
          this.error = 'Failed to delete account. Please try again.';
          this.loading = false;
        }
      });
    }
  }
}


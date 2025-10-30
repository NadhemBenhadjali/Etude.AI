import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileSyncService } from '../../services/profile-sync.service';
import { KcAuthService } from '../../services/kc-auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  form: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private kc: KcAuthService,
    private sync: ProfileSyncService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstname: ['', [Validators.required, Validators.maxLength(50)]],
      lastname: ['', [Validators.required, Validators.maxLength(50)]],
      birthDate: ['', [Validators.required]],
      level: ['FIRST', [Validators.required]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.submitting = true;

    const { firstname, lastname, birthDate, level } = this.form.value;
    this.sync.savePendingProfile({
      firstname: firstname!,
      lastname: lastname!,
      birthDate: birthDate!,
      level: level as 'FIRST' | 'SECOND' | 'THIRD'
    });

    await this.kc.register(window.location.origin + '/');
  }
}

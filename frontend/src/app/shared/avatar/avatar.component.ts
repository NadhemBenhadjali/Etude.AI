import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css']
})
export class AvatarComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  avatarUrl: string = 'assets/images/panda.png'; // Default fallback
  private subscription?: Subscription;

  ngOnInit(): void {
    this.loadUserAvatar();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadUserAvatar(): void {
    this.subscription = this.userService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.avatar) {
          this.avatarUrl = user.avatar;
        }
      },
      error: (err) => {
        console.error('Failed to load user avatar:', err);
        // Keep default avatar on error
      }
    });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
  }
}

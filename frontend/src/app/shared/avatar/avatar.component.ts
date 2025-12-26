import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Needed for basic directives like ngIf, ngFor (good practice)
import { Router, RouterModule } from '@angular/router'; // Import RouterModule directly
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-avatar',
  standalone: true, // <--- Add this line!
  imports: [CommonModule, RouterModule], // <--- Add this imports array!
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css']
})
export class AvatarComponent {

  private authService = inject(AuthService);

  constructor(private router: Router) { }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
  }
}
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService} from '../../services/user.service';
import { UserDTO } from '../../model/user.model';
import { Achievement } from '../../model/achievement.model';
import { GamificationService} from '../../services/gamification.service';
import { AuthService } from '../../services/auth.service';
import { Activity } from '../../model/shared.model';



@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private gamificationService = inject(GamificationService);
  private authService = inject(AuthService);

  // Front2 Data Fields
  username = 'Loading...';
  email = '';
  avatar = '';
  level = 1;
  rank = 'المستكشف الفضولي';
  streak = 4; // Mock for now, could come from backend later

  xp = 0;
  xpToNextLevel = 1000;

  completedLessons = 0;
  completedQuizzes = 0;
  highestStreak = 0;

  achievements: Achievement[] = [];

  // ✅ UPDATED: Activities icons are now images (not emojis)
  recentActivities: Activity[] = [
    { icon: 'assets/images/book.png', text: 'أكملت درس "الأعداد"' },
    { icon: 'assets/images/target.png', text: 'بدأت رحلة التعلم' }
  ];

  ngOnInit(): void {
    this.loadProfile();
    this.loadAchievements();
  }

  loadProfile() {
    this.userService.getCurrentUser().subscribe({
      next: (user: UserDTO) => {
        this.username = `${user.firstname} ${user.lastname}`;
        this.email = user.email;
        this.xp = user.elo || 0;
        this.level = this.mapLevel(user.level);
        this.avatar= user.avatar? user.avatar : '';

        // Map backend stats to UI
        this.completedQuizzes = user.totalQuizzes || 0;

        // Mock data for missing backend fields to keep UI rich
        this.completedLessons = Math.floor(this.xp / 50);
        this.highestStreak = Math.floor(Math.random() * 10);
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.username = 'Guest';
      }
    });
  }

  loadAchievements() {
    this.gamificationService.getMyAchievements().subscribe({
      next: (data) => {
        this.achievements = data;
      },
      error: (err) => console.error('Error loading achievements', err)
    });
  }

  mapLevel(levelStr: string): number {
    switch (levelStr) {
      case 'FIRST': return 1;
      case 'SECOND': return 2;
      case 'THIRD': return 3;
      case 'FOURTH': return 4;
      case 'FIFTH': return 5;
      case 'SIXTH': return 6;
      default: return 1;
    }
  }

  getLevelColor(): string {
    const colors = ['#FF6F91', '#FF9671', '#FFC75F', '#F9F871'];
    return colors[(this.level - 1) % colors.length];
  }

  getXpPercentage(): number {
    return (this.xp / this.xpToNextLevel) * 100;
  }

  logout() {
    this.authService.logout();
  }
}

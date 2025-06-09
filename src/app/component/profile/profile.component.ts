import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Achievement {
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface Activity {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  username = 'Aziz Souid';
  avatar = '/assets/images/dino.png';
  level = 4;
  rank = 'المستكشف الفضولي';
  streak = 4;
  xp = 750;
  xpToNextLevel = 1000;
  completedLessons = 3;
  completedQuizzes = 6;
  highestStreak = 4;

  achievements: Achievement[] = [
    {
      name: 'المتعلم النشط',
      description: 'أكمل 10 دروس',
      icon: '📚',
      unlocked: false
    },
    {
      name: 'المفكر العميق',
      description: 'أجاب على 20 سؤال بشكل صحيح',
      icon: '💡',
      unlocked: true
    },
    {
      name: 'المثابر',
      description: 'حافظ على التتابع لمدة 5 أيام',
      icon: '🔥',
      unlocked: false
    }
  ];

  recentActivities: Activity[] = [
    {
      icon: '📚',
      text: 'أكملت درس "الأعداد"'
    },
    {
      icon: '🎯',
      text: 'حصلت على 90% في اختبار الرياضيات'
    },
    {
      icon: '⭐',
      text: 'فزت بإنجاز "المتعلم النشط"'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  getLevelColor(): string {
    const colors = ['#FF6F91', '#FF9671', '#FFC75F', '#F9F871'];
    return colors[this.level % colors.length];
  }

  getXpPercentage(): number {
    return (this.xp / this.xpToNextLevel) * 100;
  }
} 
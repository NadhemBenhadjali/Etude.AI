import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { RouterModule, Router } from '@angular/router';
import { GamificationService } from '../../services/gamification.service';

interface StudentData {
  name: string;
  class: string;
  avatar: string;
  lastActivity: string;
  isOnline: boolean;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'in-progress' | 'pending';
  icon: string;
}
const levelMap = {
  FIRST: 'السنة الاولى',
  SECOND: 'السنة الثانية',
  THIRD: 'السنة الثالثة',
  FOURTH: 'السنة الرابعة',
  FIFTH: 'السنة الخامسة',
  SIXTH: 'السنة السادسة',
};

export interface Achievement {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  earned: boolean;
  unlockedAt?: string;
  progress?: number;
  currentValue?: number;
  targetValue?: number;
}

interface Session {
  id?: string;
  sessionName: string;
  chapterName: string;
  description: string;
  date: string; // Keep for fallback or display string
  createdAt?: string; // Add this field for ISO parsing
  time?: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface CalendarDay {
  number: number;
  isToday: boolean;
  status: 'completed' | 'incomplete' | 'mixed' | '';
  sessions: Session[];
  arabicDate: string;
  isCurrentMonth: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  time: string;
}

interface SuggestedPlan {
  description: string;
  items: string[];
}

interface Difficulty {
  name: string;
  severity: 'high' | 'medium' | 'low';
}

type CalendarViewType = 'month' | 'list' | 'card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef;

  // Calendar view type
  currentCalendarView: CalendarViewType = 'month';

  // User statistics for achievement progress
  userStats = {
    totalSessions: 0,
    totalQna: 0,
    totalQuizzes: 0,
    totalSummaries: 0,
    elo: 0
  };

  // Shared Arabic months list
  private readonly arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  formatArabicDay(date: string): string {
    return new Date(date).getDate().toString();
  }

  formatArabicMonth(date: string): string {
    return this.arabicMonths[new Date(date).getMonth()];
  }

  // Student Data - Initialized with Friend's Arabic Fallback Data
  studentData: StudentData = {
    name: '', // Fallback
    class: '',
    avatar: '',
    lastActivity: 'منذ ساعتين',
    isOnline: true
  };

  // Recent Activities - Initialized with Friend's Arabic Fallback Data
  recentActivities: Activity[] = [
    {
      id: '1',
      title: 'درس الرياضيات',
      description: 'حل تمارين الجمع والطرح',
      time: 'اليوم 14:30',
      status: 'completed',
      icon: '📊'
    },
    {
      id: '2',
      title: 'قراءة القصة',
      description: 'قصة الأرنب الذكي',
      time: 'اليوم 15:45',
      status: 'in-progress',
      icon: '📖'
    },
    {
      id: '3',
      title: 'اختبار العلوم',
      description: 'اختبار حول النباتات',
      time: 'غداً 10:00',
      status: 'pending',
      icon: '🧪'
    }
  ];

  // Achievements - Initialized with Friend's Arabic Fallback Data
  achievements: Achievement[] = [];

  // Calendar
  currentDate = new Date();
  currentMonthYear = '';
  weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;

  // Sessions Data - Initialized with Friend's Arabic Fallback Data
  sessionsData: Session[] = [
    {
      id: 'session1',
      sessionName: 'الرياضيات الأساسية',
      chapterName: 'العمليات الحسابية',
      description: 'تعلم الجمع والطرح والضرب مع التمارين العملية والألعاب التفاعلية',
      date: '2025-11-23',
      time: '09:00',
      status: 'completed'
    },
    {
      id: 'session2',
      sessionName: 'قراءة وفهم النصوص',
      chapterName: 'المهارات اللغوية',
      description: 'قراءة النصوص وفهم المعاني مع التدريب على الطلاقة في القراءة',
      date: '2025-11-24',
      time: '10:30',
      status: 'in-progress'
    },
    {
      id: 'session3',
      sessionName: 'العلوم الطبيعية',
      chapterName: 'دورة الماء',
      description: 'شرح دورة الماء في الطبيعة مع التجارب العملية البسيطة',
      date: '2025-11-25',
      time: '14:00',
      status: 'pending'
    },
    {
      id: 'session4',
      sessionName: 'التعبير والإنشاء',
      chapterName: 'كتابة القصص',
      description: 'تعلم كتابة القصص القصيرة وتطوير مهارات التعبير الكتابي',
      date: '2025-11-26',
      time: '15:00',
      status: 'pending'
    },
    {
      id: 'session5',
      sessionName: 'الرياضيات المتقدمة',
      chapterName: 'جدول الضرب',
      description: 'حفظ وفهم جدول الضرب من 1 إلى 10 مع الألعاب التعليمية',
      date: '2025-11-27',
      time: '09:30',
      status: 'pending'
    },
    {
      id: 'session6',
      sessionName: 'اللغة العربية',
      chapterName: 'النحو والصرف',
      description: 'تعلم قواعد النحو الأساسية',
      date: '2025-11-28',
      time: '11:00',
      status: 'pending'
    }
  ];

  // Chat
  chatOpen = false;
  chatMessage = '';
  chatMessagesList: ChatMessage[] = [
    {
      id: '1',
      content: 'أهلاً بك! أنا مساعد إدارة الجلسات. كيف يمكنني مساعدتك اليوم؟',
      sender: 'agent',
      time: '14:30'
    }
  ];
  hasNewMessages = false;
  newMessagesCount = 0;
  suggestedPlan: SuggestedPlan | null = null;

  // AI analysis and difficulties (from friend's features)
  aiAnalysis = 'بناءً على تحليل أداء الطالب، لوحظ أن أحمد يواجه بعض التحديات في مادة الرياضيات خاصة في عمليات الضرب والقسمة. كما يحتاج إلى تحسين مهارات القراءة السريعة. ننصح بزيادة وقت التمارين العملية وتوفير قصص أكثر تشويقاً لتحفيز القراءة.';
  difficulties: Difficulty[] = [
    { name: 'عمليات الضرب', severity: 'high' },
    { name: 'القراءة السريعة', severity: 'medium' },
    { name: 'التركيز', severity: 'low' }
  ];

  constructor(
    private userService: UserService,
    public authService: AuthService, // Make public to use or use in method
    private aiService: AiService,
    private gamificationService: GamificationService,
    private router: Router
  ) { }

  ngOnInit() {
    this.updateCurrentMonthYear();
    this.generateCalendarDays();
    this.loadUserData(); // Load user data first to get stats
    this.loadSessions();
    this.fetchAchievements();
  }

  // ===== Data loading =====

  fetchAchievements() {
    this.gamificationService.getMyAchievements().subscribe({
      next: (data) => {
        this.achievements = data.map(item => {
          const { progress, currentValue, targetValue } = this.calculateAchievementProgress(item);

          return {
            id: item.id,
            name: item.name,
            title: item.name,
            description: item.description,
            icon: item.icon,
            unlocked: item.unlocked,
            earned: item.unlocked,
            unlockedAt: item.unlockedAt,
            progress: progress,
            currentValue: currentValue,
            targetValue: targetValue
          };
        });
      },
      error: (err) => console.error('Failed to fetch achievements', err)
    });
  }

  /**
   * Calculate achievement progress based on achievement name and user statistics
   */
  calculateAchievementProgress(achievement: any): { progress: number, currentValue: number, targetValue: number } {
    if (achievement.unlocked) {
      return { progress: 100, currentValue: 0, targetValue: 0 };
    }

    const name = achievement.name || achievement.description || '';

    // Session-based achievements
    if (name.includes('جلسة') || name.includes('جلسات')) {
      return this.calculateSessionProgress(name);
    }

    // Quiz-based achievements
    if (name.includes('اختبار') || name.includes('اختبارات')) {
      return this.calculateQuizProgress(name);
    }

    // Elo/Rating-based achievements
    if (name.includes('نقطة تصنيف') || name.includes('الترتيب')) {
      return this.calculateEloProgress(name);
    }

    return { progress: 0, currentValue: 0, targetValue: 1 };
  }

  /**
   * Calculate progress for session-based achievements
   */
  calculateSessionProgress(achievementName: string): { progress: number, currentValue: number, targetValue: number } {
    const current = this.userStats.totalSessions;
    let target = 1;

    // Extract target from achievement name
    if (achievementName.includes('50')) {
      target = 50;
    } else if (achievementName.includes('25')) {
      target = 25;
    } else if (achievementName.includes('10')) {
      target = 10;
    } else if (achievementName.includes('3')) {
      target = 3;
    } else if (achievementName.includes('أول') || achievementName.includes('الأولى')) {
      target = 1;
    }

    const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return { progress, currentValue: current, targetValue: target };
  }

  /**
   * Calculate progress for quiz-based achievements
   */
  calculateQuizProgress(achievementName: string): { progress: number, currentValue: number, targetValue: number } {
    const current = this.userStats.totalQuizzes;
    let target = 1;

    // Extract target from achievement name
    if (achievementName.includes('25')) {
      target = 25;
    } else if (achievementName.includes('10')) {
      target = 10;
    } else if (achievementName.includes('5')) {
      target = 5;
    } else if (achievementName.includes('أول')) {
      target = 1;
    }

    const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return { progress, currentValue: current, targetValue: target };
  }

  /**
   * Calculate progress for elo/rating-based achievements
   */
  calculateEloProgress(achievementName: string): { progress: number, currentValue: number, targetValue: number } {
    const current = this.userStats.elo;
    let target = 100;

    // Extract target from achievement name
    if (achievementName.includes('500')) {
      target = 500;
    } else if (achievementName.includes('300')) {
      target = 300;
    } else if (achievementName.includes('200')) {
      target = 200;
    } else if (achievementName.includes('100')) {
      target = 100;
    }

    const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
    return { progress, currentValue: current, targetValue: target };
  }

  async loadUserData() {
    try {
      const user = await firstValueFrom(this.userService.getCurrentUser());
      if (user) {
        this.studentData = {
          name: `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim(),
          class: levelMap[user.level] ?? '',
          avatar: user.avatar ? user.avatar : '',
          lastActivity: user.updatedAt
            ? this.formatTimeAgo(new Date(user.updatedAt))
            : '',
          isOnline: true
        };

        // Update user stats for achievement calculations
        this.userStats = {
          totalSessions: (user.totalSummaries || 0) + (user.totalQna || 0) + (user.totalQuizzes || 0),
          totalQna: user.totalQna || 0,
          totalQuizzes: user.totalQuizzes || 0,
          totalSummaries: user.totalSummaries || 0,
          elo: user.elo || 0
        };

        // Refresh achievements after loading user stats
        this.fetchAchievements();
      }
    } catch (error) {
      console.error('Error loading user data, using fallback:', error);
    }
  }

  async loadSessions() {
    try {
      const response = await firstValueFrom(this.userService.getUserSessions(0, 100));
      if (response && response.content && response.content.length > 0) {
        this.sessionsData = response.content.map((session: any) => ({
          id: session.id,
          sessionName: session.topic || 'جلسة دراسية',
          chapterName: session.selectedModule || 'مادة',
          description: session.notes || 'جلسة تعليمية',
          date: new Date(session.createdAt).toISOString().split('T')[0],
          createdAt: session.createdAt, // Keep the full ISO string
          time: new Date(session.createdAt).toLocaleTimeString('ar-TN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          status:
            session.status === 'COMPLETED' ? 'completed' :
              session.status === 'IN_PROGRESS' ? 'in-progress' :
                'pending'
        }));

        // Update total sessions count
        this.userStats.totalSessions = this.sessionsData.filter(s => s.status === 'completed').length;

        this.generateCalendarDays(); // Regenerate after loading sessions
        this.fetchAchievements(); // Refresh achievements with updated stats
      }
    } catch (error) {
      console.error('Error loading sessions, using fallback:', error);
    }
  }

  // ===== Calendar View Methods =====

  setCalendarView(view: CalendarViewType) {
    this.currentCalendarView = view;
  }

  getUpcomingSessions(): Session[] {
    const today = new Date();
    return this.sessionsData
      .filter(session => new Date(session.date) >= new Date(today.toISOString().split('T')[0]))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }

  updateCurrentMonthYear() {
    const month = this.arabicMonths[this.currentDate.getMonth()];
    const year = this.currentDate.getFullYear();
    this.currentMonthYear = `${month} ${year}`;
  }

  generateCalendarDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);

    // Start from Sunday of the week containing the first day
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    this.calendarDays = [];
    const today = new Date();

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const sessions = this.getSessionsForDate(date);
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      let status: 'completed' | 'incomplete' | 'mixed' | '' = '';

      if (sessions.length > 0) {
        if (completedSessions === sessions.length) {
          status = 'completed';
        } else if (completedSessions > 0) {
          status = 'mixed';
        } else {
          status = 'incomplete';
        }
      }

      this.calendarDays.push({
        number: date.getDate(),
        isToday: this.isSameDay(date, today),
        status,
        sessions,
        arabicDate: this.formatArabicDate(date),
        isCurrentMonth: date.getMonth() === month
      });
    }
  }

  getSessionsForDate(date: Date): Session[] {
    // FIX: Use local time explicitly to avoid UTC shifts (which caused +1 day error)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    return this.sessionsData.filter(session => {
      // Handle both full ISO strings and YYYY-MM-DD
      if (session.createdAt) {
        const sessionDate = new Date(session.createdAt);
        const sYear = sessionDate.getFullYear();
        const sMonth = String(sessionDate.getMonth() + 1).padStart(2, '0');
        const sDay = String(sessionDate.getDate()).padStart(2, '0');
        return `${sYear}-${sMonth}-${sDay}` === dateString;
      }
      return session.date === dateString;
    });
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  }

  formatArabicDate(date: Date): string {
    return `${date.getDate()} ${this.arabicMonths[date.getMonth()]}`;
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateCurrentMonthYear();
    this.generateCalendarDays();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateCurrentMonthYear();
    this.generateCalendarDays();
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = day;
  }

  closeModal() {
    this.selectedDay = null;
  }

  startSession(session: Session) {
    console.log('START SESSION CLICKED:', session);
    // If completed or in-progress, view history
    if (session.status === 'completed' || session.status === 'in-progress') { // Treat in-progress as viewable for now, or check ID
      if (session.id) {
        this.router.navigate(['/session-history', session.id]);
        this.closeModal();
        return;
      }
    }

    // Fallback or logic for starting a pending session
    // session.status = 'in-progress'; // Only if starting new
    // alert(`بدء الجلسة: ${session.sessionName}`);
    this.closeModal();
    // this.generateCalendarDays();
  }

  logout() {
    this.authService.logout();
  }

  // ===== Chat Methods =====

  toggleChat() {
    this.chatOpen = !this.chatOpen;
    if (this.chatOpen) {
      this.hasNewMessages = false;
      this.newMessagesCount = 0;
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  sendMessage() {
    if (this.chatMessage.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: this.chatMessage,
        sender: 'user',
        time: new Date().toLocaleTimeString('ar-TN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      this.chatMessagesList.push(userMessage);
      this.chatMessage = '';

      // Call AI Service
      this.generateAIResponse(userMessage.content);

      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }

  onChatKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async generateAIResponse(userMessage: string) {
    try {
      const response = await firstValueFrom(this.aiService.generatePlan(userMessage, '1 hour'));

      const agentResponse: ChatMessage = {
        id: Date.now().toString(),
        content: 'شكراً لك. قمت بإعداد خطة بناءً على طلبك.',
        sender: 'agent',
        time: new Date().toLocaleTimeString('ar-TN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      this.chatMessagesList.push(agentResponse);

      if (response && response.plan) {
        const planText = typeof response.plan === 'string'
          ? response.plan
          : JSON.stringify(response.plan);

        const items = planText
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string | any[]) => line.length > 0);

        this.suggestedPlan = {
          description: 'إليك الخطة المقترحة:',
          items
        };
      }

      this.scrollToBottom();
    } catch (error: any) {
      console.error('Error generating plan:', error);
      // Fallback for chat
      const errorResponse: ChatMessage = {
        id: Date.now().toString(),
        content: 'سأقوم بتحليل احتياجات طفلك وإعداد خطة مخصصة للجلسة القادمة... (محاكاة)',
        sender: 'agent',
        time: new Date().toLocaleTimeString('ar-TN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      this.chatMessagesList.push(errorResponse);

      // Inject friend's mock plan as fallback
      setTimeout(() => {
        this.suggestedPlan = {
          description: 'بناءً على المعلومات المقدمة، إليك خطة الجلسة المقترحة لطفلك:',
          items: [
            '15 دقيقة: مراجعة درس الرياضيات السابق',
            '20 دقيقة: تمارين عملية على جدول الضرب',
            '10 دقيقة: استراحة نشطة',
            '15 دقيقة: قراءة قصة قصيرة',
            '10 دقيقة: مناقشة وأسئلة حول القصة'
          ]
        };
        this.scrollToBottom();
      }, 1000);
    }
  }

  approvePlan() {
    const approvalMessage: ChatMessage = {
      id: Date.now().toString(),
      content: 'ممتاز! تم الموافقة على الخطة. سيتم تطبيقها في الجلسة القادمة.',
      sender: 'agent',
      time: new Date().toLocaleTimeString('ar-TN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    this.chatMessagesList.push(approvalMessage);
    this.suggestedPlan = null;
    this.scrollToBottom();
  }

  rejectPlan() {
    const rejectionMessage: ChatMessage = {
      id: Date.now().toString(),
      content: 'لا مشكلة. يمكنك إخباري بالتعديلات التي تريدها وسأقوم بإعداد خطة جديدة.',
      sender: 'agent',
      time: new Date().toLocaleTimeString('ar-TN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    this.chatMessagesList.push(rejectionMessage);
    this.suggestedPlan = null;
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.chatMessagesContainer) {
      try {
        this.chatMessagesContainer.nativeElement.scrollTop =
          this.chatMessagesContainer.nativeElement.scrollHeight;
      } catch {
      }
    }
  }

  // ===== Utilities =====

  private formatTimeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) {
      return 'الآن';
    }

    if (diffMinutes < 60) {
      return `منذ ${diffMinutes} دقيقة`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  }
}

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { RouterModule, Router } from '@angular/router';
import { GamificationService } from '../../services/gamification.service';
import {Achievement} from '../../model/achievement.model';
import {StudentData,Activity,levelMap} from '../../model/user.model';
import {Session, SessionDTO} from '../../model/session.model';
import {ChatMessage,SuggestedPlan,PlanRequest,SessionLog,UserLog,PlanSession} from '../../model/planner.model';
import {CalendarDay,Difficulty} from '../../model/shared.model';



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

  // Store the user's level enum for backend calls
  userLevel: string = 'FOURTH';

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

  // Sessions Data - Initialized with Fallback Data
  sessionsData: Session[] = [
    {
      id: 'session1',
      sessionName: 'الرياضيات الأساسية',
      subject: 'رياضيات',
      module: 'العمليات الحسابية',
      lesson: 'الجمع والطرح',
      description: 'تعلم الجمع والطرح والضرب مع التمارين العملية والألعاب التفاعلية',
      date: '2025-11-23',
      time: '09:00',
      status: 'completed'
    },
    {
      id: 'session2',
      sessionName: 'قراءة وفهم النصوص',
      subject: 'لغة عربية',
      module: 'المهارات اللغوية',
      lesson: 'القراءة والفهم',
      description: 'قراءة النصوص وفهم المعاني مع التدريب على الطلاقة في القراءة',
      date: '2025-11-24',
      time: '10:30',
      status: 'in-progress'
    },
    {
      id: 'session3',
      sessionName: 'العلوم الطبيعية',
      subject: 'علوم',
      module: 'دورة الماء',
      lesson: 'حالات الماء',
      description: 'شرح دورة الماء في الطبيعة مع التجارب العملية البسيطة',
      date: '2025-11-25',
      time: '14:00',
      status: 'pending'
    },
    {
      id: 'session4',
      sessionName: 'التعبير والإنشاء',
      subject: 'لغة عربية',
      module: 'كتابة القصص',
      lesson: 'التعبير الكتابي',
      description: 'تعلم كتابة القصص القصيرة وتطوير مهارات التعبير الكتابي',
      date: '2025-11-26',
      time: '15:00',
      status: 'pending'
    },
    {
      id: 'session5',
      sessionName: 'الرياضيات المتقدمة',
      subject: 'رياضيات',
      module: 'جدول الضرب',
      lesson: 'الضرب',
      description: 'حفظ وفهم جدول الضرب من 1 إلى 10 مع الألعاب التعليمية',
      date: '2025-11-27',
      time: '09:30',
      status: 'pending'
    },
    {
      id: 'session6',
      sessionName: 'اللغة العربية',
      subject: 'لغة عربية',
      module: 'النحو والصرف',
      lesson: 'القواعد الأساسية',
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

  // Planning Form State
  showPlanningForm = false;
  planningStep = 0;
  isGeneratingPlan = false;

  // Planning Form Data
  planFormData: PlanRequest = {
    goal: '',
    time_available: '',
    branch: '',
    topic: '',
    obstacles: [],
    parent_remark: '',
    session_logs: [],
    user_logs: []
  };

  // Temp fields for form inputs
  newObstacle = '';

  // Available options for dropdowns
  availableBranches = ['أحياء', 'فيزياء', 'رياضيات', 'كيمياء', 'لغة عربية', 'لغة فرنسية', 'لغة إنجليزية', 'تاريخ', 'جغرافيا'];
  availableTimeOptions = ['أسبوع واحد', 'أسبوعين', '٣ أسابيع', 'شهر واحد', '١٠ أيام', '١٥ يوم'];

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
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            icon: item.icon,
            unlocked: item.unlocked,
            unlockedAt: item.unlockedAt,
            progress: item.progress || 0,
            currentValue: item.currentValue || 0,
            targetValue: item.targetValue || 0
          };
        });
      },
      error: (err) => console.error('Failed to fetch achievements', err)
    });
  }

  async loadUserData() {
    try {
      const user = await firstValueFrom(this.userService.getCurrentUser());
      if (user) {
        // Store the level enum for backend calls
        this.userLevel = user.level || 'FOURTH';

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
        this.sessionsData = response.content.map((session: any) => {
          // Use startedAt for scheduled date, fallback to createdAt
          const sessionDate = session.startedAt || session.createdAt;
          const dateObj = new Date(sessionDate);

          return {
            id: session.id,
            // Use module as session name, fallback to subject or default
            sessionName: session.module || session.subject || 'جلسة دراسية',
            // Use lesson or lessonContent for description
            description: session.lessonContent || session.lesson || session.sessionFeedback || 'جلسة تعليمية',
            // Store individual fields
            subject: session.subject,
            module: session.module,
            lesson: session.lesson,
            sessionType: session.sessionType,
            sessionGoal: session.lessonContent,
            parentTip: session.sessionFeedback,
            quizScore: session.quizScore,
            // Date and time from startedAt (scheduled) or createdAt
            date: dateObj.toISOString().split('T')[0],
            createdAt: session.createdAt,
            startedAt: session.startedAt,
            time: dateObj.toLocaleTimeString('ar-TN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            // Map status
            status:
              session.status === 'COMPLETED' ? 'completed' :
                session.status === 'IN_PROGRESS' ? 'in-progress' :
                  'pending'
          };
        });

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
    // Check if user wants to create a plan
    if (userMessage.includes('خطة') || userMessage.includes('plan') || userMessage.includes('جلسة')) {
      this.startPlanningWizard();
      return;
    }

    // Default response for other messages
    const agentResponse: ChatMessage = {
      id: Date.now().toString(),
      content: 'هل تريد إنشاء خطة تعليمية جديدة؟ اكتب "خطة" للبدء.',
      sender: 'agent',
      time: new Date().toLocaleTimeString('ar-TN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    this.chatMessagesList.push(agentResponse);
    this.scrollToBottom();
  }

  // ===== Planning Wizard Methods =====

  startPlanningWizard() {
    this.showPlanningForm = true;
    this.planningStep = 1;
    this.resetPlanForm();

    const agentResponse: ChatMessage = {
      id: Date.now().toString(),
      content: 'رائع! سأساعدك في إنشاء خطة تعليمية مخصصة. يرجى ملء النموذج أدناه.',
      sender: 'agent',
      time: new Date().toLocaleTimeString('ar-TN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    this.chatMessagesList.push(agentResponse);
    this.scrollToBottom();
  }

  resetPlanForm() {
    this.planFormData = {
      goal: '',
      time_available: '',
      branch: '',
      topic: '',
      obstacles: [],
      parent_remark: '',
      session_logs: [],
      user_logs: []
    };
    this.newObstacle = '';
  }

  addObstacle() {
    if (this.newObstacle.trim()) {
      this.planFormData.obstacles?.push(this.newObstacle.trim());
      this.newObstacle = '';
    }
  }

  removeObstacle(index: number) {
    this.planFormData.obstacles?.splice(index, 1);
  }

  nextPlanStep() {
    if (this.planningStep < 3) {
      this.planningStep++;
    }
  }

  prevPlanStep() {
    if (this.planningStep > 1) {
      this.planningStep--;
    }
  }

  cancelPlanning() {
    this.showPlanningForm = false;
    this.planningStep = 0;
    this.resetPlanForm();

    const agentResponse: ChatMessage = {
      id: Date.now().toString(),
      content: 'تم إلغاء إنشاء الخطة. يمكنك البدء من جديد في أي وقت!',
      sender: 'agent',
      time: new Date().toLocaleTimeString('ar-TN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    this.chatMessagesList.push(agentResponse);
    this.scrollToBottom();
  }

  async submitPlan() {
    if (!this.planFormData.goal || !this.planFormData.time_available) {
      return;
    }

    this.isGeneratingPlan = true;
    this.showPlanningForm = false;

    // Add user message showing the request
    const userSummary: ChatMessage = {
      id: Date.now().toString(),
      content: `طلب خطة تعليمية:\n📎 الهدف: ${this.planFormData.goal}\n⏱️ الوقت المتاح: ${this.planFormData.time_available}\n📚 المادة: ${this.planFormData.branch || 'غير محدد'}\n📖 الموضوع: ${this.planFormData.topic || 'غير محدد'}`,
      sender: 'user',
      time: new Date().toLocaleTimeString('ar-TN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    this.chatMessagesList.push(userSummary);

    // Add "generating" message
    const generatingMsg: ChatMessage = {
      id: Date.now().toString(),
      content: '🔄 جاري إنشاء الخطة التعليمية... يرجى الانتظار.',
      sender: 'agent',
      time: new Date().toLocaleTimeString('ar-TN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    this.chatMessagesList.push(generatingMsg);
    this.scrollToBottom();

    try {
      // Prepare session logs from loaded sessions
      const sessionLogs: SessionLog[] = this.sessionsData.map(s => ({
        session_id: s.id || '',
        type: 'learning',
        date: s.date,
        branch: s.subject || '',
        topic: s.module || s.sessionName,
        lesson: s.lesson || s.sessionName,
        summary: s.description,
        feedback: s.parentTip || '',
        quiz_score: s.quizScore,
        status: s.status,
        level: this.studentData.class
      }));

      // Prepare user logs
      const userLogs: UserLog[] = [{
        user_id: '',
        name: this.studentData.name,
        email: '',
        level: this.studentData.class,
        grade: this.studentData.class,
        elo: this.userStats.elo,
        role: 'student',
        total_quizzes: this.userStats.totalQuizzes,
        highest_score: 0,
        total_qna: this.userStats.totalQna,
        total_summaries: this.userStats.totalSummaries,
        created_at: '',
        strengths: [],
        weaknesses: this.difficulties.map(d => d.name)
      }];

      // Build complete request
      const planRequest: PlanRequest = {
        goal: this.planFormData.goal,
        time_available: this.planFormData.time_available,
        branch: this.planFormData.branch,
        topic: this.planFormData.topic,
        obstacles: this.planFormData.obstacles,
        parent_remark: this.planFormData.parent_remark,
        session_logs: sessionLogs,
        user_logs: userLogs
      };

      console.log('Sending plan request:', planRequest);

      const response = await firstValueFrom(this.aiService.generatePlan(planRequest));

      // Remove generating message
      this.chatMessagesList = this.chatMessagesList.filter(m => !m.content.includes('جاري إنشاء'));

      const agentResponse: ChatMessage = {
        id: Date.now().toString(),
        content: '✅ تم إنشاء الخطة التعليمية بنجاح!',
        sender: 'agent',
        time: new Date().toLocaleTimeString('ar-TN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      this.chatMessagesList.push(agentResponse);

      if (response && response.plan) {
        const planText = response.plan;

        // Try to parse JSON from the response
        let sessions: PlanSession[] = [];
        try {
          // Extract JSON from the response (might be wrapped in markdown code blocks)
          const jsonMatch = planText.match(/```json\s*([\s\S]*?)```/) ||
                           planText.match(/```\s*([\s\S]*?)```/) ||
                           [null, planText];
          const jsonStr = jsonMatch[1] || planText;

          // Try to parse as JSON array
          const parsed = JSON.parse(jsonStr.trim());
          if (Array.isArray(parsed)) {
            sessions = parsed as PlanSession[];
          } else if (parsed && typeof parsed === 'object') {
            // Single session object
            sessions = [parsed as PlanSession];
          }
        } catch (e) {
          console.log('Could not parse plan as JSON, using text format');
        }

        if (sessions.length > 0) {
          // Structured plan with sessions
          this.suggestedPlan = {
            description: 'إليك الخطة التعليمية المخصصة:',
            sessions: sessions
          };
        } else {
          // Fallback to text items
          const items = planText
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0 && !line.startsWith('```'));

          this.suggestedPlan = {
            description: 'إليك الخطة التعليمية المخصصة:',
            items
          };
        }
      }

      this.scrollToBottom();
    } catch (error: any) {
      console.error('Error generating plan:', error);

      // Remove generating message
      this.chatMessagesList = this.chatMessagesList.filter(m => !m.content.includes('جاري إنشاء'));

      const errorResponse: ChatMessage = {
        id: Date.now().toString(),
        content: `❌ حدث خطأ أثناء إنشاء الخطة: ${error.message || 'خطأ غير معروف'}. يرجى المحاولة مرة أخرى.`,
        sender: 'agent',
        time: new Date().toLocaleTimeString('ar-TN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      this.chatMessagesList.push(errorResponse);
      this.scrollToBottom();
    } finally {
      this.isGeneratingPlan = false;
      this.resetPlanForm();
    }
  }

  async approvePlan() {
    if (!this.suggestedPlan) {
      return;
    }

    // Show loading message
    const loadingMessage: ChatMessage = {
      id: Date.now().toString(),
      content: '🔄 جاري حفظ الجلسات في النظام...',
      sender: 'agent',
      time: new Date().toLocaleTimeString('ar-TN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    this.chatMessagesList.push(loadingMessage);
    this.scrollToBottom();

    try {
      let sessionsCreated = 0;

      // If we have structured sessions, create each one in the backend
      if (this.suggestedPlan.sessions && this.suggestedPlan.sessions.length > 0) {
        for (const planSession of this.suggestedPlan.sessions) {
          // Convert the planned date to ISO string for startedAt (scheduled date)
          const scheduledDate = new Date(planSession.date);
          // Set a default time (e.g., 9:00 AM) if only date is provided
          scheduledDate.setHours(9, 0, 0, 0);

          const sessionDTO: Partial<SessionDTO> = {
            level: this.userLevel, // Use the enum value (e.g., 'FOURTH')
            subject: planSession.Branch,
            module: planSession.Topic,
            lesson: planSession.Lesson,
            status: 'PENDING',
            sessionType: 'SUMMARY' as any,
            summaryPointsOfFocus: planSession.obstacles || [],
            sessionFeedback: planSession.parent_tip || '',
            lessonContent: `هدف الجلسة: ${planSession.session_goal}`,
            startedAt: scheduledDate.toISOString() // Use startedAt for scheduled date
          };

          try {
            await firstValueFrom(this.userService.saveSession(sessionDTO as any));
            sessionsCreated++;
          } catch (err) {
            console.error('Error creating session:', err);
          }
        }
      }

      // Remove loading message
      this.chatMessagesList = this.chatMessagesList.filter(m => !m.content.includes('جاري حفظ'));

      // Show success message
      const approvalMessage: ChatMessage = {
        id: Date.now().toString(),
        content: sessionsCreated > 0
          ? `✅ ممتاز! تم الموافقة على الخطة وإنشاء ${sessionsCreated} جلسة/جلسات في النظام. يمكنك رؤيتها في التقويم.`
          : 'ممتاز! تم الموافقة على الخطة. سيتم تطبيقها في الجلسة القادمة.',
        sender: 'agent',
        time: new Date().toLocaleTimeString('ar-TN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      this.chatMessagesList.push(approvalMessage);
      this.suggestedPlan = null;

      // Reload sessions to show the newly created ones
      if (sessionsCreated > 0) {
        await this.loadSessions();
      }

      this.scrollToBottom();
    } catch (error: any) {
      console.error('Error approving plan:', error);

      // Remove loading message
      this.chatMessagesList = this.chatMessagesList.filter(m => !m.content.includes('جاري حفظ'));

      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `❌ حدث خطأ أثناء حفظ الجلسات: ${error.message || 'خطأ غير معروف'}`,
        sender: 'agent',
        time: new Date().toLocaleTimeString('ar-TN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
      this.chatMessagesList.push(errorMessage);
      this.scrollToBottom();
    }
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

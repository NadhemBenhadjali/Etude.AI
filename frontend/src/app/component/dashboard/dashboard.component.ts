import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number;
}

interface Session {
  id: string;
  sessionName: string;
  chapterName: string;
  description: string;
  date: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef;

  // Calendar view type
  currentCalendarView: CalendarViewType = 'month';
  formatArabicDay(date: string): string {
  return new Date(date).getDate().toString();
}

formatArabicMonth(date: string): string {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[new Date(date).getMonth()];
}
  // Student Data
  studentData: StudentData = {
    name: 'أحمد محمد',
    class: 'الصف الخامس أ',
    avatar: 'assets/images/student-avatar.jpg',
    lastActivity: 'منذ ساعتين',
    isOnline: true
  };

  // Recent Activities
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

  // Achievements
  achievements: Achievement[] = [
    {
      id: '1',
      title: 'قارئ ماهر',
      description: 'قرأ 10 قصص هذا الشهر',
      icon: '📚',
      earned: true,
      progress: 100
    },
    {
      id: '2',
      title: 'عبقري الرياضيات',
      description: 'حل 50 مسألة رياضية',
      icon: '🧮',
      earned: false,
      progress: 78
    },
    {
      id: '3',
      title: 'مستكشف العلوم',
      description: 'أكمل 5 تجارب علمية',
      icon: '🔬',
      earned: false,
      progress: 40
    },
    {
      id: '4',
      title: 'نجم اللغة',
      description: 'كتب 20 موضوع إنشاء',
      icon: '✍️',
      earned: true,
      progress: 100
    }
  ];

  // Calendar
  currentDate = new Date();
  currentMonthYear = '';
  weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;

  // Sessions Data (JSON structure for easy agent integration)
  sessionsData: Session[] = [
    {
      id: 'session1',
      sessionName: 'الرياضيات الأساسية',
      chapterName: 'العمليات الحسابية',
      description: 'تعلم الجمع والطرح والضرب مع التمارين العملية والألعاب التفاعلية',
      date: '2025-0ç-07',
      time: '09:00',
      status: 'completed'
    },
    {
      id: 'session2',
      sessionName: 'قراءة وفهم النصوص',
      chapterName: 'المهارات اللغوية',
      description: 'قراءة النصوص وفهم المعاني مع التدريب على الطلاقة في القراءة',
      date: '2025-09-08',
      time: '10:30',
      status: 'in-progress'
    },
    {
      id: 'session3',
      sessionName: 'العلوم الطبيعية',
      chapterName: 'دورة الماء',
      description: 'شرح دورة الماء في الطبيعة مع التجارب العملية البسيطة',
      date: '2025-09-09',
      time: '14:00',
      status: 'pending'
    },
    {
      id: 'session4',
      sessionName: 'التعبير والإنشاء',
      chapterName: 'كتابة القصص',
      description: 'تعلم كتابة القصص القصيرة وتطوير مهارات التعبير الكتابي',
      date: '2025-09-10',
      time: '15:00',
      status: 'pending'
    },
    {
      id: 'session5',
      sessionName: 'الرياضيات المتقدمة',
      chapterName: 'جدول الضرب',
      description: 'حفظ وفهم جدول الضرب من 1 إلى 10 مع الألعاب التعليمية',
      date: '2025-09-11',
      time: '09:30',
      status: 'pending'
    },
    // Add more sessions for better demonstration
    {
      id: 'session6',
      sessionName: 'اللغة العربية',
      chapterName: 'النحو والصرف',
      description: 'تعلم قواعد النحو الأساسية',
      date: '2025-09-12',
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

  // Difficulties
  aiAnalysis = 'بناءً على تحليل أداء الطالب، لوحظ أن أحمد يواجه بعض التحديات في مادة الرياضيات خاصة في عمليات الضرب والقسمة. كما يحتاج إلى تحسين مهارات القراءة السريعة. ننصح بزيادة وقت التمارين العملية وتوفير قصص أكثر تشويقاً لتحفيز القراءة.';
  
  difficulties: Difficulty[] = [
    { name: 'عمليات الضرب', severity: 'high' },
    { name: 'القراءة السريعة', severity: 'medium' },
    { name: 'التركيز', severity: 'low' }
  ];

  ngOnInit() {
    this.updateCurrentMonthYear();
    this.generateCalendarDays();
  }

  // Calendar View Methods
  setCalendarView(view: CalendarViewType) {
    this.currentCalendarView = view;
  }

  // Get sessions for list and card views
  getUpcomingSessions(): Session[] {
    const today = new Date();
    return this.sessionsData
      .filter(session => new Date(session.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10); // Show next 10 sessions
  }

  // Calendar Methods
  updateCurrentMonthYear() {
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const month = arabicMonths[this.currentDate.getMonth()];
    const year = this.currentDate.getFullYear();
    this.currentMonthYear = `${month} ${year}`;
  }

  generateCalendarDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
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
        status: status,
        sessions: sessions,
        arabicDate: this.formatArabicDate(date),
        isCurrentMonth: date.getMonth() === month
      });
    }
  }

  getSessionsForDate(date: Date): Session[] {
    const dateString = date.toISOString().split('T')[0];
    return this.sessionsData.filter(session => session.date === dateString);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  formatArabicDate(date: Date): string {
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    return `${date.getDate()} ${arabicMonths[date.getMonth()]}`;
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
    // Update session status to in-progress
    session.status = 'in-progress';
    console.log('Starting session:', session);
    alert(`بدء الجلسة: ${session.sessionName}`);
    this.closeModal();
    // Regenerate calendar to update the display
    this.generateCalendarDays();
  }

  // Chat Methods
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

      // Simulate AI response
      setTimeout(() => {
        this.generateAIResponse(userMessage.content);
      }, 1000);

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

  generateAIResponse(userMessage: string) {
    // Simulate AI analysis and response
    const agentResponse: ChatMessage = {
      id: Date.now().toString(),
      content: 'شكراً لك على هذه المعلومات المفيدة. سأقوم بتحليل احتياجات طفلك وإعداد خطة مخصصة للجلسة القادمة...',
      sender: 'agent',
      time: new Date().toLocaleTimeString('ar-TN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    this.chatMessagesList.push(agentResponse);

    // Generate suggested plan after a short delay
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
    }, 2000);

    this.scrollToBottom();
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
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.log('Could not scroll to bottom');
      }
    }
  }

  // Utility method to simulate new messages when chat is closed
  simulateNewMessage() {
    if (!this.chatOpen) {
      this.hasNewMessages = true;
      this.newMessagesCount++;
    }
  }
}
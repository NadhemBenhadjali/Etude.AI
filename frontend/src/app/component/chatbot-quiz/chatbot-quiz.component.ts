import { Component, OnInit, OnDestroy }             from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { RouterModule, ActivatedRoute }  from '@angular/router';
import { FormsModule }                   from '@angular/forms';
import { AvatarComponent } from "../../shared/avatar/avatar.component";
import { QuizService, QuizQuestion } from '../../services/quiz.service';

interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

interface PowerUp {
  id: string;
  name: string;
  icon: string;
  count: number;
  available: boolean;
  description: string;
}

interface Checkpoint {
  position: number;
  icon: string;
  reached: boolean;
  current: boolean;
}

interface Particle {
  x: number;
  y: number;
  delay: number;
  emoji?: string;
  color?: string;
}

interface PowerupNotification {
  powerup: PowerUp;
  visible: boolean;
  message: string;
}

@Component({
  selector: 'app-chatbot-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AvatarComponent],
  templateUrl: './chatbot-quiz.component.html',
  styleUrls:   ['./chatbot-quiz.component.css']
})
export class ChatbotQuizComponent implements OnInit, OnDestroy {
  messages: { text: string; isUser: boolean }[] = [];
  isLoading = false;
  
  // Game State
  currentMode   = '';
  currentModule = '';
  
  // Quiz Logic
  questions: QuizQuestion[] = [];
  currentQuestionIndex = 0;
  score = 0;
  inQuiz = false;
  quizFinished = false;
  gameFinished = false;
  totalQuestions = 0;
  
  // Enhanced Game Features
  gameLoading = false;
  loadingProgress = 0;
  loadingText = 'جاري التحضير...';
  
  // Difficulty System
  currentDifficulty: 'easy' | 'normal' | 'expert' = 'normal';
  selectedDifficulty: 'easy' | 'normal' | 'expert' | null = null;
  
  // Scoring & Progression
  currentLevel = 1;
  experience = 0;
  experienceToNext = 100;
  experiencePercent = 0;
  
  // Game Mechanics
  currentCombo = 0;
  maxComboReached = 0;
  currentLives = 3;
  lives = [1, 2, 3]; // For display
  timeLeft = 30;
  gameTimer: any;
  
  // Visual Feedback
  dinoPosition = 0;
  gameProgressPercent = 0;
  feedbackMessage = '';
  feedbackIcon = '';
  feedbackClass = '';
  avatarMessage = '';
  dinoMessage = '';
  gameStatus = 'استعد للمغامرة!';
  
  // Animation States
  scoreAnimating = false;
  questionAnimating = false;
  showSparkles = false;
  showConfetti = false;
  showStarBurst = false;
  showFeedbackParticles = false;
  answerLocked = false;
  lastAnswerCorrect = false;
  
  // Hint System
  hintActive = false;
  correctAnswerIndex = -1;
  
  // Progress System
  progressCheckpoints: Checkpoint[] = [];
  checkpointsReached: boolean[] = []; // Track which checkpoints have been reached to avoid duplicate notifications
  
  // Powerup Notification System
  powerupNotification: PowerupNotification = {
    powerup: { id: '', name: '', icon: '', count: 0, available: false, description: '' },
    visible: false,
    message: ''
  };
  
  // Achievements System
  achievements: Achievement[] = [
    { id: 'first_correct', name: 'البداية الصحيحة', icon: '🌟', description: 'أجب على أول سؤال بشكل صحيح', unlocked: false },
    { id: 'combo_3', name: 'متتالية ثلاثية', icon: '🔥', description: 'احصل على 3 إجابات صحيحة متتالية', unlocked: false },
    { id: 'perfect_score', name: 'المثالية', icon: '💎', description: 'احصل على الدرجة الكاملة', unlocked: false },
    { id: 'speed_demon', name: 'البرق', icon: '⚡', description: 'أجب على 5 أسئلة في أقل من دقيقة', unlocked: false },
    { id: 'expert_player', name: 'الخبير', icon: '🏆', description: 'اكمل اللعبة في المستوى الخبير', unlocked: false }
  ];
  unlockedAchievements: Achievement[] = [];
  newAchievements: Achievement[] = [];
  
  // Power-ups System
  availablePowerups: PowerUp[] = [
    { id: 'hint', name: 'تلميح', icon: '💡', count: 2, available: true, description: 'احصل على تلميح للسؤال' },
    { id: 'skip', name: 'تخطي', icon: '⏭️', count: 1, available: true, description: 'تخطي السؤال الحالي' },
    { id: 'freeze', name: 'تجميد', icon: '❄️', count: 1, available: true, description: 'توقيف الوقت لـ 10 ثوانِ' }
  ];
  
  // Skip system
  skipsUsed = 0;
  maxSkips = 2;
  
  // Particle Effects
  confettiParticles: Particle[] = [];
  starBurstParticles: Particle[] = [];
  feedbackParticles: Particle[] = [];

  constructor(
    private route: ActivatedRoute,
    private quizService: QuizService
  ) {}

  ngOnInit() {
    console.log('[DEBUG] Enhanced Word Game initialized');
    this.route.queryParams.subscribe(params => {
      this.currentMode   = params['mode']   || '';
      this.currentModule = params['module'] || '';
      this.initializeGame();
    });
  }

  ngOnDestroy() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
  }

  private initializeGame() {
    this.resetGame();
    this.setupProgressCheckpoints();
    this.loadGameResources();
  }

  private loadGameResources() {
    this.gameLoading = true;
    this.loadingText = 'جاري تحميل الأسئلة...';
    
    // Simulate loading with progress
    const loadingInterval = setInterval(() => {
      this.loadingProgress += 10;
      
      if (this.loadingProgress === 30) {
        this.loadingText = 'إعداد الشخصيات...';
      } else if (this.loadingProgress === 60) {
        this.loadingText = 'تحضير المؤثرات...';
      } else if (this.loadingProgress === 90) {
        this.loadingText = 'اللمسات الأخيرة...';
      }
      
      if (this.loadingProgress >= 100) {
        clearInterval(loadingInterval);
        this.gameLoading = false;
        this.gameStatus = 'جاهز للبدء!';
        // Do NOT auto-load static quiz. Wait for user to select difficulty and click start.
      }
    }, 200);
  }

  private resetGame() {
    this.messages = [];
    this.inQuiz = false;
    this.quizFinished = false;
    this.gameFinished = false;
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.dinoPosition = 0;
    this.gameProgressPercent = 0;
    this.feedbackMessage = '';
    this.avatarMessage = '';
    this.dinoMessage = '';
    this.showSparkles = false;
    this.showConfetti = false;
    this.showStarBurst = false;
    this.totalQuestions = 0;
    this.currentCombo = 0;
    this.maxComboReached = 0;
    this.currentLives = 3;
    this.answerLocked = false;
    this.lastAnswerCorrect = false;
    this.newAchievements = [];
    this.resetTimer();
    
    // Reset hint system
    this.hintActive = false;
    this.correctAnswerIndex = -1;
    
    let greeting = 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟';
    if (this.currentMode === 'summary') {
      greeting = 'مرحباً! أنا هنا لمساعدتك في الحصول على ملخص للدروس.';
    } else if (this.currentMode === 'quiz') {
      greeting = '🎮 اختر مستوى التحدي وابدأ المغامرة!';
    }
    
    this.messages.push({ text: greeting, isUser: false });
  }

  // Difficulty Management
  setDifficulty(difficulty: 'easy' | 'normal' | 'expert') {
    this.selectedDifficulty = difficulty;
    this.updateGameSettings();
  }

  private updateGameSettings() {
    if (!this.selectedDifficulty) return;
    
    switch (this.selectedDifficulty) {
      case 'easy':
        this.timeLeft = 45;
        this.currentLives = 5;
        this.lives = [1, 2, 3, 4, 5];
        break;
      case 'normal':
        this.timeLeft = 30;
        this.currentLives = 3;
        this.lives = [1, 2, 3];
        break;
      case 'expert':
        this.timeLeft = 20;
        this.currentLives = 2;
        this.lives = [1, 2];
        break;
    }
  }

  getDifficultyText(): string {
    switch (this.currentDifficulty) {
      case 'easy': return 'مبتدئ';
      case 'normal': return 'متوسط';
      case 'expert': return 'خبير';
      default: return 'متوسط';
    }
  }

  startGameWithDifficulty() {
    if (!this.selectedDifficulty) return;
    
    this.currentDifficulty = this.selectedDifficulty;
    this.updateGameSettings();
    this.loadQuizFromServer();
    this.avatarMessage = 'ممتاز! لنبدأ!';
    
    setTimeout(() => {
      this.avatarMessage = '';
    }, 2000);
  }

  private setupProgressCheckpoints() {
    this.progressCheckpoints = [
      { position: 0, icon: '🚀', reached: true, current: true },
      { position: 25, icon: '🌟', reached: false, current: false },
      { position: 50, icon: '💎', reached: false, current: false },
      { position: 75, icon: '👑', reached: false, current: false },
      { position: 100, icon: '🏆', reached: false, current: false }
    ];
    // Initialize checkpoint tracking array
    this.checkpointsReached = new Array(this.progressCheckpoints.length).fill(false);
    this.checkpointsReached[0] = true; // First checkpoint is always reached at start
  }

  private updateProgressCheckpoints() {
    const progress = this.gameProgressPercent;
    this.progressCheckpoints.forEach((checkpoint, index) => {
      const wasReached = checkpoint.reached;
      checkpoint.reached = progress >= checkpoint.position;
      checkpoint.current = progress >= checkpoint.position && 
                          (index === this.progressCheckpoints.length - 1 || 
                           progress < this.progressCheckpoints[index + 1].position);
      
      // Check if this is a new checkpoint reached
      if (checkpoint.reached && !this.checkpointsReached[index] && index > 0) {
        this.checkpointsReached[index] = true;
        this.showPowerupNotification(index);
      }
    });
  }

  sendQuickResponse(text: string) {
    this.messages.push({ text, isUser: true });
    this.isLoading = true;

    if (this.currentMode === 'quiz' && text === 'ابدأ الاختبار') {
      this.loadQuizFromServer();
    } else {
      setTimeout(() => {
        const replies = {
          summary: 'سأقوم بتحضير ملخص مفيد لهذا الدرس. هل هناك نقاط معينة تريد التركيز عليها؟',
          general: 'سأحاول مساعدتك في هذا السؤال. هل يمكنك توضيح المزيد؟',
          default: 'أنا أفهم سؤالك. سأقوم بمساعدتك في أقرب وقت ممكن.'
        };
        const reply = replies[this.currentMode as 'summary'|'general'] || replies.default;
        this.messages.push({ text: reply, isUser: false });
        this.isLoading = false;
      }, 1500);
    }
  }

  private loadQuizFromServer() {
    console.log('[DEBUG] Loading static quiz data');
    
    // Load static quiz data directly
    setTimeout(() => {
      this.loadFallbackQuestions();
    }, 500);
  }

  private loadFallbackQuestions() {
    console.log('[DEBUG] Loading static questions');
    this.questions = [
      {
        q: "ما عاصمة تونس؟",
        options: ["تونس", "سوسة", "بنزرت", "نابل"],
        a: "تونس",
        type: "mc"
      },
      {
        q: "هل البحر الأبيض المتوسط يحد تونس من الشمال؟",
        options: ["صح", "خطأ"],
        a: "صح",
        type: "tf"
      },
      {
        q: "كم عدد الولايات في تونس؟",
        options: ["24", "23", "25", "22"],
        a: "24",
        type: "mc"
      },
      {
        q: "ما هي أكبر جامعة في تونس؟",
        options: ["جامعة تونس", "جامعة قرطاج", "جامعة منوبة", "جامعة سوسة"],
        a: "جامعة تونس",
        type: "mc"
      },
      {
        q: "هل تونس دولة عربية؟",
        options: ["صح", "خطأ"],
        a: "صح",
        type: "tf"
      },
      {
        q: "ما هي العملة الرسمية لتونس؟",
        options: ["الدينار التونسي", "الدرهم", "الريال", "الجنيه"],
        a: "الدينار التونسي",
        type: "mc"
      },
      {
        q: "ما هو اللون المميز في العلم التونسي؟",
        options: ["الأحمر", "الأزرق", "الأخضر", "الأصفر"],
        a: "الأحمر",
        type: "mc"
      },
      {
        q: "في أي قارة تقع تونس؟",
        options: ["أفريقيا", "آسيا", "أوروبا", "أمريكا"],
        a: "أفريقيا",
        type: "mc"
      },
      {
        q: "ما هو اسم الجبل الأعلى في تونس؟",
        options: ["جبل الشعانبي", "جبل السرج", "جبل زغوان", "جبل برقو"],
        a: "جبل الشعانبي",
        type: "mc"
      },
      {
        q: "ما هو البحر الذي يحد تونس من الشرق؟",
        options: ["البحر الأبيض المتوسط", "البحر الأحمر", "بحر العرب", "بحر قزوين"],
        a: "البحر الأبيض المتوسط",
        type: "mc"
      }
    ];
    
    this.totalQuestions = this.questions.length;
    this.inQuiz = true;
    this.gameStatus = 'في اللعب...';
    this.startTimer();
    this.showQuestion();
    this.isLoading = false;
    console.log('[DEBUG] Static quiz loaded:', this.questions.length, 'questions');
  }

  private showQuestion() {
    this.questionAnimating = true;
    this.answerLocked = false;
    
    const q = this.questions[this.currentQuestionIndex];
    this.messages.push({
      text: `سؤال ${this.currentQuestionIndex + 1}: ${q.q}`,
      isUser: false
    });

    // Reset question animation
    setTimeout(() => {
      this.questionAnimating = false;
    }, 500);
  }

  // Timer Management
  private startTimer() {
    this.resetTimer();
    this.gameTimer = setInterval(() => {
      this.timeLeft--;
      
      if (this.timeLeft <= 10) {
        // Warning state
      }
      
      if (this.timeLeft <= 0) {
        this.handleTimeOut();
      }
    }, 1000);
  }

  private resetTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    
    switch (this.currentDifficulty) {
      case 'easy': this.timeLeft = 45; break;
      case 'normal': this.timeLeft = 30; break;
      case 'expert': this.timeLeft = 20; break;
    }
  }

  private handleTimeOut() {
    this.answerLocked = true;
    this.currentLives--;
    this.currentCombo = 0;
    this.feedbackMessage = 'انتهى الوقت! 🕐';
    this.feedbackIcon = '⏰';
    this.feedbackClass = 'feedback-timeout';
    this.lastAnswerCorrect = false;
    
    if (this.currentLives <= 0) {
      this.gameOver();
    } else {
      this.moveToNextQuestion();
    }
  }

  // Answer Handling
  answerQuestion(option: string) {
    if (this.answerLocked) return;
    
    this.answerLocked = true;
    this.messages.push({ text: option, isUser: true });
    this.isLoading = true;

    setTimeout(() => {
      const q = this.questions[this.currentQuestionIndex];
      const isCorrect = (option === q.a);
      this.lastAnswerCorrect = isCorrect;

      if (isCorrect) {
        this.handleCorrectAnswer();
      } else {
        this.handleIncorrectAnswer(q.a);
      }

      this.updateGameProgress();
      this.isLoading = false;

      setTimeout(() => {
        if (this.currentQuestionIndex < this.questions.length - 1) {
          this.moveToNextQuestion();
        } else {
          this.finishGame();
        }
      }, 2000);
    }, 1000);
  }

  private handleCorrectAnswer() {
    this.score++;
    this.currentCombo++;
    this.experience += 10 + (this.currentCombo * 2);
    
    if (this.currentCombo > this.maxComboReached) {
      this.maxComboReached = this.currentCombo;
    }

    // Enhanced feedback
    this.feedbackMessage = this.getCorrectAnswerMessage();
    this.feedbackIcon = '✅';
    this.feedbackClass = 'feedback-correct';
    this.showSparkles = true;
    this.animateScore();
    
    // Special effects for combos
    if (this.currentCombo >= 3) {
      this.showStarBurst = true;
      this.dinoMessage = 'رائع! 🔥';
      setTimeout(() => {
        this.showStarBurst = false;
        this.dinoMessage = '';
      }, 2000);
    }

    // Check achievements
    this.checkAchievements();

    this.messages.push({
      text: '✔ إجابة صحيحة! ' + (this.currentCombo > 1 ? `متتالية × ${this.currentCombo}` : ''),
      isUser: false
    });
  }

  private handleIncorrectAnswer(correctAnswer: string) {
    this.currentCombo = 0;
    this.currentLives--;
    
    this.feedbackMessage = 'أوه! حاول مرة أخرى 💪';
    this.feedbackIcon = '❌';
    this.feedbackClass = 'feedback-incorrect';
    this.showSparkles = false;

    if (this.currentLives <= 0) {
      this.gameOver();
      return;
    }

    this.messages.push({
      text: `✘ إجابة خاطئة. الصحيح هو: ${correctAnswer}`,
      isUser: false
    });
  }

  private moveToNextQuestion() {
    this.currentQuestionIndex++;
    this.resetTimer();
    this.startTimer();
    this.showQuestion();
    this.clearFeedback();
    
    // Reset hint state
    this.hintActive = false;
    this.correctAnswerIndex = -1;
  }

  private clearFeedback() {
    setTimeout(() => {
      this.feedbackMessage = '';
      this.showSparkles = false;
    }, 2000);
  }

  // Game Progress
  private updateGameProgress() {
    if (this.totalQuestions > 0) {
      this.dinoPosition = ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;
      this.gameProgressPercent = this.dinoPosition;
      this.updateProgressCheckpoints();
    }
    
    // Update experience
    this.experiencePercent = (this.experience % this.experienceToNext) / this.experienceToNext * 100;
    if (this.experience >= this.experienceToNext) {
      this.levelUp();
    }
  }

  private levelUp() {
    this.currentLevel++;
    this.experience = 0;
    this.experienceToNext += 50;
    this.avatarMessage = `تهانينا! وصلت للمستوى ${this.currentLevel}! 🎉`;
    
    setTimeout(() => {
      this.avatarMessage = '';
    }, 3000);
  }

  // Game Completion
  private finishGame() {
    clearInterval(this.gameTimer);
    this.inQuiz = false;
    this.quizFinished = true;
    this.gameFinished = true;
    this.gameStatus = 'انتهت اللعبة!';

    let finalMessage = '';
    if (this.score >= (this.totalQuestions * 0.8)) {
      finalMessage = `مذهل! حصلت على ${this.score} من ${this.totalQuestions} نقاط! �`;
      this.showConfetti = true;
      this.triggerConfetti();
    } else if (this.score >= (this.totalQuestions * 0.5)) {
      finalMessage = `عمل جيد! حصلت على ${this.score} من ${this.totalQuestions} نقاط! 👏`;
    } else {
      finalMessage = `استمر في التعلم! حصلت على ${this.score} من ${this.totalQuestions} نقاط. �`;
    }

    this.messages.push({
      text: finalMessage,
      isUser: false
    });

    this.checkFinalAchievements();
  }

  private gameOver() {
    clearInterval(this.gameTimer);
    this.gameFinished = true;
    this.gameStatus = 'انتهت المحاولات!';
    
    this.messages.push({
      text: `انتهت المحاولات! حصلت على ${this.score} من ${this.currentQuestionIndex + 1} نقاط.`,
      isUser: false
    });
  }

  // Power-ups
  usePowerup(powerup: PowerUp) {
    if (!powerup.available || powerup.count <= 0) return;

    powerup.count--;
    if (powerup.count <= 0) powerup.available = false;

    switch (powerup.id) {
      case 'hint':
        this.showHint();
        break;
      case 'skip':
        this.skipQuestion();
        break;
      case 'freeze':
        this.freezeTime();
        break;
    }
  }

  private showHint() {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (!currentQuestion || !currentQuestion.options) return;

    // Find the correct answer index
    this.correctAnswerIndex = currentQuestion.options.findIndex(option => option === currentQuestion.a);
    
    // Activate hint mode
    this.hintActive = true;
    
    // Show hint message
    this.avatarMessage = 'تلميح: الإجابة الصحيحة أصبحت حمراء! 💡🔴';
    
    // Auto-hide hint after 5 seconds
    setTimeout(() => {
      this.avatarMessage = '';
      this.hintActive = false;
      this.correctAnswerIndex = -1;
    }, 5000);
  }

  skipQuestion() {
    if (this.skipsUsed >= this.maxSkips) return;
    
    this.skipsUsed++;
    this.currentQuestionIndex++;
    this.updateGameProgress();
    
    if (this.currentQuestionIndex < this.questions.length) {
      this.showQuestion();
    } else {
      this.finishGame();
    }
  }

  private freezeTime() {
    clearInterval(this.gameTimer);
    this.avatarMessage = 'الوقت متجمد لـ 10 ثوانِ! ❄️';
    
    setTimeout(() => {
      this.startTimer();
      this.avatarMessage = '';
    }, 10000);
  }

  // UI Helper Methods
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  onOptionHover(index: number) {
    // Add hover effects or sounds here
  }

  getCorrectAnswerMessage(): string {
    const messages = [
      'ممتاز! 🌟',
      'رائع جداً! ⭐',
      'عمل مثالي! 💎',
      'بطولي! 🏆',
      'مدهش! ✨'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  getAccuracyPercent(): number {
    if (this.currentQuestionIndex === 0) return 0;
    return Math.round((this.score / (this.currentQuestionIndex + 1)) * 100);
  }

  getPerformanceClass(): string {
    const accuracy = this.getAccuracyPercent();
    if (accuracy >= 90) return 'performance-excellent';
    if (accuracy >= 70) return 'performance-good';
    if (accuracy >= 50) return 'performance-average';
    return 'performance-needs-improvement';
  }

  getPerformanceIcon(): string {
    const accuracy = this.getAccuracyPercent();
    if (accuracy >= 90) return '🏆';
    if (accuracy >= 70) return '⭐';
    if (accuracy >= 50) return '👍';
    return '💪';
  }

  getFinalMessage(): string {
    const accuracy = this.getAccuracyPercent();
    if (accuracy >= 90) return 'أداء استثنائي! أنت نجم حقيقي! 🌟';
    if (accuracy >= 70) return 'عمل رائع! تحسن مستمر! 📈';
    if (accuracy >= 50) return 'بداية جيدة! استمر في التعلم! 📚';
    return 'لا تستسلم! كل محاولة تقربك من النجاح! 💪';
  }

  // Animation Methods
  private animateScore() {
    this.scoreAnimating = true;
    setTimeout(() => {
      this.scoreAnimating = false;
    }, 600);
  }

  private triggerConfetti() {
    this.confettiParticles = [];
    const colors = ['#FFD1E3', '#FFFAB7', '#5BBCFF', '#7EA1FF'];
    
    for (let i = 0; i < 50; i++) {
      this.confettiParticles.push({
        x: Math.random() * window.innerWidth,
        y: 0,
        delay: Math.random() * 3000,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    setTimeout(() => {
      this.showConfetti = false;
      this.confettiParticles = [];
    }, 5000);
  }

  // Achievement System
  private checkAchievements() {
    // First correct answer
    if (this.score === 1 && !this.achievements[0].unlocked) {
      this.unlockAchievement('first_correct');
    }
    
    // Combo achievements
    if (this.currentCombo === 3 && !this.achievements[1].unlocked) {
      this.unlockAchievement('combo_3');
    }
  }

  private checkFinalAchievements() {
    // Perfect score
    if (this.score === this.totalQuestions && !this.achievements[2].unlocked) {
      this.unlockAchievement('perfect_score');
    }
    
    // Expert difficulty completion
    if (this.currentDifficulty === 'expert' && this.score >= this.totalQuestions * 0.7) {
      this.unlockAchievement('expert_player');
    }
  }

  private unlockAchievement(achievementId: string) {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.unlockedAchievements.push(achievement);
      this.newAchievements.push(achievement);
      
      this.avatarMessage = `🏆 إنجاز جديد: ${achievement.name}!`;
      setTimeout(() => this.avatarMessage = '', 4000);
    }
  }

  // Game Actions
  restartGame() {
    this.resetGame();
    this.newAchievements = [];
  }

  changeDifficulty() {
    this.selectedDifficulty = null;
    this.resetGame();
  }

  shareScore() {
    const text = `حصلت على ${this.score} من ${this.totalQuestions} في مغامرة ديناصور الكلمات! 🎮`;
    
    if (navigator.share) {
      navigator.share({
        title: 'نتيجتي في مغامرة الكلمات',
        text: text,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(text).then(() => {
        this.avatarMessage = 'تم نسخ النتيجة! 📋';
        setTimeout(() => this.avatarMessage = '', 2000);
      });
    }
  }

  // Powerup Notification System
  private showPowerupNotification(checkpointIndex: number) {
    // Define powerups available at each checkpoint
    const checkpointPowerups = [
      null, // No powerup for first checkpoint (starting position)
      { id: 'hint', name: 'تلميح ذكي', icon: '💡', count: 1, available: true, description: 'يعطيك تلميح مفيد للسؤال الحالي' },
      { id: 'freeze', name: 'تجميد الوقت', icon: '❄️', count: 1, available: true, description: 'يوقف العداد الزمني لمدة 10 ثواني' },
      { id: 'skip', name: 'تخطي السؤال', icon: '⏭️', count: 1, available: true, description: 'يتيح لك تخطي السؤال الصعب' },
      { id: 'bonus', name: 'نقاط إضافية', icon: '🌟', count: 1, available: true, description: 'يضاعف نقاط الأسئلة القادمة' }
    ];

    const powerup = checkpointPowerups[checkpointIndex];
    if (!powerup) return;

    // Add the powerup to available powerups or increase count if exists
    const existingPowerup = this.availablePowerups.find(p => p.id === powerup.id);
    if (existingPowerup) {
      existingPowerup.count++;
      existingPowerup.available = true;
    } else {
      this.availablePowerups.push({ ...powerup });
    }

    // Show notification
    this.powerupNotification = {
      powerup: powerup,
      visible: true,
      message: `🎉 تهانينا! لقد وصلت إلى نقطة تفتيش وحصلت على: ${powerup.name}`
    };

    // Hide notification after 4 seconds
    setTimeout(() => {
      this.powerupNotification.visible = false;
    }, 4000);

    // Show confetti effect
    this.showConfetti = true;
    setTimeout(() => this.showConfetti = false, 2000);
  }

  // Method to dismiss notification manually
  dismissPowerupNotification() {
    this.powerupNotification.visible = false;
  }

  // Getter for current question to prevent template errors
  get currentQuestion() {
    return this.questions && this.questions.length > 0 && this.currentQuestionIndex >= 0 && this.currentQuestionIndex < this.questions.length 
      ? this.questions[this.currentQuestionIndex] 
      : null;
  }
}

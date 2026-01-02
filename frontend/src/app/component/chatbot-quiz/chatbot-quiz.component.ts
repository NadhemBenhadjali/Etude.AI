import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {AvatarComponent} from "../../shared/avatar/avatar.component";
import {QuizService} from '../../services/quiz.service';
import {QuizQuestion} from '../../model/quiz.model';
import {AiService} from '../../services/ai.service';
import {GamificationService} from '../../services/gamification.service';
import {UserService} from '../../services/user.service';
import {ToastService} from '../../services/toast.service';
import {QuizElementDTO} from '../../model/quiz.model';
import {SessionDTO, SessionType, SessionUpdateDTO} from '../../model/session.model';
import {firstValueFrom} from 'rxjs';
import {SessionStateService} from '../../services/session-state.service';
import {Achievement,PowerUp,Checkpoint,Particle,PowerupNotification} from '../../model/gamification.model';



@Component({
  selector: 'app-chatbot-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AvatarComponent],
  templateUrl: './chatbot-quiz.component.html',
  styleUrls: ['./chatbot-quiz.component.css']
})
export class ChatbotQuizComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public router = inject(Router); // Made public for template
  private quizService = inject(QuizService);
  private aiService = inject(AiService);
  private gamificationService = inject(GamificationService);
  private userService = inject(UserService);
  private sessionStateService: SessionStateService = inject(SessionStateService);
  private toastService = inject(ToastService);

  messages: { text: string; isUser: boolean }[] = [];
  isLoading = false;

  // Session tracking for planned sessions
  private sessionId: string | null = null;

  // Game State
  currentMode = '';
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
  checkpointsReached: boolean[] = [];

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


  ngOnInit() {
    // Extract sessionId from navigation state (for planned sessions)
    const navState = (this.router.getCurrentNavigation()?.extras.state || history.state) as any;
    if (navState?.sessionId) {
      this.sessionId = navState.sessionId;
      console.log('📌 Quiz Session ID from planned session:', this.sessionId);
    }

    this.route.queryParams.subscribe(params => {
      this.currentMode = params['mode'] || '';
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

    const loadingInterval = setInterval(() => {
      this.loadingProgress += 10;
      if (this.loadingProgress === 30) this.loadingText = 'إعداد الشخصيات...';
      else if (this.loadingProgress === 60) this.loadingText = 'تحضير المؤثرات...';
      else if (this.loadingProgress === 90) this.loadingText = 'اللمسات الأخيرة...';

      if (this.loadingProgress >= 100) {
        clearInterval(loadingInterval);
        this.gameLoading = false;
        this.gameStatus = 'جاهز للبدء!';
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

  get currentQuestion(): QuizQuestion | undefined {
    return this.questions[this.currentQuestionIndex];
  }

  // --- Template Helper Methods ---

  onOptionHover(index: number) {
    // Optional sound or visual effect
  }

  getAccuracyPercent(): number {
    return this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0;
  }

  getPerformanceClass(): string {
    const percent = this.getAccuracyPercent();
    if (percent >= 90) return 'excellent';
    if (percent >= 70) return 'good';
    return 'needs-improvement';
  }

  getPerformanceIcon(): string {
    const percent = this.getAccuracyPercent();
    if (percent >= 90) return '🏆';
    if (percent >= 70) return '🌟';
    return '📚';
  }

  getFinalMessage(): string {
    const percent = this.getAccuracyPercent();
    if (percent >= 90) return 'أداء أسطوري! أنت بطل حقيقي!';
    if (percent >= 70) return 'عمل رائع! استمر في التقدم.';
    return 'بداية جيدة، ولكن يمكنك تحقيق الأفضل!';
  }

  dismissPowerupNotification() {
    this.powerupNotification.visible = false;
  }

  restartGame() {
    this.initializeGame();
  }

  shareScore() {
    this.avatarMessage = 'تم نسخ النتيجة!';
    setTimeout(() => this.avatarMessage = '', 2000);
  }

  changeDifficulty() {
    this.gameFinished = false;
    this.inQuiz = false;
    this.selectedDifficulty = null;
    this.score = 0;
    this.messages = [];
  }

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
    this.checkpointsReached = new Array(this.progressCheckpoints.length).fill(false);
    this.checkpointsReached[0] = true;
  }

  private updateProgressCheckpoints() {
    const progress = this.gameProgressPercent;
    this.progressCheckpoints.forEach((checkpoint, index) => {
      checkpoint.reached = progress >= checkpoint.position;
      checkpoint.current = progress >= checkpoint.position &&
        (index === this.progressCheckpoints.length - 1 ||
          progress < this.progressCheckpoints[index + 1].position);

      if (checkpoint.reached && !this.checkpointsReached[index] && index > 0) {
        this.checkpointsReached[index] = true;
        this.showPowerupNotification(index);
      }
    });
  }

  private showPowerupNotification(checkpointIndex: number) {
    const messages = ['', 'بداية رائعة!', 'منتصف الطريق!', 'اقتربت من القمة!', 'مبروك!'];
    if (checkpointIndex > 0 && checkpointIndex < messages.length) {
      this.avatarMessage = messages[checkpointIndex];
      this.showSparkles = true;
      setTimeout(() => { this.showSparkles = false; this.avatarMessage = ''; }, 3000);
    }
  }

  async sendQuickResponse(text: string) {
    this.messages.push({ text: text, isUser: true });

    if (this.currentMode === 'summary') {
      try {
        const response: any = await firstValueFrom(this.aiService.generateSummary(text, this.currentModule || 'General'));
        this.messages.push({ text: response.summary || response.response || 'Summary generated.', isUser: false });
      } catch (err) {
        this.messages.push({ text: 'عذراً، حدث خطأ.', isUser: false });
      }
    } else if (text.includes('ابدأ') || text.includes('جاهز')) {
      if (!this.inQuiz) {
        this.messages.push({ text: 'الرجاء اختيار مستوى الصعوبة.', isUser: false });
      }
    } else {
      try {
        const response: any = await firstValueFrom(this.aiService.askQuestion(text));
        this.messages.push({ text: response.answer || 'I am not sure.', isUser: false });
      } catch (err) {
        this.messages.push({ text: 'Error connecting to AI.', isUser: false });
      }
    }
  }

  async loadQuizFromServer() {
    try {
      this.isLoading = true;
      this.gameStatus = 'جاري تحميل الأسئلة من الخادم...';

      console.log('🎯 Loading quiz from backend:', {
        module: this.currentModule,
        difficulty: this.currentDifficulty,
        num_mc: 5,
        num_tf: 5
      });

      const response: any = await firstValueFrom(
        this.aiService.generateQuiz(this.currentModule, 5, 5)
      );

      console.log('📦 Raw response from backend:', response);

      // Handle different possible response formats
      let questionsList: any[] = [];

      if (response && Array.isArray(response)) {
        // Response is directly an array of questions
        questionsList = response;
      } else if (response && response.questions && Array.isArray(response.questions)) {
        // Response has a questions property
        questionsList = response.questions;
      } else if (response && response.data && response.data.questions && Array.isArray(response.data.questions)) {
        // Response has nested data.questions property
        questionsList = response.data.questions;
      } else {
        console.error('❌ Unexpected response format:', response);
        throw new Error('Invalid quiz format received from backend');
      }

      if (questionsList.length === 0) {
        throw new Error('No questions received from backend');
      }

      // Map the questions to the correct format
      this.questions = questionsList.map((q: any, index: number) => {
        console.log(`📝 Question ${index + 1}:`, q);

        return {
          q: q.q || q.question || q.text || '',
          options: q.options || q.choices || [],
          a: q.a || q.answer || q.correctAnswer || q.correct_answer || '',
          type: this.normalizeQuestionType(q.type)
        };
      });

      console.log('✅ Processed questions:', this.questions);

      this.totalQuestions = this.questions.length;
      this.gameStatus = 'جاري اللعب';
      this.inQuiz = true;
      this.currentQuestionIndex = 0;
      this.score = 0;
      this.showQuestion();

      console.log(`🎮 Quiz loaded successfully: ${this.questions.length} questions`);
    } catch (err: any) {
      console.error('❌ Failed to load quiz from backend:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });

      this.gameStatus = 'فشل تحميل الأسئلة من الخادم';
      this.messages.push({
        text: '⚠️ عذراً، حدث خطأ في تحميل الأسئلة من الخادم. جاري استخدام أسئلة احتياطية...',
        isUser: false
      });

      // Fallback to static questions
      this.loadFallbackQuestions();
    } finally {
      this.isLoading = false;
    }
  }

  private normalizeQuestionType(type: string): 'mc' | 'tf' {
    if (!type) return 'mc';

    const normalizedType = type.toLowerCase().trim();

    if (normalizedType === 'tf' ||
      normalizedType === 'true-false' ||
      normalizedType === 'true_false' ||
      normalizedType === 'boolean') {
      return 'tf';
    }

    return 'mc';
  }

  loadFallbackQuestions() {
    // These are the rich Arabic questions from your friend's code
    this.questions = [
      {
        q: "ما هو العضو الذي يتنفس به السمك؟",
        options: ["الخياشيم", "الرئتان", "الجلد", "الفم"],
        a: "الخياشيم",
        type: "mc"
      },
      {
        q: "هل يتنفس الإنسان عن طريق الرئتين؟",
        options: ["صح", "خطأ"],
        a: "صح",
        type: "tf"
      },
      {
        q: "أي حيوان يتنفس عبر الجلد؟",
        options: ["الضفدع", "الأسد", "الطائر", "القط"],
        a: "الضفدع",
        type: "mc"
      },
      {
        q: "ما هو الغاز الضروري للتنفس عند الحيوانات؟",
        options: ["الأكسجين", "الهيدروجين", "النيتروجين", "ثاني أكسيد الكربون"],
        a: "الأكسجين",
        type: "mc"
      },
      {
        q: "هل تتنفس الحشرات بواسطة أنابيب صغيرة (قصبات هوائية)؟",
        options: ["صح", "خطأ"],
        a: "صح",
        type: "tf"
      },
      {
        q: "أي من هذه الكائنات يتنفس بالرئتين؟",
        options: ["الإنسان", "السمكة", "الحلزون البحري", "قنديل البحر"],
        a: "الإنسان",
        type: "mc"
      },
      {
        q: "كيف يتنفس الطائر؟",
        options: ["الرئتان", "الخياشيم", "الجلد", "المسلّات"],
        a: "الرئتان",
        type: "mc"
      },
      {
        q: "أين تعيش الحيوانات التي تتنفس بالخياشيم؟",
        options: ["في الماء", "في البرّ", "في الهواء", "في الجبال"],
        a: "في الماء",
        type: "mc"
      },
      {
        q: "هل يحتاج الحيوان إلى الأكسجين ليعيش؟",
        options: ["نعم", "لا"],
        a: "نعم",
        type: "tf"
      },
      {
        q: "أي من هذه الحيوانات يتنفس عن طريق القصبات الهوائية؟",
        options: ["النملة", "الطائر", "الضفدع", "الإنسان"],
        a: "النملة",
        type: "mc"
      }
    ];
    this.totalQuestions = this.questions.length;
    this.inQuiz = true;
    this.startTimer();
  }

  showQuestion() {
    this.answerLocked = false;
    this.feedbackMessage = '';
    this.resetTimer();
    this.startTimer();
    this.gameProgressPercent = (this.currentQuestionIndex / this.totalQuestions) * 100;
    this.dinoPosition = this.gameProgressPercent;
    this.updateProgressCheckpoints();
  }

  startTimer() {
    this.resetTimer();
    this.gameTimer = setInterval(() => {
      if (this.timeLeft > 0 && !this.answerLocked && !this.gameFinished) {
        this.timeLeft--;
      } else if (this.timeLeft === 0 && !this.answerLocked && !this.gameFinished) {
        this.handleTimeOut();
      }
    }, 1000);
  }

  resetTimer() {
    if (this.gameTimer) clearInterval(this.gameTimer);
    switch (this.currentDifficulty) {
      case 'easy': this.timeLeft = 45; break;
      case 'expert': this.timeLeft = 20; break;
      default: this.timeLeft = 30; break;
    }
  }

  handleTimeOut() {
    this.answerLocked = true;
    this.currentLives--;
    this.lives.pop();
    this.feedbackMessage = 'انتهى الوقت! ⏰';
    this.feedbackClass = 'error';
    this.currentCombo = 0;
    if (this.currentLives <= 0) setTimeout(() => this.finishGame(), 2000);
    else setTimeout(() => this.moveToNextQuestion(), 2000);
  }

  answerQuestion(option: string) {
    if (this.answerLocked) return;
    this.answerLocked = true;
    clearInterval(this.gameTimer);

    const q = this.questions[this.currentQuestionIndex];
    q.userAnswer = option;
    q.answered = true;

    if (option === q.a) {
      this.handleCorrectAnswer();
    } else {
      this.handleIncorrectAnswer(option, q.a);
    }
  }

  handleCorrectAnswer() {
    this.score++;
    this.currentCombo++;
    if (this.currentCombo > this.maxComboReached) this.maxComboReached = this.currentCombo;
    this.feedbackMessage = 'إجابة صحيحة! 🎉';
    this.feedbackClass = 'success';
    this.lastAnswerCorrect = true;

    // Friend feature: Push chat message on correct answer
    this.messages.push({
      text: '✔ إجابة صحيحة! ' + (this.currentCombo > 1 ? `متتالية × ${this.currentCombo}` : ''),
      isUser: false
    });

    if (this.currentCombo >= 3) {
      this.feedbackMessage += ' 🔥 Combo x' + this.currentCombo;
      this.showConfetti = true;
      setTimeout(() => this.showConfetti = false, 2000);
    }
    this.experience += 10 + (this.currentCombo * 2);
    if (this.experience >= this.experienceToNext) this.levelUp();
    setTimeout(() => this.moveToNextQuestion(), 1500);
  }

  levelUp() {
    this.currentLevel++;
    this.experience = 0;
    this.experienceToNext = Math.floor(this.experienceToNext * 1.5);
    this.powerupNotification.visible = true;
    this.availablePowerups[0].count++;
  }

  finishGame() {
    this.inQuiz = false;
    this.quizFinished = true;
    this.gameFinished = true;
    clearInterval(this.gameTimer);
    this.gameProgressPercent = 100;

    this.messages.push({
      text: `انتهت اللعبة! نتيجتك: ${this.score}/${this.totalQuestions}.`,
      isUser: false
    });

    this.gamificationService.submitQuizResult(this.score, this.totalQuestions, this.currentModule || 'General')
      .subscribe({
        next: () => console.log('Score submitted'),
        error: (err) => console.error('Error submitting score:', err)
      });

    this.saveSessionToServer();
    this.checkFinalAchievements();
  }

  saveSessionToServer() {
    // Get the saved session state
    const sessionState = this.sessionStateService.getState();
    const level = sessionState?.selectedLevel || 'FIRST';
    const subject = sessionState?.selectedSubject || 'General';
    const module = sessionState?.selectedModule || this.currentModule || 'General';

    // 1. Convert QuizQuestions to QuizElementDTOs
    const quizElements: QuizElementDTO[] = this.questions.map(q => ({
      quizType: (q.type === 'mc' ? 'MULTIPLE_CHOICE' : 'TRUE_FALSE') as any,
      question: q.q,
      options: q.options || [],
      answer: q.a,
      answered: !!q.answered
    }));

    // If we have a sessionId from a planned session, update the existing session
    if (this.sessionId) {
      const updateData: SessionUpdateDTO = {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        sessionType: SessionType.QUIZ,
        quizScore: this.score,
        quizPointsOfFocus: [],
        quizElements: quizElements
      };

      this.userService.updateSession(this.sessionId, updateData).subscribe({
        next: (res) => {
          console.log('Session updated successfully:', res);
          this.toastService.success('تم حفظ نتيجة الاختبار بنجاح! 🎉');
          this.avatarMessage = 'تم حفظ الجلسة بنجاح! 💾';
        },
        error: (err) => {
          console.error('Error updating session:', err);
          this.toastService.error('فشل حفظ نتيجة الاختبار ⚠️');
          this.avatarMessage = 'فشل حفظ الجلسة ⚠️';
        }
      });
    } else {
      // No sessionId - create a new session (ad-hoc quiz)
      const sessionDTO: SessionDTO = {
        id: crypto.randomUUID(),
        level: level,
        subject: subject,
        module: module,
        lesson: 'Quiz Session',
        status: 'COMPLETED',
        sessionType: SessionType.QUIZ,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        quizScore: this.score,
        quizPointsOfFocus: [],
        quizElements: quizElements
      };

      this.userService.saveSession(sessionDTO).subscribe({
        next: (res) => {
          console.log('Session saved successfully:', res);
          this.toastService.success('تم حفظ نتيجة الاختبار بنجاح! 🎉');
          this.avatarMessage = 'تم حفظ الجلسة بنجاح! 💾';
        },
        error: (err) => {
          console.error('Error saving session:', err);
          this.toastService.error('فشل حفظ نتيجة الاختبار ⚠️');
          this.avatarMessage = 'فشل حفظ الجلسة ⚠️';
        }
      });
    }
  }

  checkFinalAchievements() {
    if (this.score === this.totalQuestions) this.unlockAchievement('perfect_score');
    if (this.maxComboReached >= 3) this.unlockAchievement('combo_3');
    if (this.currentDifficulty === 'expert' && this.score > 0) this.unlockAchievement('expert_player');
    if (this.newAchievements.length > 0) {
      this.showStarBurst = true;
      this.avatarMessage = 'فتح إنجاز جديد! 🏆';
    }
  }

  unlockAchievement(id: string) {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.newAchievements.push(achievement);
      this.unlockedAchievements.push(achievement);
    }
  }

  handleIncorrectAnswer(option: string, correctAnswer: string) {
    this.currentCombo = 0;
    this.feedbackMessage = `خطأ! الإجابة الصحيحة هي: ${correctAnswer}`;
    this.feedbackClass = 'error';
    this.lastAnswerCorrect = false;
    this.currentLives--;
    this.lives.pop();
    if (this.currentLives <= 0) setTimeout(() => this.finishGame(), 2000);
    else setTimeout(() => this.moveToNextQuestion(), 2500);
  }

  moveToNextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.showQuestion();
    } else {
      this.finishGame();
    }
  }

  usePowerup(powerup: PowerUp) {
    if (powerup.count <= 0 || !powerup.available || this.answerLocked) return;
    powerup.count--;
    switch (powerup.id) {
      case 'hint': this.showHint(); break;
      case 'skip': this.skipQuestion(); break;
      case 'freeze': this.freezeTime(); break;
    }
    this.avatarMessage = 'تم تفعيل ' + powerup.name + '!';
    setTimeout(() => this.avatarMessage = '', 2000);
  }

  showHint() {
    const q = this.currentQuestion;
    if (!q || !q.options) return;
    this.feedbackMessage = '💡 تلميح: حاول التركيز!';
  }

  skipQuestion() {
    this.skipsUsed++;
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= this.questions.length) this.finishGame();
    else this.showQuestion();
  }

  freezeTime() {
    this.timeLeft += 10;
  }

  getOptionLetter(index: number): string {
    const letters = ['أ', 'ب', 'ج', 'د'];
    return letters[index] || '';
  }

  getLivesArray() {
    return new Array(this.currentLives).fill(0);
  }

  calculateProgress() {
    return (this.currentQuestionIndex / this.totalQuestions) * 100;
  }

  getAvatarExpression() {
    if (this.lastAnswerCorrect) return 'happy';
    if (this.currentLives <= 1) return 'worried';
    return 'neutral';
  }

  isCheckpointReached(index: number): boolean {
    return this.checkpointsReached[index];
  }
}

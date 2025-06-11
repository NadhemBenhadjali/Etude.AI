import { Component, OnInit }             from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { RouterModule, ActivatedRoute }  from '@angular/router';
import { FormsModule }                   from '@angular/forms';
import { HttpClientModule, HttpClient,
         HttpErrorResponse }             from '@angular/common/http';
import { environment}                    from '../../../environments/environment';
import { AvatarComponent } from "../../shared/avatar/avatar.component";
interface QuizQuestion {
  type:    'mc' | 'tf';
  q:       string;
  options?: string[];
  a:       string;
}

@Component({
  selector: 'app-chatbot-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, AvatarComponent],
  templateUrl: './chatbot-quiz.component.html',
  styleUrls:   ['./chatbot-quiz.component.css']
})
export class ChatbotQuizComponent implements OnInit {
  messages: { text: string; isUser: boolean }[] = [];
  isLoading = false;

  currentMode   = '';    // 'quiz', 'summary', or 'general'
  currentModule = '';

  questions: QuizQuestion[] = [];
  currentQuestionIndex = 0;
  score                = 0;
  inQuiz               = false;
  quizFinished         = false;  // ← new

  private readonly API_URL = environment.apiBase;
  constructor(
    private route: ActivatedRoute,
    private http:  HttpClient
  ) {}

  ngOnInit() {
    console.log('[DEBUG] Using API_URL =', this.API_URL);

    this.route.queryParams.subscribe(params => {
      this.currentMode   = params['mode']   || '';
      this.currentModule = params['module'] || '';
      this.resetChat();
    });
  }

  private resetChat() {
    this.messages = [];
    this.inQuiz   = false;
    this.quizFinished = false;   // reset
    this.score    = 0;
    this.currentQuestionIndex = 0;

    let greeting = 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟';
    if (this.currentMode === 'summary') {
      greeting = 'مرحباً! أنا هنا لمساعدتك في الحصول على ملخص للدروس. ما هو الدرس الذي تريد ملخصه؟';
    } else if (this.currentMode === 'quiz') {
      greeting = '🔢 اضغط على "ابدأ الاختبار" عندما تكون مستعدًا.';
    }

    this.messages.push({ text: greeting, isUser: false });
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
    const payload = {
      module: this.currentModule,
      num_mc: 6,
      num_tf: 4
    };
    console.log('[DEBUG] POSTing to', `${this.API_URL}/quiz`, 'payload:', payload);

    this.http.post<{ module: string; data: { questions: QuizQuestion[] } }>(
      `${this.API_URL}/quiz`,
      payload
    ).subscribe({
      next: payload => {
        this.questions = payload.data.questions;
        this.inQuiz    = true;
        this.showQuestion();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('[ERROR] Quiz load failed:', err);
        this.messages.push({
          text: '⚠️ لم نتمكن من جلب الأسئلة من الخادم. حاول مرة أخرى لاحقًا.',
          isUser: false
        });
        this.isLoading = false;
      }
    });
  }

  private showQuestion() {
    const q = this.questions[this.currentQuestionIndex];
    this.messages.push({
      text: `سؤال ${this.currentQuestionIndex + 1}: ${q.q}`,
      isUser: false
    });
  }

  answerQuestion(option: string) {
    this.messages.push({ text: option, isUser: true });
    this.isLoading = true;

    setTimeout(() => {
      const q = this.questions[this.currentQuestionIndex];
      this.messages.push({
        text: option === q.a
          ? '✔ إجابة صحيحة!'
          : `✘ إجابة خاطئة. الصحيح هو: ${q.a}`,
        isUser: false
      });

      if (option === q.a) this.score++;
      this.currentQuestionIndex++;
      this.isLoading = false;

      if (this.currentQuestionIndex < this.questions.length) {
        this.showQuestion();
      } else {
        this.finishQuiz();  // ← kicks off quizFinished = true
      }
    }, 1000);
  }

  private finishQuiz() {
    this.inQuiz = false;
    this.quizFinished = true;   // ← show كملنا
    this.messages.push({
      text: `🏁 انتهى الاختبار! نتيجتك: ${this.score} من ${this.questions.length}`,
      isUser: false
    });
  }
}

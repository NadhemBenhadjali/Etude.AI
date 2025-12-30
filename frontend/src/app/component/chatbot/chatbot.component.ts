import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { UserService, SessionDTO, QnAElementDTO, SessionType } from '../../services/user.service';
import { AvatarComponent } from "../../shared/avatar/avatar.component";
import { firstValueFrom } from 'rxjs';
import {SessionStateService} from '../../services/session-state.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AvatarComponent],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  messages: { text: string; isUser: boolean }[] = [];
  userInput = '';
  isLoading = false;
  currentMode = '';
  private storageKey = 'chatbot_messages';


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private aiService: AiService,
    private userService: UserService,
      private sessionStateService: SessionStateService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentMode = params['mode'] || '';
      this.loadMessages();
      if (this.messages.length === 0) {
        this.initializeChat();
      }
    });
  }

  private getStorageKey(): string {
    return `${this.storageKey}_${this.currentMode || 'default'}`;
  }

  private saveMessages() {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.messages));
    } catch (e) {
      console.error('Failed to save messages to localStorage', e);
    }
  }

  private loadMessages() {
    try {
      const saved = localStorage.getItem(this.getStorageKey());
      if (saved) {
        this.messages = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load messages from localStorage', e);
      this.messages = [];
    }
  }

  initializeChat() {
    this.messages = [];
    let greeting = 'أهلاً! أنا المساعد الذكي متاعك. كيفاش نجم نعاونك اليوم؟';

    if (this.currentMode === 'summary') {
      greeting = 'أهلاً! أنا هنا باش نعاونك باش تلخّص الدروس. آشمن درس تحب عليه ملخص؟';
    } else if (this.currentMode === 'quiz') {
      greeting = 'أهلاً! أنا هنا باش نعاونك باش تختبر معلوماتك. حاضر باش تبدا؟';
    } else if (this.currentMode === 'general') {
      greeting = 'أهلاً! أنا هنا باش نجاوب على أسئلتك العامة. كيفاش نجم نعاونك اليوم؟';
    }

    this.messages.push({ text: greeting, isUser: false });
    this.saveMessages();
  }

  async sendMessage() {
    const txt = this.userInput.trim();
    if (!txt) return;

    this.messages.push({ text: txt, isUser: true });
    this.saveMessages();
    this.isLoading = true;
    this.userInput = '';

    try {
      let data: any;
      if (this.currentMode === 'summary') {
        data = await firstValueFrom(this.aiService.generateSummary('General', txt));
      } else {
        data = await firstValueFrom(this.aiService.askQuestion(txt));
      }

      let reply = '';
      if (this.currentMode === 'summary' && data.data?.slides) {
        reply = data.data.slides.map((s: any) => `• ${s.text}`).join('\n');
      } else if (this.currentMode !== 'summary' && data.answer) {
        reply = data.answer;
      } else {
        reply = JSON.stringify(data, null, 2);
      }

      reply = reply.replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\\n/g, '<br>')
        .replace(/"/g, '')
        .replace(/\\(.+?)\\/g, '<strong>$1</strong>');

      this.messages.push({ text: reply, isUser: false });
      this.saveMessages();

    } catch (err) {
      console.error(err);
      this.messages.push({
        text: '⚠️ حدث خطأ عند الاتصال بالخادم. حاول مرة أخرى.',
        isUser: false
      });
      this.saveMessages();
    } finally {
      this.isLoading = false;
    }
  }

  sendQuickResponse(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  saveSession() {
    if (this.messages.length === 0) return;

    // Get the saved session state
    const sessionState = this.sessionStateService.getState();
    const level = sessionState?.selectedLevel || 'FIRST';
    const subject = sessionState?.selectedSubject || 'General';
    const module = sessionState?.selectedModule || this.currentMode || 'General';

    // Convert pairs to QnA
    const qnaElements: QnAElementDTO[] = [];
    for (let i = 0; i < this.messages.length - 1; i++) {
      const msg = this.messages[i];
      const nextMsg = this.messages[i + 1];
      if (msg.isUser && !nextMsg.isUser) {
        qnaElements.push({
          question: msg.text,
          answer: nextMsg.text
        });
      }
    }

    // QNA session - only send relevant fields
    const sessionDTO: SessionDTO = {
      id: crypto.randomUUID(),
      level: level, // Use saved level from session state
      subject: subject, // Use saved subject from session state
      module: module, // Use saved module from session state
      lesson: 'Chat Session',
      status: 'COMPLETED',
      sessionType: SessionType.QNA, // REQUIRED: Set session type to QNA
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      qnaElements: qnaElements,
      // DON'T send quizElements, summaryElements, or other non-QNA fields
    };

    this.userService.saveSession(sessionDTO).subscribe({
      next: () => {
        // Clear the messages from localStorage so next conversation starts fresh
        localStorage.removeItem(this.getStorageKey());
        this.messages = [];
        alert('تم حفظ الجلسة بنجاح!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => console.error('Failed to save session', err)
    });
  }
}

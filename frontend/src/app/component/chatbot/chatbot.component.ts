import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { AvatarComponent } from "../../shared/avatar/avatar.component";
import { firstValueFrom } from 'rxjs';

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private aiService: AiService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentMode = params['mode'] || '';
      this.initializeChat();
    });
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
  }

  async sendMessage() {
    const txt = this.userInput.trim();
    if (!txt) return;

    this.messages.push({ text: txt, isUser: true });
    this.isLoading = true;
    this.userInput = '';

    try {
      let data: any;
      if (this.currentMode === 'summary') {
        // Assuming the user input is "Subject: Module" or just "Module"
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

      // Clean up formatting
      reply = reply.replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\\n/g, '<br>')
        .replace(/"/g, '')
        .replace(/\\(.+?)\\/g, '<strong>$1</strong>');

      this.messages.push({ text: reply, isUser: false });

    } catch (err) {
      console.error(err);
      this.messages.push({
        text: '⚠️ حدث خطأ عند الاتصال بالخادم. حاول مرة أخرى.',
        isUser: false
      });
    } finally {
      this.isLoading = false;
    }
  }

  sendQuickResponse(text: string) {
    this.userInput = text;
    this.sendMessage();
  }
}

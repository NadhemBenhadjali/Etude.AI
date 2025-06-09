import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  messages: { text: string; isUser: boolean }[] = [];
  userInput = '';
  isLoading = false;
  currentMode = '';

  private apiUrl = 'https://7d9e-34-71-125-164.ngrok-free.app';
  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentMode = params['mode'] || '';
      this.initializeChat();
    });
  }

  initializeChat() {
    this.messages = [];
    let greeting = 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟';
    if (this.currentMode === 'summary') {
      greeting = 'مرحباً! أنا هنا لمساعدتك في الحصول على ملخص للدروس. ما هو الدرس الذي تريد ملخصه؟';
    } else if (this.currentMode === 'quiz') {
      greeting = 'مرحباً! أنا هنا لمساعدتك في اختبار معلوماتك. هل أنت مستعد للبدء؟';
    } else if (this.currentMode === 'general') {
      greeting = 'مرحباً! أنا هنا للإجابة على أسئلتك العامة. كيف يمكنني مساعدتك اليوم؟';
    }
    this.messages.push({ text: greeting, isUser: false });
  }

  async sendMessage() {
    const txt = this.userInput.trim();
    if (!txt) return;

    this.messages.push({ text: txt, isUser: true });
    this.isLoading = true;
    this.userInput = '';

    const endpoint = this.currentMode === 'summary' ? '/summary' : '/qa';
    const payload = this.currentMode === 'summary'
      ? { module: txt }
      : { question: txt };

    try {
      const res = await fetch(this.apiUrl + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      let reply = '';
      if (this.currentMode === 'summary' && data.data?.slides) {
        // bullet each slide
        reply = data.data.slides.map((s: any) => `• ${s.text}`).join('\n');
      } else if (this.currentMode !== 'summary' && data.answer) {
        reply = data.answer;
      } else {
        reply = JSON.stringify(data, null, 2);
      }

      // convert **bold** → actual Arabic bold via <b> tags removed,
      // or leave as-is if you prefer
      // right after this line…
      reply = reply.replace(/\*\*(.+?)\*\*/g, '$1');

      // …insert these two lines:
      reply = reply.replace(/\\n/g, '<br>')    // convert literal “\n” into <br>
                  .replace(/"/g, '').replace(/\\(.+?)\\/g, '<strong>$1</strong>');

                  ;         // remove all double-quotes

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

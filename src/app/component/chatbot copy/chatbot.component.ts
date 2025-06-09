import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  messages: { text: string; isUser: boolean }[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  currentMode: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentMode = params['mode'] || '';
      this.initializeChat();
    });
  }

  initializeChat() {
    this.messages = [];
    if (this.currentMode === 'summary') {
      this.messages.push({
        text: 'مرحباً! أنا هنا لمساعدتك في الحصول على ملخص للدروس. ما هو الدرس الذي تريد ملخصه؟',
        isUser: false
      });
    } else if (this.currentMode === 'quiz') {
      this.messages.push({
        text: 'مرحباً! أنا هنا لمساعدتك في اختبار معلوماتك. هل أنت مستعد للبدء؟',
        isUser: false
      });
    } else if (this.currentMode === 'general') {
      this.messages.push({
        text: 'مرحباً! أنا هنا للإجابة على أسئلتك العامة. كيف يمكنني مساعدتك اليوم؟',
        isUser: false
      });
    } else {
      this.messages.push({
        text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟',
        isUser: false
      });
    }
  }

  sendMessage() {
    if (this.userInput.trim()) {
      this.messages.push({
        text: this.userInput,
        isUser: true
      });

      this.isLoading = true;
      setTimeout(() => {
        let response = '';
        if (this.currentMode === 'summary') {
          response = 'سأقوم بتحضير ملخص مفيد لهذا الدرس. هل هناك نقاط معينة تريد التركيز عليها؟';
        } else if (this.currentMode === 'quiz') {
          response = 'حسناً، سأبدأ بطرح الأسئلة. هل أنت مستعد؟';
        } else if (this.currentMode === 'general') {
          response = 'سأحاول مساعدتك في هذا السؤال. هل يمكنك توضيح المزيد؟';
        } else {
          response = 'أنا أفهم سؤالك. سأقوم بمساعدتك في أقرب وقت ممكن.';
        }
        
        this.messages.push({
          text: response,
          isUser: false
        });
        this.isLoading = false;
      }, 2000);

      this.userInput = '';
    }
  }

  sendQuickResponse(text: string) {
    this.userInput = text;
    this.sendMessage();
  }
} 
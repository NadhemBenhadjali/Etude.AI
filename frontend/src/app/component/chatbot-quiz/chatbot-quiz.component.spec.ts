import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatbotQuizComponent } from './chatbot-quiz.component';
import { AiService } from '../../services/ai.service';
import { QuizService } from '../../services/quiz.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ChatbotQuizComponent', () => {
  let component: ChatbotQuizComponent;
  let fixture: ComponentFixture<ChatbotQuizComponent>;

  beforeEach(async () => {
    const aiServiceSpy = jasmine.createSpyObj('AiService', ['generateQuiz']);
    aiServiceSpy.generateQuiz.and.returnValue(of({ data: { questions: [] } }));

    const quizServiceSpy = jasmine.createSpyObj('QuizService', ['getQuiz']);

    const routeSpy = {
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [ChatbotQuizComponent],
      providers: [
        { provide: AiService, useValue: aiServiceSpy },
        { provide: QuizService, useValue: quizServiceSpy },
        { provide: ActivatedRoute, useValue: routeSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ChatbotQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
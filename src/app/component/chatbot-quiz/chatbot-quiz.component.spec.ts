import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatbotQuizComponent } from './chatbot-quiz.component';

describe('ChatbotQuizComponent', () => {
  let component: ChatbotQuizComponent;
  let fixture: ComponentFixture<ChatbotQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatbotQuizComponent]
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

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonBoardComponent } from './lesson-board.component';

describe('LessonBoardComponent', () => {
  let component: LessonBoardComponent;
  let fixture: ComponentFixture<LessonBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonBoardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

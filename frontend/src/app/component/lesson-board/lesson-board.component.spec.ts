import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LessonBoardComponent } from './lesson-board.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('LessonBoardComponent', () => {
  let component: LessonBoardComponent;
  let fixture: ComponentFixture<LessonBoardComponent>;

  beforeEach(async () => {
    const routeSpy = {
      snapshot: { queryParamMap: { get: () => null } },
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [LessonBoardComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: routeSpy } // Use useValue with the spy object
      ]
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AiService } from '../../services/ai.service';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    const aiServiceSpy = jasmine.createSpyObj('AiService', ['generatePlan']);
    aiServiceSpy.generatePlan.and.returnValue(of({ plan: 'test plan' }));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AiService, useValue: aiServiceSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

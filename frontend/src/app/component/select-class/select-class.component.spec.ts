import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectClassComponent } from './select-class.component';

describe('SelectClassComponent', () => {
  let component: SelectClassComponent;
  let fixture: ComponentFixture<SelectClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectClassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

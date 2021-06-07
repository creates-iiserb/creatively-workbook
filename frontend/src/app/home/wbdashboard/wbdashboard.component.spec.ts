import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WbdashboardComponent } from './wbdashboard.component';

describe('WbdashboardComponent', () => {
  let component: WbdashboardComponent;
  let fixture: ComponentFixture<WbdashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WbdashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WbdashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BetawbdetailsComponent } from './betawbdetails.component';

describe('BetawbdetailsComponent', () => {
  let component: BetawbdetailsComponent;
  let fixture: ComponentFixture<BetawbdetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BetawbdetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BetawbdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BetalistComponent } from './betalist.component';

describe('BetalistComponent', () => {
  let component: BetalistComponent;
  let fixture: ComponentFixture<BetalistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BetalistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BetalistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

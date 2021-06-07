import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArrangeComponent } from './arrange.component';

describe('ArrangeComponent', () => {
  let component: ArrangeComponent;
  let fixture: ComponentFixture<ArrangeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArrangeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArrangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

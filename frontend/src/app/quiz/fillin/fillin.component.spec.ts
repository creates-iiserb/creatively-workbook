import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FillinComponent } from './fillin.component';

describe('FillinComponent', () => {
  let component: FillinComponent;
  let fixture: ComponentFixture<FillinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FillinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FillinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WboardComponent } from './wboard.component';

describe('WboardComponent', () => {
  let component: WboardComponent;
  let fixture: ComponentFixture<WboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

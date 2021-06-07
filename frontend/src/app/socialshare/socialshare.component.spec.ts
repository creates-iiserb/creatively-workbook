import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialshareComponent } from './socialshare.component';

describe('SocialshareComponent', () => {
  let component: SocialshareComponent;
  let fixture: ComponentFixture<SocialshareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SocialshareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SocialshareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

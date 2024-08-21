import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomingCallPopupComponent } from './incoming-call-popup.component';

describe('IncomingCallPopupComponent', () => {
  let component: IncomingCallPopupComponent;
  let fixture: ComponentFixture<IncomingCallPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IncomingCallPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomingCallPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

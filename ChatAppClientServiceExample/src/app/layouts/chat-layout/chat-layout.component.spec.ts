import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatLayoutComponent } from './chat-layout.component';

describe('ChatLayoutComponent', () => {
  let component: ChatLayoutComponent;
  let fixture: ComponentFixture<ChatLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

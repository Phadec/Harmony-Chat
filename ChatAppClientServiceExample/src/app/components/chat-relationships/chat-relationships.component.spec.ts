import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatRelationshipsComponent } from './chat-relationships.component';

describe('ChatRelationshipsComponent', () => {
  let component: ChatRelationshipsComponent;
  let fixture: ComponentFixture<ChatRelationshipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatRelationshipsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatRelationshipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

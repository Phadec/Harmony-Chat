import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendRequestsComponent } from './friend-requests.component';

describe('FriendRequestsComponent', () => {
  let component: FriendRequestsComponent;
  let fixture: ComponentFixture<FriendRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FriendRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FriendRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

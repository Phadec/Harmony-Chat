import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockedUsersModalComponent } from './blocked-users-modal.component';

describe('BlockedUsersModalComponent', () => {
  let component: BlockedUsersModalComponent;
  let fixture: ComponentFixture<BlockedUsersModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlockedUsersModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlockedUsersModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeNicknameDialogComponent } from './change-nickname-dialog.component';

describe('ChangeNicknameDialogComponent', () => {
  let component: ChangeNicknameDialogComponent;
  let fixture: ComponentFixture<ChangeNicknameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChangeNicknameDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeNicknameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

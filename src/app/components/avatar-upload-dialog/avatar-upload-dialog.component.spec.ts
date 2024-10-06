import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarUploadDialogComponent } from './avatar-upload-dialog.component';

describe('AvatarUploadDialogComponent', () => {
  let component: AvatarUploadDialogComponent;
  let fixture: ComponentFixture<AvatarUploadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AvatarUploadDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarUploadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

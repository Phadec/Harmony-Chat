import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagePreviewDialogComponent } from './image-preview-dialog.component';

describe('ImagePreviewDialogComponent', () => {
  let component: ImagePreviewDialogComponent;
  let fixture: ComponentFixture<ImagePreviewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImagePreviewDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagePreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

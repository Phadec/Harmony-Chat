import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-avatar-upload-dialog',
  templateUrl: './avatar-upload-dialog.component.html',
  styleUrls: ['./avatar-upload-dialog.component.css']
})
export class AvatarUploadDialogComponent {
  avatarFile: File | null = null;
  avatarPreview: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AvatarUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.avatarFile = file;

      const reader = new FileReader();
      reader.onload = e => (this.avatarPreview = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.avatarFile) {
      this.dialogRef.close(this.avatarFile);
    }
  }
}

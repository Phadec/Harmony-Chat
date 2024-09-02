import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-theme-selector-dialog',
  templateUrl: './theme-selector-dialog.component.html',
  styleUrls: ['./theme-selector-dialog.component.css']
})
export class ThemeSelectorDialogComponent {
  themes = ['light', 'dark', 'blue', 'green', 'red'];

  constructor(
    public dialogRef: MatDialogRef<ThemeSelectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  selectTheme(theme: string) {
    this.dialogRef.close(theme);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

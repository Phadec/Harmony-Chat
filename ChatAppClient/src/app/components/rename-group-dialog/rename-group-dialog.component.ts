import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-rename-group-dialog',
  templateUrl: './rename-group-dialog.component.html',
  styleUrls: ['./rename-group-dialog.component.css']
})
export class RenameGroupDialogComponent {
  newName: string = '';

  constructor(
    public dialogRef: MatDialogRef<RenameGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentRecipient: string }
  ) {}

  onSave(): void {
    this.dialogRef.close(this.newName);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

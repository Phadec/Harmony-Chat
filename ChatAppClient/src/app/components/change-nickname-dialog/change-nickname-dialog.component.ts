import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-change-nickname-dialog',
  templateUrl: './change-nickname-dialog.component.html',
  styleUrls: ['./change-nickname-dialog.component.css']
})
export class ChangeNicknameDialogComponent {

  newNickname: string = '';

  constructor(
    public dialogRef: MatDialogRef<ChangeNicknameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.newNickname = data.currentNickname || '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.newNickname);
  }
}

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-attachment-preview-dialog',
  templateUrl: './attachment-preview-dialog.component.html',
  styleUrls: ['./attachment-preview-dialog.component.css']
})
export class AttachmentPreviewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}

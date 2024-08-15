import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ImagePreviewDialogComponent } from '../image-preview-dialog/image-preview-dialog.component'; // Adjust the path accordingly

@Component({
  selector: 'app-chat-header',
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.css']
})
export class ChatHeaderComponent implements OnInit {
  @Input() recipientInfo: any; // Nhận thông tin recipient từ component cha

  constructor(public dialog: MatDialog) {}

  ngOnInit(): void {
    
  }

  openImagePreview(): void {
    this.dialog.open(ImagePreviewDialogComponent, {
      data: 'https://localhost:7267/' + this.recipientInfo.avatar,
      panelClass: 'custom-dialog-container'
    });
  }
}

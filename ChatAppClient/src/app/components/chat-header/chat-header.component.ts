import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PeerService } from '../../services/peer.service';
import { ImagePreviewDialogComponent } from '../image-preview-dialog/image-preview-dialog.component';

@Component({
  selector: 'app-chat-header',
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.css']
})
export class ChatHeaderComponent implements OnInit {
  @Input() recipientInfo: any; // Receive recipient information from parent component

  constructor(private peerService: PeerService, public dialog: MatDialog) {}

  ngOnInit(): void {}

  // Start a voice call
  async startVoiceCall(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      this.peerService.makeCall(this.recipientInfo.peerId, stream);
    } catch (error) {
      console.error('Error accessing audio device:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  }

  // Start a video call
  async startVideoCall(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.peerService.makeCall(this.recipientInfo.peerId, stream);
    } catch (error) {
      console.error('Error accessing video device:', error);
      alert('Unable to access camera or microphone. Please check your permissions.');
    }
  }

  // Open image preview dialog
  openImagePreview(): void {
    if (!this.recipientInfo || !this.recipientInfo.avatar) {
      console.error('Recipient avatar information not found.');
      return;
    }

    this.dialog.open(ImagePreviewDialogComponent, {
      data: 'https://localhost:7267/' + this.recipientInfo.avatar,
      panelClass: 'custom-dialog-container'
    });
  }
}

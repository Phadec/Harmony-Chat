import { Component, Input, OnChanges } from '@angular/core';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-messages',
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.css']
})
export class ChatMessagesComponent implements OnChanges {
  @Input() recipientId: string | null = null;
  messages: any[] = [];
  errorMessage: string | null = null;
  currentUserId: string | null = null; // Thêm thuộc tính currentUserId

  constructor(private chatService: ChatService) {
    this.currentUserId = localStorage.getItem('userId'); // Lấy userId từ localStorage hoặc từ dịch vụ xác thực
  }

  ngOnChanges(): void {
    if (this.recipientId) {
      this.loadChats();
    }
  }

  loadChats(): void {
    if (this.recipientId) {
      this.chatService.getChats(this.recipientId).subscribe({
        next: response => {
          if (response && response.$values) {
            this.messages = response.$values;
          } else {
            this.errorMessage = 'Invalid data format received from server.';
          }
        },
        error: error => {
          this.errorMessage = error.error.Message || 'Failed to load messages.';
        }
      });
    }
  }
}

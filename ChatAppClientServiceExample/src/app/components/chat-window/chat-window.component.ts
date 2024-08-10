import { Component, Input, OnInit } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit {
  @Input() recipientId: string | null = null;
  messages: any[] = [];
  chatName: string = '';

  // Ensure the newMessage property exists
  newMessage: string = '';
  currentUserId: string = '';

  constructor(private chatService: ChatService, private signalRService: SignalRService) {}

  ngOnInit(): void {
    this.currentUserId = localStorage.getItem('userId') || ''; // Store the userId in a class property

    this.signalRService.messageReceived$.subscribe(message => {
      this.messages.push(message);
    });

    if (this.recipientId) {
      this.loadMessages(this.recipientId);
    }
  }

  ngOnChanges(): void {
    if (this.recipientId) {
      this.loadMessages(this.recipientId);
    }
  }

  loadMessages(recipientId: string): void {
    this.chatService.getChats(recipientId).subscribe((response: any) => {
      if (response && response.$values) {
        this.messages = response.$values; // Gán mảng $values vào biến messages
        this.chatName = this.messages.length > 0 ? this.messages[0].senderFullName : 'Chat';
      }
    });
  }

  onSendMessage(message: string): void {
    if (this.recipientId) {
      const formData = new FormData();
      formData.append('Message', message);
      formData.append('UserId', this.currentUserId);
      formData.append('RecipientId', this.recipientId);

      this.chatService.sendMessage(formData).subscribe();
      this.newMessage = ''; // Clear the input after sending the message
    }
  }
}

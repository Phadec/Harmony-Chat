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

  constructor(private chatService: ChatService, private signalRService: SignalRService) {}

  ngOnInit(): void {
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
    this.chatService.getChats(recipientId).subscribe((response) => {
      this.messages = response;
      this.chatName = response.length > 0 ? response[0].SenderFullName : 'Chat';
    });
  }

  onSendMessage(message: string): void {
    if (this.recipientId) {
      const formData = new FormData();
      formData.append('Message', message);
      formData.append('UserId', localStorage.getItem('userId') || '');
      formData.append('RecipientId', this.recipientId);

      this.chatService.sendMessage(formData).subscribe();
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { SignalRService } from '../../services/signalr.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-detail',
  templateUrl: './chat-detail.component.html',
  styleUrls: ['./chat-detail.component.css']
})
export class ChatDetailComponent implements OnInit, OnDestroy {
  messages: any[] = [];
  recipientId: string;

  constructor(private signalRService: SignalRService, private chatService: ChatService) {}

  ngOnInit(): void {
    this.signalRService.startConnection();
    this.signalRService.addReceiveMessageListener();

    this.loadMessages();
  }

  loadMessages(): void {
    this.chatService.getChats(this.recipientId).subscribe((response) => {
      this.messages = response;
    });
  }

  ngOnDestroy(): void {
    this.signalRService.stopConnection();
  }
}

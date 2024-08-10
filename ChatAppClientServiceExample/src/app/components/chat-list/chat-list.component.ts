import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { ChatStateService } from '../../services/chat-state.service';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.css']
})
export class ChatListComponent implements OnInit {
  chats: any[] = [];

  constructor(private chatService: ChatService, private chatStateService: ChatStateService) {}

  ngOnInit(): void {
    this.loadChatList();
  }

  loadChatList(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.chatService.getRelationships().subscribe(
        (data) => {
          this.chats = data.$values || [];
          console.log('Chats loaded:', this.chats);
        },
        (error) => {
          console.error('Failed to load chat list:', error);
        }
      );
    } else {
      console.error('User ID not found in localStorage.');
    }
  }

  selectChat(chat: any): void {
    const recipientId = chat.contactId || chat.groupId;  // Use the appropriate ID
    this.chatStateService.changeRecipientId(recipientId);  // Save recipient ID
    console.log('Selected chat:', chat);
  }
}

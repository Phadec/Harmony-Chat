import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  relationships: any[] = [];
  selectedRecipientId: string | null = null;

  @Output() selectRecipient = new EventEmitter<string>();

  constructor(private chatService: ChatService, private signalRService: SignalRService) {}

  ngOnInit(): void {
    this.loadRelationships();

    // Lắng nghe sự kiện `UpdateRelationships` để cập nhật relationships
    this.signalRService.hubConnection.on('UpdateRelationships', () => {
      console.log('UpdateRelationships event received');
      this.loadRelationships(); // Cập nhật danh sách relationships khi có sự thay đổi
    });

    // Tiếp tục lắng nghe sự kiện nhận tin nhắn mới
    this.signalRService.messageReceived$.subscribe((message: any) => {
      this.loadRelationships(); // Cập nhật danh sách relationships khi có tin nhắn mới
    });
  }

  loadRelationships(): void {
    this.chatService.getRelationships().subscribe((response) => {
      this.relationships = response.$values.map((rel: any) => {
        return {
          id: rel.relationshipType === 'Private' ? rel.contactId : rel.groupId,
          // Display contactNickname if available, otherwise show fullName
          fullName: rel.relationshipType === 'Private' && rel.contactNickname ? rel.contactNickname : (rel.relationshipType === 'Private' ? rel.contactFullName : rel.groupName),
          tagName: rel.relationshipType === 'Private' ? rel.contactTagName : '',
          lastMessage: rel.lastMessage,
          isGroup: rel.relationshipType === 'Group',
          isSentByUser: rel.isSentByUser,
          avatar: rel.avatar,
          senderFullName: rel.senderFullName || '', // For group messages, display sender's name
        };
      });
    });
  }

  onSelectRecipient(recipientId: string): void {
    this.selectedRecipientId = recipientId;
    console.log(recipientId);
    this.selectRecipient.emit(recipientId);
  }
}

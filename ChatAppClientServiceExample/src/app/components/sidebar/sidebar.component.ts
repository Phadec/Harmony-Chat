import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { SignalRService } from '../../services/signalr.service';
import { ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  relationships: any[] = [];
  selectedRecipientId: string | null = null;

  @Output() selectRecipient = new EventEmitter<string>();

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

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
          fullName: rel.relationshipType === 'Private' && rel.contactNickname ? rel.contactNickname : (rel.relationshipType === 'Private' ? rel.contactFullName : rel.groupName),
          tagName: rel.relationshipType === 'Private' ? rel.contactTagName : '',
          lastMessage: rel.lastMessage,
          isGroup: rel.relationshipType === 'Group',
          isSentByUser: rel.isSentByUser,
          avatar: rel.avatar,
          senderFullName: rel.senderFullName || '',
          hasNewMessage: rel.hasNewMessage,
        };
      });

      // Buộc Angular kiểm tra và cập nhật giao diện
      this.cdr.detectChanges();
    });
  }

  onSelectRecipient(recipientId: string): void {
    this.selectedRecipientId = recipientId;

    const selectedRelationship = this.relationships.find(rel => rel.id === recipientId);

    if (selectedRelationship && selectedRelationship.hasNewMessage) {
      selectedRelationship.hasNewMessage = false;

      this.chatService.markMessageAsRead(selectedRelationship.id).subscribe({
        next: () => {
          this.loadRelationships();
        },
        error: (err) => {
          console.error('Failed to mark message as read', err);
        }
      });
    }

    this.selectRecipient.emit(recipientId);
  }
}

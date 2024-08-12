import { Component, OnInit, Input, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { SignalRService } from '../../services/signalr.service';
import { ChatService } from '../../services/chat.service';
import { FriendsService } from '../../services/friends.service';
import { ChangeDetectorRef } from '@angular/core';
import { RecipientInfo } from '../../models/recipient-info.model';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit, OnChanges {
  @Input() recipientId: string | null = null;
  @ViewChild('chatMessages', {static: false}) private chatMessagesContainer!: ElementRef;
  messages: any[] = [];
  newMessage: string = '';
  currentUserId = localStorage.getItem('userId');
  recipientInfo: RecipientInfo | null = null; // Thông tin người nhận (bạn bè hoặc nhóm)
  attachmentFile: File | null = null; // Biến lưu trữ tệp đính kèm

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService,
    private friendService: FriendsService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.signalRService.startConnection();

    if (this.recipientId) {
      this.loadMessages();
      this.loadRecipientInfo();
    }

    this.signalRService.messageReceived$.subscribe((message: any) => {
      this.handleReceivedMessage(message);
    });

    this.signalRService.messageRead$.subscribe((chatId: string | null) => {
      if (chatId) {
        this.markMessageAsReadInUI(chatId);
      }
    });

    this.signalRService.connectedUsers$.subscribe((connectedUsers: any[]) => {
      console.log('Connected users:', connectedUsers);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recipientId'] && !changes['recipientId'].isFirstChange()) {
      this.loadMessages();
      this.loadRecipientInfo();
    }
  }

  loadMessages(): void {
    if (this.recipientId) {
      this.chatService.getChats(this.recipientId).subscribe(
        (response: any) => {
          this.messages = response.$values || [];
          this.cdr.detectChanges();
          this.scrollToBottom();

          // Check if each message has an attachment and display it
          this.messages.forEach(message => {
            if (message.attachmentUrl && message.attachmentOriginalName) {
              console.log(`Attachment found: ${message.attachmentOriginalName} at ${message.attachmentUrl}`);
            }
          });

          // Mark the last message as read
          if (this.messages.length > 0) {
            const lastMessage = this.messages[this.messages.length - 1];
            if (!lastMessage.isRead) {
              this.markMessageAsRead(lastMessage.id);
            }
          }
        },
        (error) => {
          console.error('Error loading messages:', error);
        }
      );
    }
  }


  loadRecipientInfo(): void {
    if (this.recipientId && this.currentUserId) {
      this.chatService.getRecipientInfo(this.currentUserId, this.recipientId).subscribe(
        (response) => {
          this.recipientInfo = response as RecipientInfo;
        },
        (error) => {
          console.error('Error loading recipient info:', error);
        }
      );
    }
  }

  handleReceivedMessage(message: any): void {
    const isForCurrentRecipient =
      (message.toUserId === this.recipientId && message.userId === this.currentUserId) ||
      (message.userId === this.recipientId && message.toUserId === this.currentUserId) ||
      (message.groupId && message.groupId === this.recipientId);

    if (isForCurrentRecipient) {
      const isDuplicate = this.messages.some(msg => msg.id === message.id);
      if (!isDuplicate) {
        this.messages = [...this.messages, message];
        this.cdr.detectChanges();
        this.scrollToBottom();
        this.markMessageAsRead(message.id); // Đánh dấu tin nhắn là đã đọc khi nhận được
        console.log(`New message received by recipient ${this.recipientId} from user ${message.userId}:`, message);
      }
    }
  }

  markMessageAsRead(chatId: string): void {
    if (this.recipientId) {
      this.chatService.markMessageAsRead(chatId).subscribe(
        () => {
          this.signalRService.notifyMessageRead(chatId); // Gửi tín hiệu "Đã đọc"
        },
        (error: any) => {
          console.error('Error marking message as read:', error);
        }
      );
    }
  }

  markMessageAsReadInUI(chatId: string): void {
    const message = this.messages.find(msg => msg.id === chatId);
    if (message) {
      message.isRead = true;
      this.cdr.detectChanges(); // Buộc cập nhật UI ngay
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.attachmentFile = input.files[0];
    }
  }

  onSendMessage(): void {
    if ((this.newMessage.trim() || this.attachmentFile) && this.recipientId) {
      const formData = new FormData();
      formData.append('Message', this.newMessage);
      formData.append('UserId', this.currentUserId || '');
      formData.append('RecipientId', this.recipientId);

      if (this.attachmentFile) {
        formData.append('Attachment', this.attachmentFile);
      }

      this.chatService.sendMessage(formData).subscribe(
        (response) => {
          this.newMessage = ''; // Xóa nội dung nhập sau khi gửi tin nhắn
          this.attachmentFile = null; // Reset attachment file
          this.handleReceivedMessage(response); // Thêm tin nhắn mới vào giao diện
          console.log(`Message sent by user ${this.currentUserId} to recipient ${this.recipientId}:`, response);

          // Gửi thông báo tin nhắn mới với đối tượng chat đầy đủ
          this.signalRService.sendNewMessageNotification(response);
        },
        (error) => {
          console.error('Error sending message:', error);
        }
      );
    }
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.chatMessagesContainer && this.chatMessagesContainer.nativeElement) {
          this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Scroll to bottom error:', err);
    }
  }

  getAttachmentType(attachmentUrl: string): string {
    const extension = attachmentUrl.split('.').pop()?.toLowerCase();
    if (extension && ['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return 'image';
    } else if (extension && ['mp4', 'webm', 'ogg'].includes(extension)) {
      return 'video';
    } else if (extension && extension === 'pdf') {
      return 'pdf';
    } else {
      return 'other';
    }
  }

  getAttachmentUrl(attachmentUrl: string): string {
    return `https://localhost:7267/${attachmentUrl}`;
  }
}

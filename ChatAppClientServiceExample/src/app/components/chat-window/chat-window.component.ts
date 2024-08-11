import { Component, OnInit, Input, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { SignalRService } from '../../services/signalr.service';
import { ChatService } from '../../services/chat.service';
import { ChangeDetectorRef } from '@angular/core';

interface Message {
  id: string;
  userId: string;
  recipientId?: string;
  groupId?: string;
  senderFullName: string;
  message: string;
  date: string;
  attachmentUrl?: string;
}

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit, OnChanges {
  @Input() recipientId: string | null = null;
  @ViewChild('chatMessages', { static: false }) private chatMessagesContainer!: ElementRef;
  messages: Message[] = [];
  newMessage: string = '';
  currentUserId = localStorage.getItem('userId'); // Lấy ID người dùng hiện tại từ localStorage

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.signalRService.startConnection();
    this.signalRService.addReceiveMessageListener();

    if (this.recipientId) {
      this.loadMessages();
    }

    this.signalRService.messageReceived$.subscribe((message: any) => {
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
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recipientId'] && !changes['recipientId'].isFirstChange()) {
      this.loadMessages();
    }
  }

  loadMessages(): void {
    if (this.recipientId) {
      this.chatService.getChats(this.recipientId).subscribe(
        (response: any) => {
          if (response && response.$values) {
            this.messages = response.$values;
          } else {
            this.messages = [];
          }
          this.cdr.detectChanges();
          this.scrollToBottom(); // Cuộn xuống cuối khi tải tin nhắn
        },
        (error) => {
          console.error('Error loading messages:', error);
        }
      );
    }
  }

  onSendMessage(): void {
    if (this.newMessage.trim() && this.recipientId) {
      const formData = new FormData();
      formData.append('Message', this.newMessage);
      formData.append('UserId', this.currentUserId || '');
      formData.append('RecipientId', this.recipientId);

      this.chatService.sendMessage(formData).subscribe(
        () => {
          this.newMessage = ''; // Xóa trường nhập sau khi gửi tin nhắn
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
      }, 100); // Đảm bảo rằng tin nhắn đã được render trước khi cuộn
    } catch (err) {
      console.error('Scroll to bottom error:', err);
    }
  }
}

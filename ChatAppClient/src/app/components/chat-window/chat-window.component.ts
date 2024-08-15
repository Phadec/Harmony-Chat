import { Component, OnInit, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { SignalRService } from '../../services/signalr.service';
import { ChatService } from '../../services/chat.service';
import { RecipientInfo } from '../../models/recipient-info.model';
import { MatDialog } from '@angular/material/dialog';
import { AttachmentPreviewDialogComponent } from '../attachment-preview-dialog/attachment-preview-dialog.component';
import {EmojiPickerComponent} from "../emoji-picker/emoji-picker.component";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
const vietnamTimezone = 'Asia/Ho_Chi_Minh';
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
  emojiPickerVisible: boolean = false;

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.signalRService.startConnection();

    if (this.recipientId) {
      this.loadMessages();
      this.loadRecipientInfo();
    }
    this.signalRService.groupNotificationReceived$.subscribe(notification => {
      if (notification) {
        this.loadRecipientInfo(); // Tải lại mối quan hệ khi có thay đổi từ nhóm
      }
    });
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
          this.processMessages(); // Xử lý thời gian và ngày của tin nhắn
          this.cdr.detectChanges(); // Force UI update
          this.scrollToBottom(); // Scroll to bottom after loading messages

          // Check for attachments and mark the last message as read
          this.messages.forEach(message => {
            if (message.attachmentUrl && message.attachmentOriginalName) {
              console.log(`Attachment found: ${message.attachmentOriginalName} at ${message.attachmentUrl}`);
            }
          });

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
  processMessages(): void {
    let lastMessageDate: dayjs.Dayjs | null = null;

    this.messages.forEach((message, index) => {
      // Sử dụng utc() để đảm bảo thời gian được chuẩn hóa trước khi chuyển đổi sang múi giờ Việt Nam
      const messageDate = dayjs.utc(message.date).tz(vietnamTimezone);

      // Hiển thị ngày/giờ nếu là ngày mới
      if (!lastMessageDate || !messageDate.isSame(lastMessageDate, 'day')) {
        message.displayDate = messageDate.format('DD/MM/YYYY HH:mm');
      }
      // Hiển thị giờ nếu cách nhau hơn 15 phút
      else if (lastMessageDate && messageDate.diff(lastMessageDate, 'minute') > 15) {
        message.displayDate = messageDate.format('HH:mm');
      }
      // Không hiển thị nếu cách nhau không quá 15 phút
      else {
        message.displayDate = '';
      }

      lastMessageDate = messageDate;
    });

    this.cdr.detectChanges(); // Cập nhật lại UI
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
        this.processMessages(); // Re-process messages after new message
        this.cdr.detectChanges(); // Force UI update
        this.scrollToBottom(); // Scroll to bottom after receiving a message
        this.markMessageAsRead(message.id); // Mark message as read
        console.log(`New message received by recipient ${this.recipientId} from user ${message.userId} (${message.fullName}):`, message);
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
          this.newMessage = ''; // Clear input after sending
          this.attachmentFile = null; // Reset attachment file
          this.handleReceivedMessage(response); // Add the new message to UI
          console.log(`Message sent by user ${this.currentUserId} to recipient ${this.recipientId}:`, response);

          // Notify about the new message
          this.signalRService.sendNewMessageNotification(response);

          this.scrollToBottom(); // Scroll to bottom after sending a message
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
    } else if (extension && ['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    } else if (extension && extension === 'pdf') {
      return 'pdf';
    } else if (extension && extension === 'docx') {
      return 'docx';
    } else {
      return 'other';
    }
  }

  getAttachmentUrl(attachmentUrl: string): string {
    return `https://localhost:7267/${attachmentUrl}`;
  }

  openAttachmentPreview(attachmentUrl: string, type: string): void {
    this.dialog.open(AttachmentPreviewDialogComponent, {
      data: {url: this.getAttachmentUrl(attachmentUrl), type: type},
      panelClass: 'custom-dialog-container'
    });
  }

  onEmojiClick(): void {
    const dialogRef = this.dialog.open(EmojiPickerComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((emoji: string) => {
      if (emoji) {
        this.newMessage += emoji;  // Thêm emoji vào tin nhắn hiện tại
      }
    });
  }
}

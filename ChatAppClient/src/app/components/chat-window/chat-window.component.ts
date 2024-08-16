import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  OnDestroy
} from '@angular/core';
import { SignalRService } from '../../services/signalr.service';
import { ChatService } from '../../services/chat.service';
import { RecipientInfo } from '../../models/recipient-info.model';
import { MatDialog } from '@angular/material/dialog';
import { AttachmentPreviewDialogComponent } from '../attachment-preview-dialog/attachment-preview-dialog.component';
import { EmojiPickerComponent } from "../emoji-picker/emoji-picker.component";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Subscription, combineLatest } from 'rxjs';

dayjs.extend(utc);
dayjs.extend(timezone);
const vietnamTimezone = 'Asia/Ho_Chi_Minh';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit, OnChanges, OnDestroy {
  @Input() recipientId: string | null = null;
  @Output() messageSent = new EventEmitter<void>();
  @ViewChild('chatMessages', { static: false }) private chatMessagesContainer!: ElementRef;

  messages: any[] = [];
  newMessage: string = '';
  currentUserId = localStorage.getItem('userId');
  recipientInfo: RecipientInfo | null = null;
  attachmentFile: File | null = null;
  emojiPickerVisible: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.signalRService.startConnection();

    if (this.recipientId) {
      this.loadMessages();
      this.loadRecipientInfo();
    }

    this.registerSignalREvents();
  }

  registerSignalREvents(): void {
    this.subscriptions.add(
      combineLatest([
        this.signalRService.groupNotificationReceived$,
        this.signalRService.messageReceived$,
        this.signalRService.messageRead$,
        this.signalRService.connectedUsers$,
        this.signalRService.friendEventNotification$
      ]).subscribe(([groupNotification, message, messageRead, connectedUsers, friendEvent]) => {
        if (groupNotification) {
          this.loadRecipientInfo();
        }
        if (message) {
          this.handleReceivedMessage(message);
        }
        if (messageRead) {
          this.markMessageAsReadInUI(messageRead);
        }
        console.log('Connected users:', connectedUsers);
        if (friendEvent) {
          this.handleFriendEvent(friendEvent);
        }
      })
    );

    this.subscriptions.add(
      this.signalRService.hubConnection.on('FriendEventNotification', (data: { eventType: string, friendId: string }) => {
        this.handleFriendEvent(data);
      })
    );
  }

  handleFriendEvent(data: { eventType: string, friendId: string }): void {
    if (data.eventType === 'FriendRemoved' && this.recipientId === data.friendId) {
      console.log(`Friend removed: ${data.friendId}`);
      this.resetRecipientData();
    }
  }

  resetRecipientData(): void {
    console.log("resetRecipientData() called");

    this.recipientId = null;
    this.recipientInfo = null;
    this.messages = [];
    this.newMessage = '';
    this.attachmentFile = null;

    setTimeout(() => {
      console.log("After reset - recipientId:", this.recipientId);
      console.log("After reset - recipientInfo:", this.recipientInfo);
      console.log("After reset - messages:", this.messages);

      this.cdr.detectChanges();
      console.log("Recipient data has been reset.");
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recipientId'] && changes['recipientId'].previousValue !== changes['recipientId'].currentValue) {
      this.loadMessages();
      this.loadRecipientInfo();
    }
  }

  loadMessages(): void {
    if (this.recipientId) {
      this.chatService.getChats(this.recipientId).subscribe(
        (response: any) => {
          this.messages = response.$values || [];
          this.processMessages();
          this.cdr.detectChanges();
          this.scrollToBottom();

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
      const messageDate = dayjs.utc(message.date).tz(vietnamTimezone);

      if (!lastMessageDate || !messageDate.isSame(lastMessageDate, 'day')) {
        message.displayDate = messageDate.format('DD/MM/YYYY HH:mm');
      } else if (lastMessageDate && messageDate.diff(lastMessageDate, 'minute') > 15) {
        message.displayDate = messageDate.format('HH:mm');
      } else {
        message.displayDate = '';
      }

      lastMessageDate = messageDate;
    });

    this.cdr.detectChanges();
  }

  loadRecipientInfo(): void {
    if (this.recipientId && this.currentUserId) {
      this.chatService.getRecipientInfo(this.currentUserId, this.recipientId).subscribe(
        (response) => {
          this.recipientInfo = response as RecipientInfo;
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error fetching recipient information:', error);
          if (error.status === 404) {
            this.resetRecipientData();
          }
        }
      );
    } else {
      console.log('No recipientId found, skipping loadRecipientInfo');
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
        this.processMessages();
        this.cdr.detectChanges();
        this.scrollToBottom();
        this.markMessageAsRead(message.id);
        console.log(`New message received by recipient ${this.recipientId} from user ${message.userId} (${message.fullName}):`, message);
      }
    }
  }

  markMessageAsRead(chatId: string): void {
    if (this.recipientId) {
      this.chatService.markMessageAsRead(chatId).subscribe(
        () => {
          this.signalRService.notifyMessageRead(chatId);
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
      this.cdr.detectChanges();
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
          this.newMessage = '';
          this.attachmentFile = null;
          this.handleReceivedMessage(response);
          console.log(`Message sent by user ${this.currentUserId} to recipient ${this.recipientId}:`, response);

          this.signalRService.sendNewMessageNotification(response);
          this.signalRService.notifyMessageSent();
          this.scrollToBottom();
        },
        (error) => {
          console.error('Error sending message:', error);
        }
      );
    }
  }

  scrollToBottom(): void {
    try {
      if (this.chatMessagesContainer?.nativeElement) {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll to bottom error:', err);
    }
  }

  getAttachmentType(attachmentUrl: string): string {
    const extension = attachmentUrl.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'mp4':
      case 'webm':
      case 'ogg':
        return 'video';
      case 'mp3':
      case 'wav':
        return 'audio';
      case 'pdf':
        return 'pdf';
      case 'docx':
        return 'docx';
      default:
        return 'other';
    }
  }

  getAttachmentUrl(attachmentUrl: string): string {
    return `https://localhost:7267/${attachmentUrl}`;
  }

  openAttachmentPreview(attachmentUrl: string, type: string): void {
    this.dialog.open(AttachmentPreviewDialogComponent, {
      data: { url: this.getAttachmentUrl(attachmentUrl), type: type },
      panelClass: 'custom-dialog-container'
    });
  }

  onEmojiClick(): void {
    const dialogRef = this.dialog.open(EmojiPickerComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe((emoji: string) => {
      if (emoji) {
        this.newMessage += emoji;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}

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
  Output, SecurityContext
} from '@angular/core';
import { SignalRService } from '../../services/signalr.service';
import { ChatService } from '../../services/chat.service';
import { RecipientInfo } from '../../models/recipient-info.model';
import { MatDialog } from '@angular/material/dialog';
import { AttachmentPreviewDialogComponent } from '../attachment-preview-dialog/attachment-preview-dialog.component';
import {EmojiPickerComponent} from "../emoji-picker/emoji-picker.component";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {EventService} from "../../services/event.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {AppConfigService} from "../../services/app-config.service";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";
import {HttpClient} from "@angular/common/http";
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
  @Output() messageSent = new EventEmitter<void>();
  @ViewChild('chatMessages', {static: false}) private chatMessagesContainer!: ElementRef;
  messages: any[] = [];
  pinnedMessages: any[] = [];
  newMessage: string = '';
  currentUserId = localStorage.getItem('userId');
  recipientInfo: RecipientInfo | null = null; // Thông tin người nhận (bạn bè hoặc nhóm)
  attachmentFile: File | null = null; // Biến lưu trữ tệp đính kèm
  emojiPickerVisible: boolean = false;
  repliedToMessage: any = null; // Store the message being replied to
  repliedToMessageId: string | null = null;
  previewAttachmentUrl: string | ArrayBuffer | null = null;
  private notificationSound = new Audio('assets/newmessage.mp3');
  isPinnedMessagesVisible = false;
  typingTimeout: any;
  isTyping: boolean = false;
  constructor(
    private chatService: ChatService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
    private eventService: EventService,
    private appConfig: AppConfigService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) {
  }

  ngOnInit(): void {
    // Tải tin nhắn và thông tin người nhận nếu đã có recipientId
    if (this.recipientId) {
      this.loadMessages();
      this.loadRecipientInfo();
    }

// Lắng nghe sự kiện "TypingIndicator" từ SignalR
    this.signalRService.typing$.subscribe(() => {
      this.isTyping = true;
      this.cdr.detectChanges(); // Cập nhật UI
    });

// Lắng nghe sự kiện "StopTypingIndicator" từ SignalR
    this.signalRService.stopTyping$.subscribe(() => {
      this.isTyping = false;
      this.cdr.detectChanges(); // Cập nhật UI
    });


    // Lắng nghe sự kiện xóa chat từ EventService
    this.eventService.chatDeleted$.subscribe(() => {
      this.clearMessages(); // Chỉ làm rỗng danh sách tin nhắn
      this.snackBar.open('Chat has been deleted.', 'Close', {
        duration: 3000,
      });
    });

    // Lắng nghe sự kiện thay đổi nickname từ EventService
    this.eventService.nicknameChanged$.subscribe(newNickname => {
      if (this.recipientInfo && newNickname !== null) {
        this.recipientInfo.nickname = newNickname;
        this.cdr.detectChanges(); // Cập nhật giao diện
      }
    });
    this.eventService.memberRemoved$.subscribe(() => {
      setTimeout(() => {
        this.resetRecipientData();
        this.snackBar.open('You have left the group.', 'Close', {
          duration: 3000,
        });
      }, 0);
    });

    // Đăng ký các sự kiện từ SignalR
    this.registerSignalREvents();
  }

  removeAttachment(): void {
    this.attachmentFile = null; // Xóa tệp đính kèm đã chọn
  }

  convertTextToLink(text: any): SafeHtml {
    if (typeof text !== 'string') {
      return text;  // Trả về giá trị gốc nếu không phải là chuỗi
    }

    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const htmlString = text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
    return this.sanitizer.bypassSecurityTrustHtml(htmlString);
  }

  registerSignalREvents(): void {
    // Nhận thông báo từ nhóm
    this.signalRService.groupNotificationReceived$.subscribe(notification => {
      if (notification) {
        this.loadRecipientInfo(); // Tải lại thông tin khi có thay đổi từ nhóm
      }
    });
    this.signalRService.hubConnection.on('UserStatusChanged', () => {
      this.loadRecipientInfo();
    });

    // Nhận tin nhắn
    this.signalRService.messageReceived$.subscribe((message: any) => {
      this.handleReceivedMessage(message);
      if (document.visibilityState !== 'visible') {
        this.playNotificationSound();
      }
    });

    // Nhận sự kiện khi có Reaction mới
    this.signalRService.hubConnection.on('ReactionAdded', (reactionData: any) => {
      console.log('ReactionAdded event received:', reactionData);
      this.handleReactionAdded(reactionData);
    });
    // Nhận sự kiện khi phản ứng bị xóa
    this.signalRService.hubConnection.on('ReactionRemoved', (reactionData: any) => {
      console.log('ReactionRemoved event received:', reactionData);
      this.handleReactionRemoved(reactionData);
    });

    // Nhận thông báo tin nhắn đã đọc
    this.signalRService.messageRead$.subscribe((chatId: string | null) => {
      if (chatId) {
        this.markMessageAsReadInUI(chatId);
      }
    });

    // Nhận danh sách người dùng đang kết nối
    this.signalRService.connectedUsers$.subscribe((connectedUsers: any[]) => {
      console.log('Connected users:', connectedUsers);
    });
    this.signalRService.hubConnection.on('MessageDeleted', (chatId: string) => {
      const message = this.messages.find(msg => msg.id === chatId);
      if (message) {
        message.isDeleted = true;
        message.message = 'Message has been deleted';
        message.attachmentUrl = null;
        this.cdr.detectChanges();
      }
    });



    // Nhận sự kiện liên quan đến bạn bè từ Observable
    this.signalRService.friendEventNotification$.subscribe(event => {
      console.log('Friend event notification received:', event);
      this.handleFriendEvent(event);
      this.handleBlockedByOtherEvent(event);
      this.handleUserBlockedEvent(event);
    });
    this.signalRService.hubConnection.on('MessagePinned', (messageId: string) => {
      this.handleMessagePinned(messageId);
    });

    // Sự kiện nhận thông báo tin nhắn bị bỏ ghim
    this.signalRService.hubConnection.on('MessageUnpinned', (messageId: string) => {
      this.handleMessageUnpinned(messageId);
    });
  }
  checkTypingStatus(): void {
    if (this.newMessage && this.newMessage.trim().length > 0) {
      this.onTyping();
    } else {
      this.onStopTyping();
    }
  }

  onTyping(): void {
    // Gọi phương thức thông báo đang nhập (typing)
    this.signalRService.notifyTyping(this.recipientId!);
  }

  onStopTyping(): void {
    // Gọi phương thức thông báo dừng nhập (stop typing)
    this.signalRService.notifyStopTyping(this.recipientId!);
  }

  clearMessages(): void {
    this.messages = [];  // Làm rỗng danh sách tin nhắn
    console.log("messages cleared");

    // Đảm bảo cập nhật giao diện
    this.cdr.detectChanges(); // Buộc Angular cập nhật giao diện
    console.log("UI updated after clearing messages");

  }
  handleMessagePinned(messageId: string): void {
    const message = this.messages.find(msg => msg.id === messageId);
    if (message) {
      message.isPinned = true;  // Đánh dấu tin nhắn là đã ghim
      this.pinnedMessages.push(message);  // Thêm tin nhắn vào danh sách pinnedMessages
      this.cdr.detectChanges();  // Buộc Angular cập nhật UI
    }
  }
  handleMessageUnpinned(messageId: string): void {
    const message = this.messages.find(msg => msg.id === messageId);
    if (message) {
      message.isPinned = false;  // Đánh dấu tin nhắn là chưa ghim
      this.pinnedMessages = this.pinnedMessages.filter(msg => msg.id !== messageId);  // Loại bỏ tin nhắn khỏi danh sách pinnedMessages
      this.cdr.detectChanges();  // Buộc Angular cập nhật UI
    }
  }


  handleFriendEvent(event: { eventType: string, data: { friendId: string } }): void {
    console.log(`Handling event: ${event.eventType}, for friendId: ${event.data.friendId}, current recipientId: ${this.recipientId}`);
    console.log('Full event data:', event);

    // Kiểm tra nếu sự kiện là FriendRemoved và friendId trùng với recipientId hiện tại
    if (event.eventType === 'FriendRemoved' && this.recipientId === event.data.friendId) {
      console.log(`Friend removed: ${event.data.friendId}. Resetting recipient data.`);
      this.resetRecipientData();
      this.snackBar.open('You have been remove this user.', 'Close', {
        duration: 3000, // Thời gian hiển thị thông báo là 3 giây
      });
    }
  }

  playNotificationSound(): void {
    this.notificationSound.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  }

  handleReactionRemoved(reactionData: any): void {
    const messageIndex = this.messages.findIndex(msg => msg.id === reactionData.chatId);
    if (messageIndex !== -1 && this.messages[messageIndex].Reaction?.$values) {
      const reactionIndex = this.messages[messageIndex].Reaction.$values.findIndex(
        (r: any) => r.userId === reactionData.userId
      );

      if (reactionIndex !== -1) {
        this.messages[messageIndex].Reaction.$values.splice(reactionIndex, 1); // Xóa phản ứng khỏi danh sách

        if (this.messages[messageIndex].Reaction.$values.length === 0) {
          delete this.messages[messageIndex].Reaction; // Hoặc đặt message.Reaction = { $values: [] };
        }

        // Buộc Angular phát hiện sự thay đổi
        this.messages = [...this.messages];
        this.cdr.detectChanges();
      }
    }
  }

  handleMessageDeleted(deletedMessageId: string): void {
    const message = this.messages.find(msg => msg.id === deletedMessageId);
    if (message) {
      message.isDeleted = true;
      message.message = 'Message has been deleted';
      message.attachmentUrl = null; // Optionally remove attachment
      this.cdr.detectChanges(); // Update the UI
    }
  }

  handleReactionAdded(reactionData: any): void {
    const message = this.messages.find(msg => msg.id === reactionData.chatId);
    if (message) {
      // Khởi tạo lại mảng reaction nếu chưa có
      if (!message.Reaction) {
        message.Reaction = {$values: []};
      }

      // Tìm xem reaction của user này đã tồn tại hay chưa
      const existingReactionIndex = message.Reaction.$values.findIndex(
        (r: any) => r.userId === reactionData.userId
      );

      if (existingReactionIndex !== -1) {
        // Nếu đã có reaction từ user này, thay thế bằng reaction mới
        message.Reaction.$values[existingReactionIndex] = {
          id: reactionData.reactionId,
          reactionType: reactionData.reactionType,
          createdAt: new Date().toISOString(),
          userId: reactionData.userId
        };
      } else {
        // Nếu chưa có, thêm reaction mới
        message.Reaction.$values.push({
          id: reactionData.reactionId,
          reactionType: reactionData.reactionType,
          createdAt: new Date().toISOString(),
          userId: reactionData.userId
        });
      }

      // Cập nhật UI
      this.cdr.detectChanges();
    }
  }
  onDeleteMessage(chatId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.chatService.deleteMessage(chatId).subscribe(
        () => {
          // Cập nhật trạng thái của tin nhắn sau khi xóa
          const message = this.messages.find(msg => msg.id === chatId);
          if (message) {
            message.isDeleted = true;
            message.message = 'Message has been deleted';
            message.attachmentUrl = null; // Xóa đính kèm nếu có
            this.cdr.detectChanges();
            // Phát sự kiện xóa tin nhắn
            this.eventService.emitMessageDeleted(chatId);
          }
        },
        (error) => {
          console.error('Error deleting message:', error);
        }
      );
    }
  }

  handleUserBlockedEvent(event: { eventType: string, data: { blockedUserId: string } }): void {
    console.log(`Handling event: ${event.eventType}, for blockedUserId: ${event.data.blockedUserId}, current recipientId: ${this.recipientId}`);
    console.log('Full event data:', event);

    // Kiểm tra nếu sự kiện là UserBlocked và blockedUserId trùng với recipientId hiện tại
    if (event.eventType === 'UserBlocked' && this.recipientId === event.data.blockedUserId) {
      console.log(`User blocked: ${event.data.blockedUserId}. Resetting recipient data.`);
      this.snackBar.open('You have been blocked this user.', 'Close', {
        duration: 3000, // Thời gian hiển thị thông báo là 3 giây
      });
      // Reset lại dữ liệu
      this.resetRecipientData();
    } else {
      console.log(`No matching recipientId found for blockedUserId: ${event.data.blockedUserId}`);
    }
  }


  handleBlockedByOtherEvent(event: { eventType: string, data: { blockedByUserId: string } }): void {
    console.log(`Handling event: ${event.eventType}, for blockedByUserId: ${event.data.blockedByUserId}, current recipientId: ${this.recipientId}`);

    // Kiểm tra nếu sự kiện là UserBlockedByOther và blockedByUserId trùng với recipientId hiện tại
    if (event.eventType === 'UserBlockedByOther' && this.recipientId === event.data.blockedByUserId) {
      console.log(`You have been blocked by user: ${event.data.blockedByUserId}. Resetting recipient data.`);

      // Hiển thị thông báo
      this.snackBar.open('You have been blocked by this user.', 'Close', {
        duration: 3000, // Thời gian hiển thị thông báo là 3 giây
      });

      // Sử dụng setTimeout để trì hoãn việc reset dữ liệu
      setTimeout(() => {
        this.resetRecipientData(); // Reset lại dữ liệu sau 3 giây
      }, 3000); // 3000 ms = 3 giây
    }
  }


  resetRecipientData(): void {
    console.log("resetRecipientData() called");

    // Đặt lại tất cả dữ liệu liên quan đến người nhận
    this.recipientId = null;
    console.log("recipientId reset");

    this.recipientInfo = null;
    console.log("recipientInfo reset");

    this.messages = [];  // Reset danh sách tin nhắn
    console.log("messages reset");

    this.newMessage = '';  // Xóa nội dung tin nhắn đang soạn thảo
    console.log("newMessage reset");

    this.attachmentFile = null;  // Xóa tệp đính kèm hiện tại
    console.log("attachmentFile reset");

    // Đảm bảo cập nhật giao diện
    this.cdr.detectChanges(); // Buộc Angular cập nhật giao diện
    console.log("UI updated after reset");
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['recipientId'] && !changes['recipientId'].isFirstChange()) {
      this.loadMessages();
      this.loadRecipientInfo();
    }
  }

  chatTheme: string = 'default';  // Thêm biến lưu trữ ChatTheme

  loadMessages(): void {
    if (this.recipientId) {
      // Reset mảng pinnedMessages trước khi tải tin nhắn mới
      this.pinnedMessages = [];

      this.chatService.getChats(this.recipientId).subscribe(
        (response: any) => {
          if (response.messages && response.messages.$values) {
            this.messages = response.messages.$values.map((msg: any) => {
              msg.isDeleted = msg.isDeleted || false;
              msg.Reaction = msg.reactions || { $values: [] };

              // Kiểm tra và xử lý tin nhắn được ghim
              if (msg.isPinned) {
                this.pinnedMessages.push(msg); // Lưu vào mảng pinnedMessages nếu tin nhắn được ghim
              }

              if (msg.repliedToMessageId) {
                const repliedMessage = response.messages.$values.find((m: any) => m.id === msg.repliedToMessageId);
                if (repliedMessage) {
                  msg.repliedToMessage = {
                    senderFullName: repliedMessage.senderFullName || 'Unknown',
                    message: repliedMessage.message || 'Message has been deleted'
                  };
                }
              }
              return msg;
            });

            // Sau khi tải tin nhắn, đánh dấu tin nhắn cuối cùng là đã đọc
            const lastMessage = this.messages[this.messages.length - 1];
            if (lastMessage && !lastMessage.isDeleted && lastMessage.userId !== this.currentUserId && !lastMessage.isRead) {
              // Đánh dấu tin nhắn cuối cùng là đã đọc
              this.markMessageAsRead(lastMessage.id);
            }

          } else {
            this.messages = [];
          }

          this.processMessages();
          this.cdr.detectChanges(); // Buộc UI cập nhật
          this.scrollToBottom(); // Cuộn xuống cuối sau khi tải tin nhắn
        },
        (error) => {
          console.error('Error loading messages:', error);
        }
      );
    }
  }

  availableReactions: string[] = ['😊', '😂', '😍', '😢', '😡', '👍', '👎'];
  activeReactionPickerIndex: number | null = null;

  toggleReactionPicker(index: number): void {
    this.activeReactionPickerIndex = this.activeReactionPickerIndex === index ? null : index;
  }

  onAddReaction(chatId: string, reactionType: string): void {
    const message = this.messages.find(msg => msg.id === chatId);
    if (message) {
      this.chatService.addReaction(chatId, reactionType).subscribe(
        (response: any) => {
          // Khởi tạo mảng reaction nếu chưa có
          if (!message.Reaction) {
            message.Reaction = {$values: []};
          }

          // Tìm xem reaction của người dùng này đã tồn tại hay chưa
          const existingReactionIndex = message.Reaction.$values.findIndex(
            (r: any) => r.userId === this.currentUserId
          );

          if (existingReactionIndex !== -1) {
            // Nếu đã có reaction từ người dùng này, thay thế bằng reaction mới
            message.Reaction.$values[existingReactionIndex] = {
              id: response.reactionId,
              reactionType: reactionType,
              createdAt: new Date().toISOString(),
              userId: this.currentUserId
            };
          } else {
            // Nếu chưa có, thêm reaction mới vào UI
            message.Reaction.$values.push({
              id: response.reactionId,
              reactionType: reactionType,
              createdAt: new Date().toISOString(),
              userId: this.currentUserId
            });
          }
          this.cdr.detectChanges();
          this.activeReactionPickerIndex = null; // Đóng picker sau khi chọn
        },
        error => console.error('Error adding reaction:', error)
      );
    }
  }

  onRemoveReaction(chatId: string): void {
    this.chatService.removeReaction(chatId).subscribe(
      () => {
        // Tìm tin nhắn có ID là chatId
        const message = this.messages.find(msg => msg.id === chatId);
        if (message && message.Reaction?.$values) {
          // Lọc bỏ tất cả các phản ứng của người dùng hiện tại khỏi danh sách phản ứng
          message.Reaction.$values = message.Reaction.$values.filter(
            (r: { userId: string }) => r.userId !== this.currentUserId
          );
        }
        this.cdr.detectChanges(); // Cập nhật giao diện
      },
      (error) => {
        console.error('Error removing reaction:', error);
      }
    );
  }

  processMessages(): void {
    let lastMessageDate: dayjs.Dayjs | null = null;

    this.messages.forEach((message, index) => {
      // Chỉ chuyển đổi link trong tin nhắn nếu không có tệp đính kèm
      if (!message.attachmentUrl) {
        message.message = this.convertTextToLink(message.message);
      }

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
          console.error('Error fetching recipient information:', error);
          // Nếu xảy ra lỗi 404, đặt recipientInfo về null
          if (error.status === 404) {
            this.resetRecipientData(); // Reset giao diện
          }
        }
      );
    } else {
      console.log('No recipientId found, skipping loadRecipientInfo');
    }
  }

  // Updated method to handle incoming messages, considering reply logic
  handleReceivedMessage(message: any): void {
    const isForCurrentRecipient =
      (message.toUserId === this.recipientId && message.userId === this.currentUserId) ||
      (message.userId === this.recipientId && message.toUserId === this.currentUserId) ||
      (message.groupId && message.groupId === this.recipientId);

    if (isForCurrentRecipient) {
      const isDuplicate = this.messages.some(msg => msg.id === message.id);
      if (!isDuplicate) {
        if (message.isDeleted) {
          message.message = "Message has been deleted";
        }
        // Kiểm tra và xử lý tin nhắn được trả lời
        if (message.repliedToMessage) {
          message.repliedToMessage = {
            senderFullName: message.repliedToMessage.senderFullName || 'Unknown',
            message: message.repliedToMessage.message || '',
            attachmentUrl: message.repliedToMessage.attachmentUrl || null
          };
        }
        this.messages = [...this.messages, message];
        this.processMessages();
        this.cdr.detectChanges();
        this.scrollToBottom();
        this.markMessageAsRead(message.id);
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
      this.attachmentFile = input.files[0]; // Lưu trữ tệp đính kèm
      this.generatePreviewUrl();
    }
  }
  generatePreviewUrl(): void {
    if (this.attachmentFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result !== undefined) { // Kiểm tra kết quả không phải là undefined
          this.previewAttachmentUrl = e.target.result;
        }
      };
      reader.readAsDataURL(this.attachmentFile);
    }
  }
  // New method to initiate reply
  onReplyMessage(message: any): void {
    // Set the message to be replied to
    this.repliedToMessageId = message.id;
    this.repliedToMessage = {
      senderFullName: message.senderFullName || 'Unknown',
      message: message.message || ''
    };

    // Focus the input field after setting the reply message
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);

  }
// Method to cancel the reply action
  cancelReply(): void {
    this.repliedToMessageId = null; // Clear the ID of the message being replied to
    this.repliedToMessage = null; // Clear the reply message data

    // Optionally, focus back to the input field
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]');
      if (inputElement instanceof HTMLInputElement) {
        inputElement.focus();
      }
    }, 100);
  }


  // Updated onSendMessage method
  onSendMessage(): void {
    if ((this.newMessage.trim() || this.attachmentFile) && this.recipientId) {
      const formData = new FormData();
      formData.append('Message', this.newMessage);
      formData.append('UserId', this.currentUserId || '');
      formData.append('RecipientId', this.recipientId);

      if (this.attachmentFile) {
        formData.append('Attachment', this.attachmentFile);
      }

      if (this.repliedToMessageId) {
        formData.append('RepliedToMessageId', this.repliedToMessageId);
      }

      this.chatService.sendMessage(formData).subscribe(
        (response) => {
          this.newMessage = ''; // Clear the input
          this.attachmentFile = null; // Reset the attachment
          this.repliedToMessageId = null; // Reset the repliedToMessageId
          this.repliedToMessage = null; // Reset the repliedToMessage
          this.handleReceivedMessage(response); // Add the new message to UI
          console.log(`Message sent by user ${this.currentUserId} to recipient ${this.recipientId}:`, response);

          // Notify about the new message
          this.signalRService.sendNewMessageNotification(response);
          this.signalRService.notifyMessageSent();
          this.onStopTyping();
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
    const baseUrl = this.appConfig.getBaseUrl(); // Lấy baseUrl từ AppConfigService
    return `${baseUrl}/${attachmentUrl}`;
  }
  openAttachmentPreview(attachmentUrl: string, type: string): void {
    this.dialog.open(AttachmentPreviewDialogComponent, {
      data: {url: this.getAttachmentUrl(attachmentUrl), type: type},
      panelClass: 'custom-dialog-container'
    });
  }
  onTranslateMessage(message: any): void {
    const targetLanguage = 'en'; // Dịch sang tiếng Anh

    // Làm sạch nội dung trước khi dịch
    const safeContent = this.sanitizer.sanitize(SecurityContext.HTML, message.message);

    // Kiểm tra nếu nội dung đã được làm sạch là rỗng
    if (!safeContent || typeof safeContent !== 'string' || safeContent.trim() === '') {
      console.error('Invalid message content after sanitization:', safeContent);
      return;
    }

    const libreTranslateUrl = 'https://trans.zillyhuhn.com/translate'; // Sử dụng LibreTranslate local

    fetch(libreTranslateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: safeContent,
        source: 'auto', // Chỉ định mã ngôn ngữ tiếng Việt là "vi"
        target: targetLanguage
      })
    })
      .then(response => {
        console.log('Response status:', response.status); // Log trạng thái HTTP
        if (!response.ok) {
          return response.text().then(text => {
            console.error('Error response from API:', text); // Log chi tiết phản hồi lỗi
            throw new Error(`HTTP error! status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Translation response:', data);
        if (data && data.translatedText) {
          const translatedText = data.translatedText;
          message.translatedMessage = translatedText; // Lưu bản dịch vào message
        } else {
          console.error('Translation failed or returned no result', data);
        }
        this.cdr.detectChanges(); // Cập nhật lại giao diện
      })
      .catch(error => {
        console.error('Error translating message:', error);
      });
  }
  onShowOriginalMessage(message: any): void {
    message.translatedMessage = null; // Xóa bản dịch và hiển thị nội dung gốc
  }
  onPinMessage(chatId: string): void {
    this.chatService.pinMessage(chatId).subscribe(
      () => {
        const message = this.messages.find(msg => msg.id === chatId);
        if (message) {
          message.isPinned = true;  // Cập nhật UI để phản ánh trạng thái đã pin
          this.cdr.detectChanges(); // Buộc Angular cập nhật UI
        }
      },
      error => {
        console.error('Error pinning message:', error);
      }
    );
  }

  onUnpinMessage(chatId: string): void {
    this.chatService.unpinMessage(chatId).subscribe(
      () => {
        const message = this.messages.find(msg => msg.id === chatId);
        if (message) {
          message.isPinned = false;  // Cập nhật UI để phản ánh trạng thái đã bỏ ghim
          this.pinnedMessages = this.pinnedMessages.filter(msg => msg.id !== chatId); // Loại bỏ tin nhắn khỏi mảng pinnedMessages
          this.cdr.detectChanges(); // Buộc Angular cập nhật UI
        }
      },
      error => {
        console.error('Error unpinning message:', error);
      }
    );
  }
  showPinnedMessages() {
    this.isPinnedMessagesVisible = true;
  }

  hidePinnedMessages() {
    this.isPinnedMessagesVisible = false;
  }

// Cuộn đến tin nhắn khi nhấp vào pinned message
  onPinnedMessageClick(messageId: string) {
    const messageElement = document.getElementById('message-' + messageId);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Highlight tin nhắn sau khi cuộn tới
      messageElement.classList.add('highlight-message');

      // Xóa highlight sau 2 giây
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
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

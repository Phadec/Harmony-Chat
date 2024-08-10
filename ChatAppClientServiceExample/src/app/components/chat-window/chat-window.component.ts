import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { SignalRService } from '../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  @Input() recipientId: string = '';
  messages: any[] = [];
  newMessage: string = '';
  userId: string; // Biến lưu trữ userId từ localStorage
  private messageSubscription: Subscription | null = null;
  selectedFile: File | null = null; // Biến lưu trữ file được chọn

  constructor(private chatService: ChatService, private signalRService: SignalRService) {
    this.userId = localStorage.getItem('userId') || ''; // Lấy userId từ localStorage
  }

  ngOnInit(): void {
    this.loadMessages();

    this.messageSubscription = this.signalRService.messageReceived$.subscribe(message => {
      if (message.recipientId === this.recipientId) {
        this.messages.push(message);
      }
    });
  }

  ngOnDestroy(): void {
    this.messageSubscription?.unsubscribe();
  }

  loadMessages(): void {
    this.chatService.getChats(this.recipientId).subscribe(data => {
      console.log('Messages loaded: ', data);
      this.messages = data;
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0]; // Lưu file được chọn
  }

  triggerFileInput(): void {
    document.getElementById('fileInput')?.click(); // Kích hoạt input file ẩn
  }

  sendMessage(): void {
    if (this.newMessage.trim() || this.selectedFile) {
      const formData = new FormData();
      formData.append('UserId', this.userId);
      formData.append('RecipientId', this.recipientId);
      formData.append('Message', this.newMessage);

      if (this.selectedFile) {
        formData.append('Attachment', this.selectedFile, this.selectedFile.name);
      }

      this.chatService.sendMessage(formData).subscribe(response => {
        this.newMessage = '';
        this.selectedFile = null; // Reset selected file
        this.loadMessages(); // Reload messages after sending
      });
    }
  }
}

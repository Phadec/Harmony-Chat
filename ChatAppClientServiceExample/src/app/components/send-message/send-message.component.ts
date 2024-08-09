import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-send-message',
  templateUrl: './send-message.component.html',
  styleUrls: ['./send-message.component.css']
})
export class SendMessageComponent {
  @Input() recipientId: string | null = null;
  @Output() messageSent = new EventEmitter<void>();
  messageForm: FormGroup;

  constructor(private chatService: ChatService, private fb: FormBuilder) {
    this.messageForm = this.fb.group({
      message: ['', Validators.required],
      attachment: [null]
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.messageForm.patchValue({ attachment: file });
    }
  }

  sendMessage(): void {
    if (this.messageForm.valid && this.recipientId) {
      const formData = new FormData();
      formData.append('message', this.messageForm.get('message')?.value);
      formData.append('userId', localStorage.getItem('userId') || '');
      formData.append('recipientId', this.recipientId);

      const attachment = this.messageForm.get('attachment')?.value;
      if (attachment) {
        formData.append('attachment', attachment);
      }

      this.chatService.sendMessage(formData).subscribe({
        next: (response) => {
          this.messageForm.reset();
          this.messageSent.emit();  // Phát sự kiện khi tin nhắn được gửi
        },
        error: (error) => {
          console.error('Failed to send message:', error);
        }
      });
    }
  }
}

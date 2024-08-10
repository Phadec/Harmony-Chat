import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.css']
})
export class MessageInputComponent {
  newMessage: string = '';

  @Output() sendMessage = new EventEmitter<string>();

  sendMessageHandler(): void {
    if (this.newMessage.trim()) {
      this.sendMessage.emit(this.newMessage);
      this.newMessage = ''; // Xóa nội dung tin nhắn sau khi gửi
    }
  }
}

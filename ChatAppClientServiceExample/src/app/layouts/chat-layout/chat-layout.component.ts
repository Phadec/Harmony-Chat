import { Component } from '@angular/core';

@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.css']
})
export class ChatLayoutComponent {
  selectedRecipientId: string | null = null;

  onRecipientSelected(recipientId: string): void {
    this.selectedRecipientId = recipientId;
  }
}

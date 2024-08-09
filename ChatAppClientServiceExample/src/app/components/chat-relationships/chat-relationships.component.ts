import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-relationships',
  templateUrl: './chat-relationships.component.html',
  styleUrls: ['./chat-relationships.component.css']
})
export class ChatRelationshipsComponent implements OnInit {
  @Output() recipientSelected = new EventEmitter<string>();
  relationships: any[] = [];
  errorMessage: string | null = null;
  selectedRecipient: string | null = null;  // Define selectedRecipient

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.getRelationships().subscribe({
      next: (response) => {
        if (response && response.$values) {
          this.relationships = response.$values;
          console.log('Relationships loaded:', this.relationships);
        } else {
          this.errorMessage = 'No relationships found.';
        }
      },
      error: (error) => {
        this.errorMessage = error.error.Message || 'Failed to load relationships.';
        console.error('Error loading relationships:', error);
      }
    });
  }

  selectRecipient(recipientId: string): void {
    this.selectedRecipient = recipientId;  // Assign value to selectedRecipient
    this.recipientSelected.emit(recipientId);
    console.log('Recipient selected:', recipientId);
  }
}

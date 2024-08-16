import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatStateService {

  private recipientInfoSource = new BehaviorSubject<any>(null);
  recipientInfo$ = this.recipientInfoSource.asObservable();

  private selectedRecipientIdSubject = new BehaviorSubject<string | null>(null);
  selectedRecipientId$ = this.selectedRecipientIdSubject.asObservable();

  private messagesSubject = new BehaviorSubject<any[]>([]);
  messages$ = this.messagesSubject.asObservable();

  updateRecipientInfo(info: any) {
    if (info) {
      console.log('ChatStateService - Updating recipient info:', info);
      this.recipientInfoSource.next(info);
    } else {
      this.resetChatState();
    }
  }

  updateMessages(messages: any[]): void {
    console.log('ChatStateService - Updating messages:', messages);
    this.messagesSubject.next(messages);
  }

  resetChatState(): void {
    console.log("ChatStateService - Resetting chat state");
    this.recipientInfoSource.next(null);
    this.messagesSubject.next([]);
  }
  setSelectedRecipient(recipientId: string): void {
    this.selectedRecipientIdSubject.next(recipientId);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  private recipientIdSource = new BehaviorSubject<string | null>(null);
  currentRecipientId$ = this.recipientIdSource.asObservable();

  constructor() {}

  changeRecipientId(recipientId: string) {
    this.recipientIdSource.next(recipientId);
  }
}

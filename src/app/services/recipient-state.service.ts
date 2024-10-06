import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipientStateService {
  // BehaviorSubject giữ trạng thái hiện tại của recipientId và recipientInfo
  private recipientIdSubject = new BehaviorSubject<string | null>(null);
  recipientId$ = this.recipientIdSubject.asObservable();

  private recipientInfoSubject = new BehaviorSubject<any | null>(null);
  recipientInfo$ = this.recipientInfoSubject.asObservable();

  // Phương thức để cập nhật recipientId
  setRecipientId(recipientId: string | null): void {
    this.recipientIdSubject.next(recipientId);
  }

  // Phương thức để cập nhật recipientInfo
  setRecipientInfo(recipientInfo: any | null): void {
    this.recipientInfoSubject.next(recipientInfo);
  }
}

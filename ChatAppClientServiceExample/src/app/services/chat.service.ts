import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://localhost:7267/api/chats';
  private currentRecipientId: string | null = null;

  constructor(private http: HttpClient) {}

  getCurrentRecipientId(): string | null {
    return this.currentRecipientId;
  }

  setCurrentRecipientId(recipientId: string): void {
    this.currentRecipientId = recipientId;
  }

  getChats(userId: string, recipientId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-chats?userId=${userId}&recipientId=${recipientId}`);
  }

  sendMessage(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-message`, formData);
  }
}

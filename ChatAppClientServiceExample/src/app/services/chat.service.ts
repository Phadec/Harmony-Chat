import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {RecipientInfo} from "../models/recipient-info.model";

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://localhost:7267/api/chats';

  constructor(private http: HttpClient) {}

  getRelationships(): Observable<any> {
    const userId = localStorage.getItem('userId');
    return this.http.get(`${this.apiUrl}/get-relationships`, { params: { userId: userId || '' } });
  }

  getChats(recipientId: string): Observable<any> {
    const userId = localStorage.getItem('userId');
    return this.http.get<any>(`${this.apiUrl}/get-chats?userId=${userId}&recipientId=${recipientId}`);
  }

  sendMessage(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-message`, formData);
  }
  getRecipientInfo(userId: string, recipientId: string): Observable<RecipientInfo> {
    return this.http.get<RecipientInfo>(`${this.apiUrl}/${userId}/recipient-info/${recipientId}`);
  }
  markMessageAsRead(chatId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${chatId}/mark-as-read`, {});
  }
}

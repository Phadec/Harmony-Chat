import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {RecipientInfo} from "../models/recipient-info.model";
import {AppConfigService} from "./app-config.service";

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl: string;

  constructor(private http: HttpClient, private appConfig: AppConfigService) {
    this.apiUrl = `${this.appConfig.getBaseUrl()}/api/chats`;
  }

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
  deleteChat(userId: string, recipientId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/delete-chats/${recipientId}`);
  }
  addReaction(chatId: string, reactionType: string): Observable<any> {
    const body = { reactionType };
    return this.http.post<any>(`${this.apiUrl}/${chatId}/react`, body);
  }
  removeReaction(chatId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${chatId}/remove-reaction`);
  }
  deleteMessage(chatId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${chatId}/delete-message`, {});
  }

}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecipientInfo } from "../models/recipient-info.model";
import { AppConfigService } from "./app-config.service";

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl: string;

  constructor(private http: HttpClient, private appConfig: AppConfigService) {
    this.apiUrl = `${this.appConfig.getBaseUrl()}/api/chats`;
  }

  // Lấy các mối quan hệ (bạn bè, nhóm)
  getRelationships(): Observable<any> {
    const userId = localStorage.getItem('userId');
    return this.http.get(`${this.apiUrl}/get-relationships`, { params: { userId: userId || '' } });
  }

  // Lấy các tin nhắn giữa người dùng và người nhận
  getChats(recipientId: string, pageNumber: number = 1, pageSize: number = 20): Observable<any> {
    const userId = localStorage.getItem('userId');
    return this.http.get<any>(`${this.apiUrl}/get-chats`, {
      params: {
        userId: userId || '',           // Lấy userId từ localStorage
        recipientId: recipientId,       // Người nhận
        pageNumber: pageNumber.toString(),  // Số trang
        pageSize: pageSize.toString()      // Kích thước trang
      }
    });
  }

  // Gửi tin nhắn
  sendMessage(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-message`, formData);
  }

  // Lấy thông tin người nhận
  getRecipientInfo(userId: string, recipientId: string): Observable<RecipientInfo> {
    return this.http.get<RecipientInfo>(`${this.apiUrl}/${userId}/recipient-info/${recipientId}`);
  }

  // Đánh dấu tin nhắn là đã đọc
  markMessageAsRead(chatId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${chatId}/mark-as-read`, {});
  }

  // Xóa tất cả tin nhắn giữa người dùng và người nhận
  deleteChat(userId: string, recipientId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/delete-chats/${recipientId}`);
  }

  // Thêm phản ứng vào tin nhắn
  addReaction(chatId: string, reactionType: string): Observable<any> {
    const body = { reactionType };
    return this.http.post<any>(`${this.apiUrl}/${chatId}/react`, body);
  }

  // Xóa phản ứng từ tin nhắn
  removeReaction(chatId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${chatId}/remove-reaction`);
  }

  // Xóa tin nhắn
  deleteMessage(chatId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${chatId}/delete-message`, {});
  }

  // Ghim tin nhắn
  pinMessage(chatId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${chatId}/pin`, {});
  }

  // Bỏ ghim tin nhắn
  unpinMessage(chatId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${chatId}/unpin`, {});
  }
}

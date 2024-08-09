import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection: signalR.HubConnection;
  private apiUrl = 'https://localhost:7267/api/chats';

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.apiUrl}/hubs/chat`) // Đường dẫn tới SignalR Hub trên server
      .build();

    this.hubConnection.start().then(() => {
      console.log('SignalR Connected');
    }).catch(err => console.error('SignalR Connection Error: ', err));
  }

  public onMessageReceived(callback: (message: any) => void): void {
    this.hubConnection.on('ReceiveMessage', callback);
  }

  sendMessage(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-message`, formData);
  }

  getRelationships(): Observable<any> {
    const userId = localStorage.getItem('userId');
    return this.http.get(`${this.apiUrl}/get-relationships`, { params: { userId: userId || '' } });
  }

  getChats(recipientId: string): Observable<any> {
    const userId = localStorage.getItem('userId');
    return this.http.get<any>(`${this.apiUrl}/get-chats?userId=${userId}&recipientId=${recipientId}`);
  }
}

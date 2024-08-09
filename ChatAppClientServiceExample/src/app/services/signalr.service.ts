import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/chathub`)
      .build();
  }

  public startConnection(): void {
    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));
  }

  public addReceiveMessageListener(): void {
    this.hubConnection.on('ReceivePrivateMessage', (message) => {
      console.log('New private message received:', message);
      // Xử lý logic để cập nhật UI với tin nhắn mới
    });

    this.hubConnection.on('ReceiveGroupMessage', (message) => {
      console.log('New group message received:', message);
      // Xử lý logic để cập nhật UI với tin nhắn mới
    });
  }

  public stopConnection(): void {
    this.hubConnection.stop()
      .then(() => console.log('Connection stopped'))
      .catch(err => console.log('Error while stopping connection: ' + err));
  }
}

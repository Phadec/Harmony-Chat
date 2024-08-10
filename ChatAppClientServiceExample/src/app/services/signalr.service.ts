import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;
  private messageReceived = new Subject<any>();
  public messageReceived$ = this.messageReceived.asObservable();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7267/chat-hub', {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .build();
  }

  public startConnection(): void {
    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection started'))
      .catch(err => console.log('Error while starting SignalR connection: ' + err));
  }

  public addReceiveMessageListener(): void {
    this.hubConnection.on('ReceivePrivateMessage', (message) => {
      this.messageReceived.next(message);  // Emit sự kiện khi nhận tin nhắn
    });

    this.hubConnection.on('ReceiveGroupMessage', (message) => {
      this.messageReceived.next(message);  // Emit sự kiện khi nhận tin nhắn
    });
  }

  public stopConnection(): void {
    this.hubConnection.stop()
      .then(() => console.log('SignalR Connection stopped'))
      .catch(err => console.log('Error while stopping SignalR connection: ' + err));
  }
}


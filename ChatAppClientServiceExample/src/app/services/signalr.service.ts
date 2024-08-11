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
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      this.hubConnection
        .start()
        .then(() => console.log('SignalR Connection started'))
        .catch(err => console.log('Error while starting SignalR connection: ' + err));
    } else {
      console.log('SignalR connection already started.');
    }
  }

  public addReceiveMessageListener(): void {
    this.hubConnection.on('ReceivePrivateMessage', (message) => {
      console.log('Private message received:', message); // Log tin nhắn nhận được
      this.messageReceived.next(message);
    });

    this.hubConnection.on('ReceiveGroupMessage', (message) => {
      console.log('Group message received:', message); // Log tin nhắn nhận được
      this.messageReceived.next(message);
    });
  }

  public stopConnection(): void {
    if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR Connection stopped'))
        .catch(err => console.log('Error while stopping SignalR connection: ' + err));
    }
  }
}

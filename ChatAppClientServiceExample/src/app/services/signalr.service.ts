import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  public hubConnection: signalR.HubConnection;
  private messageReceived = new BehaviorSubject<any>(null);
  private messageRead = new BehaviorSubject<string | null>(null);
  private connectedUsers = new BehaviorSubject<any[]>([]);

  public messageReceived$: Observable<any> = this.messageReceived.asObservable();
  public messageRead$: Observable<string | null> = this.messageRead.asObservable();
  public connectedUsers$: Observable<any[]> = this.connectedUsers.asObservable();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7267/chat-hub', {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    this.startConnection();
    this.registerServerEvents();
  }

  public startConnection(): void {
    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR Connection started');
        this.hubConnection.invoke('Connect', localStorage.getItem('userId'))
          .then(() => console.log('User connected successfully.'))
          .catch(err => console.log('Error while invoking Connect: ' + err));
      })
      .catch(err => console.log('Error while starting SignalR connection: ' + err));
  }

  public registerServerEvents(): void {
    this.hubConnection.on('ReceivePrivateMessage', (message) => {
      console.log('Private message received:', message);
      this.messageReceived.next(message);
    });

    this.hubConnection.on('ReceiveGroupMessage', (message) => {
      console.log('Group message received:', message);
      this.messageReceived.next(message);
    });

    this.hubConnection.on('MessageRead', (chatId) => {
      console.log(`Message ${chatId} has been read.`);
      this.messageRead.next(chatId);
    });

    this.hubConnection.on('UpdateConnectedUsers', (connectedUsers) => {
      console.log('Connected users:', connectedUsers);
      this.connectedUsers.next(connectedUsers);
    });

    this.hubConnection.on('NewMessageReceived', (notification) => {
      console.log('New message received notification:', notification);
      this.messageReceived.next(notification); // Trigger message received event
    });

    this.hubConnection.on('MessageReadByRecipient', (notification) => {
      console.log(`Message ${notification.chatId} has been read by the recipient.`);
      this.messageRead.next(notification.chatId); // Trigger message read event
    });
  }

  public notifyMessageRead(chatId: string): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('NotifyMessageRead', chatId)
        .then(() => console.log(`Notification sent for message ${chatId} read by user`))
        .catch(err => console.error(`Error sending read notification: ${err}`));
    } else {
      console.warn('Hub connection is not established. Cannot send read notification.');
    }
  }

  public sendNewMessageNotification(chat: any): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('NotifyNewMessage', chat)
        .then(() => console.log(`Notification sent for new message ${chat.Id}`))
        .catch(err => console.error(`Error sending new message notification: ${err}`));
    } else {
      console.warn('Hub connection is not established. Cannot send new message notification.');
    }
  }


  public stopConnection(): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR Connection stopped'))
        .catch(err => console.log('Error while stopping SignalR connection: ' + err));
    }
  }
}

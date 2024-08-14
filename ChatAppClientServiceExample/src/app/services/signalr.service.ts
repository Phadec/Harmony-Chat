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
  private friendRequestSent = new BehaviorSubject<any>(null); // Add this line


  public messageReceived$: Observable<any> = this.messageReceived.asObservable();
  public messageRead$: Observable<string | null> = this.messageRead.asObservable();
  public connectedUsers$: Observable<any[]> = this.connectedUsers.asObservable();
  public friendRequestSent$: Observable<any> = this.friendRequestSent.asObservable(); // Add this line
  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7267/chat-hub', {
        accessTokenFactory: () => sessionStorage.getItem('token') || ''
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
    this.hubConnection.on('FriendRequestSent', (friendRequest) => {
      console.log('Friend request sent:', friendRequest);
      this.friendRequestSent.next(friendRequest);
    });


    this.hubConnection.on('NicknameChanged', (userId, nickname) => {
      console.log(`Nickname changed for user ${userId}. New nickname: ${nickname}`);
      // Xử lý cập nhật nickname trong giao diện
    });

    this.hubConnection.on('FriendRequestReceived', (userId, requestId) => {
      console.log(`New friend request received from ${userId}. Request ID: ${requestId}`);
      // Xử lý cập nhật giao diện khi có yêu cầu kết bạn mới
    });

    this.hubConnection.on('FriendRemoved', (userId) => {
      console.log(`Friend removed: ${userId}`);
      // Xử lý cập nhật giao diện khi bạn bè bị xóa
    });

    this.hubConnection.on('UserBlocked', (userId) => {
      console.log(`User blocked: ${userId}`);
      // Xử lý cập nhật giao diện khi người dùng bị chặn
    });

    this.hubConnection.on('UserUnblocked', (userId) => {
      console.log(`User unblocked: ${userId}`);
      // Xử lý cập nhật giao diện khi người dùng được bỏ chặn
    });

    this.hubConnection.on('FriendRequestAccepted', (userId) => {
      console.log(`Friend request accepted by ${userId}`);
      // Xử lý cập nhật giao diện khi yêu cầu kết bạn được chấp nhận
    });
    this.hubConnection.on('FriendRequestSent', (friendRequest) => {
      console.log('Friend request sent:', friendRequest);
    });


    this.hubConnection.on('FriendRequestRejected', (userId) => {
      console.log(`Friend request rejected by ${userId}`);
      // Xử lý cập nhật giao diện khi yêu cầu kết bạn bị từ chối
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

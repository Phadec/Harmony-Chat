import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  public hubConnection: signalR.HubConnection;
  private messageReceived = new BehaviorSubject<any>(null);
  private messageRead = new BehaviorSubject<string | null>(null);
  private connectedUsers = new BehaviorSubject<any[]>([]);
  private friendRequestSent = new BehaviorSubject<any>(null);
  private groupNotificationReceived = new BehaviorSubject<any>(null);

  public messageReceived$: Observable<any> = this.messageReceived.asObservable();
  public messageRead$: Observable<string | null> = this.messageRead.asObservable();
  public connectedUsers$: Observable<any[]> = this.connectedUsers.asObservable();
  public friendRequestSent$: Observable<any> = this.friendRequestSent.asObservable();
  public groupNotificationReceived$: Observable<any> = this.groupNotificationReceived.asObservable();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7267/chat-hub', {
        accessTokenFactory: () => this.getAccessToken()
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 10000, 30000]) // Tự động thử lại với thời gian giãn cách: ngay lập tức, 2 giây, 10 giây, 30 giây
      .build();

    this.startConnection();
    this.registerServerEvents();
    window.addEventListener('beforeunload', this.stopConnection.bind(this));
  }

  private getAccessToken(): string {
    const token = localStorage.getItem('token');
    if (token && this.isTokenExpired(token)) {
      // Làm mới token hoặc yêu cầu đăng nhập lại
      this.refreshToken();
      return ''; // Trả về token tạm thời trống, cần kiểm soát sau khi làm mới
    }
    return token || '';
  }

  private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate < new Date();
  }

  private refreshToken(): void {
    // Hàm làm mới token, thực hiện theo logic của bạn.
    // Sau khi làm mới thành công, lưu token mới vào localStorage
    // và khởi động lại kết nối SignalR.
    console.log('Refreshing token...');
    // Ví dụ gọi API làm mới token
    // fetch('your-refresh-token-api-endpoint').then(response => {
    //   const newToken = response.token;
    //   localStorage.setItem('token', newToken);
    //   this.startConnection(); // Kết nối lại sau khi làm mới token thành công
    // });
  }

  public startConnection(): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      this.hubConnection
        .start()
        .then(() => {
          console.log('SignalR Connection started');
          this.registerServerEvents(); // Đảm bảo gọi hàm này sau khi kết nối thành công
        })
        .catch(err => {
          console.error('Error while starting SignalR connection:', err);
          if (err.message.includes('Unauthorized')) {
            console.error('Token might be expired or invalid. Please check the token.');
            this.refreshToken();
          }
        });
    } else {
      console.log('HubConnection is not in Disconnected state. Current state:', this.hubConnection.state);
    }
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

    this.hubConnection.on('NotifyFriendRequestReceived', (userId: string, requestId: string) => {
      console.log(`New friend request received from ${userId}. Request ID: ${requestId}`);
      // Xử lý cập nhật giao diện ở đây
    });

    this.hubConnection.on('NotifyGroupMembers', (groupId: string, message: string) => {
      console.log(`Notification received for group ${groupId}: ${message}`);
      this.groupNotificationReceived.next({ groupId, message });
    });

    // Xử lý các sự kiện kết nối lại và mất kết nối
    this.hubConnection.onreconnecting(error => {
      console.warn('Connection lost due to error. Reconnecting...', error);
    });

    this.hubConnection.onreconnected(connectionId => {
      console.log('Reconnected successfully. ConnectionId:', connectionId);
    });

    this.hubConnection.onclose(error => {
      if (error) {
        console.error('Connection closed due to error:', error);
      } else {
        console.log('Connection closed.');
      }
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
    if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR Connection stopped'))
        .catch(err => console.log('Error while stopping SignalR connection: ' + err));
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.stopConnection.bind(this));
    this.stopConnection(); // Ensure the connection is stopped when service is destroyed
  }
}

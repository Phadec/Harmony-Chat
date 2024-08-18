import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, filter, Observable, Subject, Subscription } from 'rxjs';
import { NavigationEnd, Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  public hubConnection: signalR.HubConnection;
  private urlSubscription: Subscription;

  // Các tín hiệu liên quan đến cuộc gọi video/thoại
  private offerReceived = new BehaviorSubject<any>(null);
  private answerReceived = new BehaviorSubject<any>(null);
  private iceCandidateReceived = new BehaviorSubject<any>(null);
  private callEnded = new Subject<void>();

  private messageReceived = new BehaviorSubject<any>(null);
  private messageRead = new BehaviorSubject<string | null>(null);
  private connectedUsers = new BehaviorSubject<any[]>([]);
  private friendRequestSent = new BehaviorSubject<any>(null);
  private groupNotificationReceived = new BehaviorSubject<any>(null);
  private nicknameChangedSource = new BehaviorSubject<string | null>(null);
  public messageSent = new Subject<void>();
  // Friend-related observables
  private friendAdded = new BehaviorSubject<any>(null);
  private friendRemoved = new BehaviorSubject<any>(null);
  private friendRequestReceived = new BehaviorSubject<any>(null);
  private nicknameChanged = new BehaviorSubject<any>(null);
  private userBlocked = new BehaviorSubject<any>(null);
  private userUnblocked = new BehaviorSubject<any>(null);
  private friendEventNotification = new Subject<any>();

  public messageReceived$: Observable<any> = this.messageReceived.asObservable();
  public messageRead$: Observable<string | null> = this.messageRead.asObservable();
  public connectedUsers$: Observable<any[]> = this.connectedUsers.asObservable();
  public groupNotificationReceived$: Observable<any> = this.groupNotificationReceived.asObservable();
  public friendEventNotification$: Observable<any> = this.friendEventNotification.asObservable();

  // WebRTC-related observables
  public offerReceived$: Observable<any> = this.offerReceived.asObservable();
  public answerReceived$: Observable<any> = this.answerReceived.asObservable();
  public iceCandidateReceived$: Observable<any> = this.iceCandidateReceived.asObservable();
  private incomingCall = new Subject<{ callerId: string, callType: 'voice' | 'video' }>();
  public incomingCall$ = this.incomingCall.asObservable();
  public callEnded$: Observable<void> = this.callEnded.asObservable();

  constructor(private router: Router) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7267/chat-hub', {
        accessTokenFactory: () => this.getAccessToken()
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();

    this.urlSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url === '/chats') {
          this.startConnection();
        } else {
          this.stopConnection();
        }
      });

    // Optionally start connection if the current URL is '/chats' when the service is initialized
    if (this.router.url === '/chats') {
      this.startConnection();
    }

    window.addEventListener('beforeunload', this.stopConnection.bind(this));
  }

  private getAccessToken(): string {
    const token = localStorage.getItem('token');
    if (token && this.isTokenExpired(token)) {
      this.refreshToken();
      return '';
    }
    return token || '';
  }

  private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationDate = new Date(payload.exp * 1000);
    return expirationDate < new Date();
  }

  private refreshToken(): void {
    console.log('Refreshing token...');
  }

  public startConnection(): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      this.hubConnection
        .start()
        .then(() => {
          console.log('SignalR Connection started');
          this.registerServerEvents();
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
    this.hubConnection.on('FriendRequestReceived', (friendRequest) => {
      console.log('Friend request received:', friendRequest);
      this.friendRequestReceived.next(friendRequest); // Emit event
    });

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
      this.nicknameChanged.next({ userId, nickname });
    });

    this.hubConnection.on('NotifyFriendRequestReceived', (friendRequest) => {
      console.log('Friend request received:', friendRequest);
      this.friendRequestReceived.next(friendRequest);
    });

    this.hubConnection.on('NotifyFriendAdded', (friend) => {
      console.log('Friend added:', friend);
      this.friendAdded.next(friend);
    });

    this.hubConnection.on('NotifyFriendRemoved', (friend) => {
      console.log('Friend removed:', friend);
      this.friendRemoved.next(friend);
    });

    this.hubConnection.on('UserBlocked', (blockedUserId) => {
      console.log('User blocked:', blockedUserId);
      this.userBlocked.next(blockedUserId);
    });

    this.hubConnection.on('FriendEventNotification', (data) => {
      console.log('Friend event notification received:', data);
      this.friendEventNotification.next(data);
    });
    this.hubConnection.on('UserUnblocked', (unblockedUserId) => {
      console.log('User unblocked:', unblockedUserId);
      this.userUnblocked.next(unblockedUserId);
    });

    this.hubConnection.on('NotifyGroupMembers', (groupId: string, message: string) => {
      console.log(`Notification received for group ${groupId}: ${message}`);
      this.groupNotificationReceived.next({ groupId, message });
    });

    this.hubConnection.onreconnecting(error => {
      console.warn('Connection lost due to error. Reconnecting...', error);
    });

    this.hubConnection.onreconnected(connectionId => {
      console.log('Reconnected successfully. ConnectionId:', connectionId);
    });

    // Tín hiệu WebRTC
    this.hubConnection.on('ReceiveOffer', (offer, connectionId) => {
      console.log('Offer received:', offer);
      this.offerReceived.next({ offer, connectionId });
    });

    this.hubConnection.on('ReceiveAnswer', (answer) => {
      console.log('Answer received:', answer);
      this.answerReceived.next(answer);
    });

    this.hubConnection.on('ReceiveIceCandidate', (candidate) => {
      console.log('ICE Candidate received:', candidate);
      this.iceCandidateReceived.next(candidate);
    });

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
    this.hubConnection.on('IncomingCall', (callerId: string, callType: 'voice' | 'video') => {
      console.log(`Incoming ${callType} call from ${callerId}`);
      this.incomingCall.next({ callerId, callType });
    });
    this.hubConnection.on('CallEnded', () => {
      console.log('Call ended signal received.');
      this.callEnded.next();
    });

  }
  sendReject(connectionId: string): void {
    this.hubConnection.invoke('RejectCall', connectionId)
      .catch(err => console.error('Error sending reject call:', err));
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

  // Gửi tín hiệu WebRTC
  public sendOffer(offer: string, targetUserId: string): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log('Sending offer to server:', offer); // Thêm log để kiểm tra dữ liệu offer được gửi đi
      this.hubConnection.invoke('SendOffer', offer, targetUserId)
        .then(() => {
          console.log('Offer successfully sent to server'); // Log khi gửi thành công
        })
        .catch(err => {
          console.error('Error sending offer:', err); // Log nếu có lỗi xảy ra
        });
    } else {
      console.warn('Hub connection is not established. Cannot send offer.');
    }
  }

  public sendAnswer(answer: string, connectionId: string): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendAnswer', answer, connectionId)
        .catch(err => console.error('Error sending answer:', err));
    } else {
      console.warn('Hub connection is not established. Cannot send answer.');
    }
  }

  public sendIceCandidate(candidate: string, connectionId: string): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendIceCandidate', candidate, connectionId)
        .catch(err => console.error('Error sending ICE candidate:', err));
    } else {
      console.warn('Hub connection is not established. Cannot send ICE candidate.');
    }
  }

  public stopConnection(): void {
    if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR Connection stopped'))
        .catch(err => console.log('Error while stopping SignalR connection: ' + err));
    }
  }

  public notifyMessageSent(): void {
    this.messageSent.next(); // Phát sự kiện khi có tin nhắn mới
  }

  changeNickname(newNickname: string): void {
    this.nicknameChangedSource.next(newNickname);
  }

  public notifyIncomingCall(callerId: string, callType: 'voice' | 'video'): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('NotifyIncomingCall', callerId, callType)
        .then(() => console.log(`Incoming call notification sent from ${callerId}`))
        .catch(err => console.error(`Error sending incoming call notification: ${err}`));
    } else {
      console.warn('Hub connection is not established. Cannot send incoming call notification.');
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.stopConnection.bind(this));
    this.stopConnection();
  }
}
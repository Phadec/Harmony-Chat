import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, filter, Observable, Subject, Subscription } from 'rxjs';
import { NavigationEnd, Router } from "@angular/router";
import {IncomingCallPopupComponent} from "../components/incoming-call-popup/incoming-call-popup.component";
import {MatDialog} from "@angular/material/dialog";
import {AppConfigService} from "./app-config.service";

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  public hubConnection: signalR.HubConnection;
  private urlSubscription: Subscription;
  private callAcceptedSubject = new Subject<void>();
  private connectionState = new BehaviorSubject<boolean>(false);
  private messageReceived = new BehaviorSubject<any>(null);
  private messageRead = new BehaviorSubject<string | null>(null);
  private connectedUsers = new BehaviorSubject<any[]>([]);
  private groupNotificationReceived = new BehaviorSubject<any>(null);
  public messageSent = new Subject<void>();
  // Friend-related observables
  private friendEventNotification = new Subject<any>();

  public messageReceived$: Observable<any> = this.messageReceived.asObservable();
  public messageRead$: Observable<string | null> = this.messageRead.asObservable();
  public connectedUsers$: Observable<any[]> = this.connectedUsers.asObservable();
  public groupNotificationReceived$: Observable<any> = this.groupNotificationReceived.asObservable();
  public friendEventNotification$: Observable<any> = this.friendEventNotification.asObservable();
  private ringingAudio: HTMLAudioElement | null = null;

  constructor(private router: Router, private dialog: MatDialog, private appConfig: AppConfigService) {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.appConfig.getBaseUrl()}/chat-hub`, {
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
    console.log('Attempting to start SignalR connection...');  // Kiểm tra xem hàm có được gọi hay không
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      this.hubConnection
        .start()
        .then(() => {
          console.log('SignalR Connection started');
          this.connectionState.next(true);
          this.registerServerEvents();
        })
        .catch(err => {
          console.error('Error while starting SignalR connection:', err);
          this.connectionState.next(false);
        });
    } else {
      console.log('SignalR connection is already established.');
    }
  }
// Phương thức phát âm thanh khi có cuộc gọi đến
  private startRinging(): void {
    this.ringingAudio = new Audio('assets/ringreceive.mp3'); // Đảm bảo đường dẫn này đúng
    this.ringingAudio.loop = true;
    this.ringingAudio.play().catch(error => {
      console.error('Failed to play ringing sound:', error);
    });
  }

  // Phương thức dừng phát âm thanh
  private stopRinging(): void {
    if (this.ringingAudio) {
      this.ringingAudio.pause();
      this.ringingAudio.currentTime = 0;
    }
  }

  public getConnectionState(): BehaviorSubject<boolean> {
    return this.connectionState;
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

    this.hubConnection.on('FriendEventNotification', (data) => {
      console.log('Friend event notification received:', data);
      this.friendEventNotification.next(data);
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

    this.hubConnection.onclose(error => {
      if (error) {
        console.error('Connection closed due to error:', error);
      } else {
        console.log('Connection closed.');
      }
    });
    this.hubConnection.on('ReceiveCall', (data) => {
      console.log('Data received from server:', data);
      if (data && data.callerName && data.peerId) {
        this.handleIncomingCall(data);
      }
    });

    this.hubConnection.on('PeerIdUpdated', (peerId: string) => {
      console.log(`PeerId ${peerId} registered successfully.`);
      // Thực hiện các hành động khác nếu cần thiết
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
  public callAccepted(): void {
    this.callAcceptedSubject.next();
  }
  public onCallAccepted(): Observable<void> {
    return this.callAcceptedSubject.asObservable();
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

  public notifyMessageSent(): void {
    this.messageSent.next(); // Phát sự kiện khi có tin nhắn mới
  }
  public async registerPeerId(userId: string, peerId: string): Promise<void> {
    try {
      await this.hubConnection.invoke('RegisterPeerId', userId, peerId);
      console.log(`PeerId ${peerId} registered successfully for user ${userId}`);
    } catch (error) {
      console.error('Error registering PeerId:', error);
    }
  }

  // Phương thức để lấy peerId từ server
  public async getPeerId(userId: string): Promise<string> {
    try {
      return await this.hubConnection.invoke<string>('GetPeerId', userId);
    } catch (error) {
      console.error('Error getting peerId from server:', error);
      return '';
    }
  }
  public handleEndCall(peerId: string, isVideoCall: boolean): void {
    this.hubConnection.invoke('HandleEndingCall', peerId, isVideoCall)
      .catch(err => console.error('Error handling ending call:', err));
  }

  private handleIncomingCall(data: { callerName: string, peerId: string, isVideoCall: boolean }): void {
    // Kiểm tra nếu popup đã mở
    if (this.dialog.openDialogs.length === 0) {
      // Phát âm thanh khi có cuộc gọi đến
      this.startRinging();

      const dialogRef = this.dialog.open(IncomingCallPopupComponent, {
        width: '60%',
        maxWidth: '800px',
        height: 'auto',
        maxHeight: '90vh',
        panelClass: 'no-scroll-popup',
        data: { callerName: data.callerName, peerId: data.peerId, isVideoCall: data.isVideoCall }
      });

      // Dừng âm thanh khi cuộc gọi được chấp nhận
      this.onCallAccepted().subscribe(() => {
        console.log('CallAccepted event received!');
        this.stopRinging();  // Dừng âm thanh khi cuộc gọi được chấp nhận
      });

      // Dừng âm thanh khi popup đóng nếu không có sự kiện CallAccepted
      dialogRef.afterClosed().subscribe(() => {
        this.stopRinging();
      });
    } else {
      console.warn('Popup already opened. Skipping duplicate call.');
    }
  }


  public notifyIncomingCall(peerId: string, isVideoCall: boolean): void {
    this.hubConnection.invoke('HandleIncomingCall', peerId, isVideoCall)
      .then(() => console.log('Data sent to server:', { peerId, isVideoCall }))
      .catch(err => console.error('Error handling incoming call:', err));

  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeunload', this.stopConnection.bind(this));
    this.stopConnection();
  }
}

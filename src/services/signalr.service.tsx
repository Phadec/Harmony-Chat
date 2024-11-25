import { BehaviorSubject, Observable, Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

class SignalRService {
  public hubConnection: signalR.HubConnection;
  private connectionState = new BehaviorSubject<boolean>(false);
  private messageReceived = new BehaviorSubject<any>(null);
  private messageRead = new BehaviorSubject<string | null>(null);
  private connectedUsers = new BehaviorSubject<any[]>([]);
  private groupNotificationReceived = new BehaviorSubject<any>(null);
  private typingSubject = new Subject<any>();
  private stopTypingSubject = new Subject<any>();
  private ringingAudio: any | null = null;
  public typing$ = this.typingSubject.asObservable();
  public stopTyping$ = this.stopTypingSubject.asObservable();
  public messageReceived$: Observable<any> = this.messageReceived.asObservable();
  public messageRead$: Observable<string | null> = this.messageRead.asObservable();
  public connectedUsers$: Observable<any[]> = this.connectedUsers.asObservable();
  public groupNotificationReceived$: Observable<any> = this.groupNotificationReceived.asObservable();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('your-signalr-url', {
        accessTokenFactory: () => this.getAccessToken(),
      })
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();
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
    console.log('Attempting to start SignalR connection...');
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

  private startRinging(): void {
    this.ringingAudio = new Audio('assets/ringreceive.mp3');
    this.ringingAudio.loop = true;
    this.ringingAudio.play().catch((error: Error) => {
      console.error('Failed to play ringing sound:', error);
    });
  }

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

    this.hubConnection.on('NotifyGroupMembers', (groupId: string, message: string) => {
      console.log(`Notification received for group ${groupId}: ${message}`);
      this.groupNotificationReceived.next({ groupId, message });
    });

    this.hubConnection.on('ReceiveCall', (data) => {
      console.log('Data received from server:', data);
      if (data && data.callerName && data.peerId) {
        this.handleIncomingCall(data);
      }
    });

    this.hubConnection.on('TypingIndicator', (recipientId, isTyping) => {
      if (isTyping) {
        this.typingSubject.next(recipientId);
      }
    });

    this.hubConnection.on('StopTypingIndicator', (recipientId) => {
      this.stopTypingSubject.next(recipientId);
    });
  }

  public notifyTyping(recipientId: string): void {
    this.hubConnection.invoke('NotifyTyping', recipientId, true)
      .then(() => console.log(`Notified typing for recipientId ${recipientId}`))
      .catch(err => console.error('Error notifying typing:', err));
  }

  public notifyStopTyping(recipientId: string): void {
    this.hubConnection.invoke('NotifyStopTyping', recipientId)
      .then(() => console.log(`Notified stop typing for recipientId ${recipientId}`))
      .catch(err => console.error('Error notifying stop typing:', err));
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

  public stopConnection(): void {
    if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR Connection stopped'))
        .catch(err => console.log('Error while stopping SignalR connection: ' + err));
    }
  }

  public handleEndCall(peerId: string, isVideoCall: boolean): void {
    this.hubConnection.invoke('HandleEndingCall', peerId, isVideoCall)
      .catch(err => console.error('Error handling ending call:', err));
  }

  private handleIncomingCall(data: { callerName: string, peerId: string, isVideoCall: boolean }): void {
    Alert.alert('Incoming Call', `You have an incoming call from ${data.callerName}`, [
      { text: 'Reject', onPress: () => this.stopRinging() },
      { text: 'Accept', onPress: () => this.stopRinging() }
    ]);
    this.startRinging();
  }
}

export default SignalRService;
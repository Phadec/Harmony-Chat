import {BehaviorSubject, Subject} from "rxjs";
import {HubConnectionBuilder, HubConnectionState, LogLevel} from "@microsoft/signalr";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

class SignalR {
	constructor() {
		this.hubConnection = null;
		this.messageSubject = new BehaviorSubject(null);
		this.connectionState = new BehaviorSubject(false);
		this.messageHandlers = new Set();
		this.connectedUsers = new BehaviorSubject([]);
		this.messageRead = new BehaviorSubject([]);
		this.friendEventNotification = new Subject(null);
		this.typingSubject = new Subject();
		this.stopTypingSubject = new Subject();
	}

	// Singleton pattern
	static getInstance() {
		if (!SignalR.instance) {
			SignalR.instance = new SignalR();
		}
		return SignalR.instance;
	}

	// Kết nối tới SignalR Hub
	async connect() {
		if (this.hubConnection?.state === HubConnectionState.Connected) {
			return;
		}

		try {
			this.hubConnection = new HubConnectionBuilder()
				.withUrl('http://10.0.2.2:5250/chat-hub', {
					accessTokenFactory: () => this.getAccessToken(),
				})
				.withAutomaticReconnect([0, 2000, 10000, 30000])
				.configureLogging(LogLevel.Information)
				.build();

			// setup registered server events
			this.registerServerEvents();

			await this.hubConnection.start();
			this.connectionState.next(true);
			console.log('SignalR Connection started');

			// Setup reconnection handling
			this.hubConnection.onreconnecting(() => {
				this.connectionState.next(false);
				console.log('SignalR reconnecting...');
			});

			this.hubConnection.onreconnected(() => {
				this.connectionState.next(true);
				console.log('SignalR reconnected');
			});

		} catch (error) {
			console.error('Error while starting SignalR connection:', error);
			this.connectionState.next(false);
		}
	}

	// Đăng ký xử lý các sự kiện từ server
	registerServerEvents() {
		this.hubConnection.on('ReceivePrivateMessage', (message) => {
			this.messageSubject.next(message);
			this.messageHandlers.forEach(handler => handler(message));
		});

		// Cập nhật những người dùng đang online
		this.hubConnection.on('UpdateConnectedUsers', (connectedUsers) => {
			console.log('Connected users:', connectedUsers);
			this.connectedUsers.next(connectedUsers);
		});
		// User status changed
		this.hubConnection.on('UserStatusChanged', () => {

		});

		// Cập nhật các mối quan hệ bạn bè
		this.hubConnection.on('UpdateRelationships', () => {
			console.log('UpdateRelationships event received');
		});

		// Message read
		this.hubConnection.on('MessageRead', (chatId) => {
			console.log('Message read:', chatId);
			this.messageRead.next(chatId);
		});

		// Friend event notification
		this.hubConnection.on('FriendEventNotification', (data) => {
			console.log('Friend event notification received:', data);
			this.friendEventNotification.next(data);
		});

		// Typing event notification
		this.hubConnection.on('TypingIndicator', (recipientId, isTyping) => {
			if (isTyping) {
				this.typingSubject.next(recipientId);
			}
		});

		// Stop typing event notification
		this.hubConnection.on('StopTypingIndicator', (recipientId) => {
			this.stopTypingSubject.next(recipientId);
		});


	}

	// Ngắt kết nối
	async disconnect() {
		if (this.hubConnection?.state === HubConnectionState.Connected) {
			await this.hubConnection.stop();
			this.connectionState.next(false);
			console.log('SignalR Connection stopped');
		}
	}

	// Lấy token từ AsyncStorage
	async getAccessToken() {
		const token = await AsyncStorage.getItem('token');
		if (token && this.isTokenExpired(token)) {
			await this.refreshToken();
			return await AsyncStorage.getItem('token');
		}
		return token || '';
	}

	isTokenExpired(token) {
		try {
			const payload = JSON.parse(decode(token.split('.')[1]));
			return new Date(payload.exp * 1000) < new Date();
		} catch {
			return true;
		}
	}

	async refreshToken() {
		// Implement your token refresh logic here
		console.log('Refreshing token...');
	}

	// Gửi tin nhắn mới
	async sendNewMessageNotification(message) {
		if (this.hubConnection?.state !== HubConnectionState.Connected) {
			console.log('SignalR connection is not established. Reconnecting...');
			await this.connect();
		}
		console.log('Sending new message notification:', message);
		try {
			await this.hubConnection.invoke('NotifyNewMessage', message);
			console.log(`Notification sent for new message ${message.toUserId}`);
		} catch (err) {
			console.error(`Error sending new message notification: ${err}`);
			throw err;
		}
	}

	// Đăng ký xử lý tin nhắn mới
	subscribeToMessages(handler) {
		this.messageHandlers.add(handler);
		return () => this.messageHandlers.delete(handler);
	}

	// Gửi sự kiện typing
	sendTypingIndicator(recipientId) {
		if (this.hubConnection?.state === HubConnectionState.Connected) {
			this.hubConnection.invoke('NotifyTyping', recipientId)
				.then(() => console.log(`Typing indicator sent to ${recipientId}`))
				.catch(err => console.error(`Error sending typing indicator: ${err}`));
		}
	}

	// Gửi sự kiện stop typing
	sendStopTypingIndicator(recipientId) {
		if (this.hubConnection?.state === HubConnectionState.Connected) {
			this.hubConnection.invoke('NotifyStopTyping', recipientId)
				.then(() => console.log(`Stop typing indicator sent to ${recipientId}`))
				.catch(err => console.error(`Error sending stop typing indicator: ${err}`));
		}
	}

	// THông báo đã đọc tin nhắn
	notifyMessageRead(chatId) {
		if (this.hubConnection?.state === HubConnectionState.Connected) {
			this.hubConnection.invoke('NotifyMessageRead', chatId)
				.then(() => console.log(`Message read notification sent for chat ${chatId}`))
				.catch(err => console.error(`Error sending message read notification: ${err}`));
		}
	}

	// Get message observable
	get messages$() {
		return this.messageSubject.asObservable();
	}

	// Get connection state observable
	get connectionState$() {
		return this.connectionState.asObservable();
	}

}

export default SignalR;


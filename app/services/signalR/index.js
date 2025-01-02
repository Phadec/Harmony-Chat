import {HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {BehaviorSubject} from 'rxjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {baseURL} from '../axiosInstance';

class SignalRService {
	constructor() {
		this.hubConnection = this.createConnection();
		this.isConnected = false;
		this.reconnectAttempts = 0;
		this.messageReceived$ = new BehaviorSubject(null);
		this.groupCreated$ = new BehaviorSubject(null);
		this.notificationReceived$ = new BehaviorSubject(null);
		this.registerListeners();
	}

	static getInstance() {
		if (!SignalRService.instance) {
			SignalRService.instance = new SignalRService();
		}
		return SignalRService.instance;
	}

	createConnection() {
		return new HubConnectionBuilder()
			.withUrl(`${baseURL}/chat-hub`, {
				accessTokenFactory: this.getAccessToken,
			})
			.configureLogging(LogLevel.Information)
			.withAutomaticReconnect([0, 2000, 10000, 30000])
			.build();
	}

	getAccessToken = async () => {
		const token = await AsyncStorage.getItem('token');
		return token || '';
	};

	registerListeners() {
		this.hubConnection.on('ReceivePrivateMessage', (message) => {
			console.log('Private message received:', message);
			this.messageReceived$.next(message);
		});

		this.hubConnection.on('ReceiveGroupMessage', (message) => {
			console.log('Group message received:', message);
			this.messageReceived$.next(message);
		});

		this.hubConnection.on('ReceiveGroupNotification', (message) => {
			console.log('[SignalR] ReceiveGroupNotification:', message);
			this.groupCreated$.next(message);
		});

		this.hubConnection.on('NotifyGroupMembers', (groupId, message) => {
			console.log('[SignalR] NotifyGroupMembers:', groupId, message);
			this.groupCreated$.next({groupId, message});
		});

		this.hubConnection.on('UserStatusChanged', (status) => {
			console.log('User status changed:', status);
		});

		this.hubConnection.on('UpdateConnectedUsers', (status) => {
			console.log('Connected users updated:', status);
		});

		this.hubConnection.on('ReactionAdded', (reaction) => {
			console.log('Reaction added:', reaction);
			this.messageReceived$.next({type: 'ReactionAdded', reaction});
		});

		this.hubConnection.on('ReactionRemoved', (reaction) => {
			console.log('Reaction removed:', reaction);
			this.messageReceived$.next({type: 'ReactionRemoved', reaction});
		});

		this.hubConnection.on('UpdateRelationships', () => {
			console.log('Relationship updated');
			this.messageReceived$.next({type: 'UpdateRelationships'});
		});

		this.hubConnection.on('MessageDeleted', (messageId) => {
			console.log('Message deleted:', messageId);
			this.messageReceived$.next({type: 'MessageDeleted', messageId});
		});

		this.hubConnection.on('FriendEventNotification', (event, data) => {
			console.log('Friend event notification:', event, data);
			this.messageReceived$.next({type: 'FriendEventNotification', event});
		})


		// Thêm reconnection logic
		this.hubConnection.onreconnected(() => {
			console.log('SignalR reconnected');
		});
		// this.hubConnection.onclose((error) => {
		// 	console.error('SignalR connection closed:', error);
		// 	this.isConnected = false;
		// });
	}

	startConnection() {
		if (this.isConnected) return;

		this.hubConnection
			.start()
			.then(() => {
				this.isConnected = true;
				this.reconnectAttempts = 0;
				console.log('SignalR connection established.');
			})
			.catch((err) => {
				console.error('Error while starting SignalR connection: ', err);
				this.isConnected = false;
				this.reconnectAttempts++;
				this.retryConnection();
			});
	}

	retryConnection() {
		const maxRetries = 5;
		if (this.reconnectAttempts < maxRetries) {
			const retryDelay = [1000, 3000, 5000, 10000, 20000][this.reconnectAttempts];
			setTimeout(() => {
				console.log(`Retrying SignalR connection (Attempt: ${this.reconnectAttempts + 1})`);
				this.startConnection();
			}, retryDelay);
		} else {
			console.error('Max retry attempts reached for SignalR connection.');
		}
	}


	stopConnection() {
		if (!this.isConnected) return;

		this.hubConnection
			.stop()
			.then(() => {
				this.isConnected = false;
				console.log('SignalR connection stopped.');
			})
			.catch((err) => {
				console.error('Error while stopping SignalR connection: ', err);
			});
	}

	setupGroupListeners(onNewGroup) {
		if (!this.isConnected) {
			this.startConnection();
		}

		// Gỡ bỏ listener cũ nếu có
		this.hubConnection.off('NotifyGroupMembers');

		// Đăng ký listener mới với cùng tên event
		this.hubConnection.on('NotifyGroupMembers', (groupId, message) => {
			console.log('[SignalR] NotifyGroupMembers triggered:', groupId, message);
			this.groupCreated$.next({groupId, message});
			if (onNewGroup) {
				onNewGroup(groupId);
			}
		});
	}

	start() {
		if (!this.isConnected) {
			this.startConnection();
		}
	}

	get connectionState() {
		return this.hubConnection.state;
	}

	get connectionStatus() {
		return this.isConnected ? 'Connected' : 'Disconnected';
	}
}

SignalRService.instance = null;

export {SignalRService};
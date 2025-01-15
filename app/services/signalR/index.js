import {HubConnectionBuilder, LogLevel} from '@microsoft/signalr';
import {BehaviorSubject, Subject} from 'rxjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {baseURL} from '../axiosInstance';
import { PeerService } from '../peer';

class SignalRService {
	constructor() {
		this.hubConnection = this.createConnection();
		this.isConnected = false;
		this.reconnectAttempts = 0;
		this.messageReceived$ = new BehaviorSubject(null);
		this.typingReceived$ = new BehaviorSubject(null);
		this.groupCreated$ = new BehaviorSubject(null);
		this.notificationReceived$ = new BehaviorSubject(null);
		this.reactionReceived$ = new Subject();
		this.connectionState$ = new Subject();
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
			this.reactionReceived$.next({
				messageId: reaction.chatId,
				reaction: reaction.reactionType,
				userId: reaction.userId,
				hasNewMessage: reaction.hasNewMessage
			});
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

		// Typing Indicator
		this.hubConnection.on('TypingIndicator', (senderId, isTyping) => {
			console.log(`[SignalR] TypingIndicator received: senderId=${senderId}, isTyping=${isTyping}`);
			this.typingReceived$.next({ senderId, isTyping });
		});

		this.hubConnection.on('StopTypingIndicator', (senderId) => {
			console.log(`[SignalR] StopTypingIndicator received: senderId=${senderId}`);
			this.typingReceived$.next({ senderId, isTyping: false });
		});

		// Add reaction received handler
		this.hubConnection.on("ReceiveReaction", (messageId, reaction, userId) => {
			this.reactionReceived$.next({ messageId, reaction, userId });
		});

		// Thêm reconnection logic
		this.hubConnection.onreconnected(() => {
			console.log('SignalR reconnected');
			this.connectionState$.next(true);
		});
		this.hubConnection.onclose(() => {
			this.connectionState$.next(false);
		});
	}

	async startConnection() {
		if (!this.hubConnection) {
			this.hubConnection = new HubConnectionBuilder()
				.withUrl(`${baseURL}/chat-hub`, {
					accessTokenFactory: this.getAccessToken,
				})
				.configureLogging(LogLevel.Information)
				.withAutomaticReconnect([0, 2000, 10000, 30000])
				.build();
		}

		try {
			await this.hubConnection.start();
			this.isConnected = true;
			this.reconnectAttempts = 0;
			this.connectionState$.next(true);
			console.log('SignalR connection established.');
		} catch (err) {
			console.error('Error while starting SignalR connection: ', err);
			this.isConnected = false;
			this.reconnectAttempts++;
			this.connectionState$.next(false);
			this.retryConnection();
		}
	}

	async ensureConnection() {
		if (!this.hubConnection || this.hubConnection.state !== 'Connected') {
			await this.startConnection();
		}
		return this.hubConnection;
	}

	async invoke(methodName, ...args) {
		try {
			await this.ensureConnection();
			return await this.hubConnection.invoke(methodName, ...args);
		} catch (error) {
			console.error(`Error invoking ${methodName}:`, error);
			throw error;
		}
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

	async initializeAfterLogin() {
		try {
			await this.startConnection();
			// Initialize PeerService after SignalR is connected
			const peerService = PeerService.getInstance();
			await peerService.initializePeer();
			return true;
		} catch (error) {
			console.error('Error initializing services after login:', error);
			return false;
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

	startTyping(recipientId) {
		this.invoke('NotifyTyping', recipientId, true)
			.then(() => console.log('Typing notification sent.'))
			.catch(err => console.error('Error sending typing notification:', err));
	}

	stopTyping(recipientId) {
		this.invoke('NotifyStopTyping', recipientId)
			.then(() => console.log('StopTyping notification sent.'))
			.catch(err => console.error('Error sending stop typing notification:', err));
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

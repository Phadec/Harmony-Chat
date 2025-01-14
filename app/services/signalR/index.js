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
		this.typingReceived$ = new BehaviorSubject(null);
		this.groupCreated$ = new BehaviorSubject(null);
		this.notificationReceived$ = new BehaviorSubject(null);
		this.callingReceived$ = new BehaviorSubject(null);
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

		// Typing Indicator
		this.hubConnection.on('TypingIndicator', (senderId, isTyping) => {
			console.log(`[SignalR] TypingIndicator received: senderId=${senderId}, isTyping=${isTyping}`);
			this.typingReceived$.next({ senderId, isTyping });
		});

		this.hubConnection.on('StopTypingIndicator', (senderId) => {
			console.log(`[SignalR] StopTypingIndicator received: senderId=${senderId}`);
			this.typingReceived$.next({ senderId, isTyping: false });
		});

		// Thêm các listeners mới cho cuộc gọi
		this.hubConnection.on('ReceiveCall', (callData) => {
			console.log('[SignalR] ReceiveCall:', callData);
			this.callingReceived$.next({
				type: 'ReceiveCall',
				...callData
			});
		});

		this.hubConnection.on('CallAccepted', () => {
			console.log('[SignalR] CallAccepted');
			this.callingReceived$.next({
				type: 'CallAccepted'
			});
		});

		this.hubConnection.on('CallEnded', (data) => {
			console.log('[SignalR] CallEnded:', data);
			this.callingReceived$.next({
				type: 'CallEnded',
				...data
			});
		});

		this.hubConnection.on('PeerIdUpdated', (userId, peerId) => {
			console.log(`[SignalR] PeerIdUpdated: userId=${userId}, peerId=${peerId}`);
			this.callingReceived$.next({
				type: 'PeerIdUpdated',
				userId,
				peerId
			});
		});

		// Thêm handlers cho trạng thái kết nối
		this.hubConnection.onreconnecting((error) => {
			console.log('[SignalR] Reconnecting...', error);
			this.isConnected = false;
		});

		this.hubConnection.onreconnected((connectionId) => {
			console.log('[SignalR] Reconnected. ConnectionId:', connectionId);
			this.isConnected = true;
		});

		this.hubConnection.onclose((error) => {
			console.log('[SignalR] Connection closed.', error);
			this.isConnected = false;
			this.retryConnection();
		});

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

	startTyping(recipientId) {
		this.hubConnection.invoke('NotifyTyping', recipientId, true)
			.then(() => console.log('Typing notification sent.'))
			.catch(err => console.error('Error sending typing notification:', err));
	}

	stopTyping(recipientId) {
		this.hubConnection.invoke('NotifyStopTyping', recipientId)
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

	// Thêm các methods mới cho cuộc gọi
	async registerPeerId(userId, peerId) {
		try {
			await this.hubConnection.invoke("RegisterPeerId", userId, peerId);
			console.log('[SignalR] PeerId registered successfully');
			return true;
		} catch (error) {
			console.error('[SignalR] Error registering PeerId:', error);
			return false;
		}
	}

	async getPeerId(userId) {
		try {
			const peerId = await this.hubConnection.invoke("GetPeerId", userId);
			console.log('[SignalR] Got PeerId for user:', peerId);
			return peerId;
		} catch (error) {
			console.error('[SignalR] Error getting PeerId:', error);
			return null;
		}
	}

	async handleIncomingCall(peerId, isVideoCall) {
		try {
			await this.hubConnection.invoke("HandleIncomingCall", peerId, isVideoCall);
			console.log('[SignalR] Incoming call handled');
			return true;
		} catch (error) {
			console.error('[SignalR] Error handling incoming call:', error);
			return false;
		}
	}

	async acceptCall(peerId) {
		try {
			await this.hubConnection.invoke("AcceptCall", peerId);
			console.log('[SignalR] Call accepted');
			return true;
		} catch (error) {
			console.error('[SignalR] Error accepting call:', error);
			return false;
		}
	}

	async endCall(peerId, isVideoCall) {
		try {
			await this.hubConnection.invoke("HandleEndingCall", peerId, isVideoCall);
			console.log('[SignalR] Call ended');
			return true;
		} catch (error) {
			console.error('[SignalR] Error ending call:', error);
			return false;
		}
	}

	start() {
		console.log('Starting Socket connection...');
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

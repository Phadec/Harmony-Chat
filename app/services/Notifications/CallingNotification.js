import {CallManager} from "../Call";
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import {navigationRef} from "../../RootNavigation";
import {Platform} from 'react-native';

class CallingNotificationService {
	constructor() {
		this.callManager = CallManager.getInstance();
		this.notificationId = 1;
		this.currentCallNotification = null;
		this.initialize().then(
			() => console.log('CallingNotificationService initialized'),
		).catch(error =>
			console.error('Error initializing CallingNotificationService:', error)
		);
	}

	static getInstance() {
		if (!CallingNotificationService.instance) {
			CallingNotificationService.instance = new CallingNotificationService();
		}
		return CallingNotificationService.instance;
	}

	async initialize() {
		try {
			// Request permissions
			await this.requestPermissions();

			// Create notification channel
			await this.createCallChannel();

			// Setup handlers
			this.setupMessagingHandlers();
			this.setupPushNotificationHandlers();

			// Subscribe to call state changes
			this.subscribeToCallStateChanges();
		} catch (error) {
			console.error('Error in initialization:', error);
			throw error;
		}
	}

	async requestPermissions() {
		try {
			// Request Firebase permissions
			const authStatus = await messaging().requestPermission({
				sound: true,
				badge: true,
				alert: true,
				provisional: true,
			});

			const enabled =
				authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
				authStatus === messaging.AuthorizationStatus.PROVISIONAL;

			if (!enabled) {
				console.warn('Push notifications are disabled');
				return false;
			}

			// Get and log FCM token
			const token = await messaging().getToken();
			console.log('FCM Token:', token);

			return true;
		} catch (error) {
			console.error('Error requesting permissions:', error);
			return false;
		}
	}

	async createCallChannel() {
		// Tạo channel riêng cho cuộc gọi với độ ưu tiên cao
		PushNotification.createChannel(
			{
				channelId: 'calls',
				channelName: 'Incoming Calls',
				channelDescription: 'Channel for incoming calls',
				playSound: true,
				soundName: Platform.OS === 'android' ? 'ringtone.mp3' : 'default',
				importance: 5, // Max importance
				vibrate: true,
				vibration: 1000,
			},
			(created) => console.log(`Call channel created: ${created}`)
		);
	}

	setupMessagingHandlers() {
		// Foreground message handler
		messaging().onMessage(async remoteMessage => {
			console.log('Received foreground message:', remoteMessage);

			if (remoteMessage.data?.type === 'incoming_call') {
				await this.displayCallNotification({
					...remoteMessage.data,
					title: remoteMessage.notification?.title || 'Incoming Call',
					body: remoteMessage.notification?.body || 'Someone is calling you'
				});
			}
		});

		// Background message handler
		messaging().setBackgroundMessageHandler(async remoteMessage => {
			console.log('Received background message:', remoteMessage);

			if (remoteMessage.data?.type === 'incoming_call') {
				await this.displayCallNotification(remoteMessage.data);
			}
			return Promise.resolve();
		});

		// Quit state handler
		messaging().getInitialNotification().then(remoteMessage => {
			if (remoteMessage?.data?.type === 'incoming_call') {
				this.handleNotificationPress(remoteMessage.data);
			}
		});
	}

	setupPushNotificationHandlers() {
		PushNotification.configure({
			onNotification: async (notification) => {
				console.log('Received notification:', notification);

				const data = notification.data || notification.userInfo;

				if (notification.userInteraction) {
					await this.handleNotificationPress(data);
				}

				switch (notification.action) {
					case 'accept':
						await this.handleAcceptCall(notification);
						break;
					case 'reject':
						await this.handleRejectCall(notification);
						break;
				}
			},

			onAction: (notification) => {
				console.log('Notification action received:', notification.action);
			},

			permissions: {
				alert: true,
				badge: true,
				sound: true,
				critical: true, // For critical notifications (iOS only)
			},

			popInitialNotification: true,
			requestPermissions: Platform.OS === 'ios',
		});
	}

	subscribeToCallStateChanges() {
		// Theo dõi thay đổi trạng thái cuộc gọi
		this.callManager.callState.subscribe(state => {
			if (state === 'idle' && this.currentCallNotification) {
				this.clearCallNotification();
			}
		});
	}

	async displayCallNotification(data) {
		try {
			// Tạo notification ID duy nhất cho cuộc gọi này
			const notificationId = this.notificationId++;

			// Lưu thông tin notification hiện tại
			this.currentCallNotification = {
				id: notificationId,
				data: data
			};

			const notificationConfig = {
				id: notificationId,
				channelId: 'calls',
				title: data.title || 'Incoming Call',
				message: data.body || `${data.callerName} is calling...`,
				userInfo: data,
				data: data,
				ongoing: true,
				autoCancel: false,
				priority: 'max',
				importance: 'high',
				visibility: 'public',
				vibrate: true,
				playSound: true,

				// Android specific
				smallIcon: 'ic_notification',
				largeIcon: data.avatar || 'ic_launcher',
				actions: ['Accept', 'Reject'],
				invokeApp: true,
				color: '#2196F3',

				// iOS specific
				category: 'call',
				critical: true,
				criticalVolume: 1.0,
			};

			PushNotification.localNotification(notificationConfig);

			// Automatically clear notification after 30 seconds if not answered
			setTimeout(() => {
				if (this.currentCallNotification?.id === notificationId) {
					this.clearCallNotification();
				}
			}, 30000);

		} catch (error) {
			console.error('Error displaying call notification:', error);
		}
	}

	clearCallNotification() {
		if (this.currentCallNotification) {
			PushNotification.cancelLocalNotifications({id: this.currentCallNotification.id});
			this.currentCallNotification = null;
		}
	}

	async handleNotificationPress(data) {
		try {
			// Kiểm tra xem cuộc gọi còn active không
			if (this.callManager.isReceivingCall || this.callManager.isInCall) {
				navigationRef.current?.navigate('Calling', {
					friend: {
						id: data.callerId,
						name: data.callerName,
						avatar: data.avatar,
					},
					isIncoming: true,
				});
			} else {
				// Nếu cuộc gọi đã kết thúc, xóa notification
				this.clearCallNotification();
			}
		} catch (error) {
			console.error('Error handling notification press:', error);
		}
	}

	async handleAcceptCall(notification) {
		try {
			// Clear notification first
			this.clearCallNotification();

			// Accept the call
			await this.callManager.acceptCall();

			// Navigate to calling screen
			navigationRef.current?.navigate('Calling', {
				friend: {
					id: notification.data.callerId,
					name: notification.data.callerName,
					avatar: notification.data.avatar,
				},
				isIncoming: true,
			});
		} catch (error) {
			console.error('Error accepting call:', error);
		}
	}

	async handleRejectCall(notification) {
		try {
			// Clear notification first
			this.clearCallNotification();

			// End the call
			await this.callManager.endCall();
		} catch (error) {
			console.error('Error rejecting call:', error);
		}
	}
}

export default CallingNotificationService;

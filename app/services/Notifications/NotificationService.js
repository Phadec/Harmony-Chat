import PushNotification from 'react-native-push-notification';

class NotificationService {
	constructor() {
		this.configure();
	}

	configure() {
		// Configure PushNotification
		PushNotification.configure({
			onRegister: function (token) {

			},

			onNotification: function (notification) {
				console.log("NOTIFICATION:", notification);
			},

			permissions: {
				alert: true,
				badge: true,
				sound: true,
			},

			popInitialNotification: true,
			requestPermissions: true,
		});

		// Create default channel
		PushNotification.createChannel(
			{
				channelId: "calls",
				channelName: "Incoming Calls",
				channelDescription: "Channel for incoming calls",
				playSound: true,
				soundName: "default",
				importance: 4,
				vibrate: true,
			},
			(created) => console.log(`CreateChannel 'calls' returned '${created}'`)
		);
	}

	static getInstance() {
		if (!NotificationService.instance) {
			NotificationService.instance = new NotificationService();
			console.log("NotificationService initialized");
		}
		return NotificationService.instance;
	}
}

export default NotificationService;

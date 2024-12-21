// import React, {useEffect, useState} from 'react';
// import {HubConnectionBuilder, HubConnectionState, LogLevel} from '@microsoft/signalr';
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import {decode} from 'base-64';
// import {BehaviorSubject} from 'rxjs'; // Nếu dùng RxJS
//
// const useSignalR = (onMessageReceived) => {
// 	const [hubConnection, setHubConnection] = useState(null);
// 	const [isConnected, setIsConnected] = useState(false);
//
// 	const messageReceived$ = new BehaviorSubject(null); // Subject cho tin nhắn mới
//
// 	useEffect(() => {
// 		const connectToSignalR = async () => {
// 			const connection = new HubConnectionBuilder()
// 				.withUrl('http://10.0.2.2:5250/chat-hub', {
// 					accessTokenFactory: () => getAccessToken(),
// 				})
// 				.withAutomaticReconnect([0, 2000, 10000, 30000])
// 				.build();
//
// 			connection.on('ReceivePrivateMessage', (message) => {
// 				console.log('Tin nhắn mới:', message);
// 				// Gọi callback để xử lý tin nhắn mới
// 				if (onMessageReceived) {
// 					onMessageReceived(message);
// 				}
// 			});
//
// 			try {
// 				await connection.start();
// 				console.log('SignalR Connection started');
// 				setHubConnection(connection);
// 				setIsConnected(true);
// 			} catch (error) {
// 				console.error('Error while starting SignalR connection:', error);
// 				setIsConnected(false);
// 			}
// 		};
//
// 		connectToSignalR().then(
// 			() => console.log('SignalR Connection established'),
// 			(error) => console.error('Failed to establish SignalR Connection:', error)
// 		);
//
// 		return () => {
// 			if (hubConnection) {
// 				hubConnection.stop().then(() => console.log('SignalR Connection stopped'));
// 			}
// 		};
// 	}, [onMessageReceived]);
//
// 	const getAccessToken = async () => {
// 		const token = await AsyncStorage.getItem('token');
// 		if (token && isTokenExpired(token)) {
// 			refreshToken();
// 			return '';
// 		}
// 		return token || '';
// 	};
//
// 	const isTokenExpired = (token) => {
// 		const payload = JSON.parse(decode(token.split('.')[1]));
// 		const expirationDate = new Date(payload.exp * 1000);
// 		return expirationDate < new Date();
// 	};
//
// 	const refreshToken = () => {
// 		console.log('Refreshing token...');
// 	};
//
// 	const sendNewMessageNotification = (message) => {
// 		console.log('Sending new message notification:', message);
// 		if (hubConnection.state === HubConnectionState.Connected) {
// 			hubConnection.invoke('NotifyNewMessage', message)
// 				.then(() => console.log(`Notification sent for new message ${message.toUserId}`))
// 				.catch(err => console.error(`Error sending new message notification: ${err}`));
// 		}
// 	};
//
//
//
//
// 	return {sendNewMessageNotification, messageReceived$};
// };
//
//
// export default useSignalR;

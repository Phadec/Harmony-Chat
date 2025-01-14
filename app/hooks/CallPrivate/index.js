import {useEffect, useRef, useState} from "react";
import {SignalRService} from "../../services/signalR";
import Peer from 'react-native-peerjs';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {mediaDevices} from "react-native-webrtc";
import {Alert, AppState} from 'react-native';

const useCallPrivate = (friend, navigation) => {
	const [peer, setPeer] = useState(null);
	const [localStream, setLocalStream] = useState(null);
	const [remoteStream, setRemoteStream] = useState(null);
	const [call, setCall] = useState(false);
	const [isCallActive, setIsCallActive] = useState(false);
	const [callEnded, setCallEnded] = useState(false);
	const [currentPeerId, setCurrentPeerId] = useState(null);
	const [callError, setCallError] = useState(null);

	const callTimeout = useRef(null);
	const socket = useRef(SignalRService.getInstance());

	useEffect(() => {
		let newPeer = null;

		const initConnection = async () => {
			try {
				// Lắng nghe các sự kiện cuộc gọi từ SignalR
				const subscription = socket.current.callingReceived$.subscribe(data => {
					if (!data) {
						console.error("Dữ liệu không hợp lệ");
						return;
					}

					switch (data.type) {
						case 'ReceiveCall':
							const {callerName, peerId, isVideoCall} = data;
							Alert.alert(
								"Cuộc gọi đến",
								`${callerName} đang gọi...`,
								[
									{
										text: "Từ chối",
										onPress: async () => {
											await socket.current.endCall(peerId, isVideoCall);
										},
										style: "cancel"
									},
									{
										text: "Chấp nhận",
										onPress: () => {
											navigation.navigate('Calling', {
												callerName,
												peerId,
												isVideoCall,
												isIncoming: true
											});
											answerCall(peerId);
										}
									}
								]
							);
							break;

						case 'CallAccepted':
							setIsCallActive(true);
							setCall(true);
							if (callTimeout.current) {
								clearTimeout(callTimeout.current);
							}
							break;

						case 'CallEnded':
							handleEndCall();
							break;

						case 'PeerIdUpdated':
							console.log(`Peer ID cập nhật: ${data.userId}: ${data.peerId}`);
							break;

						default:
							console.error("Sự kiện không xác định:", data);
							break;
					}
				});

				// Khởi tạo kết nối SignalR
				await socket.current.start();

				// Khởi tạo PeerJS
				const userId = await AsyncStorage.getItem('userId');
				newPeer = new Peer({
					config: {
						iceServers: [
							{ urls: 'stun:stun.l.google.com:19302' },
							{ urls: 'stun:stun1.l.google.com:19302' }
						]
					}
				});

				newPeer.on('open', async (id) => {
					console.log("PeerJS ID:", id);
					setCurrentPeerId(id);

					if (socket.current.connectionStatus === 'Connected') {
						const success = await socket.current.registerPeerId(userId, id);
						if (!success) {
							console.error("Không thể đăng ký PeerId");
						}
					}
				});

				newPeer.on('call', async (incomingCall) => {
					try {
						const stream = await getLocalStream();
						incomingCall.answer(stream);
						setLocalStream(stream);

						incomingCall.on('stream', (incomingStream) => {
							setRemoteStream(incomingStream);
						});

						incomingCall.on('error', (error) => {
							setCallError(error);
							handleEndCall();
						});

						incomingCall.on('close', () => {
							handleEndCall();
						});
					} catch (error) {
						console.error("Lỗi xử lý cuộc gọi đến:", error);
						setCallError(error);
					}
				});

				setPeer(newPeer);

				return () => {
					subscription.unsubscribe();
				};
			} catch (error) {
				console.error("Lỗi khởi tạo:", error);
				setCallError(error);
			}
		};

		initConnection();

		const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
			if (nextAppState === 'background' && isCallActive) {
				handleEndCall();
			}
		});

		return () => {
			appStateSubscription.remove();
			if (newPeer) {
				newPeer.destroy();
			}
			handleEndCall();
		};
	}, []);

	const getLocalStream = async () => {
		try {
			return await mediaDevices.getUserMedia({
				video: true,
				audio: true
			});
		} catch (error) {
			console.error("Lỗi lấy local stream:", error);
			setCallError(error);
			throw error;
		}
	};

	const startCall = async (receiverId, isVideoCall) => {
		try {
			const receiverPeerId = await socket.current.getPeerId(receiverId);
			if (!receiverPeerId) {
				Alert.alert("Lỗi", "Không thể kết nối với người nhận");
				return;
			}

			const stream = await getLocalStream();
			setLocalStream(stream);

			const peerCall = peer.call(receiverPeerId, stream);

			await socket.current.handleIncomingCall(receiverPeerId, isVideoCall);

			peerCall.on('stream', (incomingStream) => {
				setRemoteStream(incomingStream);
			});

			callTimeout.current = setTimeout(() => {
				if (!isCallActive) {
					handleEndCall();
					Alert.alert("Cuộc gọi thất bại", "Không có phản hồi");
				}
			}, 30000);

			navigation.navigate('Calling', {
				receiverId,
				isIncoming: false
			});

			setCall(true);
		} catch (error) {
			console.error("Lỗi bắt đầu cuộc gọi:", error);
			setCallError(error);
			Alert.alert("Lỗi", "Không thể bắt đầu cuộc gọi");
		}
	};

	const answerCall = async (callerPeerId) => {
		try {
			const success = await socket.current.acceptCall(callerPeerId);
			if (success) {
				setIsCallActive(true);
				setCall(true);
			} else {
				Alert.alert("Lỗi", "Không thể trả lời cuộc gọi");
			}
		} catch (error) {
			console.error('Lỗi trả lời cuộc gọi:', error);
			setCallError(error);
			Alert.alert("Lỗi", "Không thể trả lời cuộc gọi");
		}
	};

	const handleEndCall = async () => {
		try {
			if (localStream) {
				localStream.getTracks().forEach(track => {
					track.enabled = false;
					track.stop();
				});
				setLocalStream(null);
			}

			if (remoteStream) {
				remoteStream.getTracks().forEach(track => {
					track.enabled = false;
					track.stop();
				});
				setRemoteStream(null);
			}

			if (callTimeout.current) {
				clearTimeout(callTimeout.current);
			}

			setIsCallActive(false);
			setCall(false);
			setCallEnded(true);

			if (currentPeerId) {
				await socket.current.endCall(currentPeerId, true);
			}

		} catch (error) {
			console.error('Lỗi kết thúc cuộc gọi:', error);
			setCallError(error);
		}
	};

	return {
		startCall,
		answerCall,
		handleEndCall,
		localStream,
		remoteStream,
		isCallActive,
		call,
		callEnded,
		callError
	};
};

export default useCallPrivate;

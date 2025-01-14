import {SignalRService} from "../signalR";
import {BehaviorSubject} from "rxjs";
import Peer from "react-native-peerjs";
import {mediaDevices} from "react-native-webrtc";
import CallingNotificationService from "../Notifications/CallingNotification";
import PushNotification from "react-native-push-notification";

export const STATE = {
	IDLE: 'idle',
	CALLING: 'calling',
	IN_CALL: 'inCall',
	RECEIVING_CALL: 'receivingCall',
};

const EVENT_CALL = {
	INCOMING: 'ReceiveCall',
	ACCEPTED: 'CallAccepted',
	ENDED: 'CallEnded',
}

class CallManager {
	constructor() {
		// Khởi tạo các service và state
		this.signalRService = SignalRService.getInstance();
		this.peer = null;
		this.currentCall = null;
		this.isInitialized = false; // Thêm flag kiểm tra khởi tạo

		// Các BehaviorSubject để theo dõi trạng thái của cuộc gọi
		this.callState = new BehaviorSubject(STATE.IDLE);
		this.localStream = new BehaviorSubject(null);
		this.remoteStream = new BehaviorSubject(null);

		// Bind các methods
		this.handleIncomingCall = this.handleIncomingCall.bind(this);
		this.handleCallAccepted = this.handleCallAccepted.bind(this);
		this.handleCallEnded = this.handleCallEnded.bind(this);

		// Khởi tạo listeners
		this.setupCallListeners();
	}

	// Thiết lập các listeners từ SignalR
	setupCallListeners() {
		this.signalRService.callingReceived$.subscribe(async (event) => {
			if (!event) return;

			switch (event.type) {
				case EVENT_CALL.INCOMING:
					// Xử lý cuộc gọi đến
					await this.handleIncomingCall(event);
					break;
				case EVENT_CALL.ACCEPTED:
					// Xử lý cuộc gọi được chấp nhận
					this.handleCallAccepted();
					break;
				case EVENT_CALL.ENDED:
					// Xử lý cuộc gọi kết thúc
					this.handleCallEnded();
					break;
				default:
					break;
			}
		});
	}

	// Singleton
	static getInstance() {
		if (!CallManager.instance) {
			CallManager.instance = new CallManager();
			console.log('CallManager instance created');
		}

		return CallManager.instance;
	}

	// Khởi tạo PeerJS
	async initializePeer(userId) {
		try {
			if (this.peer) {
				// Nếu đã có peer instance, ngắt kết nối cũ
				this.peer.destroy();
			}

			return new Promise((resolve, reject) => {
				// Khởi tạo peer mới
				this.peer = new Peer(userId.toString(), {
					config: {
						iceServers: [
							{urls: 'stun:stun.l.google.com:19302'}
						]
					},
					debug: 3 // Thêm debug level để dễ theo dõi
				});

				// Xử lý sự kiện kết nối thành công
				this.peer.on('open', (id) => {
					console.log('PeerJS connected with ID:', id);
					this.isInitialized = true;
					resolve(true);
				});

				// Xử lý sự kiện lỗi
				this.peer.on('error', (error) => {
					console.error('PeerJS connection error:', error);
					this.isInitialized = false;
					reject(error);
				});

				// Xử lý cuộc gọi đến
				this.peer.on('call', this.handleIncomingCall.bind(this));

				this.peer.on('disconnected', () => {
					console.warn('Peer disconnected, attempting to reconnect...');
					this.peer.reconnect();
				});

				this.peer.on('close', () => {
					console.warn('Peer connection closed');
					this.isInitialized = false;
				});

			});
		} catch (error) {
			console.error('Lỗi khởi tạo PeerJS:', error);
			this.isInitialized = false;
			throw error;
		}
	}

	// Bắt đầu cuộc gọi
	async initiateCall(receiveId, isVideoCall = true) {
		try {
			// Kiểm tra xem PeerJS đã được khởi tạo chưa
			if (!this.peer || !this.isInitialized) {
				throw new Error('PeerJS chưa được khởi tạo. Vui lòng gọi initializePeer trước.');
			}

			console.log('Bắt đầu cuộc gọi đến user:', receiveId);
			// Register peerId của người gọi
			await this.signalRService.registerPeerId(receiveId, this.peer.id);

			// Lấy stream từ camera/mic
			const stream = await this.getMediaStream(isVideoCall);
			this.localStream.next(stream);

			// Thông báo cho người nhận qua SignalR
			await this.signalRService.handleIncomingCall(receiveId, isVideoCall);

			// Gọi tới peer của người nhận
			const call = this.peer.call(receiveId, stream, {
				metadata: {
					caller: {
						id: this.peer.id,
						name: 'You', // Tên
						avatar: '', // Avatar
					},
					isVideoCall: isVideoCall
				},
			});

			// Xử lý stream từ người nhận
			await call.on('stream', (remoteStream) => {
				this.remoteStream.next(remoteStream);
				this.callState.next(STATE.IN_CALL);
			});

			this.currentCall = call;
			this.callState.next(STATE.CALLING);

			console.log('Current Call State:', this.callState.value);
			console.log('Local Stream:', this.localStream.value);
			console.log('Remote Stream:', this.remoteStream.value);

			return true;
		} catch (error) {
			console.error('Lỗi khi bắt đầu cuộc gọi:', error);
			this.callState.next(STATE.IDLE);
			return false;
		}
	}

	// Chấp nhận cuộc gọi
	async acceptCall() {
		try {
			if (!this.currentCall) {
				throw new Error('Không có cuộc gọi đến');
			}

			// Lấy stream từ camera/mic
			const stream = await this.getMediaStream();
			this.localStream.next(stream);

			// Trả lời cuộc gọi với stream local
			this.currentCall.answer(stream);

			// Xử lý stream từ người gọi
			this.currentCall.on('stream', (remoteStream) => {
				this.remoteStream.next(remoteStream);
				this.callState.next(STATE.IN_CALL);
			});

			// Thông báo cho người gọi qua SignalR
			await this.signalRService.acceptCall(this.currentCall.peer);

			return true;
		} catch (error) {
			console.error('Lỗi khi chấp nhận cuộc gọi:', error);
			return false;
		}
	}

	// Kết thúc cuộc gọi
	async endCall() {
		try {
			if (this.currentCall) {
				this.currentCall.close();

				// Thông báo kết thúc cuộc gọi qua SignalR
				await this.signalRService.endCall(
					this.currentCall.peer,
					this.currentCall.isVideoCall
				);
			}

			// Dọn dẹp streams
			const localStream = this.localStream.getValue();
			if (localStream) {
				localStream.getTracks().forEach(track => track.stop());
				this.localStream.next(null);
			}

			const remoteStream = this.remoteStream.getValue();
			if (remoteStream) {
				remoteStream.getTracks().forEach(track => track.stop());
				this.remoteStream.next(null);
			}

			this.callState.next(STATE.IDLE);
			return true;
		} catch (error) {
			console.error('Lỗi khi kết thúc cuộc gọi:', error);
			return false;
		}
	}

	// Xử lý cuộc gọi đến
	async handleIncomingCall(incomingCall) {
		// Log để debug
		console.log('Incoming call received:', incomingCall);

		// Lấy thông tin người gọi từ metadata hoặc từ peer ID
		const caller = incomingCall.metadata?.caller || {
			id: incomingCall.peer,
			name: 'Unknown Caller',
			avatar: null
		};

		// Tạo notification với thông tin người gọi
		// Hiển thị notification
		await CallingNotificationService.getInstance().displayCallNotification({
			type: 'incoming_call',
			title: 'Cuộc gọi đến',
			body: `${caller.name} đang gọi cho bạn`,
			callerId: caller.id,
			callerName: caller.name,
			callerAvatar: caller.avatar
		});

		console.log('Notification sent for caller:', caller);
		this.currentCall = incomingCall;
		this.callState.next(STATE.RECEIVING_CALL);
	}

	// Xử lý khi cuộc gọi được chấp nhận
	handleCallAccepted() {
		if (this.callState.value === STATE.CALLING) {
			this.callState.next(STATE.IN_CALL);
		}
	}

	// Xử lý khi cuộc gọi kết thúc
	handleCallEnded() {
		this.endCall();
	}

	// Xử lý tín hiệu cuộc gọi từ SignalR
	handleSignalRCallReceived(event) {
		// Cập nhật trạng thái để UI hiển thị màn hình cuộc gọi đến
		this.callState.next(STATE.RECEIVING_CALL);
	}

	// Lấy media stream (audio/video) từ thiết bị
	async getMediaStream(isVideo = true) {
		try {
			const constraints = {
				audio: true,
				video: isVideo ? {
					facingMode: 'user',
					with: {min: 640, ideal: 1280, max: 1920},
					height: {min: 480, ideal: 720, max: 1080}
				} : false,
			}

			const stream = await mediaDevices.getUserMedia(constraints);
			return stream;
		} catch (error) {
			console.error('Lỗi khi lấy media stream:', error);
			return error;
		}
	}


	// Các getter để kiểm tra trạng thái
	get isInCall() {
		return this.callState.value === STATE.IN_CALL;
	}

	get isReceivingCall() {
		return this.callState.value === STATE.RECEIVING_CALL;
	}

	get isIdle() {
		return this.callState.value === STATE.IDLE;
	}

	get isCalling() {
		return this.callState.value === STATE.CALLING;
	}
}

export {CallManager};

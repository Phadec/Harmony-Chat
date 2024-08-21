import Peer, { MediaConnection } from 'peerjs';
import { Injectable } from '@angular/core';
import { SignalRService } from './signalr.service';
import {first} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  private peer: Peer | null = null;
  private mediaCall: MediaConnection | null = null;
  private localStream: MediaStream | null = null;  // Lưu trữ MediaStream của webcam và microphone

  constructor(private signalRService: SignalRService) {
    this.initializePeer();
  }

  private initializePeer(): void {
    if (this.peer) {
      console.log('Peer already initialized.');
      return;
    }

    console.log('Waiting for SignalR connection...');

    // Đợi SignalR kết nối thành công rồi mới khởi tạo Peer
    this.signalRService.getConnectionState().pipe(first(isConnected => isConnected === true))
      .subscribe(() => {
        console.log('SignalR connected. Initializing Peer...');
        this.peer = new Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' }
            ]
          }
        });

        this.peer.on('open', (peerId) => {
          console.log(`Peer opened with ID: ${peerId}`);
          this.registerPeerId(peerId);
        });

        this.peer.on('call', (call) => this.incomingCallHandler(call));
        this.peer.on('error', (err) => console.error('PeerJS error:', err));
      });
  }

  // Phương thức đăng ký callback khi nhận được stream từ đối tác
  public onStream(callback: (stream: MediaStream) => void): void {
    if (this.mediaCall) {
      this.mediaCall.on('stream', (remoteStream: MediaStream) => {
        callback(remoteStream);
      });
    } else {
      console.error('No active call to handle stream.');
    }
  }

  private registerPeerId(peerId: string): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      this.signalRService.registerPeerId(userId, peerId)
        .then(() => console.log(`PeerId ${peerId} registered successfully for user ${userId}`))
        .catch(err => console.error('Error registering PeerId:', err));
    } else {
      console.error('User ID not found. Cannot register PeerId.');
    }
  }

  private incomingCallHandler(call: MediaConnection): void {
    if (this.mediaCall) {
      console.warn('Already in a call. Rejecting new incoming call.');
      call.close(); // Nếu đã có cuộc gọi, từ chối cuộc gọi mới
      return;
    }

    this.mediaCall = call;

    // Giả sử `call.metadata` có chứa thông tin về cuộc gọi, bao gồm `isVideoCall`
    const isVideoCall = call.metadata?.isVideoCall ?? false; // Đảm bảo rằng chúng ta có giá trị `isVideoCall`

    this.signalRService.notifyIncomingCall(call.peer, isVideoCall);
    console.log('Sending isVideoCall to SignalR:', isVideoCall);
  }

  public async acceptCall(isVideoCall: boolean): Promise<MediaStream | null> {
    try {
      // Dựa trên giá trị isVideoCall để yêu cầu quyền truy cập camera và microphone
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true
      });

      if (this.mediaCall) {
        this.mediaCall.answer(this.localStream);
        this.mediaCall.on('stream', (remoteStream: MediaStream) => this.handleRemoteStream(remoteStream));
        this.mediaCall.on('close', () => this.cleanup());
      } else {
        console.error('No incoming call to accept.');
        return null;
      }

      return this.localStream;  // Trả về localStream
    } catch (error) {
      console.error('Failed to get local stream:', error);
      return null;  // Trả về null nếu có lỗi
    }
  }


  // Xử lý người nhận từ chối cuộc gọi
  public rejectCall(): void {
    if (this.mediaCall) {
      this.mediaCall.close();
      this.cleanup();
    } else {
      console.error('No incoming call to reject.');
    }
  }

  public async makeCall(peerId: string, isVideoCall: boolean): Promise<void> {
    try {
      // Dựa trên giá trị isVideoCall để yêu cầu quyền truy cập camera và microphone
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true
      });

      this.localStream.getTracks().forEach(track => console.log(track.kind));

      if (!this.peer) {
        console.error('Peer instance is not initialized.');
        return;
      }

      if (this.mediaCall) {
        console.error('Already in a call. Cannot make a new call.');
        return;
      }

      this.mediaCall = this.peer.call(peerId, this.localStream, { metadata: { isVideoCall } });
      console.log('isVideoCall:', isVideoCall);
      if (this.mediaCall) {
        this.mediaCall.on('stream', (remoteStream: MediaStream) => this.handleRemoteStream(remoteStream));
        this.mediaCall.on('close', () => this.cleanup());
      } else {
        console.error('Failed to make call.');
      }
    } catch (error) {
      console.error('Failed to get local stream:', error);
    }
  }
  public endCall(): void {
    if (this.mediaCall) {
      const peerId = this.mediaCall.peer;
      let isVideoCall = false; // Mặc định là false

      // Kiểm tra nếu localStream tồn tại và có video tracks
      if (this.localStream && this.localStream.getVideoTracks().length > 0) {
        isVideoCall = true;
      }

      this.mediaCall.close();
      this.signalRService.handleEndCall(peerId, isVideoCall); // Gửi tín hiệu kết thúc cuộc gọi cùng với isVideoCall
      this.cleanup();
      console.log('Call manually ended.');
    } else {
      console.error('No active call to end.');
    }
  }

  private handleRemoteStream(remoteStream: MediaStream): void {
    const videoElement = document.createElement('video');
    videoElement.srcObject = remoteStream;
    videoElement.autoplay = true;
    videoElement.style.width = "100%"; // Thêm style nếu cần thiết
    document.body.appendChild(videoElement);
  }

  // Cleanup resources
  private cleanup(): void {
    // Dừng tất cả các track của webcam và microphone
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;  // Xóa stream sau khi đã dừng tất cả các track
    }

    this.mediaCall = null;

    // Xóa video element
    const videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
      videoElement.remove();
    }
  }

  private getCurrentUserId(): string | null {
    return localStorage.getItem("userId");
  }
}

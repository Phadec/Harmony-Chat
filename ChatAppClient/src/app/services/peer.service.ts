import Peer, { MediaConnection } from 'peerjs';
import { Injectable } from '@angular/core';
import { SignalRService } from './signalr.service';
import { first } from "rxjs";

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

  public initializePeer(): void {
    // Kiểm tra xem Peer đã được khởi tạo chưa
    if (this.peer) {
      console.log('Peer already initialized.');
      return;
    }

    console.log('Waiting for SignalR connection...');

    // Đợi cho đến khi kết nối SignalR thành công trước khi khởi tạo Peer
    this.signalRService.getConnectionState().pipe(
      first(isConnected => isConnected === true)
    ).subscribe({
      next: () => {
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

        this.peer.on('error', (err) => {
          console.error('PeerJS error:', err);
          // Xử lý lỗi trong quá trình sử dụng PeerJS
        });
      },
      error: (err) => {
        console.error('Error connecting to SignalR:', err);
        // Xử lý lỗi kết nối SignalR tại đây, bạn có thể muốn thử kết nối lại
      }
    });
  }

  public waitForCallAcceptedThenStream(callback: (stream: MediaStream) => void): void {
    this.signalRService.hubConnection.on('CallAccepted', () => {
      console.log('CallAccepted signal received! Starting to listen for stream.');

      if (this.mediaCall) {
        this.mediaCall.on('stream', (remoteStream: MediaStream) => {
          callback(remoteStream);
        });
      } else {
        console.error('No active call to handle stream.');
      }
    });
  }

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
      call.close();
      return;
    }

    this.mediaCall = call;

    const isVideoCall = call.metadata?.isVideoCall ?? false;
    this.signalRService.notifyIncomingCall(call.peer, isVideoCall);
    console.log('Sending isVideoCall to SignalR:', isVideoCall);
  }

  public async acceptCall(isVideoCall: boolean): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true
      });

      if (this.mediaCall) {
        this.mediaCall.answer(this.localStream);

        this.waitForCallAcceptedThenStream((remoteStream) => {
          this.handleRemoteStream(remoteStream);
        });

        this.mediaCall.on('close', () => this.cleanup());
      } else {
        console.error('No incoming call to accept.');
        return null;
      }

      return this.localStream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      return null;
    }
  }

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
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true
      });

      if (!this.peer) {
        console.error('Peer instance is not initialized.');
        return;
      }

      if (this.mediaCall) {
        console.error('Already in a call. Cannot make a new call.');
        return;
      }

      this.mediaCall = this.peer.call(peerId, this.localStream, { metadata: { isVideoCall } });

      if (this.mediaCall) {
        this.waitForCallAcceptedThenStream((remoteStream) => {
          this.handleRemoteStream(remoteStream);
        });

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
      let isVideoCall = false;

      if (this.localStream && this.localStream.getVideoTracks().length > 0) {
        isVideoCall = true;
      }

      this.mediaCall.close();
      this.signalRService.handleEndCall(peerId, isVideoCall);
      this.cleanup();
      console.log('Call manually ended.');
    } else {
      console.error('No active call to end.');
    }
  }

  private handleRemoteStream(remoteStream: MediaStream): void {
    const videoElement = document.getElementById('remote-video') as HTMLVideoElement;

    if (videoElement) {
      videoElement.srcObject = remoteStream;
      videoElement.onloadedmetadata = () => {
        videoElement.play().then(() => {
          console.log('Remote stream is playing.');
        }).catch(err => console.error('Error playing remote stream:', err));
      };
    } else {
      console.error('Remote video element not found.');
    }
  }

  private cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.mediaCall) {
      this.mediaCall.close();
      this.mediaCall = null;
    }

    const remoteVideoElement = document.getElementById('remote-video') as HTMLVideoElement;
    if (remoteVideoElement) {
      remoteVideoElement.pause();
      remoteVideoElement.srcObject = null;
    }

    console.log('Call resources cleaned up.');
  }

  private getCurrentUserId(): string | null {
    return localStorage.getItem("userId");
  }
}

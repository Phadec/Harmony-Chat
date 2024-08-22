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
  private localStream: MediaStream | null = null;

  constructor(private signalRService: SignalRService) {
    this.initializePeer();
  }

  public initializePeer(): void {
    if (this.peer) {
      console.log('Peer already initialized.');
      return;
    }

    console.log('Waiting for SignalR connection...');
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

        this.peer.on('disconnected', () => {
          console.error('Peer disconnected.');
        });

        this.peer.on('close', () => {
          console.error('Peer connection closed.');
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS error:', err);
        });
      },
      error: (err) => {
        console.error('Error connecting to SignalR:', err);
      }
    });
  }

  public waitForCallAcceptedThenStream(callback: (stream: MediaStream) => void): void {
    this.signalRService.hubConnection.on('CallAccepted', () => {
      console.log('CallAccepted signal received! Starting to listen for stream.');

      if (this.mediaCall) {
        this.mediaCall.on('stream', (remoteStream: MediaStream) => {
          console.log('Remote stream received:', remoteStream);
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
        console.log('Remote stream received:', remoteStream);

        if (remoteStream.getAudioTracks().length > 0) {
          console.log('Audio stream received');
          callback(remoteStream);
        } else {
          console.log('No audio tracks found in the remote stream.');
        }
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
    console.log('Incoming call received:', call);

    const isVideoCall = call.metadata?.isVideoCall ?? false;
    this.signalRService.notifyIncomingCall(call.peer, isVideoCall);
    console.log('Notifying SignalR of incoming call with isVideoCall:', isVideoCall);
  }

  public async acceptCall(isVideoCall: boolean): Promise<MediaStream | null> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true
      });

      if (this.mediaCall) {
        this.mediaCall.answer(this.localStream);
        console.log('Call answered with local stream:', this.localStream);

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
      console.log('Rejecting call...');
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
      console.log('Local stream obtained for making call:', this.localStream);

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
        console.log('Outgoing call initiated with peerId:', peerId);
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
    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length > 0) {
      // Handle video stream
      const videoElement = document.getElementById('remote-video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = remoteStream;
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(() => {
            console.log('Remote video stream is playing.');
          }).catch(err => console.error('Error playing remote video stream:', err));
        };
      } else {
        console.error('Remote video element not found.');
      }
    } else {
      // Handle audio stream
      const audioElement = document.getElementById('remote-audio') as HTMLAudioElement;
      if (audioElement) {
        audioElement.srcObject = remoteStream;
        audioElement.onloadedmetadata = () => {
          audioElement.play().then(() => {
            console.log('Remote audio stream is playing.');
          }).catch(err => console.error('Error playing remote audio stream:', err));
        };
      } else {
        console.error('Remote audio element not found.');
      }
    }
  }


  private cleanup(): void {
    console.log('Cleaning up call resources...');

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      console.log('Local stream stopped.');
    }

    if (this.mediaCall) {
      this.mediaCall.close();
      this.mediaCall = null;
      console.log('Media call closed.');
    }

    const remoteVideoElement = document.getElementById('remote-video') as HTMLVideoElement;
    if (remoteVideoElement) {
      remoteVideoElement.pause();
      remoteVideoElement.srcObject = null;
      console.log('Remote video element cleaned up.');
    }

    console.log('Call resources cleaned up.');
  }

  private getCurrentUserId(): string | null {
    return localStorage.getItem("userId");
  }
}

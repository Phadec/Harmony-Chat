import Peer from 'peerjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignalRService } from '../signalR';
import { BehaviorSubject } from 'rxjs';

class PeerService {
  constructor() {
    this.peer = null;
    this.mediaCall = null;
    this.localStream = null;
    this.signalRService = SignalRService.getInstance();
    this.remoteStream$ = new BehaviorSubject(null);
    this.initializePeer();
  }

  static getInstance() {
    if (!PeerService.instance) {
      PeerService.instance = new PeerService();
    }
    return PeerService.instance;
  }

  async initializePeer() {
    if (this.peer) {
      console.log('Peer already initialized.');
      return;
    }

    try {
      this.peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' }
          ]
        }
      });

      this.peer.on('open', async (peerId) => {
        console.log(`Peer opened with ID: ${peerId}`);
        await this.registerPeerId(peerId);
      });

      this.peer.on('call', (call) => this.incomingCallHandler(call));

      this.peer.on('disconnected', () => {
        console.error('Peer disconnected.');
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
      });

    } catch (error) {
      console.error('Error initializing peer:', error);
    }
  }

  async registerPeerId(peerId) {
    try {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        await this.signalRService.hubConnection.invoke('RegisterPeerId', user.id, peerId);
        console.log(`PeerId ${peerId} registered for user ${user.id}`);
      }
    } catch (error) {
      console.error('Error registering PeerId:', error);
    }
  }

  incomingCallHandler(call) {
    if (this.mediaCall) {
      console.warn('Already in a call. Rejecting new incoming call.');
      call.close();
      return;
    }

    this.mediaCall = call;
    console.log('Incoming call received:', call);

    const isVideoCall = call.metadata?.isVideoCall ?? false;
    this.signalRService.hubConnection.invoke('HandleIncomingCall', call.peer, isVideoCall)
      .catch(err => console.error('Error handling incoming call:', err));
  }

  async acceptCall(isVideoCall) {
    try {
      // Note: React Native specific media handling would go here
      // This is a placeholder for actual media stream acquisition
      const stream = await this.getLocalStream(isVideoCall);
      
      if (this.mediaCall && stream) {
        this.mediaCall.answer(stream);
        this.localStream = stream;

        this.mediaCall.on('stream', (remoteStream) => {
          this.remoteStream$.next(remoteStream);
        });

        this.mediaCall.on('close', () => this.cleanup());
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accepting call:', error);
      return null;
    }
  }

  async makeCall(peerId, isVideoCall) {
    try {
      const stream = await this.getLocalStream(isVideoCall);
      
      if (!this.peer || !stream) {
        throw new Error('Peer not initialized or stream not available');
      }

      this.localStream = stream;
      this.mediaCall = this.peer.call(peerId, stream, { metadata: { isVideoCall } });

      if (this.mediaCall) {
        this.mediaCall.on('stream', (remoteStream) => {
          this.remoteStream$.next(remoteStream);
        });

        this.mediaCall.on('close', () => this.cleanup());
      }
    } catch (error) {
      console.error('Error making call:', error);
    }
  }

  async getLocalStream(isVideoCall) {
    // Note: This needs to be implemented using react-native-webrtc
    // Placeholder for actual implementation
    return null;
  }

  endCall() {
    if (this.mediaCall) {
      const peerId = this.mediaCall.peer;
      const isVideoCall = this.localStream?.getVideoTracks().length > 0;

      this.mediaCall.close();
      this.signalRService.hubConnection.invoke('HandleEndCall', peerId, isVideoCall)
        .catch(err => console.error('Error handling end call:', err));
      this.cleanup();
    }
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.mediaCall) {
      this.mediaCall.close();
      this.mediaCall = null;
    }

    this.remoteStream$.next(null);
  }
}

PeerService.instance = null;

export { PeerService };

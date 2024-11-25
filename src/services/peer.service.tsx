import { useEffect, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { SignalRService } from './signalr.service'; // Assuming SignalRService is converted for React Native
import { Alert } from 'react-native';

interface PeerServiceProps {
  signalRService: SignalRService;
}

const PeerService: React.FC<PeerServiceProps> = ({ signalRService }) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [mediaCall, setMediaCall] = useState<MediaConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const initializePeer = async () => {
      console.log('Waiting for SignalR connection...');
      const isConnected = await signalRService.getConnectionState();
      if (isConnected) {
        console.log('SignalR connected. Initializing Peer...');
        const newPeer = new Peer({
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' }
            ]
          }
        });

        newPeer.on('open', (peerId) => {
          console.log(`Peer opened with ID: ${peerId}`);
          registerPeerId(peerId);
        });

        newPeer.on('call', (call) => incomingCallHandler(call));
        newPeer.on('disconnected', () => console.error('Peer disconnected.'));
        newPeer.on('close', () => console.error('Peer connection closed.'));
        newPeer.on('error', (err) => console.error('PeerJS error:', err));

        setPeer(newPeer);
      } else {
        console.error('Error connecting to SignalR');
      }
    };

    initializePeer();
  }, [signalRService]);

  const registerPeerId = async (peerId: string) => {
    const userId = getCurrentUserId();
    if (userId) {
      try {
        await signalRService.registerPeerId(userId, peerId);
        console.log(`PeerId ${peerId} registered successfully for user ${userId}`);
      } catch (err) {
        console.error('Error registering PeerId:', err);
      }
    } else {
      console.error('User ID not found. Cannot register PeerId.');
    }
  };

  const incomingCallHandler = (call: MediaConnection) => {
    if (mediaCall) {
      console.warn('Already in a call. Rejecting new incoming call.');
      call.close();
      return;
    }

    setMediaCall(call);
    console.log('Incoming call received:', call);

    const isVideoCall = call.metadata?.isVideoCall ?? false;
    signalRService.notifyIncomingCall(call.peer, isVideoCall);
    console.log('Notifying SignalR of incoming call with isVideoCall:', isVideoCall);
  };

  const acceptCall = async (isVideoCall: boolean): Promise<MediaStream | null> => {
    try {
      const stream = await getUserMedia(isVideoCall);

      if (mediaCall) {
        mediaCall.answer(stream);
        console.log('Call answered with local stream:', stream);

        mediaCall.on('stream', (remoteStream) => {
          handleRemoteStream(remoteStream);
        });

        mediaCall.on('close', () => cleanup());
      } else {
        console.error('No incoming call to accept.');
        return null;
      }

      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      return null;
    }
  };

  const rejectCall = () => {
    if (mediaCall) {
      console.log('Rejecting call...');
      mediaCall.close();
      cleanup();
    } else {
      console.error('No incoming call to reject.');
    }
  };

  const makeCall = async (peerId: string, isVideoCall: boolean): Promise<void> => {
    try {
      const stream = await getUserMedia(isVideoCall);

      if (!peer) {
        console.error('Peer instance is not initialized.');
        return;
      }

      if (mediaCall) {
        console.error('Already in a call. Cannot make a new call.');
        return;
      }

      const call = peer.call(peerId, stream, { metadata: { isVideoCall } });

      if (call) {
        console.log('Outgoing call initiated with peerId:', peerId);
        call.on('stream', (remoteStream) => handleRemoteStream(remoteStream));
        call.on('close', () => cleanup());

        setMediaCall(call);
      } else {
        console.error('Failed to make call.');
      }
    } catch (error) {
      console.error('Failed to get local stream:', error);
    }
  };

  const handleRemoteStream = (remoteStream: MediaStream) => {
    const videoTracks = remoteStream.getVideoTracks();
    const audioTracks = remoteStream.getAudioTracks();

    if (videoTracks.length > 0) {
      // Handle remote video stream (using React Native components)
    }

    if (audioTracks.length > 0) {
      // Handle remote audio stream (using React Native components)
    } else {
      console.warn('No audio tracks found in the remote stream.');
    }
  };

  const endCall = () => {
    if (mediaCall) {
      const peerId = mediaCall.peer;
      let isVideoCall = false;

      if (localStream && localStream.getVideoTracks().length > 0) {
        isVideoCall = true;
      }

      mediaCall.close();
      signalRService.handleEndCall(peerId, isVideoCall);
      cleanup();
      console.log('Call manually ended.');
    } else {
      console.error('No active call to end.');
    }
  };

  const cleanup = () => {
    console.log('Cleaning up call resources...');

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      console.log('Local stream stopped.');
    }

    if (mediaCall) {
      mediaCall.close();
      setMediaCall(null);
      console.log('Media call closed.');
    }

    console.log('Call resources cleaned up.');
  };

  const getCurrentUserId = (): string | null => {
    // For React Native, you might use AsyncStorage or some other local storage method.
    return null; // Replace with actual method to get user ID
  };

  const getUserMedia = async (isVideoCall: boolean): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoCall,
        audio: true
      });
      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  };

  return null; // This is a service, no UI to render in this component
};

export default PeerService;

import { Injectable } from '@angular/core';
import { Peer, DataConnection, MediaConnection } from 'peerjs';

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  private peer: Peer;
  private mediaCall: MediaConnection | null = null;

  constructor() {
    this.peer = new Peer({
      // Optionally you can pass an ID here or leave it to be auto-generated
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' }
        ]
      }
    });

    this.peer.on('open', (id) => {
      console.log('PeerJS ID:', id);
    });

    this.peer.on('call', (call) => {
      this.mediaCall = call;
    });
  }

  getPeerId(): string {
    return this.peer.id;
  }

  makeCall(peerId: string, stream: MediaStream) {
    this.mediaCall = this.peer.call(peerId, stream);
  }

  answerCall(stream: MediaStream) {
    if (this.mediaCall) {
      this.mediaCall.answer(stream);
    }
  }

  onStream(callback: (stream: MediaStream) => void) {
    if (this.mediaCall) {
      this.mediaCall.on('stream', (remoteStream) => {
        callback(remoteStream);
      });
    }
  }
}

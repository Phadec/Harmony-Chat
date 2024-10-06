import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PeerService } from '../../services/peer.service';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-incoming-call-popup',
  templateUrl: './incoming-call-popup.component.html',
  styleUrls: ['./incoming-call-popup.component.css']
})
export class IncomingCallPopupComponent implements OnInit, AfterViewInit, OnDestroy {
  callAccepted: boolean = false;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;

  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteAudio') remoteAudioRef!: ElementRef<HTMLAudioElement>;  // Thêm phần tử audio
  endCallAudio: HTMLAudioElement | null = null;
  constructor(
    public dialogRef: MatDialogRef<IncomingCallPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { callerName: string, peerId: string, isVideoCall: boolean },
    private peerService: PeerService,
    private cdRef: ChangeDetectorRef,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    console.log('Incoming call from:', this.data.callerName);
    console.log('Is Video Call:', this.data.isVideoCall);

    this.signalRService.hubConnection.on('CallEnded', (data: { isVideoCall: boolean }) => {
      if (data.isVideoCall === this.data.isVideoCall) {
        this.endCall();
      }
    });

    this.listenForRemoteStream();
  }

  ngAfterViewInit(): void {
    this.cdRef.detectChanges();
  }

  async acceptCall(): Promise<void> {
    try {
      console.log('Accepting call...');
      this.localStream = await this.peerService.acceptCall(this.data.isVideoCall);
      this.callAccepted = !!this.localStream;

      if (!this.callAccepted) {
        throw new Error('Failed to access local media stream.');
      }

      await this.signalRService.hubConnection.send('AcceptCall', this.data.peerId);
      this.signalRService.callAccepted();

      if (this.data.isVideoCall && this.localStream) {
        this.tryPlayingLocalStream(5);
      }

      console.log('Call accepted successfully.');
    } catch (error) {
      console.error('Failed to accept call:', error);
      this.handleMediaErrors(error);
      this.rejectCall();
    }
  }

  tryPlayingLocalStream(retries: number): void {
    if (!this.localStream) {
      console.error('Local stream is null or undefined.');
      return;
    }

    if (this.localVideoRef?.nativeElement) {
      console.log('Local stream obtained:', this.localStream);
      this.playStream(this.localStream, this.localVideoRef.nativeElement);
    } else if (retries > 0) {
      console.warn('Local video element not ready, retrying...', retries, 'attempts left.');
      setTimeout(() => this.tryPlayingLocalStream(retries - 1), 100);
    } else {
      console.error('Failed to initialize local video element after multiple attempts.');
    }
  }

  listenForRemoteStream(): void {
    console.log('Listening for remote stream...');

    this.peerService.onStream((remoteStream: MediaStream) => {
      console.log('Received remote stream:', remoteStream);

      this.remoteStream = remoteStream;

      const audioTracks = remoteStream.getAudioTracks();
      const videoTracks = remoteStream.getVideoTracks();

      if (videoTracks.length > 0) {
        // For video call
        this.playStream(remoteStream, this.remoteVideoRef.nativeElement);
      } else if (audioTracks.length > 0) {
        // For voice call
        this.playStream(remoteStream, this.remoteAudioRef.nativeElement);
      } else {
        console.warn('Remote stream does not contain any audio or video tracks.');
      }
    });
  }

  playStream(stream: MediaStream, mediaElement: HTMLMediaElement): void {
    if (mediaElement) {
      console.log('Assigning stream to media element', mediaElement);
      mediaElement.srcObject = stream;

      mediaElement.onloadedmetadata = () => {
        console.log('Metadata loaded, attempting to play media');
        mediaElement.play().then(() => {
          console.log('Media playback started successfully.');
        }).catch((error) => {
          console.error('Failed to play media:', error);
          // If media playback fails due to browser restrictions, alert the user
          alert('Unable to autoplay the media. Please interact with the page to start the media playback.');
        });
      };
    } else {
      console.error('Media element is not initialized.');
    }
  }

  rejectCall(): void {
    try {
      console.log('Rejecting call...');
      this.signalRService.handleEndCall(this.data.peerId, this.data.isVideoCall);
      this.stopLocalStream();
      this.dialogRef.close();
    } catch (error) {
      console.error('Error while rejecting call:', error);
    }
  }

  endCall(): void {
    console.log('Ending call...');
    this.playEndCallSound();  // Phát âm thanh kết thúc cuộc gọi
    this.peerService.endCall();
    this.stopLocalStream();
    this.dialogRef.close();
  }
  playEndCallSound(): void {
    this.endCallAudio = new Audio('assets/endcall.mp3'); // Đường dẫn đến tệp âm thanh kết thúc cuộc gọi
    this.endCallAudio.play().then(() => {
      console.log('End call sound played');
    }).catch(error => {
      console.error('Failed to play end call sound:', error);
    });
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  ngOnDestroy(): void {
    this.signalRService.hubConnection.off('CallEnded');
    this.stopLocalStream();
  }

  private handleMediaErrors(error: unknown): void {
    if (error instanceof Error) {
      switch (error.name) {
        case 'NotAllowedError':
          alert('Permission to access media devices was denied.');
          break;
        case 'NotFoundError':
          alert('No media devices found. Please connect a camera and microphone.');
          break;
        case 'NotReadableError':
          alert('Media device is already in use by another application.');
          break;
        default:
          alert('Could not access media devices. Please check your permissions.');
          break;
      }
    } else {
      alert('An unknown error occurred.');
    }
  }
}

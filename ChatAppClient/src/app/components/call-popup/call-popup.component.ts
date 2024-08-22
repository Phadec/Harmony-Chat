import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PeerService } from '../../services/peer.service';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-call-popup',
  templateUrl: './call-popup.component.html',
  styleUrls: ['./call-popup.component.css']
})
export class CallPopupComponent implements OnInit, OnDestroy {
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  callAccepted: boolean = false;
  ringingAudio: HTMLAudioElement | null = null;  // Biến để quản lý âm thanh
  timeoutId: any;
  constructor(
    public dialogRef: MatDialogRef<CallPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { recipientName: string, isVideoCall: boolean },
    private peerService: PeerService,
    private signalRService: SignalRService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Lắng nghe remote stream ngay lập tức
    this.listenForRemoteStream();

    this.signalRService.hubConnection.on('CallAccepted', () => {
      console.log('CallAccepted signal received!');
      this.callAccepted = true;
      this.stopRinging();  // Dừng âm thanh khi cuộc gọi được chấp nhận
      clearTimeout(this.timeoutId);  // Hủy bỏ timeout khi cuộc gọi được chấp nhận
      this.startLocalStream();
    });

    // Lắng nghe sự kiện kết thúc cuộc gọi
    this.signalRService.hubConnection.on('CallEnded', (data: { isVideoCall: boolean }) => {
      if (data.isVideoCall === this.data.isVideoCall) {
        this.stopRinging();  // Dừng âm thanh khi cuộc gọi kết thúc
        this.endCall();
      }
    });

    // Bắt đầu phát âm thanh khi mở popup
    this.startRinging();

    // Thiết lập timeout tự động kết thúc cuộc gọi sau 15 giây nếu không được chấp nhận
    this.timeoutId = setTimeout(() => {
      console.log('Call not accepted within 15 seconds, ending call automatically.');
      this.endCall();  // Tự động kết thúc cuộc gọi
    }, 15000);  // 15 giây
  }
  startRinging(): void {
    this.ringingAudio = new Audio('assets/ringcall.mp3');
    this.ringingAudio.loop = true;
    this.ringingAudio.play().then(() => {
      console.log('Ringing sound started');
    }).catch(error => {
      console.error('Failed to play ringing sound:', error);
    });
  }
    stopRinging(): void {
    if (this.ringingAudio) {
      this.ringingAudio.pause();
      this.ringingAudio.currentTime = 0;  // Đặt lại thời gian về 0 để phát lại từ đầu nếu cần
    }
  }

  async startLocalStream(): Promise<void> {
    if (!this.callAccepted) {
      console.log('Waiting for CallAccepted before starting local stream...');
      return;
    }

    try {
      const constraints = this.data.isVideoCall ? { video: true, audio: true } : { audio: true };
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.localStream && this.data.isVideoCall) {
        this.playStream(this.localStream, 'local-video');
      }
    } catch (error) {
      console.error('Failed to get local stream:', error);
      alert('Could not access media devices. Please check your permissions.');
    }
  }

  listenForRemoteStream(): void {
    if (!this.callAccepted) {
      console.log('Waiting for CallAccepted before listening for remote stream...');
      return;
    }

    this.peerService.onStream((remoteStream: MediaStream) => {
      console.log('Remote stream received:', remoteStream);

      this.remoteStream = remoteStream;

      if (this.remoteStream.getVideoTracks().length > 0 && this.callAccepted) {
        this.playStream(remoteStream, 'remote-video');
      }
    });
  }

  playStream(stream: MediaStream, elementId: string): void {
    const videoElement = document.getElementById(elementId) as HTMLVideoElement;

    if (videoElement) {
      console.log(`Assigning stream to video element with ID: ${elementId}`);
      videoElement.srcObject = stream;
      console.log('Stream assigned:', videoElement.srcObject);

      videoElement.onloadedmetadata = () => {
        videoElement.play().then(() => {
          console.log(`Video playback started on element: ${elementId}`);
        }).catch((error) => {
          console.error(`Failed to play video on element ${elementId}:`, error);
        });
      };
    } else {
      console.error(`Video element with ID: ${elementId} not found.`);
    }
  }

  endCall(): void {
    console.log('Ending call...');
    this.peerService.endCall();
    this.cleanupStreams();
    this.dialogRef.close();
  }

  cleanupStreams(): void {
    console.log('Cleaning up streams...');
    this.stopLocalStream();
    this.stopRemoteStream();
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  stopRemoteStream(): void {
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
  }

  ngOnDestroy(): void {
    console.log('Cleaning up CallPopupComponent...');
    this.signalRService.hubConnection.off('CallEnded');
    this.signalRService.hubConnection.off('CallAccepted');
    this.cleanupStreams();
  }
}

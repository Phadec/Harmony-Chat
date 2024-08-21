import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
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

  constructor(
    public dialogRef: MatDialogRef<CallPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { recipientName: string, isVideoCall: boolean }, // Thêm isVideoCall để xác định loại cuộc gọi
    private peerService: PeerService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    this.startLocalStream();
    this.listenForRemoteStream();
    console.log('isVideoCall received in CallPopupComponent:', this.data.isVideoCall);

    // Lắng nghe sự kiện CallEnded từ SignalR
    this.signalRService.hubConnection.on('CallEnded', (data: { isVideoCall: boolean }) => {
      if (data.isVideoCall === this.data.isVideoCall) {
        this.endCall();
      }
    });
  }

  // Bắt đầu stream cục bộ (có thể là audio hoặc cả video + audio)
  async startLocalStream(): Promise<void> {
    try {
      // Nếu là cuộc gọi video thì yêu cầu cả camera và microphone, nếu không chỉ yêu cầu microphone
      if (this.data.isVideoCall) {
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } else {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      // Chỉ phát video khi đó là cuộc gọi video
      if (this.data.isVideoCall && this.localStream) {
        this.playStream(this.localStream, 'local-video');
      }
    } catch (error) {
      console.error('Failed to get local stream:', error);
      alert('Could not access media devices. Please check your permissions.');
    }
  }

  // Lắng nghe stream từ đối tác
  listenForRemoteStream(): void {
    this.peerService.onStream((remoteStream) => {
      if (this.data.isVideoCall) {  // Chỉ phát video khi đó là cuộc gọi video
        this.playStream(remoteStream, 'remote-video');
      }
    });
  }

  // Hiển thị stream lên UI
  playStream(stream: MediaStream, elementId: string): void {
    const videoElement = document.getElementById(elementId) as HTMLVideoElement;
    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.play().catch((error) => {
        console.error(`Failed to play video on element ${elementId}:`, error);
      });
    } else {
      console.error(`Video element with id ${elementId} not found.`);
    }
  }

  // Kết thúc cuộc gọi
  endCall(): void {
    this.peerService.endCall();
    this.stopLocalStream();
    this.dialogRef.close();
  }

  // Dừng stream cục bộ
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // Cleanup khi component bị hủy
  ngOnDestroy(): void {
    this.signalRService.hubConnection.off('CallEnded');
    this.stopLocalStream();
  }
}

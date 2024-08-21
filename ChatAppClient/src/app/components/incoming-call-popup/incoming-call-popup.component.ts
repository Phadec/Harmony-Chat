import { Component, Inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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

  // Sử dụng ViewChild để tham chiếu đến phần tử video
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;

  constructor(
    public dialogRef: MatDialogRef<IncomingCallPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { callerName: string, peerId: string, isVideoCall: boolean },
    private peerService: PeerService,
    private signalRService: SignalRService
  ) {}

  ngOnInit(): void {
    console.log('Incoming call from:', this.data.callerName);
    console.log('Is Video Call:', this.data.isVideoCall);

    // Lắng nghe sự kiện kết thúc cuộc gọi từ đối tác
    this.signalRService.hubConnection.on('CallEnded', (data: { isVideoCall: boolean }) => {
      if (data.isVideoCall === this.data.isVideoCall) {
        this.endCall();
      }
    });

    this.listenForRemoteStream();
  }

  ngAfterViewInit(): void {
    if (this.data.isVideoCall && this.localVideoRef && this.localStream) {
      this.playStream(this.localStream, this.localVideoRef.nativeElement);
    }
  }

  async acceptCall(): Promise<void> {
    try {
      console.log('Accepting call...');

      // Chấp nhận cuộc gọi với loại cuộc gọi (video/audio) dựa trên `isVideoCall`
      this.localStream = await this.peerService.acceptCall(this.data.isVideoCall);
      this.callAccepted = !!this.localStream;  // Đánh dấu là cuộc gọi đã được chấp nhận nếu có localStream

      // Nếu là cuộc gọi video, phát stream video cục bộ
      if (this.data.isVideoCall && this.localStream) {
        console.log('Local stream obtained:', this.localStream);
        this.playStream(this.localStream, this.localVideoRef?.nativeElement);
      }
    } catch (error: unknown) {
      console.error('Failed to accept call:', error);

      if (error instanceof Error) {
        // Xử lý các loại lỗi khác nhau
        if (error.name === 'NotAllowedError') {
          alert('Permission to access media devices was denied.');
        } else if (error.name === 'NotFoundError') {
          alert('No media devices found. Please connect a camera and microphone.');
        } else if (error.name === 'NotReadableError') {
          alert('Media device is already in use by another application.');
        } else {
          alert('Could not access media devices. Please check your permissions.');
        }
      } else {
        alert('An unknown error occurred.');
      }

      this.rejectCall();  // Tự động từ chối cuộc gọi nếu không lấy được thiết bị
    }
  }




  // Từ chối cuộc gọi
  rejectCall(): void {
    try {
      console.log('Rejecting call...');

      // Gọi phương thức để xử lý kết thúc cuộc gọi trên server
      this.signalRService.handleEndCall(this.data.peerId, this.data.isVideoCall);

      // Đảm bảo dừng bất kỳ stream nào nếu có
      this.stopLocalStream();

      // Đóng dialog popup
      this.dialogRef.close();
    } catch (error) {
      console.error('Error while rejecting call:', error);
    }
  }

  // Lắng nghe remote stream từ đối tác
  listenForRemoteStream(): void {
    this.peerService.onStream((remoteStream) => {
      console.log('Received remote stream:', remoteStream);
      if (this.data.isVideoCall) {
        this.playStream(remoteStream, this.remoteVideoRef?.nativeElement);
      }
    });
  }

  // Phương thức phát video đã được sửa đổi
  playStream(stream: MediaStream, videoElement: HTMLVideoElement | undefined): void {
    if (videoElement) {
      console.log(`Playing stream on video element`, videoElement);

      // Gán stream cho srcObject của phần tử video
      videoElement.srcObject = stream;

      // Đảm bảo phát video sau khi metadata đã được load
      videoElement.onloadedmetadata = () => {
        videoElement.play().catch((error) => {
          console.error(`Failed to play video:`, error);
        });
      };
    } else {
      console.error(`Video element not found or not initialized.`);
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

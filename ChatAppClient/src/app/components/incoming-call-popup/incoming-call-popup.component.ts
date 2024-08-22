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

    // Lắng nghe sự kiện kết thúc cuộc gọi từ đối tác
    this.signalRService.hubConnection.on('CallEnded', (data: { isVideoCall: boolean }) => {
      if (data.isVideoCall === this.data.isVideoCall) {
        this.endCall();
      }
    });

    // Lắng nghe stream từ đối tác ngay khi nhận cuộc gọi
    this.listenForRemoteStream();
  }

  ngAfterViewInit(): void {
    // Chỉ định lại các thành phần ViewChild sau khi View đã được khởi tạo
    this.cdRef.detectChanges();
  }
  async acceptCall(): Promise<void> {
    try {
      console.log('Accepting call...');

      // Chấp nhận cuộc gọi và nhận stream từ thiết bị local (video hoặc audio tùy thuộc vào cuộc gọi)
      this.localStream = await this.peerService.acceptCall(this.data.isVideoCall);

      // Đánh dấu rằng cuộc gọi đã được chấp nhận nếu có localStream
      this.callAccepted = !!this.localStream;

      if (!this.callAccepted) {
        throw new Error('Failed to access local media stream.');
      }

      // Gửi tín hiệu chấp nhận cuộc gọi lên server
      await this.signalRService.hubConnection.send('AcceptCall', this.data.peerId);

      // Phát tín hiệu dừng âm thanh khi cuộc gọi đã được chấp nhận
      this.signalRService.callAccepted();

      // Đảm bảo localVideoRef đã sẵn sàng trước khi phát stream
      if (this.data.isVideoCall && this.localStream) {
        this.tryPlayingLocalStream(5); // Thử phát stream với tối đa 5 lần thử
      }

      console.log('Call accepted successfully.');
    } catch (error) {
      console.error('Failed to accept call:', error);
      this.handleMediaErrors(error);
      this.rejectCall(); // Hủy bỏ cuộc gọi nếu xảy ra lỗi
    }
  }

  tryPlayingLocalStream(retries: number): void {
    // Kiểm tra xem localStream có null không trước khi tiếp tục
    if (!this.localStream) {
      console.error('Local stream is null or undefined.');
      return;
    }

    if (this.localVideoRef?.nativeElement) {
      console.log('Local stream obtained:', this.localStream);
      this.playStream(this.localStream, this.localVideoRef.nativeElement);
    } else if (retries > 0) {
      console.warn('Local video element not ready, retrying...', retries, 'attempts left.');
      setTimeout(() => this.tryPlayingLocalStream(retries - 1), 100); // Thử lại sau 100ms
    } else {
      console.error('Failed to initialize local video element after multiple attempts.');
      // Nếu thất bại sau nhiều lần thử, bạn có thể xử lý thêm tại đây (ví dụ: thông báo lỗi cho người dùng)
    }
  }

  listenForRemoteStream(): void {
    console.log('Listening for remote stream...');

    this.peerService.onStream((remoteStream: MediaStream) => {
      console.log('Received remote stream:', remoteStream);

      if (remoteStream.getVideoTracks().length > 0) {
        console.log('Remote stream contains video tracks.');
        this.remoteStream = remoteStream;

        this.cdRef.detectChanges(); // Cập nhật giao diện

        if (this.remoteVideoRef?.nativeElement) {
          console.log('Applying remote stream to the video element.');
          this.playStream(remoteStream, this.remoteVideoRef.nativeElement);
        } else {
          console.warn('Remote video element is not found or not initialized.');
        }
      } else {
        console.warn('Remote stream does not contain any video tracks.');
      }
    });
  }

  playStream(stream: MediaStream, videoElement: HTMLVideoElement): void {
    if (videoElement) {
      console.log('Assigning stream to video element', videoElement);
      videoElement.srcObject = stream;

      videoElement.onloadedmetadata = () => {
        console.log('Metadata loaded, attempting to play video');
        videoElement.play().catch((error) => {
          console.error('Failed to play video:', error);
        });
      };
    } else {
      console.error('Video element is not initialized.');
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
    this.peerService.endCall();
    this.stopLocalStream();
    this.dialogRef.close();
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

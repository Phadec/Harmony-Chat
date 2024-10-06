import { Component, Input, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { PeerService } from "../../services/peer.service";
import { SignalRService } from "../../services/signalr.service";
import { CallPopupComponent } from "../call-popup/call-popup.component";
import { ImagePreviewDialogComponent } from "../image-preview-dialog/image-preview-dialog.component";
import { AppConfigService } from "../../services/app-config.service";

@Component({
  selector: 'app-chat-header',
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.css']
})
export class ChatHeaderComponent implements OnInit {
  @Input() recipientInfo: any;  // Nhận recipientInfo từ ChatWindowComponent
  @Input() chatTheme: string = 'default'; // Nhận chatTheme từ ChatWindowComponent

  constructor(
    private peerService: PeerService,
    private signalRService: SignalRService,
    private appConfig: AppConfigService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Đăng ký xử lý khi có luồng stream từ người nhận
    this.peerService.onStream((remoteStream) => {
      this.playRemoteStream(remoteStream);
    });
  }

  async startVoiceCall(): Promise<void> {
    try {
      if (!this.recipientInfo?.id || !this.recipientInfo?.fullName) {
        console.error('Recipient information is missing or incomplete.');
        return;
      }

      const recipientPeerId = await this.signalRService.getPeerId(this.recipientInfo.id);
      if (recipientPeerId) {
        console.log('Opening voice call dialog...');
        this.peerService.makeCall(recipientPeerId, false); // Truyền isVideoCall = false

        if (!this.dialog.openDialogs.length) {
          this.dialog.open(CallPopupComponent, {
            width: '60%',
            maxWidth: '800px',
            height: 'auto',
            maxHeight: '90vh',  // Giới hạn chiều cao để không vượt quá màn hình
            panelClass: 'no-scroll-popup',
            data: {
              recipientName: this.recipientInfo.fullName,
              isVideoCall: false  // Truyền isVideoCall = false
            },
            disableClose: true
          });
        }
      } else {
        console.error('Unable to retrieve recipient PeerId.');
      }
    } catch (error) {
      console.error('Error starting voice call:', error);
    }
  }

  async startVideoCall(): Promise<void> {
    try {
      if (!this.recipientInfo?.id || !this.recipientInfo?.fullName) {
        console.error('Recipient information is missing or incomplete.');
        return;
      }

      const recipientPeerId = await this.signalRService.getPeerId(this.recipientInfo.id);
      if (recipientPeerId) {
        console.log('Opening video call dialog...');
        this.peerService.makeCall(recipientPeerId, true); // Truyền isVideoCall = true

        if (!this.dialog.openDialogs.length) {
          this.dialog.open(CallPopupComponent, {
            width: '60%',
            maxWidth: '800px',
            height: 'auto',
            maxHeight: '90vh',  // Giới hạn chiều cao để không vượt quá màn hình
            panelClass: 'no-scroll-popup',
            data: {
              recipientName: this.recipientInfo.fullName,
              isVideoCall: true  // Truyền isVideoCall = true
            },
            disableClose: true
          });
        }
      } else {
        alert('Unable to retrieve recipient peerId.');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Unable to start video call. Please check your connection and permissions.');
    }
  }

  // Phương thức hiển thị stream từ người nhận
  playRemoteStream(remoteStream: MediaStream): void {
    const videoElement = document.createElement('video');
    videoElement.srcObject = remoteStream;
    videoElement.autoplay = true;
    videoElement.controls = true; // Optional: cho phép người dùng điều khiển video

    // Thêm video vào một container trong UI
    const videoContainer = document.getElementById('video-container');
    if (videoContainer) {
      videoContainer.innerHTML = ''; // Xóa nội dung cũ nếu có
      videoContainer.appendChild(videoElement);
    }
  }

  // Mở hộp thoại xem ảnh
  openImagePreview(): void {
    const baseUrl = this.appConfig.getBaseUrl();
    if (!this.recipientInfo || !this.recipientInfo.avatar) {
      console.error('Recipient avatar information not found.');
      return;
    }

    this.dialog.open(ImagePreviewDialogComponent, {
      data: `${baseUrl}/${this.recipientInfo.avatar}`, // Sử dụng baseUrl và avatar
      panelClass: 'custom-dialog-container'
    });
  }

  getAvatarUrl(avatar: string): string {
    const baseUrl = this.appConfig.getBaseUrl(); // Lấy baseUrl từ AppConfigService
    return `${baseUrl}/${avatar}`;
  }
}

import { PeerService } from "../../services/peer.service";
import { SignalRService } from "../../services/signalr.service";  // Import SignalRService
import { MatDialog } from "@angular/material/dialog";
import { Component, Input, OnInit } from "@angular/core";
import { ImagePreviewDialogComponent } from "../image-preview-dialog/image-preview-dialog.component";
import { CallPopupComponent } from "../call-popup/call-popup.component";

@Component({
  selector: 'app-chat-header',
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.css']
})
export class ChatHeaderComponent implements OnInit {
  @Input() recipientInfo: any; // Nhận thông tin người nhận từ component cha

  constructor(
    private peerService: PeerService,
    private signalRService: SignalRService,  // Inject SignalRService
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
        this.peerService.makeCall(recipientPeerId, false); // Không truyền isVideoCall = false

        if (!this.dialog.openDialogs.length) {
          this.dialog.open(CallPopupComponent, {
            width: '600px',   // Thiết lập chiều rộng
            height: '80%',
            data: {
              recipientName: this.recipientInfo.fullName,
              isVideoCall: false  // Truyền isVideoCall = false
            }
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
        this.peerService.makeCall(recipientPeerId, true); // Không truyền isVideoCall = true

        if (!this.dialog.openDialogs.length) {
          this.dialog.open(CallPopupComponent, {
            width: '600px',   // Thiết lập chiều rộng
            height: '80%',
            data: {
              recipientName: this.recipientInfo.fullName,
              isVideoCall: true  // Truyền isVideoCall = true
            }
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
    if (!this.recipientInfo || !this.recipientInfo.avatar) {
      console.error('Recipient avatar information not found.');
      return;
    }

    this.dialog.open(ImagePreviewDialogComponent, {
      data: 'https://localhost:7267/' + this.recipientInfo.avatar,
      panelClass: 'custom-dialog-container'
    });
  }
}

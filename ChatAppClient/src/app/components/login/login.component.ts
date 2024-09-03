import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { SignalRService } from '../../services/signalr.service';
import { PeerService } from '../../services/peer.service'; // Import PeerService

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private signalRService: SignalRService, // Inject SignalRService
    private peerService: PeerService // Inject PeerService
  ) {}

  onLogin(): void {
    this.authService.login(this.username, this.password).subscribe({
      next: async (response) => {
        // Lưu thông tin vào localStorage
        localStorage.setItem('userId', response.id);
        localStorage.setItem('token', response.token);
        localStorage.setItem('userAvatar', response.avatar);
        localStorage.setItem('role', response.role); // Lưu role của người dùng

        console.log("Login successful");
        console.log("User ID:", response.id);
        console.log("Token:", response.token);

        // Kết nối SignalR sau khi đăng nhập thành công
        await this.signalRService.startConnection();

        // Điều hướng dựa trên role của người dùng
        if (response.role === 'Admin') {
          this.router.navigate(['/admin']);
        } else if (response.role === 'User') {
          this.router.navigate(['/chats']);
        } else {
          // Nếu role không xác định, có thể chuyển đến một trang mặc định hoặc trang lỗi
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error("Login failed", error);

        // Hiển thị thông báo lỗi nếu có
        this.errorMessage = error.error.message || "Login failed. Please check your credentials and try again.";
      }
    });
  }
}

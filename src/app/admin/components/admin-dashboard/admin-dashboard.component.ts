import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../admin.service';
import { AuthService } from "../../../services/auth.service";
import { Router } from '@angular/router';  // Import Router

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  users: any[] = [];  // Đảm bảo rằng biến users là một mảng

  constructor(private adminService: AdminService, private authService: AuthService, private router: Router) {}  // Inject Router

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe((response: any) => {
      this.users = response.$values;  // Gán dữ liệu từ response.$values cho biến users
    });
  }

  lockUser(userId: string): void {
    this.adminService.lockUser(userId).subscribe(() => {
      this.users = this.users.map(user => user.id === userId ? { ...user, isLocked: true } : user);
    });
  }

  unlockUser(userId: string): void {
    this.adminService.unlockUser(userId).subscribe(() => {
      this.users = this.users.map(user => user.id === userId ? { ...user, isLocked: false } : user);
    });
  }

  signOut(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.authService.logout(userId).subscribe({
        next: () => {
          localStorage.removeItem('userId');
          localStorage.removeItem('token');  // Xóa thêm thông tin token nếu có
          this.router.navigate(['/login']);  // Chuyển hướng về trang đăng nhập
        },
        error: (err) => {
          console.error('Error during sign out:', err);
        }
      });
    } else {
      // Nếu không có userId trong localStorage, chuyển hướng về trang đăng nhập ngay lập tức
      this.router.navigate(['/login']);
    }
  }
}

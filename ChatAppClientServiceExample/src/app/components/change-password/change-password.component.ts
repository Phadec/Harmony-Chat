import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onChangePassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = "New passwords do not match!";
      return;
    }

    const formData = new FormData();
    formData.append('currentPassword', this.currentPassword);
    formData.append('newPassword', this.newPassword);

    this.authService.changePassword(formData).subscribe({
      next: response => {
        console.log('Password changed successfully', response);
        this.successMessage = "Password has been changed successfully.";
        this.errorMessage = null;
        setTimeout(() => {
          this.router.navigate(['/login']); // Điều hướng tới trang login sau khi thay đổi mật khẩu thành công
        }, 3000); // Redirect to login page after 3 seconds
      },
      error: error => {
        console.error('Password change failed', error);
        this.errorMessage = error.error.Message || 'Password change failed.';
        this.successMessage = null;
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  newPassword: string = '';
  confirmPassword: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  token: string | null = null;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.errorMessage = "Invalid or missing password reset token.";
      }
    });
  }

  onResetPassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = "Passwords do not match!";
      return;
    }

    if (!this.token) {
      this.errorMessage = "Invalid or missing password reset token.";
      return;
    }

    const formData = new FormData();
    formData.append('token', this.token);
    formData.append('newPassword', this.newPassword);

    this.authService.resetPassword(formData).subscribe({
      next: response => {
        console.log('Password reset successful', response);
        this.successMessage = "Password has been reset successfully.";
        this.errorMessage = null;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000); // Redirect to login page after 3 seconds
      },
      error: error => {
        console.error('Password reset failed', error);
        this.errorMessage = error.error.Message || 'Password reset failed.';
        this.successMessage = null;
      }
    });
  }
}

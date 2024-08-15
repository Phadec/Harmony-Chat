import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';  // Import HttpErrorResponse

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
    formData.append('confirmPassword', this.confirmPassword);

    this.authService.resetPassword(formData).subscribe({
      next: response => {
        console.log('Password reset successful', response);
        this.successMessage = "Password has been reset successfully.";
        this.errorMessage = null;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000); // Redirect to login page after 3 seconds
      },
      error: (error: HttpErrorResponse) => {
        console.error('Password reset failed', error);

        // Check if the server sent a custom error message
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message; // This accesses the custom error message sent from the server
        } else {
          this.errorMessage = 'Password reset failed. Please try again later.';
        }

        this.successMessage = null;
      }
    });
  }
}

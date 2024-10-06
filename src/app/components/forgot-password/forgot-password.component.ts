import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  username: string = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService) {
  }

  onForgotPassword(): void {
    if (!this.username) {
      this.errorMessage = 'Username is required';
      return;
    }
    this.authService.forgotPassword(this.username).subscribe({
      next: response => {
        this.successMessage = "Password reset email sent. Please check your inbox.";
        this.errorMessage = null;
      },
      error: error => {
        if (error.status === 400 && error.error.errors) {
          console.log('Validation errors:', error.error.errors);
        }
        this.errorMessage = error.error.title || 'Failed to send password reset email.';
        this.successMessage = null;
      }
    });
  }
}

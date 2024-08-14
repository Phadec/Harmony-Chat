import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service'; // Adjust the path as necessary
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.css']
})
export class ChangePasswordDialogComponent {
  changePasswordForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private fb: FormBuilder
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordsMatchValidator // Custom validator to check if passwords match
    });
  }

  passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { notSame: true };
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      return;
    }

    const currentId = sessionStorage.getItem('userId'); // Retrieve the current user ID from local storage

    if (!currentId) {
      this.errorMessage = 'User ID not found in local storage.';
      return;
    }

    const payload = {
      userId: currentId,
      currentPassword: this.changePasswordForm.get('currentPassword')?.value,
      newPassword: this.changePasswordForm.get('newPassword')?.value
    };

    this.authService.changePassword(payload.currentPassword, payload.newPassword, this.changePasswordForm.get('confirmPassword')?.value).subscribe({
      next: (response) => {
        console.log('Password changed successfully:', response);
        this.dialogRef.close(true); // Close the dialog on success
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.errorMessage = 'Failed to change password. Please try again.'; // Display an error message
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false); // Close the dialog without making any changes
  }
}

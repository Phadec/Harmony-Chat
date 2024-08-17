import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user.service'; // Assuming you have a UserService for user-related API calls
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar for notifications

@Component({
  selector: 'app-update-user-dialog',
  templateUrl: './update-user-dialog.component.html',
  styleUrls: ['./update-user-dialog.component.css']
})
export class UpdateUserDialogComponent implements OnInit {
  updateUserForm: FormGroup;
  avatarPreview: string | null = null; // Biến để lưu bản xem trước của avatar

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UpdateUserDialogComponent>,
    private userService: UserService,
    private snackBar: MatSnackBar // Inject MatSnackBar for showing notifications
  ) {
    this.updateUserForm = this.fb.group({
      FirstName: ['', Validators.required],
      LastName: ['', Validators.required],
      Birthday: [null, Validators.required],
      Email: ['', [Validators.required, Validators.email]],
      TagName: ['', Validators.required],
      AvatarFile: [null]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.userService.getUserInfo(userId).subscribe(user => {
        this.updateUserForm.patchValue({
          FirstName: user.firstName,
          LastName: user.lastName,
          Birthday: user.birthday,
          Email: user.email,
          TagName: user.tagName,
        });

        // Nếu người dùng đã có avatar, hiển thị bản xem trước
        if (user.avatar) {
          this.avatarPreview = this.getAvatarUrl(user.avatar);
        }
      });
    }
  }

  onFileChange(event: any): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.updateUserForm.patchValue({
        AvatarFile: file
      });

      // Tạo bản xem trước cho hình ảnh được chọn
      const reader = new FileReader();
      reader.onload = e => this.avatarPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  onUpdate(): void {
    if (this.updateUserForm.valid) {
      const formData = new FormData();

      Object.entries(this.updateUserForm.value).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value instanceof Blob ? value : value.toString());
        }
      });

      const userId = localStorage.getItem('userId');
      this.userService.updateUser(userId!, formData).subscribe(
        () => {
          console.log('Profile updated successfully');
          this.snackBar.open('Profile updated successfully', 'Close', {
            duration: 3000,
          });
          this.dialogRef.close(true); // Close the dialog and return success
        },
        (error) => {
          console.error('Failed to update profile', error);
          this.handleError(error); // Handle the error and show notification
        }
      );
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getAvatarUrl(avatar: string): string {
    return `https://localhost:7267/${avatar}`;
  }

  private handleError(error: any): void {
    let errorMessage = 'An unexpected error occurred. Please try again later.';

    // Check if the error is a server response with a message
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }

    // Display the error message using MatSnackBar
    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
    });
  }
}

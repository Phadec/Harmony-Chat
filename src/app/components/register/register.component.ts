import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  username: string = '';
  firstName: string = '';
  lastName: string = '';
  birthday: string = '';
  email: string = '';
  password: string = '';
  retypePassword: string = '';
  selectedFile: File | null = null;
  avatarPreview: string | ArrayBuffer | null = null;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];

    // Preview the selected image
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.avatarPreview = e.target.result;
        }
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onRegister(): void {
    if (this.password !== this.retypePassword) {
      this.errorMessage = "Passwords do not match!";
      return;
    }

    const formData = new FormData();
    formData.append('username', this.username);
    formData.append('firstName', this.firstName);
    formData.append('lastName', this.lastName);
    formData.append('birthday', this.birthday);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('retypePassword', this.retypePassword);
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.authService.register(formData).subscribe({
      next: response => {
        console.log('Registration successful', response);
        this.router.navigate(['/login']); // Điều hướng đến trang đăng nhập sau khi đăng ký thành công
      },
      error: error => {
        console.error('Registration failed', error);
        // Gán thông báo lỗi từ máy chủ vào biến errorMessage
        this.errorMessage = error.error.message || 'Registration failed';
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/login']);
  }
}

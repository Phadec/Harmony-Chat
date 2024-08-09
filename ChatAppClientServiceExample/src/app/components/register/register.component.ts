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
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
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
        this.router.navigate(['/login']); // Điều hướng tới trang login sau khi đăng ký thành công
      },
      error: error => {
        console.error('Registration failed', error);
        this.errorMessage = error.error.Message || 'Registration failed';
      }
    });
  }
}

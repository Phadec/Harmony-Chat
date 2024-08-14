import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        // Assuming response contains userId and token
        localStorage.setItem('userId', response.id);
        localStorage.setItem('token', response.token);
        localStorage.setItem('userAvatar', response.avatar);

        console.log("Login successful");
        console.log("User ID:", response.id);
        console.log("Token:", response.token);

        // Redirect to another page or perform other actions after successful login
        this.router.navigate(['/chats']);
      },
      error: (error) => {
        console.error("Login failed", error);
        this.errorMessage = "Login failed. Please check your credentials and try again.";
      }
    });
  }
}

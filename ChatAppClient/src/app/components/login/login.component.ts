import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  name: string = "";
  password: string = "";

  constructor(private http: HttpClient, private router: Router) {}

  sendprivate() {
    // Tạo FormData để gửi dữ liệu dưới dạng form-data
    const formData = new FormData();

    formData.append('Username', this.name);
    formData.append('Password', this.password);

    // Sử dụng phương thức POST để gửi dữ liệu
    this.http.post('https://localhost:7267/api/Auth/Login', formData, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    }).subscribe({
      next: (res: any) => {
        localStorage.setItem('accessToken', JSON.stringify(res));
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        console.error('Login failed', err);
      }
    });
  }
}

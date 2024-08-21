import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://192.168.1.102:7267/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  // Hàm lấy token từ localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Hàm giải mã payload của JWT token
  decodeToken(token: string): any {
    try {
      const payload = atob(token.split('.')[1]);
      return JSON.parse(payload);
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }

  // Kiểm tra token có hết hạn hay không
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    const expirationDate = new Date(decoded.exp * 1000); // exp là thời gian hết hạn theo Unix timestamp
    return expirationDate < new Date();
  }

  // Kiểm tra xem người dùng có hợp lệ không
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.clearSession(); // Xóa session nếu token hết hạn hoặc không tồn tại
      return false;
    }
    return true;
  }

  // Xóa token và userId khỏi localStorage và điều hướng đến trang login
  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  register(data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  confirmEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/confirm-email`, { params: { token } });
  }

  login(username: string, password: string): Observable<any> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post(`${this.apiUrl}/login`, formData);
  }

  logout(userId: string): Observable<any> {
    const formData = new FormData();
    formData.append('userId', userId);
    return this.http.post(`${this.apiUrl}/logout`, formData);
  }

  forgotPassword(username: string): Observable<any> {
    const payload = { Username: username };
    return this.http.post(`${this.apiUrl}/forgot-password`, payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  resetPassword(data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-user-password`, data);
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.error('User ID not found in local storage.');
      throw new Error('User ID is missing.');
    }

    const payload = {
      userId: userId,
      currentPassword: currentPassword,
      newPassword: newPassword
    };

    return this.http.post(`${this.apiUrl}/change-user-password`, payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }
}

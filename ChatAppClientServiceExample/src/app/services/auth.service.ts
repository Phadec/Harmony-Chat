import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://localhost:7267/api/auth';

  constructor(private http: HttpClient) {}

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
    const userId = sessionStorage.getItem('userId'); // Fetch userId from local storage

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

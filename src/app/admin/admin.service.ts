import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from "../services/app-config.service";

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl: string;

  constructor(private http: HttpClient, private appConfig: AppConfigService) {
    this.apiUrl = `${this.appConfig.getBaseUrl()}/api/Admin`;
  }

  // Lấy danh sách người dùng
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetUsers/get-users`);
  }

  // Khóa người dùng
  lockUser(userId: string): Observable<any> {
    const formData = new FormData();
    formData.append('userId', userId);
    return this.http.post(`${this.apiUrl}/LockUser/lock-user`, formData);
  }

  // Mở khóa người dùng
  unlockUser(userId: string): Observable<any> {
    const formData = new FormData();
    formData.append('userId', userId);
    return this.http.post(`${this.apiUrl}/UnlockUser/unlock-user`, formData);
  }

}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `https://localhost:7267/api/Users`; // Cập nhật với URL API của bạn

  constructor(private http: HttpClient) { }

  searchUserByTagName(tagName: string): Observable<any> {
    const url = `${this.apiUrl}/search?tagName=${encodeURIComponent(tagName)}`;
    return this.http.get<any>(url).pipe(
      catchError((error) => {
        console.error('Error occurred during search API call:', error);
        return throwError(error);
      })
    );
  }


  // Cập nhật thông tin người dùng
  updateUser(userId: string, request: any): Observable<any> {
    const url = `${this.apiUrl}/${userId}/update-user`;
    return this.http.put<any>(url, request).pipe(
      catchError(this.handleError)
    );
  }

  // Cập nhật trạng thái người dùng
  updateStatus(userId: string, status: string): Observable<any> {
    const url = `${this.apiUrl}/${userId}/update-status`;
    const body = { status };
    return this.http.post<any>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  // Cập nhật trạng thái hiển thị người dùng
  updateStatusVisibility(userId: string, showOnlineStatus: boolean): Observable<any> {
    const url = `${this.apiUrl}/${userId}/update-status-visibility`;
    const body = { showOnlineStatus };
    return this.http.post<any>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  // Lấy trạng thái của người dùng
  getStatus(userId: string): Observable<any> {
    const url = `${this.apiUrl}/${userId}/status`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  // Lấy thông tin người dùng
  getUserInfo(userId: string): Observable<any> {
    const url = `${this.apiUrl}/${userId}/get-user-info`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  // Xử lý lỗi
  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(error);
  }
}

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Bỏ qua xác thực cho các đường dẫn Auth API
    if (request.url.includes('/api/auth/login') ||
      request.url.includes('/api/auth/register') ||
      request.url.includes('/api/auth/forgot-password') ||
      request.url.includes('/api/auth/reset-password') ||
      request.url.includes('/api/auth/confirm-email')) {
      return next.handle(request);
    }

    // Thêm token vào header cho các yêu cầu khác
    const token = sessionStorage.getItem('token');
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}

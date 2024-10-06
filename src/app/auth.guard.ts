import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('role');

    if (userId && userRole) {
      if (userRole === 'Admin') {
        // Nếu là admin, cho phép truy cập trang admin
        return true;
      } else if (userRole === 'User') {
        // Nếu là user, cho phép truy cập trang người dùng
        return true;
      } else {
        // Nếu không xác định được role, điều hướng về trang login
        this.router.navigate(['/login']);
        return false;
      }
    } else {
      // Nếu chưa đăng nhập, điều hướng về trang login
      this.router.navigate(['/login']);
      return false;
    }
  }
}

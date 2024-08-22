import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    // Kiểm tra vai trò của người dùng từ localStorage
    const userRole = localStorage.getItem('role');

    // Nếu vai trò là "Admin", cho phép truy cập
    if (userRole === 'Admin') {
      return true;
    }

    // Nếu không phải Admin, chuyển hướng về trang login hoặc trang không có quyền truy cập
    this.router.navigate(['/no-access']); // Bạn có thể điều hướng đến trang không có quyền truy cập
    return false;
  }
}

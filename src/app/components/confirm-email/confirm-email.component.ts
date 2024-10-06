import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.css']
})
export class ConfirmEmailComponent implements OnInit {
  isLoading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      console.log("Received token:", token);

      if (token) {
        this.authService.confirmEmail(token).subscribe({
          next: response => {
            console.log("Email confirmed successfully:", response);
            this.isLoading = false;
            this.successMessage = "Email confirmed successfully. You can now log in.";
            setTimeout(() => {
              this.router.navigate(['/login']); // Điều hướng tới trang login sau khi thành công
            }, 3000);
          },
          error: error => {
            console.log("Error confirming email:", error);
            this.isLoading = false;
            this.errorMessage = error.error.Message || "Email confirmation failed.";
          }
        });
      } else {
        console.log("No token found in URL");
        this.isLoading = false;
        this.errorMessage = "Invalid email confirmation link.";
      }
    });
  }
}

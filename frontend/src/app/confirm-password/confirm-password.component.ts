import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-confirm-password',
  templateUrl: './confirm-password.component.html',
  styleUrls: ['./confirm-password.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class ConfirmPasswordComponent {
  confirmPasswordForm: FormGroup;
  email: string | null = null;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.confirmPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });

    // Get email from query params
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] || null;
    });
  }

  onSubmit() {
    if (!this.email) {
      this.errorMessage = 'Invalid request. Email is missing.';
      return;
    }

    const { newPassword, confirmPassword } = this.confirmPasswordForm.value;

    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      return;
    }

    // Send reset request
    this.http
      .post('http://localhost:5000/api/auth/reset-password', {
        email: this.email,
        newPassword,
      })
      .subscribe(
        () => {
          alert('Password changed successfully!');
          this.router.navigate(['/login']); // Redirect to login
        },
        (error) => {
          this.errorMessage =
            error.error?.message || 'Failed to reset password.';
        }
      );
  }
}

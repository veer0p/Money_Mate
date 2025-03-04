import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ✅ Import required modules
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  loading: boolean = false; // ✅ Added loading state
  errorMessage: string = ''; // ✅ Added error message handling

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // ✅ Added validation
      password: ['', [Validators.required, Validators.minLength(6)]], // ✅ Password validation
    });
  }

  onSubmit() {
    this.loading = true; // ✅ Show loading state
    this.errorMessage = ''; // Reset error message

    const formData = this.loginForm.value;

    this.http.post('http://localhost:5000/api/auth/login', formData).subscribe(
      (response: any) => {
        this.loading = false;

        if (response.token) {
          localStorage.setItem('authToken', response.token);
          this.router.navigate(['/home']); // ✅ Redirect to home
        } else {
          this.router.navigate(['/otp-verification'], {
            queryParams: { email: formData.email, source: 'login' }, // ✅ Pass source
          });
        }
      },
      (error) => {
        this.loading = false;
        this.errorMessage =
          error.error?.message || 'Login failed. Please try again!';
      }
    );
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  goToSignUp() {
    this.router.navigate(['/signup']);
  }
}

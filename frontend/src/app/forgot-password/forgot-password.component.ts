import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ✅ Import required modules
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  email: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: [''],
    });
  }

  onSubmit() {
    const formData = this.forgotPasswordForm.value;

    this.http
      .post('http://localhost:5000/api/auth/send-otp', formData)
      .subscribe(
        () => {
          alert('OTP sent to your email!');
          this.router.navigate(['/otp-verification'], {
            queryParams: { email: formData.email, source: 'forgot-password' }, // ✅ Pass source
          });
        },
        (error) => {
          alert('Failed to send OTP!');
          console.error(error);
        }
      );
  }
}

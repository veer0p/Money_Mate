// src/app/auth/forgot-password/forgot-password.component.ts
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/Service/auth.service';

@Component({
    selector: 'auth-forgot-password',
    templateUrl: './forgot-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        RouterLink,
    ],
})
export class AuthForgotPasswordComponent {
    @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm!: NgForm;

    forgotPasswordForm: FormGroup;
    showAlert: boolean = false;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        // Initialize the form
        this.forgotPasswordForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
        });
    }

    sendResetLink(): void {
        // Return if the form is invalid or already submitting
        if (
            this.forgotPasswordForm.invalid ||
            this.forgotPasswordForm.disabled
        ) {
            return;
        }

        // Disable the form
        this.forgotPasswordForm.disable();
        this.showAlert = false;

        // Get email value
        const email = this.forgotPasswordForm.get('email')?.value;

        // Call the auth service to request password reset
        this.authService.requestPasswordReset(email).subscribe({
            next: (response) => {
                // Handle successful request
                this.alert = {
                    type: 'success',
                    message:
                        response.message ||
                        'Password reset link sent to your email.',
                };
                this.showAlert = true;

                // Optionally navigate back to sign-in after a delay
                setTimeout(() => {
                    this.router.navigate(['/sign-in']);
                }, 3000); // 3 seconds delay
            },
            error: (error) => {
                // Handle error
                this.alert = {
                    type: 'error',
                    message:
                        error.message ||
                        'Failed to send reset link. Please try again.',
                };
                this.showAlert = true;
                this.forgotPasswordForm.enable();
            },
            complete: () => {
                // Only enable form if there's an error (successful case redirects)
                if (this.showAlert && this.alert.type === 'error') {
                    this.forgotPasswordForm.enable();
                }
            },
        });
    }

    // Optional: Reset form and alert
    resetForm(): void {
        this.forgotPasswordNgForm.resetForm();
        this.forgotPasswordForm.enable();
        this.showAlert = false;
    }
}

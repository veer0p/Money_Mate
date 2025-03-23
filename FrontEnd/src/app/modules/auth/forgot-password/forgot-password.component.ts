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
    canResend: boolean = false;
    isLoading: boolean = false;
    resendCooldown: number = 0; // Cooldown timer in seconds
    resendInterval: any; // For setInterval

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.forgotPasswordForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
        });
    }

    sendResetLink(): void {
        if (
            this.forgotPasswordForm.invalid ||
            this.isLoading ||
            this.resendCooldown > 0
        ) {
            return;
        }

        this.isLoading = true;
        this.forgotPasswordForm.disable();
        this.showAlert = false;

        const email = this.forgotPasswordForm.get('email')?.value;

        this.authService.requestPasswordReset(email).subscribe({
            next: (response) => {
                this.alert = {
                    type: 'success',
                    message:
                        response.message ||
                        'Password reset link sent to your email.',
                };
                this.showAlert = true;
                this.canResend = true;
                this.startResendCooldown();
            },
            error: (error) => {
                let errorMessage =
                    error.message ||
                    'Failed to send reset link. Please try again.';
                if (error.status === 429) {
                    errorMessage =
                        'Too many requests. Please wait a moment before trying again.';
                }
                this.alert = {
                    type: 'error',
                    message: errorMessage,
                };
                this.showAlert = true;
                this.forgotPasswordForm.enable();
            },
            complete: () => {
                this.isLoading = false;
                if (this.showAlert && this.alert.type === 'error') {
                    this.forgotPasswordForm.enable();
                }
            },
        });
    }

    startResendCooldown(): void {
        this.resendCooldown = 30; // 30 seconds cooldown
        this.resendInterval = setInterval(() => {
            if (this.resendCooldown > 0) {
                this.resendCooldown--;
            } else {
                clearInterval(this.resendInterval);
            }
        }, 1000);
    }

    resetForm(): void {
        this.forgotPasswordNgForm.resetForm();
        this.forgotPasswordForm.enable();
        this.showAlert = false;
        this.canResend = false;
        this.isLoading = false;
        this.resendCooldown = 0;
        clearInterval(this.resendInterval);
    }
}

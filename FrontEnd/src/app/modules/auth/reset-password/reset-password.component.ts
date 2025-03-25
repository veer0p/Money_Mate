// src/app/auth/reset-password/reset-password.component.ts
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/Service/auth.service';

@Component({
    selector: 'auth-reset-password',
    templateUrl: './reset-password.component.html',
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
        MatIconModule,
        MatProgressSpinnerModule,
        RouterLink,
    ],
})
export class AuthResetPasswordComponent implements OnInit {
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm!: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    resetPasswordForm: FormGroup;
    showAlert: boolean = false;
    private token: string = '';

    constructor(
        private authService: AuthService,
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute
    ) {
        // Initialize the form
        this.resetPasswordForm = this.fb.group(
            {
                password: ['', [Validators.required, Validators.minLength(6)]],
                passwordConfirm: ['', Validators.required],
            },
            {
                validators: this.mustMatch('password', 'passwordConfirm'),
            }
        );
    }

    ngOnInit(): void {
        // Get the token from query parameters
        this.route.queryParams.subscribe((params) => {
            this.token = params['token'] || '';
            if (!this.token) {
                this.alert = {
                    type: 'error',
                    message: 'Invalid or missing reset token.',
                };
                this.showAlert = true;
                this.resetPasswordForm.disable();
            }
        });
    }

    // Custom validator for matching passwords
    private mustMatch(controlName: string, matchingControlName: string) {
        return (formGroup: FormGroup) => {
            const control = formGroup.controls[controlName];
            const matchingControl = formGroup.controls[matchingControlName];

            if (
                matchingControl.errors &&
                !matchingControl.errors['mustMatch']
            ) {
                return;
            }

            if (control.value !== matchingControl.value) {
                matchingControl.setErrors({ mustMatch: true });
            } else {
                matchingControl.setErrors(null);
            }
        };
    }

    resetPassword(): void {
        // Return if the form is invalid or already submitting
        if (
            this.resetPasswordForm.invalid ||
            this.resetPasswordForm.disabled ||
            !this.token
        ) {
            return;
        }

        // Disable the form
        this.resetPasswordForm.disable();
        this.showAlert = false;

        const newPassword = this.resetPasswordForm.get('password')?.value;

        // Send the reset password request
        this.authService.resetPassword(this.token, newPassword).subscribe({
            next: (response) => {
                // Handle successful reset
                this.alert = {
                    type: 'success',
                    message:
                        response.message ||
                        'Your password has been successfully reset.',
                };
                this.showAlert = true;

                // Redirect to sign-in after a delay
                setTimeout(() => {
                    this.router.navigate(['/sign-in']);
                }, 2000); // 2 seconds delay
            },
            error: (error) => {
                // Handle error
                this.alert = {
                    type: 'error',
                    message:
                        error.message ||
                        'Failed to reset password. The link may be invalid or expired.',
                };
                this.showAlert = true;
                this.resetPasswordForm.enable();
            },
            complete: () => {
                // Only enable form if there's an error (successful case redirects)
                if (this.showAlert && this.alert.type === 'error') {
                    this.resetPasswordForm.enable();
                }
            },
        });
    }

    // Optional: Reset form and alert
    resetForm(): void {
        this.resetPasswordNgForm.resetForm();
        this.resetPasswordForm.enable();
        this.showAlert = false;
    }
}

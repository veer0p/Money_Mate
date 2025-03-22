// src/app/auth/sign-up/sign-up.component.ts
import { Component, ViewEncapsulation } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/Service/auth.service';

@Component({
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        RouterLink,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
    ],
})
export class AuthSignUpComponent {
    signUpForm: FormGroup;
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
        this.signUpForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]],
            agreements: [false, Validators.requiredTrue],
        });
    }

    signUp(): void {
        // Return if the form is invalid or already submitting
        if (this.signUpForm.invalid || this.signUpForm.disabled) {
            return;
        }

        // Disable the form
        this.signUpForm.disable();
        this.showAlert = false;

        // Get form values
        const formValue = this.signUpForm.value;
        const signupData = {
            first_name: formValue.firstName,
            last_name: formValue.lastName,
            email: formValue.email,
            phone_number: formValue.phoneNumber,
            password: formValue.password,
        };

        // Call the auth service signup
        this.authService.signup(signupData).subscribe({
            next: (response) => {
                // Handle successful signup
                this.alert = {
                    type: 'success',
                    message:
                        response.message ||
                        'Registration successful! Please verify your email.',
                };
                this.showAlert = true;

                // Navigate to email verification page
                this.router.navigate(['/verify-email'], {
                    queryParams: { email: signupData.email },
                });
            },
            error: (error) => {
                // Handle error
                this.alert = {
                    type: 'error',
                    message:
                        error.message ||
                        'Registration failed. Please try again.',
                };
                this.showAlert = true;
                this.signUpForm.enable();
            },
            complete: () => {
                // Only enable form if there's an error (successful case redirects)
                if (this.showAlert && this.alert.type === 'error') {
                    this.signUpForm.enable();
                }
            },
        });
    }

    // Optional: Reset form and alert
    resetForm(): void {
        this.signUpForm.reset();
        this.signUpForm.enable();
        this.showAlert = false;
    }
}

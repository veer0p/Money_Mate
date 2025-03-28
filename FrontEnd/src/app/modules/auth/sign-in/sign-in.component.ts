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
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
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
export class AuthSignInComponent {
    @ViewChild('signInNgForm') signInNgForm!: NgForm;

    signInForm: FormGroup;
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
        this.signInForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
            rememberMe: [false],
        });
    }

    signIn(): void {
        // Return if the form is invalid or already submitting
        if (this.signInForm.invalid || this.signInForm.disabled) {
            return;
        }

        // Disable the form
        this.signInForm.disable();
        this.showAlert = false;

        // Get form values
        const { email, password } = this.signInForm.value;

        // Call the auth service login
        this.authService.login(email, password).subscribe({
            next: (response) => {
                // Handle successful login
                if (response.token && response.refreshToken) {
                    // Save tokens and userId
                    this.authService.saveTokens(
                        response.token,
                        response.refreshToken
                    );
                    // Store userId in localStorage
                    localStorage.setItem('userId', response.userId);
                    this.router.navigate(['/dashboard']);
                } else if (response.message.includes('OTP')) {
                    // Handle 2FA case
                    this.alert = {
                        type: 'info',
                        message: response.message,
                    };
                    this.showAlert = true;
                    this.router.navigate(['/verify-otp'], {
                        queryParams: { email: email },
                    });
                }
            },
            error: (error) => {
                // Handle error
                this.alert = {
                    type: 'error',
                    message: error.message || 'Invalid email or password',
                };
                this.showAlert = true;
                this.signInForm.enable();
            },
            complete: () => {
                // Re-enable form if not redirected
                if (!this.authService.isLoggedIn()) {
                    this.signInForm.enable();
                }
            },
        });
    }

    resetForm(): void {
        this.signInNgForm.resetForm();
        this.signInForm.enable();
        this.showAlert = false;
    }
}

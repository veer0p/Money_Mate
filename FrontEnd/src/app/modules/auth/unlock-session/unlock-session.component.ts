// src/app/auth/unlock-session/unlock-session.component.ts
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
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/Service/auth.service';

@Component({
    selector: 'auth-unlock-session',
    templateUrl: './unlock-session.component.html',
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
export class AuthUnlockSessionComponent {
    @ViewChild('unlockSessionNgForm') unlockSessionNgForm!: NgForm;

    unlockSessionForm: FormGroup;
    showAlert: boolean = false;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    name: string = ''; // This could be set from a previous session or route param

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        // Initialize the form
        this.unlockSessionForm = this.fb.group({
            name: ['', Validators.required], // Could be pre-filled if you have session data
            password: ['', Validators.required],
        });

        // Optionally get name from route params or session storage
        const storedName = sessionStorage.getItem('lockedUserName');
        if (storedName) {
            this.name = storedName;
            this.unlockSessionForm.patchValue({ name: storedName });
        }
    }

    unlock(): void {
        // Return if the form is invalid or already submitting
        if (this.unlockSessionForm.invalid || this.unlockSessionForm.disabled) {
            return;
        }

        // Disable the form
        this.unlockSessionForm.disable();
        this.showAlert = false;

        // Get form values
        const { name, password } = this.unlockSessionForm.value;

        // Since we don't have a specific unlock endpoint, we'll use login
        // You might want to modify this based on your actual backend implementation
        this.authService.login(name, password).subscribe({
            next: (response) => {
                // Handle successful unlock
                if (response.token && response.refreshToken) {
                    this.authService.saveTokens(
                        response.token,
                        response.refreshToken
                    );
                    this.alert = {
                        type: 'success',
                        message: 'Session unlocked successfully!',
                    };
                    this.showAlert = true;

                    // Navigate back to previous route or dashboard
                    setTimeout(() => {
                        const redirectUrl =
                            sessionStorage.getItem('redirectUrl') ||
                            '/dashboard';
                        this.router.navigate([redirectUrl]);
                        sessionStorage.removeItem('redirectUrl');
                        sessionStorage.removeItem('lockedUserName');
                    }, 1000);
                } else if (response.message.includes('OTP')) {
                    // Handle 2FA case
                    this.alert = {
                        type: 'info',
                        message: response.message,
                    };
                    this.showAlert = true;
                    this.router.navigate(['/verify-otp'], {
                        queryParams: { email: name },
                    });
                }
            },
            error: (error) => {
                // Handle error
                this.alert = {
                    type: 'error',
                    message:
                        error.message ||
                        'Invalid credentials. Please try again.',
                };
                this.showAlert = true;
                this.unlockSessionForm.enable();
            },
            complete: () => {
                // Only enable form if there's an error (successful case redirects)
                if (this.showAlert && this.alert.type === 'error') {
                    this.unlockSessionForm.enable();
                }
            },
        });
    }

    // Optional: Reset form and alert
    resetForm(): void {
        this.unlockSessionNgForm.resetForm();
        this.unlockSessionForm.enable();
        this.showAlert = false;
    }
}

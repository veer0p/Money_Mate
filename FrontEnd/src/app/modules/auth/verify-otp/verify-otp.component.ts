import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    NgForm,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/Service/auth.service';

@Component({
    selector: 'auth-verify-otp',
    templateUrl: './verify-otp.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        FuseAlertComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        RouterLink,
    ],
})
export class VerifyOtpComponent implements OnInit {
    @ViewChild('verifyOtpNgForm') verifyOtpNgForm!: NgForm;

    verifyOtpForm: FormGroup;
    showAlert: boolean = false;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    email: string = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.verifyOtpForm = this.fb.group({
            otp: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.email = params['email'] || '';
            if (!this.email) {
                this.alert = {
                    type: 'error',
                    message: 'No email provided. Please sign in again.',
                };
                this.showAlert = true;
                this.verifyOtpForm.disable();
            }
        });
    }

    verifyOtp(): void {
        if (
            this.verifyOtpForm.invalid ||
            this.verifyOtpForm.disabled ||
            !this.email
        ) {
            return;
        }

        this.verifyOtpForm.disable();
        this.showAlert = false;

        const otp = this.verifyOtpForm.get('otp')?.value;

        this.authService.verifyLoginOTP(this.email, otp).subscribe({
            next: (response) => {
                if (response.token && response.refreshToken) {
                    this.authService.saveTokens(
                        response.token,
                        response.refreshToken
                    );
                    this.alert = { type: 'success', message: response.message };
                    this.showAlert = true;
                    setTimeout(() => this.router.navigate(['/finance']), 2000);
                }
            },
            error: (error) => {
                this.alert = {
                    type: 'error',
                    message: error.message || 'Invalid or expired OTP',
                };
                this.showAlert = true;
                this.verifyOtpForm.enable();
            },
        });
    }
}

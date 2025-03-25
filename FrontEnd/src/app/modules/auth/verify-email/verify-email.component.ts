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
    selector: 'auth-verify-email',
    templateUrl: './verify-email.component.html',
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
export class VerifyEmailComponent implements OnInit {
    @ViewChild('verifyEmailNgForm') verifyEmailNgForm!: NgForm;

    verifyEmailForm: FormGroup;
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
        this.verifyEmailForm = this.fb.group({
            otp: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.email = params['email'] || '';
            if (!this.email) {
                this.alert = {
                    type: 'error',
                    message: 'No email provided. Please sign up again.',
                };
                this.showAlert = true;
                this.verifyEmailForm.disable();
            }
        });
    }

    verifyEmail(): void {
        if (
            this.verifyEmailForm.invalid ||
            this.verifyEmailForm.disabled ||
            !this.email
        ) {
            return;
        }

        this.verifyEmailForm.disable();
        this.showAlert = false;

        const otp = this.verifyEmailForm.get('otp')?.value;

        this.authService.verifyEmail(this.email, otp).subscribe({
            next: (response) => {
                this.alert = { type: 'success', message: response.message };
                this.showAlert = true;
                setTimeout(() => this.router.navigate(['/sign-in']), 2000);
            },
            error: (error) => {
                this.alert = {
                    type: 'error',
                    message: error.message || 'Invalid or expired OTP',
                };
                this.showAlert = true;
                this.verifyEmailForm.enable();
            },
        });
    }
}

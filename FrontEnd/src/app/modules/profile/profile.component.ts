import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from 'app/Service/auth.service';
import { UserService } from 'app/Service/user.service';
import * as QRCode from 'qrcode'; // Import QRCode library
import { Subject, takeUntil } from 'rxjs';

interface User {
    id: string;
    first_name: string;
    last_name: string;
    dob?: string;
    email: string;
    phone_number?: string;
    is_active: boolean;
    is_verified: boolean;
    is_email_verified: boolean;
    created_at: string;
    last_login?: string;
    role: string;
    is_2fa_enabled: boolean;
    profile_image_url?: string;
    account_balance: number;
}

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    standalone: true,
    imports: [
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDialogModule,
        FormsModule,
        CommonModule,
    ],
})
export class ProfileComponent implements OnInit {
    user: User | null = null;
    userId: string | null = null;
    isLoading: boolean = false;
    isEditing: boolean = false;
    editedUser: Partial<User> = {};
    profileImageFile: File | null = null;
    qrCodeUrl: string | null = null; // To store the QR code image URL

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.userId = this.authService.getUserId();
        if (this.userId) {
            this.fetchUserDetails();
            this.generateQRCode(); // Generate QR code on init
        } else {
            this.snackBar.open('User ID not found. Please log in.', 'Close', {
                duration: 3000,
            });
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    fetchUserDetails(): void {
        if (!this.userId) return;

        this.isLoading = true;
        this.userService
            .getUserDetails(this.userId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.user = response.data;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error fetching user details:', error);
                    this.snackBar.open(
                        'Failed to load user details.',
                        'Close',
                        {
                            duration: 3000,
                        }
                    );
                    this.isLoading = false;
                },
            });
    }

    generateQRCode(): void {
        if (!this.userId) return;

        // Generate a QR code with the userId
        const qrData = `money-mate://link-user/${this.userId}`; // Example URL scheme for the app
        QRCode.toDataURL(qrData, { width: 200, margin: 1 }, (err, url) => {
            if (err) {
                console.error('Error generating QR code:', err);
                this.snackBar.open('Failed to generate QR code.', 'Close', {
                    duration: 3000,
                });
                return;
            }
            this.qrCodeUrl = url; // Set the QR code image URL
        });
    }

    toggleEdit(): void {
        this.isEditing = !this.isEditing;
        if (this.isEditing && this.user) {
            this.editedUser = {
                first_name: this.user.first_name,
                last_name: this.user.last_name,
                phone_number: this.user.phone_number,
            };
        }
    }

    saveChanges(): void {
        if (!this.userId || !this.editedUser) return;

        this.isLoading = true;
        this.userService
            .updateUserDetails(this.userId, this.editedUser)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: () => {
                    this.snackBar.open(
                        'Profile updated successfully!',
                        'Close',
                        {
                            duration: 3000,
                        }
                    );
                    this.isEditing = false;
                    this.fetchUserDetails(); // Refresh user details
                },
                error: (error) => {
                    console.error('Error updating user details:', error);
                    this.snackBar.open('Failed to update profile.', 'Close', {
                        duration: 3000,
                    });
                    this.isLoading = false;
                },
            });
    }

    onProfileImageChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0 && this.userId) {
            this.profileImageFile = input.files[0];
            this.uploadProfileImage();
        }
    }

    uploadProfileImage(): void {
        if (!this.userId || !this.profileImageFile) return;

        this.isLoading = true;
        this.userService
            .uploadProfileImage(this.userId, this.profileImageFile)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    if (this.user) {
                        this.user.profile_image_url =
                            response.data.profile_image_url;
                    }
                    this.snackBar.open(
                        'Profile image updated successfully!',
                        'Close',
                        {
                            duration: 3000,
                        }
                    );
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error uploading profile image:', error);
                    this.snackBar.open(
                        'Failed to upload profile image.',
                        'Close',
                        {
                            duration: 3000,
                        }
                    );
                    this.isLoading = false;
                },
            });
    }
}

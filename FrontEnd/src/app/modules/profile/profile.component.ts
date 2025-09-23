import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from 'app/Service/auth.service';
import { UserService } from 'app/Service/user.service';
import { UserUpdateService } from 'app/shared/services/user-update.service';
import * as QRCode from 'qrcode'; // Import QRCode library
import { Subject, takeUntil } from 'rxjs';

interface User {
    id: string;
    email: string;
    balance: number;
    created_at: string;
    updated_at: string;
    first_name?: string;
    last_name?: string;
    dob?: string;
    phone_number?: string;
    is_active?: boolean;
    is_verified?: boolean;
    is_email_verified?: boolean;
    last_login?: string;
    role?: string;
    is_2fa_enabled?: boolean;
    profile_image_url?: string;
}

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    standalone: true,
    imports: [
        MatButtonModule,
        MatCardModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatNativeDateModule,
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
        private snackBar: MatSnackBar,
        private userUpdateService: UserUpdateService
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
                    this.user = response.user || response.data;
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
        const qrData = `${this.userId}`; // Example URL scheme for the app
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
                dob: this.user.dob,
                profile_image_url: this.user.profile_image_url,
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
                next: (response) => {
                    this.user = response.user || response.data;
                    this.userUpdateService.notifyUserUpdate(this.user);
                    this.snackBar.open(
                        'Profile updated successfully!',
                        'Close',
                        {
                            duration: 3000,
                        }
                    );
                    this.isEditing = false;
                    this.isLoading = false;
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
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target?.result as string;
                if (this.user) {
                    this.user.profile_image_url = base64String;
                }
                // Store base64 in editedUser for saving
                this.editedUser.profile_image_url = base64String;
            };
            reader.readAsDataURL(file);
        }
    }


}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

interface ApiResponse<T> {
    status: string;
    message: string;
    data?: T;
    error?: string;
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private readonly BASE_URL = environment.apiUrl;

    constructor(private http: HttpClient) {}

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An unknown error occurred';
        if (error.error instanceof ErrorEvent) {
            errorMessage = error.error.message;
        } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
        }
        return throwError(() => new Error(errorMessage));
    }

    getUserDetails(userId: string): Observable<ApiResponse<User>> {
        const url = `${this.BASE_URL}/user/view/${userId}`;
        console.log('Request URL:', url);
        return this.http.get<ApiResponse<User>>(url).pipe(
            tap((response) => {
                console.log('User Details Response:', response);
            }),
            catchError(this.handleError)
        );
    }

    updateUserDetails(
        userId: string,
        updatedData: Partial<User>
    ): Observable<ApiResponse<void>> {
        const url = `${this.BASE_URL}/user/update/${userId}`;
        console.log('Request URL:', url, 'Data:', updatedData);
        return this.http.put<ApiResponse<void>>(url, updatedData).pipe(
            tap((response) => {
                console.log('Update User Response:', response);
            }),
            catchError(this.handleError)
        );
    }

    uploadProfileImage(
        userId: string,
        file: File
    ): Observable<ApiResponse<{ profile_image_url: string }>> {
        const url = `${this.BASE_URL}/user/${userId}/upload-profile-image`;
        const formData = new FormData();
        formData.append('profileImage', file, file.name);
        console.log('Request URL:', url, 'File:', file.name);
        return this.http
            .post<ApiResponse<{ profile_image_url: string }>>(url, formData)
            .pipe(
                tap((response) => {
                    console.log('Upload Profile Image Response:', response);
                }),
                catchError(this.handleError)
            );
    }
}

// src/app/services/auth.service.ts
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface ApiResponse {
    message: string;
    token?: string;
    refreshToken?: string;
    userId?: string;
    error?: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
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

    signup(userData: {
        first_name: string;
        last_name: string;
        email: string;
        password: string;
        phone_number: string;
    }): Observable<ApiResponse> {
        return this.http
            .post<ApiResponse>(`${this.BASE_URL}/auth/signup`, userData)
            .pipe(catchError(this.handleError));
    }

    verifyEmail(email: string, otp: string): Observable<ApiResponse> {
        return this.http
            .post<ApiResponse>(`${this.BASE_URL}/auth/verify-email`, {
                email,
                otp,
            })
            .pipe(catchError(this.handleError));
    }

    login(email: string, password: string): Observable<ApiResponse> {
        const url = `${this.BASE_URL}/auth/login`;
        console.log('Request URL:', url); // Debug
        return this.http.post<ApiResponse>(url, { email, password }).pipe(
            tap((response: any) => console.log('Response:', response)),
            catchError(this.handleError)
        );
    }

    verifyLoginOTP(email: string, otp: string): Observable<ApiResponse> {
        return this.http
            .post<ApiResponse>(`${this.BASE_URL}/auth/verify-login-otp`, {
                email,
                otp,
            })
            .pipe(catchError(this.handleError));
    }

    requestToggle2FA(email: string): Observable<ApiResponse> {
        return this.http
            .post<ApiResponse>(`${this.BASE_URL}/auth/request-toggle-2fa`, {
                email,
            })
            .pipe(catchError(this.handleError));
    }

    verifyToggle2FA(email: string, otp: string): Observable<ApiResponse> {
        return this.http
            .post<ApiResponse>(`${this.BASE_URL}/auth/verify-toggle-2fa`, {
                email,
                otp,
            })
            .pipe(catchError(this.handleError));
    }

    requestPasswordReset(email: string): Observable<ApiResponse> {
        return this.http
            .post<ApiResponse>(`${this.BASE_URL}/auth/request-password-reset`, {
                email,
            })
            .pipe(catchError(this.handleError));
    }

    resetPassword(token: string, newPassword: string): Observable<ApiResponse> {
        return this.http
            .post<ApiResponse>(`${this.BASE_URL}/auth/reset-password`, {
                token,
                newPassword,
            })
            .pipe(catchError(this.handleError));
    }

    saveTokens(token: string, refreshToken: string): void {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken');
    }

    clearTokens(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}

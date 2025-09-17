import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface SavingGoalApiResponse {
    status: string;
    message: string;
    data: any;
}

@Injectable({
    providedIn: 'root',
})
export class SavingGoalsService {
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

    getSavingGoals(
        userId: string,
        search?: string
    ): Observable<SavingGoalApiResponse> {
        let url = `${this.BASE_URL}/saving-goals/user/${userId}`;
        if (search) {
            url += `?search=${encodeURIComponent(search)}`;
        }
        return this.http
            .get<SavingGoalApiResponse>(url)
            .pipe(catchError(this.handleError));
    }

    getSavingGoal(goalId: string): Observable<SavingGoalApiResponse> {
        const url = `${this.BASE_URL}/saving-goals/${goalId}`;
        return this.http
            .get<SavingGoalApiResponse>(url)
            .pipe(catchError(this.handleError));
    }

    createSavingGoal(payload: any): Observable<SavingGoalApiResponse> {
        const url = `${this.BASE_URL}/saving-goals/create`;
        return this.http
            .post<SavingGoalApiResponse>(url, payload)
            .pipe(catchError(this.handleError));
    }

    updateSavingGoal(
        goalId: string,
        payload: any
    ): Observable<SavingGoalApiResponse> {
        const url = `${this.BASE_URL}/saving-goals/${goalId}`;
        return this.http
            .put<SavingGoalApiResponse>(url, payload)
            .pipe(catchError(this.handleError));
    }
}

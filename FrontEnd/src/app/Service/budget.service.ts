import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface BudgetApiResponse {
    status: string;
    message: string;
    data: any;
}

@Injectable({
    providedIn: 'root',
})
export class BudgetService {
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

    getBudgets(userId: string, search?: string): Observable<BudgetApiResponse> {
        let url = `${this.BASE_URL}/budgets/user/${userId}`;
        if (search) {
            url += `?search=${encodeURIComponent(search)}`;
        }
        return this.http
            .get<BudgetApiResponse>(url)
            .pipe(catchError(this.handleError));
    }

    getBudget(budgetId: string): Observable<BudgetApiResponse> {
        const url = `${this.BASE_URL}/budgets/${budgetId}`;
        return this.http
            .get<BudgetApiResponse>(url)
            .pipe(catchError(this.handleError));
    }

    createBudget(payload: any): Observable<BudgetApiResponse> {
        const url = `${this.BASE_URL}/budgets/create`;
        return this.http
            .post<BudgetApiResponse>(url, payload)
            .pipe(catchError(this.handleError));
    }

    updateBudget(
        budgetId: string,
        payload: any
    ): Observable<BudgetApiResponse> {
        const url = `${this.BASE_URL}/budgets/${budgetId}`;
        return this.http
            .put<BudgetApiResponse>(url, payload)
            .pipe(catchError(this.handleError));
    }

    getCategories(): Observable<BudgetApiResponse> {
        const url = `${this.BASE_URL}/categories`;
        return this.http
            .get<BudgetApiResponse>(url)
            .pipe(catchError(this.handleError));
    }
}

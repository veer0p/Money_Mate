// src/app/services/transaction.service.ts
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface Transaction {
    id: string;
    user_id: string;
    account_number: string;
    transaction_type: 'credit' | 'debit';
    category: string;
    amount: string;
    currency: string;
    transaction_date: string;
    description: string;
    reference_id: string;
    created_at: string;
    updated_at: string;
}

interface TransactionApiResponse {
    status: string;
    message: string;
    data: Transaction[];
}

@Injectable({
    providedIn: 'root',
})
export class TransactionService {
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

    getTransactionsByUserId(
        userId: string
    ): Observable<TransactionApiResponse> {
        const url = `${this.BASE_URL}/transactions/user/${userId}`;
        console.log('Fetching transactions from:', url); // Debug
        return this.http
            .get<TransactionApiResponse>(url)
            .pipe(catchError(this.handleError));
    }
}

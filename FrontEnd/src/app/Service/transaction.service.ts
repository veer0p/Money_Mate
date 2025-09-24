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
    data: {
        transactions: Transaction[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    };
}

interface TransactionFilters {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    startDate?: string;
    endDate?: string;
    transaction_type?: 'credit' | 'debit';
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    account_number?: string;
    search?: string;
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
        userId: string,
        filters?: TransactionFilters
    ): Observable<TransactionApiResponse> {
        let url = `${this.BASE_URL}/transactions/user/${userId}`;
        
        if (filters) {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
        }
        
        return this.http
            .get<TransactionApiResponse>(url)
            .pipe(catchError(this.handleError));
    }

    getTransactionCategories(userId: string): Observable<{status: string; data: string[]}> {
        const url = `${this.BASE_URL}/transactions/user/${userId}/categories`;
        return this.http
            .get<{status: string; data: string[]}>(url)
            .pipe(catchError(this.handleError));
    }
}
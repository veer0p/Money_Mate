// src/app/Service/dashboard.service.ts
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface DashboardSummary {
    totalTransactions: number;
    totalAmountSpent: number;
    totalAmountReceived: number;
    averageTransactionAmount: number;
}

interface DashboardApiResponse {
    status: string;
    message: string;
    data: DashboardSummary;
}

interface TransactionTrendResponse {
    status: string;
    message: string;
    data: {
        series: { name: string; data: number[] }[];
        labels: string[];
    };
}

interface TransactionDistributionResponse {
    status: string;
    message: string;
    data: {
        categories: string[];
        amounts: number[];
        totalSpent: number;
        totalReceived: number;
    };
}

interface RecentTransaction {
    description: string;
    amount: number;
    transaction_date: string;
    category: string;
}

interface RecentTransactionsResponse {
    status: string;
    message: string;
    data: RecentTransaction[];
}

@Injectable({
    providedIn: 'root',
})
export class DashboardService {
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

    getDashboardSummary(userId: string): Observable<DashboardApiResponse> {
        const url = `${this.BASE_URL}/dashboard/summary/${userId}`;
        console.log('Fetching dashboard summary from:', url);
        return this.http
            .get<DashboardApiResponse>(url)
            .pipe(catchError(this.handleError));
    }

    getTransactionTrend(userId: string): Observable<TransactionTrendResponse> {
        const url = `${this.BASE_URL}/dashboard/trend/${userId}`;
        console.log('Fetching transaction trend from:', url);
        return this.http
            .get<TransactionTrendResponse>(url)
            .pipe(catchError(this.handleError));
    }

    getTransactionDistribution(
        userId: string
    ): Observable<TransactionDistributionResponse> {
        const url = `${this.BASE_URL}/dashboard/distribution/${userId}`;
        console.log('Fetching transaction distribution from:', url);
        return this.http
            .get<TransactionDistributionResponse>(url)
            .pipe(catchError(this.handleError));
    }

    getRecentTransactions(
        userId: string
    ): Observable<RecentTransactionsResponse> {
        const url = `${this.BASE_URL}/dashboard/recent/${userId}`;
        console.log('Fetching recent transactions from:', url);
        return this.http
            .get<RecentTransactionsResponse>(url)
            .pipe(catchError(this.handleError));
    }
}

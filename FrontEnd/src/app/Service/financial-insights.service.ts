import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class FinancialInsightsService {
    private readonly BASE_URL = 'http://localhost:5000/api';

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

    getFinancialInsights(userId: string): Observable<any> {
        return this.http
            .get<any>(
                `${this.BASE_URL}/financial-insights/839a60a1-91b1-4d97-a935-5724cf3463bb`
            )
            .pipe(retry(2), catchError(this.handleError));
    }
}

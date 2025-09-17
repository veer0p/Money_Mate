import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface FinancialInsightsResponse {
    success: boolean;
    data: {
        monthlySpendSummaries?: { date_or_month: string; amount: string }[];
        incomeVsExpenses?: {
            date_or_month: string;
            income: string;
            expense: string;
            netSavings: number;
        }[];
        spendingPatterns?: {
            byDay?: { date_or_month: string; amount: string }[];
            byHour?: { date_or_month: string; amount: string }[];
        };
        financialHealth?: {
            savingsRate: string;
            emergencyFund: { balance: string; monthsCovered: number | null };
            debtToIncomeRatio: number;
            investmentRatio: number;
            creditUtilization: number;
            monthlyBudgetAdherence: number;
            financialScore: number;
        };
        savingsOpportunities?: { category: string; amount: string }[];
        alerts?: {
            date_or_month: string;
            amount: string;
            notes: string;
            severity: 'low' | 'medium' | 'high';
            resolved: boolean;
        }[];
    };
}

@Injectable({
    providedIn: 'root',
})
export class FinancialInsightsService {
    private apiUrl = `${environment.apiUrl}/financial-insights`;

    constructor(private http: HttpClient) {}

    getFinancialInsights(
        userId: string,
        params?: { startDate: string; endDate: string }
    ): Observable<FinancialInsightsResponse> {
        return this.http.get<FinancialInsightsResponse>(
            `${this.apiUrl}/${userId}`,
            {
                params: params as any,
            }
        );
    }

    calculateFinancialScore(metrics: {
        savingsRate: number;
        debtToIncomeRatio: number;
        investmentRatio: number;
        creditUtilization: number;
        monthlyBudgetAdherence: number;
    }): number {
        // Normalize each metric to a 0-1 scale
        const normalizedMetrics = {
            savingsRate: Math.min(metrics.savingsRate, 0.5) / 0.5, // Cap at 50% savings rate
            debtToIncomeRatio: Math.max(0, 1 - metrics.debtToIncomeRatio / 0.5), // Cap at 50% DTI
            investmentRatio: Math.min(metrics.investmentRatio, 0.2) / 0.2, // Cap at 20% investment ratio
            creditUtilization: Math.max(0, 1 - metrics.creditUtilization / 0.3), // Cap at 30% credit utilization
            monthlyBudgetAdherence: metrics.monthlyBudgetAdherence,
        };

        // Calculate weighted average
        const weights = {
            savingsRate: 0.3,
            debtToIncomeRatio: 0.25,
            investmentRatio: 0.2,
            creditUtilization: 0.15,
            monthlyBudgetAdherence: 0.1,
        };

        const score = Object.entries(normalizedMetrics).reduce(
            (sum, [key, value]) =>
                sum + value * weights[key as keyof typeof weights],
            0
        );

        // Convert to 0-10 scale
        return Math.round(score * 10 * 10) / 10;
    }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FinancialInsightsService } from 'app/Service/financial-insights.service_1';
import { format, subMonths } from 'date-fns';
import { NgApexchartsModule } from 'ng-apexcharts';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../Service/auth.service';

@Component({
    selector: 'app-insights',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatButtonModule,
        MatButtonToggleModule,
        NgApexchartsModule,
        ReactiveFormsModule,
    ],
    templateUrl: './insights.component.html',
    styleUrls: ['./insights.component.scss'],
})
export class InsightsComponent implements OnInit {
    insights: {
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
    } = {};
    filterForm: FormGroup;
    loading = false;
    error: string | null = null;
    timeRange = '6months';
    insightType = 'all';
    viewMode: 'cards' | 'charts' = 'cards';

    // Chart options for Income vs Expenses
    incomeExpensesChartOptions: any = {};
    monthlySpendingChartOptions: any = {};
    financialHealthChartOptions: any = {};

    get hasInsights(): boolean {
        return (
            this.insights &&
            Object.keys(this.insights).some((key) =>
                Array.isArray(this.insights[key])
                    ? this.insights[key].length > 0
                    : typeof this.insights[key] === 'object' &&
                      this.insights[key] !== null
            )
        );
    }

    constructor(
        private financialInsightsService: FinancialInsightsService,
        private authService: AuthService,
        private fb: FormBuilder
    ) {
        this.filterForm = this.fb.group({
            search: [''],
            insightType: [''],
            startDate: [''],
            endDate: [''],
        });
    }

    ngOnInit(): void {
        this.fetchInsights();
    }

    fetchInsights(): void {
        console.log('Fetching insights...');
        this.loading = true;
        this.error = null;

        // Get current user ID from auth service
        const userId = this.authService.getCurrentUserId();
        console.log('Current user ID:', userId);

        if (!userId) {
            this.error = 'User not authenticated';
            this.loading = false;
            console.log('Error: User not authenticated');
            return;
        }

        // Calculate date range for last 6 months
        const endDate = new Date();
        const startDate = subMonths(endDate, 6);
        console.log('Date range:', { startDate, endDate });

        this.financialInsightsService
            .getFinancialInsights('839a60a1-91b1-4d97-a935-5724cf3463bb', {
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
            })
            .pipe(
                catchError((error) => {
                    console.error('Error fetching insights:', error);
                    this.error =
                        error.error?.message ||
                        'Failed to load insights. Please try again.';
                    return of({
                        success: false,
                        data: {} as typeof this.insights,
                    });
                }),
                finalize(() => {
                    console.log('API call completed');
                    this.loading = false;
                })
            )
            .subscribe((response) => {
                console.log('API response:', response);
                if (response?.success && response?.data) {
                    // Filter out invalid monthly spend summaries
                    if (response.data.monthlySpendSummaries) {
                        response.data.monthlySpendSummaries =
                            response.data.monthlySpendSummaries
                                .filter(
                                    (summary) =>
                                        summary.date_or_month && summary.amount
                                )
                                .reduce((unique: any[], item) => {
                                    const exists = unique.find(
                                        (u) =>
                                            u.date_or_month ===
                                            item.date_or_month
                                    );
                                    if (!exists) {
                                        unique.push(item);
                                    }
                                    return unique;
                                }, [])
                                .sort(
                                    (a, b) =>
                                        new Date(a.date_or_month).getTime() -
                                        new Date(b.date_or_month).getTime()
                                );
                    }

                    // Ensure we have valid data structures
                    const defaultFinancialHealth = {
                        savingsRate: '0',
                        emergencyFund: { balance: '0', monthsCovered: null },
                        debtToIncomeRatio: 0,
                        investmentRatio: 0,
                        creditUtilization: 0,
                        monthlyBudgetAdherence: 0,
                        financialScore: 0,
                    };

                    this.insights = {
                        ...response.data,
                        financialHealth:
                            response.data.financialHealth ||
                            defaultFinancialHealth,
                    };
                    this.filterAlerts();
                    if (this.viewMode === 'charts') {
                        this.initializeCharts();
                    }
                } else if (!this.error) {
                    this.error = 'Unexpected response format.';
                }
            });
    }

    private filterAlerts(): void {
        if (this.insights.alerts) {
            // Remove duplicate alerts
            const uniqueAlerts = new Map();
            this.insights.alerts.forEach((alert) => {
                const key = `${alert.date_or_month}-${alert.notes}`;
                if (!uniqueAlerts.has(key)) {
                    uniqueAlerts.set(key, alert);
                }
            });

            // Filter out resolved alerts and sort by severity
            this.insights.alerts = Array.from(uniqueAlerts.values())
                .filter((alert) => !alert.resolved)
                .sort((a, b) => {
                    const severityOrder = { high: 3, medium: 2, low: 1 };
                    return (
                        severityOrder[b.severity] - severityOrder[a.severity]
                    );
                });
        }
    }

    onFilterChange(): void {
        this.fetchInsights();
    }

    clearFilters(): void {
        this.filterForm.reset();
    }

    toggleViewMode(): void {
        this.viewMode = this.viewMode === 'cards' ? 'charts' : 'cards';
        if (this.viewMode === 'charts' && this.insights) {
            this.initializeCharts();
        }
    }

    private initializeCharts(): void {
        this.initializeIncomeExpensesChart();
        this.initializeMonthlySpendingChart();
        this.initializeFinancialHealthChart();
    }

    private initializeIncomeExpensesChart(): void {
        if (!this.insights.incomeVsExpenses?.length) return;

        const categories = this.insights.incomeVsExpenses.map((item) =>
            new Date(item.date_or_month).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
            })
        );

        this.incomeExpensesChartOptions = {
            series: [
                {
                    name: 'Income',
                    data: this.insights.incomeVsExpenses.map((item) =>
                        parseFloat(item.income)
                    ),
                },
                {
                    name: 'Expenses',
                    data: this.insights.incomeVsExpenses.map((item) =>
                        parseFloat(item.expense)
                    ),
                },
                {
                    name: 'Net Savings',
                    data: this.insights.incomeVsExpenses.map(
                        (item) => item.netSavings
                    ),
                },
            ],
            chart: {
                type: 'bar',
                height: 350,
                stacked: false,
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                },
            },
            dataLabels: {
                enabled: false,
            },
            xaxis: {
                categories: categories,
            },
            yaxis: {
                title: {
                    text: 'Amount ($)',
                },
            },
            colors: ['#10B981', '#EF4444', '#6366F1'],
            legend: {
                position: 'bottom',
            },
        };
    }

    private initializeMonthlySpendingChart(): void {
        if (!this.insights.monthlySpendSummaries?.length) return;

        this.monthlySpendingChartOptions = {
            series: [
                {
                    name: 'Monthly Spending',
                    data: this.insights.monthlySpendSummaries.map((item) =>
                        parseFloat(item.amount)
                    ),
                },
            ],
            chart: {
                type: 'line',
                height: 350,
            },
            xaxis: {
                categories: this.insights.monthlySpendSummaries.map((item) =>
                    new Date(item.date_or_month).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                    })
                ),
            },
            yaxis: {
                title: {
                    text: 'Amount ($)',
                },
            },
            colors: ['#6366F1'],
            stroke: {
                curve: 'smooth',
            },
            markers: {
                size: 4,
            },
        };
    }

    private initializeFinancialHealthChart(): void {
        if (!this.insights.financialHealth) return;

        this.financialHealthChartOptions = {
            series: [
                {
                    name: 'Financial Health Score',
                    data: [
                        this.insights.financialHealth.savingsRate,
                        this.insights.financialHealth.debtToIncomeRatio,
                        this.insights.financialHealth.investmentRatio,
                        this.insights.financialHealth.creditUtilization,
                        this.insights.financialHealth.monthlyBudgetAdherence,
                    ],
                },
            ],
            chart: {
                type: 'radar',
                height: 350,
            },
            xaxis: {
                categories: [
                    'Savings Rate',
                    'Debt/Income',
                    'Investment',
                    'Credit',
                    'Budget Adherence',
                ],
            },
            yaxis: {
                show: false,
            },
            colors: ['#6366F1'],
            plotOptions: {
                radar: {
                    size: 140,
                    polygons: {
                        strokeColors: '#e8e8e8',
                        fill: {
                            colors: ['#f8f8f8', '#fff'],
                        },
                    },
                },
            },
        };
    }
}

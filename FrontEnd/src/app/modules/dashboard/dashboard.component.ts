import { CurrencyPipe, DatePipe } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from 'app/Service/auth.service';
import { DashboardService } from 'app/Service/dashboard.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';

import { Subject, takeUntil } from 'rxjs';

interface DashboardSummary {
    totalTransactions: number;
    totalAmountSpent: number;
    totalAmountReceived: number;
    averageTransactionAmount: number;
}

interface TransactionTrend {
    series: { name: string; data: number[] }[];
    labels: string[];
}

interface ApiResponse<T> {
    status: string;
    message: string;
    data: T;
    period?: string;
}

interface TransactionDistribution {
    categories: string[];
    amounts: number[];
    totalSpent: number;
    totalReceived: number;
    period: string;
}

interface RecentTransaction {
    description: string;
    amount: number;
    transaction_date: string;
    category: string;
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: true,
    imports: [
        CurrencyPipe,
        DatePipe,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatButtonToggleModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        NgApexchartsModule,
    ],
})
export class DashboardComponent implements OnInit, AfterViewInit {


    summary: DashboardSummary = {
        totalTransactions: 0,
        totalAmountSpent: 0,
        totalAmountReceived: 0,
        averageTransactionAmount: 0,
    };
    transactionTrend: TransactionTrend = {
        series: [],
        labels: [],
    };
    transactionDistribution: TransactionDistribution = {
        categories: [],
        amounts: [],
        totalSpent: 0,
        totalReceived: 0,
        period: 'This Week',
    };
    recentTransactions: RecentTransaction[] = [];
    userId: string | null = null;
    isLoading: boolean = false;
    transactionDistributionPeriod: string = 'This Week';
    recentTransactionsPeriod: string = 'Today';

    chartTransactionTrend: ApexOptions = {
        chart: {
            type: 'area',
            height: '100%',
            width: '100%',
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        series: [],
        xaxis: {
            categories: [],
        },
        yaxis: {
            show: false,
        },
    };

    chartTransactionDistribution: ApexOptions = {
        chart: {
            type: 'pie',
            height: '100%',
            width: '100%',
        },
        series: [],
        labels: [],
        colors: [
            '#3182CE', '#E53E3E', '#38A169', '#D69E2E', '#805AD5',
            '#DD6B20', '#319795', '#C53030', '#2B6CB0', '#553C9A'
        ],
        legend: {
            position: 'bottom',
        },
        responsive: [
            {
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200,
                    },
                    legend: {
                        position: 'bottom',
                    },
                },
            },
        ],
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private dashboardService: DashboardService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.userId = this.authService.getUserId();
        if (this.userId) {
            this.fetchDashboardData();
        } else {
            console.error('User ID not found in localStorage. Please log in.');
            this.router.navigate(['/sign-in']);
        }
    }

    ngAfterViewInit(): void {
        // Chart will auto-render with ApexCharts
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    fetchDashboardData(): void {
        if (!this.userId) return;

        this.isLoading = true;

        // Fetch summary
        this.dashboardService
            .getDashboardSummary(this.userId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: ApiResponse<DashboardSummary>) => {
                    this.summary = response.data;
                    this.checkLoadingState();
                },
                error: (error) => {
                    console.error('Error fetching dashboard summary:', error);
                    this.summary = {
                        totalTransactions: 0,
                        totalAmountSpent: 0,
                        totalAmountReceived: 0,
                        averageTransactionAmount: 0,
                    };
                    this.checkLoadingState();
                },
            });

        // Fetch transaction trend
        this.dashboardService
            .getTransactionTrend(this.userId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: ApiResponse<TransactionTrend>) => {
                    this.transactionTrend = response.data;
                    this.prepareTransactionTrendChart();
                    this.checkLoadingState();
                },
                error: (error) => {
                    console.error('Error fetching transaction trend:', error);
                    this.transactionTrend = { series: [], labels: [] };
                    this.prepareTransactionTrendChart();
                    this.checkLoadingState();
                },
            });

        // Fetch transaction distribution
        this.dashboardService
            .getTransactionDistribution(this.userId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: ApiResponse<TransactionDistribution>) => {
                    this.transactionDistribution = response.data;
                    this.transactionDistributionPeriod = response.data.period;
                    this.prepareTransactionDistributionChart();
                    this.checkLoadingState();
                },
                error: (error) => {
                    console.error(
                        'Error fetching transaction distribution:',
                        error
                    );
                    this.transactionDistribution = {
                        categories: [],
                        amounts: [],
                        totalSpent: 0,
                        totalReceived: 0,
                        period: 'This Week',
                    };
                    this.transactionDistributionPeriod = 'This Week';
                    this.prepareTransactionDistributionChart();
                    this.checkLoadingState();
                },
            });

        // Fetch recent transactions
        this.dashboardService
            .getRecentTransactions(this.userId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: ApiResponse<RecentTransaction[]>) => {
                    console.log('Recent transactions response:', response);
                    this.recentTransactions = response.data;
                    this.recentTransactionsPeriod = response.period ?? 'Today';
                    this.checkLoadingState();
                },
                error: (error) => {
                    console.error('Error fetching recent transactions:', error);
                    this.recentTransactions = [];
                    this.recentTransactionsPeriod = 'Today';
                    this.checkLoadingState();
                },
            });
    }

    checkLoadingState(): void {
        if (
            this.summary.totalTransactions !== undefined &&
            this.transactionTrend.series.length >= 0 &&
            this.transactionDistribution.categories.length >= 0 &&
            this.recentTransactions !== undefined
        ) {
            this.isLoading = false;
        }
    }

    prepareTransactionTrendChart(): void {
        this.chartTransactionTrend = {
            chart: {
                animations: {
                    speed: 400,
                    animateGradually: {
                        enabled: false,
                    },
                },
                fontFamily: 'inherit',
                foreColor: 'inherit',
                width: '100%',
                height: '100%',
                type: 'area',
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                },
            },
            colors: ['#818CF8'],
            dataLabels: {
                enabled: false,
            },
            fill: {
                colors: ['#312E81'],
            },
            grid: {
                show: true,
                borderColor: '#334155',
                padding: {
                    top: 10,
                    bottom: -40,
                    left: 0,
                    right: 0,
                },
                position: 'back',
                xaxis: {
                    lines: {
                        show: true,
                    },
                },
            },
            series: this.transactionTrend.series,
            stroke: {
                width: 2,
            },
            tooltip: {
                followCursor: true,
                theme: 'dark',
                x: {
                    formatter: (value: number, { dataPointIndex }): string => {
                        return (
                            this.transactionTrend.labels[dataPointIndex] || ''
                        );
                    },
                },
                y: {
                    formatter: (value: number): string =>
                        `₹${value.toFixed(2)}`,
                },
            },
            xaxis: {
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
                crosshairs: {
                    stroke: {
                        color: '#475569',
                        dashArray: 0,
                        width: 2,
                    },
                },
                labels: {
                    offsetY: -20,
                    style: {
                        colors: '#CBD5E1',
                    },
                },
                categories: this.transactionTrend.labels,
                type: 'category',
            },
            yaxis: {
                axisTicks: {
                    show: false,
                },
                axisBorder: {
                    show: false,
                },
                min: (min): number => min - 1000,
                max: (max): number => max + 500,
                tickAmount: 5,
                show: false,
            },
        };
    }

    prepareTransactionDistributionChart(): void {
        console.log(
            'Transaction Distribution Data:',
            this.transactionDistribution
        );

        const categories =
            this.transactionDistribution.categories.length > 0
                ? this.transactionDistribution.categories
                : ['No Data'];
        const amounts =
            this.transactionDistribution.amounts.length > 0
                ? this.transactionDistribution.amounts
                : [100];

        this.chartTransactionDistribution = {
            ...this.chartTransactionDistribution,
            series: amounts,
            labels: categories,
        };

        console.log('Pie Chart Data:', this.chartTransactionDistribution);
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}

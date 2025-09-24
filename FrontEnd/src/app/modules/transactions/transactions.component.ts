import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { AuthService } from 'app/Service/auth.service';
import { TransactionService } from 'app/Service/transaction.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-transactions',
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        MatProgressBarModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        ReactiveFormsModule,
    ],
})
export class TransactionsComponent implements OnInit {
    transactions: any[] = [];
    selectedTransaction: any = null;
    userId: string | null = null;
    isLoading: boolean = false;
    categories: string[] = [];
    showFilters: boolean = false;

    // Pagination
    pagination = {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10
    };
    pageSizeOptions: number[] = [5, 10, 25, 50];

    // Filter form
    filterForm = new FormGroup({
        search: new FormControl(''),
        startDate: new FormControl(''),
        endDate: new FormControl(''),
        transaction_type: new FormControl(''),
        category: new FormControl(''),
        minAmount: new FormControl(''),
        maxAmount: new FormControl(''),
        account_number: new FormControl(''),
        sortBy: new FormControl('transaction_date'),
        sortOrder: new FormControl('DESC')
    });

    constructor(
        private transactionService: TransactionService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.userId = this.authService.getUserId();
        if (this.userId) {
            this.fetchTransactions();
            this.fetchCategories();
        } else {
            console.error('User ID not found in localStorage. Please log in.');
            this.router.navigate(['/sign-in']);
        }

        // Set up filter form changes with debounce
        this.filterForm.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged()
            )
            .subscribe(() => {
                this.pagination.currentPage = 1;
                this.fetchTransactions();
            });
    }

    fetchTransactions(): void {
        if (!this.userId) return;

        this.isLoading = true;
        const filters = this.buildFilters();
        
        this.transactionService.getTransactionsByUserId(this.userId, filters).subscribe({
            next: (response) => {
                this.transactions = (response.data.transactions || []).map(
                    (transaction) => ({
                        ...transaction,
                        amount: transaction.amount ? parseFloat(transaction.amount) : 0,
                    })
                );
                this.pagination = response.data.pagination;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error fetching transactions:', error);
                this.transactions = [];
                this.pagination = { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 };
                this.isLoading = false;
            },
        });
    }

    fetchCategories(): void {
        if (!this.userId) return;
        
        this.transactionService.getTransactionCategories(this.userId).subscribe({
            next: (response) => {
                this.categories = response.data || [];
            },
            error: (error) => {
                console.error('Error fetching categories:', error);
                this.categories = [];
            }
        });
    }

    buildFilters(): any {
        const formValue = this.filterForm.value;
        const filters: any = {
            page: this.pagination.currentPage,
            limit: this.pagination.itemsPerPage
        };

        if (formValue.search) filters.search = formValue.search;
        if (formValue.startDate) filters.startDate = formValue.startDate;
        if (formValue.endDate) filters.endDate = formValue.endDate;
        if (formValue.transaction_type) filters.transaction_type = formValue.transaction_type;
        if (formValue.category) filters.category = formValue.category;
        if (formValue.minAmount) filters.minAmount = formValue.minAmount;
        if (formValue.maxAmount) filters.maxAmount = formValue.maxAmount;
        if (formValue.account_number) filters.account_number = formValue.account_number;
        if (formValue.sortBy) filters.sortBy = formValue.sortBy;
        if (formValue.sortOrder) filters.sortOrder = formValue.sortOrder;

        return filters;
    }

    onPageChange(event: any): void {
        this.pagination.currentPage = event.pageIndex + 1;
        this.pagination.itemsPerPage = event.pageSize;
        this.fetchTransactions();
    }

    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    clearFilters(): void {
        this.filterForm.reset({
            sortBy: 'transaction_date',
            sortOrder: 'DESC'
        });
        this.pagination.currentPage = 1;
    }

    toggleDetails(transactionId: string): void {
        this.selectedTransaction =
            this.selectedTransaction?.id === transactionId
                ? null
                : this.transactions.find((t) => t.id === transactionId);
    }

    setTransactionType(type: string): void {
        this.filterForm.get('transaction_type')?.setValue(type);
    }

    setSortOrder(order: string): void {
        this.filterForm.get('sortOrder')?.setValue(order);
    }

    getActiveFiltersCount(): number {
        const formValue = this.filterForm.value;
        let count = 0;
        if (formValue.search) count++;
        if (formValue.startDate) count++;
        if (formValue.endDate) count++;
        if (formValue.transaction_type) count++;
        if (formValue.category) count++;
        if (formValue.minAmount) count++;
        if (formValue.maxAmount) count++;
        if (formValue.account_number) count++;
        return count;
    }

    getTotalCredit(): number {
        return this.transactions
            .filter(t => t.transaction_type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getTotalDebit(): number {
        return this.transactions
            .filter(t => t.transaction_type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getNetBalance(): number {
        return this.getTotalCredit() - this.getTotalDebit();
    }

    Math = Math;

    trackByFn(index: number, item: any): string {
        return item.id;
    }
}
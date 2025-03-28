import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms'; // Import for form control
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AuthService } from 'app/Service/auth.service';
import { TransactionService } from 'app/Service/transaction.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'; // For debouncing search

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
        ReactiveFormsModule,
    ],
})
export class TransactionsComponent implements OnInit {
    allTransactions: any[] = [];
    filteredTransactions: any[] = []; // Store filtered transactions for search
    displayedTransactions: any[] = [];
    selectedTransaction: any = null;
    userId: string | null = null;
    isLoading: boolean = false;

    // Paginator properties
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    pageSizeOptions: number[] = [5, 10, 25, 100];
    pageSize: number = 10;
    pageIndex: number = 0;
    totalTransactions: number = 0;

    // Search control
    searchControl = new FormControl('');

    constructor(
        private transactionService: TransactionService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Get the userId from localStorage
        this.userId = this.authService.getUserId();
        if (this.userId) {
            this.fetchTransactions();
        } else {
            console.error('User ID not found in localStorage. Please log in.');
            this.router.navigate(['/sign-in']);
        }

        // Set up search functionality with debounce
        this.searchControl.valueChanges
            .pipe(
                debounceTime(300), // Wait 300ms after typing stops
                distinctUntilChanged() // Only emit if the value has changed
            )
            .subscribe((searchTerm) => {
                this.filterTransactions(searchTerm || '');
            });
    }

    fetchTransactions(): void {
        if (!this.userId) return;

        this.isLoading = true;
        this.transactionService.getTransactionsByUserId(this.userId).subscribe({
            next: (response) => {
                // Parse the amount field from string to number
                this.allTransactions = (response.data || []).map(
                    (transaction) => ({
                        ...transaction,
                        amount: transaction.amount
                            ? parseFloat(transaction.amount)
                            : 0,
                    })
                );
                this.filteredTransactions = [...this.allTransactions]; // Initialize filtered transactions
                this.totalTransactions = this.filteredTransactions.length;
                this.updateDisplayedTransactions();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error fetching transactions:', error);
                this.allTransactions = [];
                this.filteredTransactions = [];
                this.displayedTransactions = [];
                this.totalTransactions = 0;
                this.isLoading = false;
            },
        });
    }

    filterTransactions(searchTerm: string): void {
        if (!searchTerm) {
            this.filteredTransactions = [...this.allTransactions];
        } else {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            this.filteredTransactions = this.allTransactions.filter(
                (transaction) =>
                    transaction.reference_id
                        .toLowerCase()
                        .includes(lowerCaseSearchTerm) ||
                    transaction.account_number
                        .toLowerCase()
                        .includes(lowerCaseSearchTerm) ||
                    transaction.transaction_type
                        .toLowerCase()
                        .includes(lowerCaseSearchTerm) ||
                    transaction.category
                        .toLowerCase()
                        .includes(lowerCaseSearchTerm) ||
                    transaction.description
                        .toLowerCase()
                        .includes(lowerCaseSearchTerm)
            );
        }
        this.totalTransactions = this.filteredTransactions.length;
        this.pageIndex = 0; // Reset to first page on search
        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }
        this.updateDisplayedTransactions();
    }

    updateDisplayedTransactions(): void {
        const startIndex = this.pageIndex * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.displayedTransactions = this.filteredTransactions.slice(
            startIndex,
            endIndex
        );
    }

    onPageChange(event: any): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updateDisplayedTransactions();
    }

    toggleDetails(transactionId: string): void {
        this.selectedTransaction =
            this.selectedTransaction?.id === transactionId
                ? null
                : this.displayedTransactions.find(
                      (t) => t.id === transactionId
                  );
    }

    trackByFn(index: number, item: any): string {
        return item.id;
    }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { BudgetService } from 'app/Service/budget.service';
import { ConfirmDialogComponent } from 'app/shared/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-budget',
    standalone: true,
    imports: [
        CommonModule,
        MatProgressBarModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        MatPaginatorModule,
        ReactiveFormsModule,
    ],
    templateUrl: './budget.component.html',
    styleUrls: ['./budget.component.scss'],
})
export class BudgetComponent implements OnInit {
    budgets: any[] = [];
    displayedBudgets: any[] = [];
    isLoading = false;
    totalBudgets = 0;
    pageIndex = 0;
    pageSize = 10;
    searchControl = new FormControl();

    constructor(
        private budgetService: BudgetService,
        private snackBar: MatSnackBar,
        private router: Router,
        private dialog: MatDialog
    ) {}

    ngOnInit() {
        this.loadBudgets();
        this.searchControl.valueChanges.subscribe((value) => {
            this.filterBudgets(value);
        });
    }

    loadBudgets(searchTerm: string = '') {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.snackBar.open('User not logged in', 'Close', {
                duration: 3000,
            });
            return;
        }
        this.isLoading = true;
        this.budgetService.getBudgets(userId, searchTerm).subscribe(
            (response) => {
                this.budgets = response.data || [];
                this.totalBudgets = this.budgets.length;
                this.updateDisplayedBudgets();
                this.isLoading = false;
            },
            (error) => {
                this.snackBar.open('Failed to load budgets', 'Close', {
                    duration: 3000,
                });
                this.isLoading = false;
            }
        );
    }

    filterBudgets(searchTerm: string) {
        this.loadBudgets(searchTerm);
    }

    updateDisplayedBudgets() {
        const startIndex = this.pageIndex * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.displayedBudgets = this.budgets.slice(startIndex, endIndex);
    }

    onPageChange(event: any) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updateDisplayedBudgets();
    }

    addBudget() {
        this.router.navigate(['/budgets/detail/add']);
    }

    editBudget(budgetId: string) {
        this.router.navigate(['/budgets/detail/edit', budgetId]);
    }

    viewBudget(budgetId: string) {
        this.router.navigate(['/budgets/detail/view', budgetId]);
    }

    deleteBudget(budgetId: string) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Delete Budget',
                message: 'Are you sure you want to delete this budget?',
                confirmText: 'Delete',
                cancelText: 'Cancel',
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    this.snackBar.open('User not logged in', 'Close', {
                        duration: 3000,
                    });
                    return;
                }

                this.budgetService
                    .updateBudget(budgetId, {
                        user_id: userId,
                        is_delete: true,
                    })
                    .subscribe(
                        () => {
                            this.snackBar.open(
                                'Budget deleted successfully',
                                'Close',
                                {
                                    duration: 3000,
                                }
                            );
                            this.loadBudgets();
                        },
                        (error) => {
                            this.snackBar.open(
                                'Failed to delete budget',
                                'Close',
                                {
                                    duration: 3000,
                                }
                            );
                        }
                    );
            }
        });
    }
}

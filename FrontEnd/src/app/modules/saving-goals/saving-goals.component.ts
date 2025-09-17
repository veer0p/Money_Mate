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
import { SavingGoalsService } from 'app/Service/saving-goals.service';
import { ConfirmDialogComponent } from 'app/shared/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-saving-goals',
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
    templateUrl: './saving-goals.component.html',
})
export class SavingGoalsComponent implements OnInit {
    goals: any[] = [];
    displayedGoals: any[] = [];
    isLoading = false;
    totalGoals = 0;
    pageIndex = 0;
    pageSize = 10;
    searchControl = new FormControl();

    constructor(
        private savingGoalsService: SavingGoalsService,
        private snackBar: MatSnackBar,
        private router: Router,
        private dialog: MatDialog
    ) {}

    ngOnInit() {
        this.loadGoals();
        this.searchControl.valueChanges.subscribe((value) => {
            this.filterGoals(value);
        });
    }

    loadGoals(searchTerm: string = '') {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.snackBar.open('User not logged in', 'Close', {
                duration: 3000,
            });
            return;
        }
        this.isLoading = true;
        this.savingGoalsService.getSavingGoals(userId, searchTerm).subscribe(
            (response) => {
                this.goals = response.data || [];
                this.totalGoals = this.goals.length;
                this.updateDisplayedGoals();
                this.isLoading = false;
            },
            (error) => {
                this.snackBar.open('Failed to load saving goals', 'Close', {
                    duration: 3000,
                });
                this.isLoading = false;
            }
        );
    }

    filterGoals(searchTerm: string) {
        this.loadGoals(searchTerm);
    }

    updateDisplayedGoals() {
        const startIndex = this.pageIndex * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.displayedGoals = this.goals.slice(startIndex, endIndex);
    }

    onPageChange(event: any) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updateDisplayedGoals();
    }

    addGoal() {
        this.router.navigate(['/savings-goals/detail/add']);
    }

    editGoal(goalId: string) {
        this.router.navigate(['/savings-goals/detail/edit', goalId]);
    }

    viewGoal(goalId: string) {
        this.router.navigate(['/savings-goals/detail/view', goalId]);
    }

    deleteGoal(goalId: string) {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Delete Saving Goal',
                message: 'Are you sure you want to delete this saving goal?',
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

                this.savingGoalsService
                    .updateSavingGoal(goalId, {
                        user_id: userId,
                        is_delete: true,
                    })
                    .subscribe(
                        () => {
                            this.snackBar.open(
                                'Saving goal deleted successfully',
                                'Close',
                                {
                                    duration: 3000,
                                }
                            );
                            this.loadGoals();
                        },
                        (error) => {
                            this.snackBar.open(
                                'Failed to delete saving goal',
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

    getProgressPercentage(goal: any): number {
        return (goal.saved_amount / goal.goal_amount) * 100;
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'upcoming':
                return 'text-blue-600';
            case 'in_progress':
                return 'text-green-600';
            case 'archived':
                return 'text-gray-600';
            case 'failed':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    }
}

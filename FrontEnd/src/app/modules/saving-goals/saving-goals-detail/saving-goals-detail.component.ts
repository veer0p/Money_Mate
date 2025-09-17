import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { SavingGoalsService } from 'app/Service/saving-goals.service';

@Component({
    selector: 'app-saving-goals-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDatepickerModule,
        MatProgressBarModule,
    ],
    templateUrl: './saving-goals-detail.component.html',
})
export class SavingGoalsDetailComponent implements OnInit {
    goalForm: FormGroup;
    isLoading = false;
    isEditMode = false;
    isViewMode = false;
    goalId: string | null = null;
    currentGoal: any = null;

    constructor(
        private fb: FormBuilder,
        private savingGoalsService: SavingGoalsService,
        private route: ActivatedRoute,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.goalForm = this.fb.group({
            title: ['', [Validators.required, Validators.maxLength(100)]],
            description: [''],
            goal_amount: ['', [Validators.required, Validators.min(0)]],
            start_date: ['', Validators.required],
            end_date: ['', Validators.required],
        });
    }

    ngOnInit() {
        const mode = this.route.snapshot.paramMap.get('mode');
        this.goalId = this.route.snapshot.paramMap.get('id');

        this.isEditMode = mode === 'edit';
        this.isViewMode = mode === 'view';

        if (this.isEditMode || this.isViewMode) {
            this.loadGoalDetails();
        }
    }

    loadGoalDetails() {
        if (!this.goalId) return;

        this.isLoading = true;
        this.savingGoalsService.getSavingGoal(this.goalId).subscribe(
            (response) => {
                this.currentGoal = response.data;
                if (this.isEditMode) {
                    this.goalForm.patchValue({
                        title: this.currentGoal.title,
                        description: this.currentGoal.description,
                        goal_amount: this.currentGoal.goal_amount,
                        start_date: new Date(this.currentGoal.start_date),
                        end_date: new Date(this.currentGoal.end_date),
                    });
                }
                this.isLoading = false;
            },
            (error) => {
                this.snackBar.open('Failed to load goal details', 'Close', {
                    duration: 3000,
                });
                this.isLoading = false;
            }
        );
    }

    calculateStatus(): string {
        if (!this.currentGoal) return 'upcoming';

        const now = new Date();
        const startDate = new Date(this.currentGoal.start_date);
        const endDate = new Date(this.currentGoal.end_date);

        if (now < startDate) return 'upcoming';
        if (now > endDate) {
            return this.currentGoal.saved_amount >= this.currentGoal.goal_amount
                ? 'archived'
                : 'failed';
        }
        return 'in_progress';
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'upcoming':
                return 'bg-blue-100 text-blue-800';
            case 'in_progress':
                return 'bg-green-100 text-green-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    getProgressPercentage(): number {
        if (!this.currentGoal) return 0;
        return (
            (this.currentGoal.saved_amount / this.currentGoal.goal_amount) * 100
        );
    }

    getRemainingAmount(): number {
        if (!this.currentGoal) return 0;
        return this.currentGoal.goal_amount - this.currentGoal.saved_amount;
    }

    getDaysRemaining(): number {
        if (!this.currentGoal) return 0;
        const endDate = new Date(this.currentGoal.end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    onSubmit() {
        if (this.goalForm.invalid) return;

        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.snackBar.open('User not logged in', 'Close', {
                duration: 3000,
            });
            return;
        }

        const formData = {
            ...this.goalForm.value,
            user_id: userId,
        };

        this.isLoading = true;
        if (this.isEditMode && this.goalId) {
            this.savingGoalsService
                .updateSavingGoal(this.goalId, formData)
                .subscribe(
                    () => {
                        this.snackBar.open(
                            'Goal updated successfully',
                            'Close',
                            {
                                duration: 3000,
                            }
                        );
                        this.router.navigate(['/savings-goals']);
                    },
                    (error) => {
                        this.snackBar.open('Failed to update goal', 'Close', {
                            duration: 3000,
                        });
                        this.isLoading = false;
                    }
                );
        } else {
            this.savingGoalsService.createSavingGoal(formData).subscribe(
                () => {
                    this.snackBar.open('Goal created successfully', 'Close', {
                        duration: 3000,
                    });
                    this.router.navigate(['/savings-goals']);
                },
                (error) => {
                    this.snackBar.open('Failed to create goal', 'Close', {
                        duration: 3000,
                    });
                    this.isLoading = false;
                }
            );
        }
    }

    onCancel() {
        this.router.navigate(['/savings-goals']);
    }
}

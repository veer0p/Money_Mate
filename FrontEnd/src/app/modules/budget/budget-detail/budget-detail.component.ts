import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { BudgetService } from 'app/Service/budget.service';

@Component({
    selector: 'app-budget-detail',
    standalone: true,
    imports: [
        CommonModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatProgressBarModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
    ],
    templateUrl: './budget-detail.component.html',
    styleUrls: ['./budget-detail.component.scss'],
})
export class BudgetDetailComponent implements OnInit {
    budgetForm: FormGroup;
    isLoading = false;
    mode: 'add' | 'edit' | 'view' = 'add';
    budgetId: string | null = null;
    availableCategories: { id: string; name: string }[] = [];

    constructor(
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router,
        private budgetService: BudgetService
    ) {
        this.budgetForm = this.fb.group({
            budgetName: ['', Validators.required],
            totalAmount: [
                { value: 0, disabled: this.mode === 'view' }, // Disable in view mode
                [Validators.required, Validators.min(0)],
            ],
            categories: this.fb.array([], Validators.required),
            startDate: ['', Validators.required],
            endDate: [
                '',
                [Validators.required, this.dateRangeValidator.bind(this)],
            ],
        });

        // Update totalAmount when categories change
        this.categories.valueChanges.subscribe(() => {
            this.updateTotalAmount();
        });
    }

    ngOnInit() {
        this.mode =
            (this.route.snapshot.paramMap.get('mode') as
                | 'add'
                | 'edit'
                | 'view') || 'add';
        this.budgetId = this.route.snapshot.paramMap.get('id');
        this.loadCategories();
        if (this.mode === 'edit' || this.mode === 'view') {
            this.loadBudget();
        }
        if (this.mode === 'add' && this.categories.length === 0) {
            this.addCategory();
        }
    }

    get categories(): FormArray {
        return this.budgetForm.get('categories') as FormArray;
    }

    loadCategories() {
        this.budgetService.getCategories().subscribe({
            next: (response) => {
                this.availableCategories = response.data || [];
            },
            error: () => {
                this.snackBar.open('Failed to load categories', 'Close', {
                    duration: 3000,
                });
            },
        });
    }

    getCategoryName(categoryId: string): string {
        return (
            this.availableCategories.find((cat) => cat.id === categoryId)
                ?.name || 'Unknown Category'
        );
    }

    loadBudget() {
        if (!this.budgetId) return;

        this.isLoading = true;
        this.budgetService.getBudget(this.budgetId).subscribe({
            next: (response) => {
                const budget = response.data;
                console.log('Budget data:', budget); // Debug
                this.budgetForm.patchValue({
                    budgetName: budget.budget_name,
                    totalAmount: parseFloat(budget.total_amount), // Set API value
                    startDate: budget.start_date
                        ? new Date(budget.start_date)
                        : '',
                    endDate: budget.end_date ? new Date(budget.end_date) : '',
                });

                const categoriesArray = this.categories;
                categoriesArray.clear();
                if (
                    budget.budget_categories &&
                    Array.isArray(budget.budget_categories)
                ) {
                    budget.budget_categories.forEach((cat: any) => {
                        categoriesArray.push(
                            this.fb.group({
                                category_id: [
                                    cat.category_id,
                                    Validators.required,
                                ],
                                amount: [
                                    parseFloat(cat.amount), // Convert string to number
                                    [Validators.required, Validators.min(0)],
                                ],
                            })
                        );
                    });
                }

                // Only update totalAmount from categories in add/edit mode
                if (this.mode !== 'view') {
                    this.updateTotalAmount();
                }
                if (this.mode === 'view') this.isLoading = false;
                this.isLoading = false;
            },
            error: () => {
                this.snackBar.open('Failed to load budget', 'Close', {
                    duration: 3000,
                });
                this.isLoading = false;
            },
        });
    }
    addCategory() {
        this.categories.push(
            this.fb.group({
                category_id: ['', Validators.required],
                amount: [0, [Validators.required, Validators.min(0)]],
            })
        );
    }

    removeCategory(index: number) {
        this.categories.removeAt(index);
    }

    updateTotalAmount() {
        const total = this.categories.controls.reduce((sum, control) => {
            return sum + (control.get('amount')?.value || 0);
        }, 0);
        this.budgetForm
            .get('totalAmount')
            ?.setValue(total, { emitEvent: false });
        console.log('Updated totalAmount:', total); // Debug
    }

    dateRangeValidator(control: AbstractControl) {
        const startDate = this.budgetForm?.get('startDate')?.value;
        const endDate = control.value;
        return startDate && endDate && new Date(endDate) <= new Date(startDate)
            ? { dateRange: true }
            : null;
    }

    onSubmit() {
        if (!this.budgetForm.valid) return;

        this.isLoading = true;
        const formValue = this.budgetForm.value;
        const payload = {
            user_id: localStorage.getItem('userId'),
            budget_name: formValue.budgetName,
            total_amount: formValue.totalAmount,
            categories: formValue.categories,
            start_date: formValue.startDate.toISOString().split('T')[0],
            end_date: formValue.endDate.toISOString().split('T')[0],
        };

        const request =
            this.mode === 'add'
                ? this.budgetService.createBudget(payload)
                : this.budgetService.updateBudget(this.budgetId!, payload);

        request.subscribe({
            next: () => {
                const message =
                    this.mode === 'add'
                        ? 'Budget created successfully'
                        : 'Budget updated successfully';
                this.snackBar.open(message, 'Close', { duration: 3000 });
                this.router.navigate(['/budgets']);
            },
            error: () => {
                const message =
                    this.mode === 'add'
                        ? 'Failed to create budget'
                        : 'Failed to update budget';
                this.snackBar.open(message, 'Close', { duration: 3000 });
                this.isLoading = false;
            },
        });
    }

    cancel() {
        this.router.navigate(['/budgets']);
    }
}

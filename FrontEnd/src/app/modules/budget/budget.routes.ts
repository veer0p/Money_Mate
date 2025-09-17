import { Routes } from '@angular/router';
import { BudgetDetailComponent } from './budget-detail/budget-detail.component';
import { BudgetComponent } from './budget.component';

export const BudgetsRoutes: Routes = [
    {
        path: '',
        component: BudgetComponent,
    },
    {
        path: 'detail/:mode',
        component: BudgetDetailComponent,
    },
    {
        path: 'detail/:mode/:id',
        component: BudgetDetailComponent,
    },
];

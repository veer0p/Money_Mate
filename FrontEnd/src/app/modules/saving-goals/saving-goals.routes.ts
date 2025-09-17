import { Routes } from '@angular/router';
import { SavingGoalsDetailComponent } from './saving-goals-detail/saving-goals-detail.component';
import { SavingGoalsComponent } from './saving-goals.component';

export const SavingGoalsRoutes: Routes = [
    {
        path: '',
        component: SavingGoalsComponent,
    },
    {
        path: 'detail/:mode',
        component: SavingGoalsDetailComponent,
    },
    {
        path: 'detail/:mode/:id',
        component: SavingGoalsDetailComponent,
    },
];

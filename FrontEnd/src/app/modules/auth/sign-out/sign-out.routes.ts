import { Routes } from '@angular/router';
import { AuthSignOutComponent } from 'app/modules/auth/sign-out/sign-out.component';

export const SignOutRoutes: Routes = [
    {
        path: '',
        component: AuthSignOutComponent,
    },
];

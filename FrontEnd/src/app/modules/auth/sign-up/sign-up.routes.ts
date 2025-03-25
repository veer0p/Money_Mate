import { Routes } from '@angular/router';
import { AuthSignUpComponent } from 'app/modules/auth/sign-up/sign-up.component';

export const SignUpRoutes: Routes = [
    {
        path: '',
        component: AuthSignUpComponent,
    },
];

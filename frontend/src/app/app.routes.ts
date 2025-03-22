import { Routes } from '@angular/router';
import { AuthGuard } from 'app/core/auth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { ClassyLayoutComponent } from './layout/layouts/vertical/classy/classy.component';

export const appRoutes: Routes = [
    // Default redirect
    { path: '', redirectTo: '/sign-in', pathMatch: 'full' },

    // Auth routes (public, with empty layout)
    {
        path: '',
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            {
                path: 'sign-up',
                loadChildren: () =>
                    import('app/modules/auth/sign-up/sign-up.routes'),
            },
            {
                path: 'verify-email',
                loadChildren: () =>
                    import('app/modules/auth/verify-email/verify-email.routes'),
            },
            {
                path: 'sign-in',
                loadChildren: () =>
                    import('app/modules/auth/sign-in/sign-in.routes'),
            },
            {
                path: 'verify-otp',
                loadChildren: () =>
                    import('app/modules/auth/verify-otp/verify-otp.routes'),
            },
            {
                path: 'forgot-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/forgot-password/forgot-password.routes'
                    ),
            },
            {
                path: 'reset-password',
                loadChildren: () =>
                    import(
                        'app/modules/auth/reset-password/reset-password.routes'
                    ),
            },
            {
                path: 'sign-out',
                loadChildren: () =>
                    import('app/modules/auth/sign-out/sign-out.routes'),
            },
        ],
    },

    // Protected routes (with ClassyLayoutComponent)
    {
        path: '',
        component: ClassyLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'finance',
                loadChildren: () =>
                    import('app/modules/finance/finance.routes'),
            },
        ],
    },

    // Fallback for unknown routes
    { path: '**', redirectTo: '/sign-in' },
];

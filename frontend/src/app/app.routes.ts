import { Routes } from '@angular/router';
import { LayoutComponent } from 'app/layout/layout.component';
import { AuthForgotPasswordComponent } from 'app/modules/auth/forgot-password/forgot-password.component';
import { AuthResetPasswordComponent } from 'app/modules/auth/reset-password/reset-password.component';
import { AuthSignInComponent } from 'app/modules/auth/sign-in/sign-in.component';
import { AuthGuard } from './core/auth.guard';
import { AuthSignUpComponent } from './modules/auth/sign-up/sign-up.component';

export const appRoutes: Routes = [
    // Redirect empty path to '/sign-in'
    { path: '', redirectTo: '/sign-in', pathMatch: 'full' },

    // Auth routes (empty layout)
    {
        path: '',
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            {
                path: 'sign-up',
                component: AuthSignUpComponent,
            },
            {
                path: 'sign-in',
                component: AuthSignInComponent,
            },
            {
                path: 'forgot-password',
                component: AuthForgotPasswordComponent,
            },
            {
                path: 'reset-password',
                component: AuthResetPasswordComponent,
            },
        ],
    },

    // Protected routes (classy layout)
    {
        path: '',
        component: LayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'dashboard',
                loadChildren: () =>
                    import('app/modules/dashboard/dashboard.routes').then(
                        (m) => m.DashboardRoutes
                    ),
            },
            {
                path: 'transactions',
                loadChildren: () =>
                    import('app/modules/transactions/transactions.routes').then(
                        (m) => m.TransactionsRoutes
                    ),
            },
            {
                path: 'budgets',
                loadChildren: () =>
                    import('app/modules/budgets/budgets.routes').then(
                        (m) => m.BudgetsRoutes
                    ),
            },
            {
                path: 'savings-goals',
                loadChildren: () =>
                    import(
                        'app/modules/savings-goals/savings-goals.routes'
                    ).then((m) => m.SavingsGoalsRoutes),
            },
            {
                path: 'insights',
                loadChildren: () =>
                    import('app/modules/insights/insights.routes').then(
                        (m) => m.InsightsRoutes
                    ),
            },
            {
                path: 'mobile-sync',
                loadChildren: () =>
                    import('app/modules/mobile-sync/mobile-sync.routes').then(
                        (m) => m.MobileSyncRoutes
                    ),
            },
            {
                path: 'profile',
                loadChildren: () =>
                    import('app/modules/profile/profile.routes').then(
                        (m) => m.ProfileRoutes
                    ),
            },
            {
                path: 'settings',
                loadChildren: () =>
                    import('app/modules/settings/settings.routes').then(
                        (m) => m.SettingsRoutes
                    ),
            },
        ],
    },

    // Redirect after login
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboard' },

    // 404 redirect
    { path: '**', redirectTo: '/sign-in' },
];

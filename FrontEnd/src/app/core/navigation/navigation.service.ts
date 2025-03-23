import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _httpClient = inject(HttpClient);
    private _navigation: ReplaySubject<Navigation> =
        new ReplaySubject<Navigation>(1);

    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }

    get(): Observable<Navigation> {
        return this._httpClient.get<Navigation>('api/common/navigation').pipe(
            tap((navigation) => {
                if (!navigation.default) {
                    navigation.default = [];
                }
                if (!navigation.compact) {
                    navigation.compact = [];
                }
                if (!navigation.futuristic) {
                    navigation.futuristic = [];
                }
                if (!navigation.horizontal) {
                    navigation.horizontal = [];
                }
                this._navigation.next(navigation);
            })
        );
    }

    loadNavigation(): void {
        const navigation: Navigation = {
            default: [
                {
                    id: 'money-mate',
                    title: 'Money Mate',
                    subtitle: 'Track your finances',
                    type: 'group',
                    children: [
                        {
                            id: 'dashboard',
                            title: 'Dashboard',
                            type: 'basic',
                            link: '/dashboard',
                            icon: 'heroicons_outline:home',
                        },
                        {
                            id: 'transactions',
                            title: 'Transactions',
                            type: 'basic',
                            link: '/transactions',
                            icon: 'heroicons_outline:receipt-percent',
                        },
                        {
                            id: 'budgets',
                            title: 'Budgets',
                            type: 'basic',
                            link: '/budgets',
                            icon: 'heroicons_outline:wallet',
                        },
                        {
                            id: 'savings-goals',
                            title: 'Savings Goals',
                            type: 'basic',
                            link: '/savings-goals',
                            icon: 'heroicons_outline:currency-dollar',
                        },
                        {
                            id: 'insights',
                            title: 'Insights',
                            type: 'basic',
                            link: '/insights',
                            icon: 'heroicons_outline:light-bulb',
                        },
                        {
                            id: 'mobile-sync',
                            title: 'Mobile Sync',
                            type: 'basic',
                            link: '/mobile-sync',
                            icon: 'heroicons_outline:device-phone-mobile',
                        },
                        {
                            id: 'profile',
                            title: 'Profile',
                            type: 'basic',
                            link: '/profile',
                            icon: 'heroicons_outline:user',
                        },
                        {
                            id: 'settings',
                            title: 'Settings',
                            type: 'basic',
                            link: '/settings',
                            icon: 'heroicons_outline:cog',
                        },
                    ],
                },
            ],
            compact: [],
            futuristic: [],
            horizontal: [],
        };
        this._navigation.next(navigation);
    }
}

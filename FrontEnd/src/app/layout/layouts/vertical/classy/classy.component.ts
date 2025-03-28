import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import {
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { AuthService } from 'app/Service/auth.service'; // Import AuthService
import { UserService } from 'app/Service/user.service'; // Import UserService
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';
import { User } from 'app/core/user/user.types';
import { UserComponent } from 'app/layout/common/user/user.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'classy-layout',
    templateUrl: './classy.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        UserComponent,
        MatButtonModule,
        MatIconModule,
        RouterOutlet,
    ],
})
export class ClassyLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigation: Navigation;
    user: User;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _userService: UserService, // Inject UserService
        private _authService: AuthService // Inject AuthService
    ) {}

    get currentYear(): number {
        return new Date().getFullYear();
    }

    ngOnInit(): void {
        // Load navigation data
        this._navigationService.loadNavigation();

        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // Fetch user details dynamically
        const userId = this._authService.getUserId();
        if (userId) {
            this._userService
                .getUserDetails(userId)
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe({
                    next: (response) => {
                        const userData = response.data;
                        this.user = {
                            id: userData.id,
                            name: `${userData.first_name} ${userData.last_name}`,
                            email: userData.email,
                            avatar:
                                userData.profile_image_url ||
                                'assets/images/default-profile.png',
                            status: userData.is_active ? 'online' : 'offline',
                        };
                    },
                    error: (error) => {
                        console.error('Error fetching user details:', error);
                        // Fallback to default user data if the API fails
                        this.user = {
                            id: '1',
                            name: 'Unknown User',
                            email: 'unknown@company.com',
                            avatar: 'assets/images/default-profile.png',
                            status: 'offline',
                        };
                    },
                });
        } else {
            console.error('User ID not found. Please log in.');
            this._router.navigate(['/sign-in']);
        }

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toggleNavigation(name: string): void {
        const navigation =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                name
            );
        if (navigation) {
            navigation.toggle();
        }
    }
}

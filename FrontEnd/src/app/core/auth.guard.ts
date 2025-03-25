import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterStateSnapshot,
    UrlTree,
} from '@angular/router';
import { AuthService } from 'app/Service/auth.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ):
        | Observable<boolean | UrlTree>
        | Promise<boolean | UrlTree>
        | boolean
        | UrlTree {
        if (this.authService.isLoggedIn()) {
            return true;
        }

        // Redirect to sign-in with return URL
        return this.router.createUrlTree(['/sign-in'], {
            queryParams: { returnUrl: state.url },
        });
    }
}

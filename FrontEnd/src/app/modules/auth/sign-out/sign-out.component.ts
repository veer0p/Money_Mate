// src/app/auth/sign-out/sign-out.component.ts
import { I18nPluralPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from 'app/Service/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
    selector: 'auth-sign-out',
    templateUrl: './sign-out.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [RouterLink, I18nPluralPipe],
})
export class AuthSignOutComponent implements OnInit, OnDestroy {
    countdown: number = 5; // Start with 5 seconds countdown
    countdownMapping: { [k: string]: string } = {
        '=1': '# second',
        other: '# seconds',
    };
    private countdownSubscription!: Subscription;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Clear authentication tokens
        this.authService.clearTokens();

        // Start countdown
        this.countdownSubscription = interval(1000).subscribe(() => {
            this.countdown--;
            if (this.countdown <= 0) {
                this.redirectToSignIn();
            }
        });
    }

    ngOnDestroy(): void {
        // Clean up subscription
        if (this.countdownSubscription) {
            this.countdownSubscription.unsubscribe();
        }
    }

    redirectToSignIn(): void {
        // Navigate to sign-in page
        this.router.navigate(['/sign-in']);
    }
}

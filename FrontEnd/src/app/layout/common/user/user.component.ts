import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from 'app/Service/auth.service';
import { User } from 'app/core/user/user.types';

@Component({
    selector: 'user',
    templateUrl: './user.component.html',
    standalone: true,
    imports: [MatMenuModule, CommonModule],
})
export class UserComponent {
    @Input() showAvatar: boolean = true;
    @Input() user: User; // Add user input

    constructor(
        private _authService: AuthService,
        private _router: Router
    ) {}
}

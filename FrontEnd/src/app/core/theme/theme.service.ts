import { Injectable, inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FuseConfigService } from '@fuse/services/config';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ThemeService implements OnDestroy {
    private _document = inject(DOCUMENT);
    private _fuseConfigService = inject(FuseConfigService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor() {
        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this._updateTheme(config);
            });
    }

    /**
     * Update the theme by applying the theme class to the body element
     */
    private _updateTheme(config: any): void {
        if (!config) {
            return;
        }

        const body = this._document.body;
        
        // Remove all existing theme classes
        const existingThemeClasses = Array.from(body.classList).filter(className => 
            className.startsWith('theme-')
        );
        existingThemeClasses.forEach(className => {
            body.classList.remove(className);
        });

        // Apply the current theme class
        if (config.theme) {
            body.classList.add(config.theme);
        }

        // Apply the scheme class (light/dark)
        if (config.scheme) {
            // Remove existing scheme classes
            body.classList.remove('light', 'dark');
            body.classList.add(config.scheme);
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
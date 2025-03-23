import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, inject } from '@angular/core';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations'; // Ensure this import is correct
import {
    PreloadAllModules,
    provideRouter,
    withInMemoryScrolling,
    withPreloading,
} from '@angular/router';
import { provideFuse } from '@fuse';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { appRoutes } from 'app/app.routes';
import { provideIcons } from 'app/core/icons/icons.provider';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { firstValueFrom } from 'rxjs';
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader';

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimations(), // Ensure this is present
        provideHttpClient(),
        provideRouter(
            appRoutes,
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
        ),

        // Material Date Adapter
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'D',
                },
                display: {
                    dateInput: 'DDD',
                    monthYearLabel: 'LLL yyyy',
                    dateA11yLabel: 'DD',
                    monthYearA11yLabel: 'LLLL yyyy',
                },
            },
        },

        // Transloco Config
        provideTransloco({
            config: {
                availableLangs: [
                    { id: 'en', label: 'English' },
                    { id: 'tr', label: 'Turkish' },
                ],
                defaultLang: 'en',
                fallbackLang: 'en',
                reRenderOnLangChange: true,
                prodMode: true,
            },
            loader: TranslocoHttpLoader,
        }),
        {
            provide: APP_INITIALIZER,
            useFactory: () => {
                const translocoService = inject(TranslocoService);
                const defaultLang = translocoService.getDefaultLang();
                translocoService.setActiveLang(defaultLang);
                return () => firstValueFrom(translocoService.load(defaultLang));
            },
            multi: true,
        },
        {
            provide: APP_INITIALIZER,
            useFactory: () => {
                const navigationService = inject(NavigationService);
                return () => {
                    navigationService.loadNavigation();
                    return Promise.resolve();
                };
            },
            multi: true,
        },

        // Fuse
        provideIcons(),
        provideFuse({
            mockApi: { delay: 0 },
            fuse: {
                layout: 'classy',
                scheme: 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: 'theme-default',
                themes: [
                    { id: 'theme-default', name: 'Default' },
                    { id: 'theme-brand', name: 'Brand' },
                    { id: 'theme-teal', name: 'Teal' },
                    { id: 'theme-rose', name: 'Rose' },
                    { id: 'theme-purple', name: 'Purple' },
                    { id: 'theme-amber', name: 'Amber' },
                ],
            },
        }),
    ],
};

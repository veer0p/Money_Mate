import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from 'app/app.component';
import { appConfig } from 'app/app.config';
import './app/core/theme/theme-initializer';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
);

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FuseConfig, FuseConfigService } from '@fuse/services/config';
import { Subject, filter, takeUntil } from 'rxjs';
import { EmptyLayoutComponent } from './layouts/empty/empty.component';
import { ClassyLayoutComponent } from './layouts/vertical/classy/classy.component';

@Component({
    selector: 'layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, EmptyLayoutComponent], // Add EmptyLayoutComponent to imports
})
export class LayoutComponent implements OnInit, OnDestroy {
    config: FuseConfig;
    layout: string = 'classy'; // Default to 'classy'
    layoutComponents: { [key: string]: any } = {
        classy: ClassyLayoutComponent,
        empty: EmptyLayoutComponent,
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _fuseConfigService: FuseConfigService
    ) {}

    ngOnInit(): void {
        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                this.config = config;
                this._updateLayout();
            });

        // Subscribe to NavigationEnd event
        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => {
                this._updateLayout();
            });

        // Initial layout update
        this._updateLayout();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private _updateLayout(): void {
        // Start with the default layout
        this.layout = this.config?.layout || 'classy';

        // Check for layout in query params
        let route = this._activatedRoute;
        while (route.firstChild) {
            route = route.firstChild;
        }
        const layoutFromQueryParam = route.snapshot.queryParamMap.get('layout');
        if (layoutFromQueryParam) {
            this.layout = layoutFromQueryParam;
            if (this.config) {
                this.config.layout = layoutFromQueryParam;
            }
            return;
        }

        // Check for layout in route data (traverse all parent routes)
        let currentRoute: ActivatedRoute | null = this._activatedRoute;
        while (currentRoute) {
            if (
                currentRoute.snapshot.routeConfig?.data &&
                currentRoute.snapshot.routeConfig.data.layout
            ) {
                this.layout = currentRoute.snapshot.routeConfig.data.layout;
                break;
            }
            currentRoute = currentRoute.parent;
        }
    }
}

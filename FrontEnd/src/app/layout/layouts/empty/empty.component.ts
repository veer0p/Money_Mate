import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'empty-layout',
    templateUrl: './empty.component.html',
    standalone: true,
    imports: [RouterOutlet],
})
export class EmptyLayoutComponent {
    constructor() {}
}

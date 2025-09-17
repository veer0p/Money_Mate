import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    template: `
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <mat-dialog-content>
            <p>{{ data.message }}</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button [mat-dialog-close]="false">
                {{ data.cancelText }}
            </button>
            <button mat-raised-button color="warn" [mat-dialog-close]="true">
                {{ data.confirmText }}
            </button>
        </mat-dialog-actions>
    `,
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: {
            title: string;
            message: string;
            confirmText: string;
            cancelText: string;
        }
    ) {}
}

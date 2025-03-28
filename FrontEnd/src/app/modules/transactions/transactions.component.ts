import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-transactions',
    standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
    ],
    templateUrl: './transactions.component.html',
    styleUrl: './transactions.component.scss',
})
export class TransactionsComponent {
    transactions = [
        {
            id: '550e8400-e29b-41d4-a716-446655440000',
            reference_id: 'TXN001',
            account_number: 'ACC123456789',
            transaction_type: 'credit',
            category: 'Salary',
            amount: 50000.0,
            currency: 'INR',
            transaction_date: '2025-03-01',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440001',
            reference_id: 'TXN002',
            account_number: 'ACC123456789',
            transaction_type: 'debit',
            category: 'Groceries',
            amount: 2500.5,
            currency: 'INR',
            transaction_date: '2025-03-02',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440002',
            reference_id: 'TXN003',
            account_number: 'ACC987654321',
            transaction_type: 'debit',
            category: 'Utilities',
            amount: 1200.75,
            currency: 'INR',
            transaction_date: '2025-03-03',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440003',
            reference_id: 'TXN004',
            account_number: 'ACC987654321',
            transaction_type: 'credit',
            category: 'Freelance',
            amount: 15000.0,
            currency: 'INR',
            transaction_date: '2025-03-04',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440004',
            reference_id: 'TXN005',
            account_number: 'ACC456789123',
            transaction_type: 'debit',
            category: 'Dining',
            amount: 800.25,
            currency: 'INR',
            transaction_date: '2025-03-05',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440005',
            reference_id: 'TXN006',
            account_number: 'ACC456789123',
            transaction_type: 'credit',
            category: 'Refund',
            amount: 500.0,
            currency: 'INR',
            transaction_date: '2025-03-06',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440006',
            reference_id: 'TXN007',
            account_number: 'ACC789123456',
            transaction_type: 'debit',
            category: 'Travel',
            amount: 3500.0,
            currency: 'INR',
            transaction_date: '2025-03-07',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440007',
            reference_id: 'TXN008',
            account_number: 'ACC789123456',
            transaction_type: 'credit',
            category: 'Bonus',
            amount: 10000.0,
            currency: 'INR',
            transaction_date: '2025-03-08',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440008',
            reference_id: 'TXN009',
            account_number: 'ACC321654987',
            transaction_type: 'debit',
            category: 'Shopping',
            amount: 4500.0,
            currency: 'INR',
            transaction_date: '2025-03-09',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440009',
            reference_id: 'TXN010',
            account_number: 'ACC321654987',
            transaction_type: 'credit',
            category: 'Gift',
            amount: 2000.0,
            currency: 'INR',
            transaction_date: '2025-03-10',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440010',
            reference_id: 'TXN011',
            account_number: 'ACC654987321',
            transaction_type: 'debit',
            category: 'Entertainment',
            amount: 600.5,
            currency: 'INR',
            transaction_date: '2025-03-11',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440011',
            reference_id: 'TXN012',
            account_number: 'ACC654987321',
            transaction_type: 'credit',
            category: 'Interest',
            amount: 300.0,
            currency: 'INR',
            transaction_date: '2025-03-12',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440012',
            reference_id: 'TXN013',
            account_number: 'ACC147258369',
            transaction_type: 'debit',
            category: 'Medical',
            amount: 1800.0,
            currency: 'INR',
            transaction_date: '2025-03-13',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440013',
            reference_id: 'TXN014',
            account_number: 'ACC147258369',
            transaction_type: 'credit',
            category: 'Insurance',
            amount: 5000.0,
            currency: 'INR',
            transaction_date: '2025-03-14',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440014',
            reference_id: 'TXN015',
            account_number: 'ACC258369147',
            transaction_type: 'debit',
            category: 'Education',
            amount: 2500.0,
            currency: 'INR',
            transaction_date: '2025-03-15',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440015',
            reference_id: 'TXN016',
            account_number: 'ACC258369147',
            transaction_type: 'credit',
            category: 'Salary',
            amount: 52000.0,
            currency: 'INR',
            transaction_date: '2025-03-16',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440016',
            reference_id: 'TXN017',
            account_number: 'ACC369147258',
            transaction_type: 'debit',
            category: 'Rent',
            amount: 15000.0,
            currency: 'INR',
            transaction_date: '2025-03-17',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440017',
            reference_id: 'TXN018',
            account_number: 'ACC369147258',
            transaction_type: 'credit',
            category: 'Investment',
            amount: 8000.0,
            currency: 'INR',
            transaction_date: '2025-03-18',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440018',
            reference_id: 'TXN019',
            account_number: 'ACC741852963',
            transaction_type: 'debit',
            category: 'Transport',
            amount: 900.0,
            currency: 'INR',
            transaction_date: '2025-03-19',
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440019',
            reference_id: 'TXN020',
            account_number: 'ACC741852963',
            transaction_type: 'credit',
            category: 'Cashback',
            amount: 200.0,
            currency: 'INR',
            transaction_date: '2025-03-20',
        },
    ];

    selectedTransaction: any = null;

    toggleDetails(transactionId: string) {
        this.selectedTransaction =
            this.selectedTransaction?.id === transactionId
                ? null
                : this.transactions.find((t) => t.id === transactionId);
    }

    trackByFn(index: number, item: any): string {
        return item.id;
    }
}

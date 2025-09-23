import csv
import re
from datetime import datetime

def categorize_transaction(description):
    """Categorize transaction based on description"""
    desc = description.lower()
    
    if 'upi' in desc:
        return 'Transfer'
    elif any(word in desc for word in ['credited', 'credit']):
        return 'Income'
    elif any(word in desc for word in ['debited', 'debit']):
        return 'Expense'
    else:
        return 'Other'

def analyze_transactions(csv_file):
    """Analyze transactions and show spending by category"""
    categories = {}
    total_spent = 0
    total_received = 0
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            amount = float(row['amount'])
            transaction_type = row['transaction_type']
            category = row['category'] or categorize_transaction(row['description'])
            
            if transaction_type == 'debit':
                total_spent += amount
                categories[category] = categories.get(category, 0) + amount
            elif transaction_type == 'credit':
                total_received += amount
    
    print(f"Total Spent: {total_spent}")
    print(f"Total Received: {total_received}")
    print("\nSpending by Category:")
    for category, amount in categories.items():
        print(f"{category}: {amount}")

if __name__ == "__main__":
    analyze_transactions(r"C:\Users\atoda\Downloads\transactions.csv")
import re
from typing import Optional

class TransactionCategorizer:
    def __init__(self):
        self.categories = {
            'Food & Dining': [
                'zomato', 'swiggy', 'dominos', 'pizza', 'burger', 'kfc', 'mcdonalds',
                'restaurant', 'food', 'cafe', 'hotel', 'dining', 'eatery', 'bakery',
                'subway', 'starbucks', 'dunkin', 'baskin', 'haldirams', 'barbeque'
            ],
            'Petrol & Fuel': [
                'petrol', 'fuel', 'diesel', 'gas', 'pump', 'hp', 'iocl', 'bpcl',
                'shell', 'reliance', 'essar', 'bharat petroleum'
            ],
            'Shopping & E-commerce': [
                'amazon', 'flipkart', 'myntra', 'shopping', 'mall', 'store', 'purchase',
                'nykaa', 'ajio', 'meesho', 'snapdeal', 'paytm mall', 'bigbasket'
            ],
            'Transport & Travel': [
                'uber', 'ola', 'taxi', 'metro', 'bus', 'train', 'irctc', 'makemytrip',
                'ixigo', 'travel', 'ticket', 'rapido', 'auto', 'cab', 'flight'
            ],
            'Utilities & Bills': [
                'recharge', 'mobile', 'electricity', 'gas', 'water', 'bill',
                'airtel', 'jio', 'vodafone', 'broadband', 'wifi', 'internet'
            ],
            'Education': [
                'coursera', 'udemy', 'education', 'school', 'college', 'byjus',
                'unacademy', 'course', 'tuition', 'fees', 'books'
            ],
            'Entertainment': [
                'netflix', 'spotify', 'movie', 'cinema', 'entertainment', 'music',
                'hotstar', 'prime', 'youtube', 'gaming', 'pvr', 'inox'
            ],
            'Healthcare': [
                'hospital', 'doctor', 'medical', 'pharmacy', 'medicine', 'health',
                'apollo', 'medplus', 'clinic', 'diagnostic'
            ],
            'Banking': [
                'atm', 'neft', 'imps', 'minimum balance', 'charges', 'fee', 'bank',
                'transfer', 'upi', 'rtgs', 'credited', 'debited'
            ],
            'Personal': [
                'atodariyadharme', 'neetu.collation', '_fam', 'family', 'personal',
                '8487005334_fam'
            ]
        }
    
    def categorize(self, description: str) -> str:
        """Categorize transaction based on description"""
        if not description:
            return 'Others'
        
        desc_lower = description.lower()
        
        # Check each category
        for category, keywords in self.categories.items():
            if any(keyword in desc_lower for keyword in keywords):
                return category
        
        return 'Others'
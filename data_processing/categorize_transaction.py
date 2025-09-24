import sys
import json

def categorize_transaction(description):
    """Determine transaction category from description"""
    if not description:
        return 'Others'
    
    desc = description.lower()
    
    # Food & Dining
    if any(word in desc for word in ['zomato', 'swiggy', 'dominos', 'pizza', 'burger', 'kfc', 'mcdonalds', 
                                     'restaurant', 'food', 'cafe', 'hotel', 'dining', 'eatery', 'bakery']):
        return 'Food & Dining'
    
    # Petrol & Fuel
    if any(word in desc for word in ['petrol', 'fuel', 'diesel', 'gas', 'pump', 'hp', 'iocl', 'bpcl']):
        return 'Petrol & Fuel'
    
    # Shopping & E-commerce  
    if any(word in desc for word in ['amazon', 'flipkart', 'myntra', 'shopping', 'mall', 'store', 'purchase']):
        return 'Shopping & E-commerce'
    
    # Transport & Travel
    if any(word in desc for word in ['uber', 'ola', 'taxi', 'metro', 'bus', 'train', 'irctc', 'makemytrip', 
                                     'ixigo', 'travel', 'ticket']):
        return 'Transport & Travel'
    
    # Utilities & Bills
    if any(word in desc for word in ['recharge', 'mobile', 'electricity', 'gas', 'water', 'bill', 
                                     'airtel', 'jio', 'vodafone', 'broadband']):
        return 'Utilities & Bills'
    
    # Education
    if any(word in desc for word in ['coursera', 'udemy', 'education', 'school', 'college', 'byjus', 
                                     'unacademy', 'course']):
        return 'Education'
    
    # Entertainment
    if any(word in desc for word in ['netflix', 'spotify', 'movie', 'cinema', 'entertainment', 'music',
                                     'hotstar', 'prime']):
        return 'Entertainment'
    
    # Healthcare
    if any(word in desc for word in ['hospital', 'doctor', 'medical', 'pharmacy', 'medicine', 'health',
                                     'apollo', 'medplus']):
        return 'Healthcare'
    
    # Banking & Financial
    if any(word in desc for word in ['atm', 'neft', 'imps', 'minimum balance', 'charges', 'fee', 'bank']):
        return 'Banking'
    
    # Personal (family/friends)
    if any(word in desc for word in ['atodariyadharme', 'neetu.collation', '_fam', 'family', 'personal']):
        return 'Personal'
    
    return 'Others'

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({'error': 'No description provided'}))
            sys.exit(1)
        
        description = sys.argv[1]
        category = categorize_transaction(description)
        
        print(json.dumps({'category': category}))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
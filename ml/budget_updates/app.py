import pandas as pd
import re
from datetime import datetime

# Load dataset
file_path = "D:\Money_Mate\ml\exported_data\messages_export.csv"
df = pd.read_csv(file_path)

# Define budget categories and limits
budget_limits = {
    "food": 5000,  # Example: $5000 monthly
    "shopping": 7000,
    "bills": 4000,
    "transport": 3000
}

# Function to extract amount and category from messages
def extract_transaction(message):
    amount_pattern = r'\bRs\.?\s?(\d+[,.]?\d*)\b'  # Regex for extracting amount
    category_keywords = {
        "food": ["restaurant", "dining", "food", "Zomato", "Swiggy"],
        "shopping": ["Amazon", "Flipkart", "shopping", "mall"],
        "bills": ["electricity", "water", "bill", "recharge"],
        "transport": ["cab", "Uber", "Ola", "fuel"]
    }
    
    amount_match = re.search(amount_pattern, message)
    if amount_match:
        amount = float(amount_match.group(1).replace(',', ''))
        for category, keywords in category_keywords.items():
            if any(word.lower() in message.lower() for word in keywords):
                return amount, category
    return None, None

# Process messages to extract transactions
transactions = []
for index, row in df.iterrows():
    amount, category = extract_transaction(row['message_body'])
    if amount and category:
        transactions.append({
            "date": row['received_at'],
            "amount": amount,
            "category": category
        })

# Convert transactions to DataFrame
transactions_df = pd.DataFrame(transactions)

# Calculate total spending per category
spending_summary = transactions_df.groupby("category")["amount"].sum()

# Check budget warnings
warnings = []
for category, spent in spending_summary.items():
    budget = budget_limits.get(category, 0)
    if spent >= 0.9 * budget:
        warnings.append(f"🚨 Warning: You've spent {spent}/{budget} in {category}.")

# Display warnings
for warning in warnings:
    print(warning)

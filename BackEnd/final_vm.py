import sys
import io
import uuid
from datetime import datetime
import psycopg2
import fasttext
import re

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

class TransactionClassifier:
    def __init__(self, model_path="transaction_model_v2.bin"):
        self.model = fasttext.load_model(model_path)

    def clean_text(self, text):
        cleaned = re.sub(r'\n+', ' ', text.strip())
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.lower()

    def extract_amount(self, text):
        balance_match = re.search(
            r'(Available|Avail|Avl|Ledger|Ending|Updated|Remaining|Net Available|Total|Post txn|Current|Final)\s*'
            r'(Balance|Bal|Funds)?[:\-]?\s*Rs\.?\s*([\d,]+(?:\.\d{1,2})?)',
            text,
            flags=re.IGNORECASE
        )
        balance = float(balance_match.group(3).replace(',', '')) if balance_match else None

        cleaned_text = re.sub(
            r'(Available|Avail|Avl|Ledger|Ending|Updated|Remaining|Net Available|Total|Post txn|Current|Final)?\s*'
            r'(Balance|Bal|Funds)?[:\-]?\s*Rs\.?\s*[\d,]+(?:\.\d+)?',
            '',
            text,
            flags=re.IGNORECASE
        )

        amount_match = re.search(r'Rs\.?\s?([\d,]+(?:\.\d{1,2})?)', cleaned_text)
        if amount_match:
            amount = float(amount_match.group(1).replace(',', ''))
        else:
            amount_match_alt = re.search(r'(\b\d{1,6}(?:\.\d{1,2})?\b)', cleaned_text)
            amount = float(amount_match_alt.group(1)) if amount_match_alt else 0.0

        return amount, balance

    def predict(self, text, user_id, cursor, db):
        amount, balance = self.extract_amount(text)
        cleaned_text = self.clean_text(text)
        prediction, confidence = self.model.predict(cleaned_text)
        
        # Check for OTP in the message
        otp_pattern = r'\b\d{6}\b'  # Assuming OTP is a 6-digit number
        contains_otp = re.search(otp_pattern, text) is not None

        # Define non-financial keywords to exclude
        non_financial_keywords = ["games", "otp", "rummy", "binge", "casino", "lottery", "betting", "cricket", "congrets", "Congratulations", "GAMERS"]
        contains_non_financial = any(keyword in text.lower() for keyword in non_financial_keywords)

        # Determine if the message is financial
        is_financial = "__label__positive" in prediction and not contains_otp and not contains_non_financial
        
        # Allow financial keywords to override, but only if not excluded by non-financial keywords
        financial_keywords = ["debited", "credited", "balance", "rs.", "account", "transaction", "spi", "paytm", "phonepe", "gpay", "recharge"]
        if not is_financial and any(keyword in text.lower() for keyword in financial_keywords) and not contains_non_financial:
            is_financial = True
            keyword_override = True
        else:
            keyword_override = False
        
        return {
            'prediction': prediction[0],
            'confidence': confidence[0],
            'is_financial': is_financial,
            'amount': amount,
            'account_balance': balance,
            'keyword_override': keyword_override
        }

print("Step 1: Starting script execution...")

print("Step 2: Loading FastText model...")
try:
    financial_classifier = TransactionClassifier('transaction_model_v2.bin')
    print("Step 2: Model loaded successfully!")
except Exception as e:
    print(f"Step 2: Failed to load model - {e}")
    sys.exit(1)

print("Step 3: Connecting to Neon PostgreSQL database...")
try:
    db = psycopg2.connect(
        host="ep-noisy-sun-a88xazp4-pooler.eastus2.azure.neon.tech",
        database="neondb",
        user="neondb_owner",
        password="npg_NFfl4qvhk8uX",
        sslmode="require"
    )
    cursor = db.cursor()
    print("Step 3: Database connection successful!")
except Exception as e:
    print(f"Step 3: Failed to connect to database - {e}")
    sys.exit(1)

print("Step 4: Starting message processing...")

BATCH_SIZE = 500
offset = 0
processed_count = 0
financial_count = 0
non_financial_count = 0
uncategorized_count = 0

CATEGORIES = {
    "shopping": ["amazon", "flipkart", "myntra", "purchase", "order", "bought", "shop", "cart", "zepto", "big basket"],
    "banking": ["account", "bank", "loan", "interest", "balance", "emi", "debit", "credit", "withdraw", "recharge"],
    "food": ["zomato", "swiggy", "food", "restaurant", "pizza", "coffee", "dine"],
    "person-to-person": ["sent", "received", "upi", "transfer", "paytm", "phonepe", "gpay", "money sent"],
    "other": []
}

def classify_category(text, cursor):
    text_lower = text.lower()
    
    # First try to find an existing category that matches
    cursor.execute("""
        SELECT id, name 
        FROM categories 
        WHERE LOWER(name) = ANY(%s)
    """, ([category for category in CATEGORIES.keys()],))
    
    category_map = {row[1].lower(): row[0] for row in cursor.fetchall()}
    
    for category_name, keywords in CATEGORIES.items():
        if any(word in text_lower for word in keywords):
            if category_name.lower() in category_map:
                return category_map[category_name.lower()]
    
    # Get the 'other' category ID if no match found
    cursor.execute("SELECT id FROM categories WHERE LOWER(name) = 'other' LIMIT 1")
    other_category = cursor.fetchone()
    return other_category[0] if other_category else None

cursor.execute("SELECT COUNT(*) FROM messages WHERE status = 'uncategorized'")
total_messages = cursor.fetchone()[0]
print(f"Step 5: Total uncategorized messages to process: {total_messages}")

if total_messages == 0:
    print("Step 5: No uncategorized messages found. Exiting.")
    cursor.close()
    db.close()
    sys.exit(0)

print("Step 6: Starting batch processing (Descending Order)...")
while offset < total_messages:
    print(f"Step 6.{offset//BATCH_SIZE + 1}: Fetching batch {offset} to {min(offset + BATCH_SIZE - 1, total_messages - 1)}...")
    cursor.execute("""
        SELECT id, user_id, message_body, received_at 
        FROM messages 
        WHERE status = 'uncategorized'
        ORDER BY received_at DESC
        LIMIT %s OFFSET %s
    """, (BATCH_SIZE, offset))
    messages = cursor.fetchall()
    
    batch_size = len(messages)
    if batch_size == 0:
        break
    
    print(f"Step 6.{offset//BATCH_SIZE + 1}: Retrieved {batch_size} uncategorized messages")
    
    for msg_id, user_id, sms, received_at in messages:
        processed_count += 1
        print(f"\nStep 7.{processed_count}: Processing Message: {sms}")
        
        try:
            result = financial_classifier.predict(sms, user_id, cursor, db)
            print(f"Step 7.{processed_count}: Prediction - {result['prediction']} | Confidence: {result['confidence']:.2f} | Is Financial: {result['is_financial']}" + 
                  (f" | Keyword Override: {result['keyword_override']}" if result['keyword_override'] else ""))
            
            # Always update user's account balance if available, regardless of message type
            if result['account_balance'] is not None:
                cursor.execute("""
                    UPDATE users 
                    SET account_balance = %s, updated_at = NOW() 
                    WHERE id = %s
                """, (result['account_balance'], user_id))
                print(f"Step 7.{processed_count}: Updated user {user_id}'s balance to Rs {result['account_balance']}")
            
            if result['is_financial'] and result['amount']:
                financial_count += 1
                transaction_type = "debit" if "debited" in sms.lower() or "spent" in sms.lower() else "credit"
                category_id = classify_category(sms, cursor)
                amount = result['amount']
                txn_id = str(uuid.uuid4())
                now = datetime.now()
                
                cursor.execute("""
                    INSERT INTO transactions
                    (id, user_id, message_id, account_number, transaction_type, amount, currency, 
                     transaction_date, category_id, account_balance, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    txn_id, user_id, msg_id, "unknown", transaction_type, amount, "INR", received_at, 
                    category_id, result['account_balance'], now, now
                ))
                cursor.execute("UPDATE messages SET status = 'processed', updated_at = NOW() WHERE id = %s", (msg_id,))
                db.commit()
                print(f"Step 7.{processed_count}: Inserted transaction - Rs {amount} | Type: {transaction_type} | Category ID: {category_id} | Balance: {result['account_balance'] or 'N/A'} | msg_id {msg_id}")
            else:
                non_financial_count += 1
                cursor.execute("UPDATE messages SET status = 'processed', updated_at = NOW() WHERE id = %s", (msg_id,))
                db.commit()
                print(f"Step 7.{processed_count}: Marked as processed (non-financial) | msg_id {msg_id}")
        
        except Exception as e:
            uncategorized_count += 1
            print(f"Step 7.{processed_count}: Failed to process - {e}")
            db.rollback()
            cursor.execute("UPDATE messages SET status = 'uncategorized', updated_at = NOW() WHERE id = %s", (msg_id,))
            db.commit()
            print(f"Step 7.{processed_count}: Marked as uncategorized (not processed by model) | msg_id {msg_id}")
    
    offset += BATCH_SIZE
    print(f"Step 6.{offset//BATCH_SIZE}: Batch {offset - BATCH_SIZE} to {offset - 1} completed")

print("\nStep 8: Finalizing...")
cursor.close()
db.close()
print("Step 8: Database connection closed!")

print(f"\n✅ Step 9: Execution complete!")
print(f"Total messages Processed: {processed_count}")
print(f"Financial Transactions: {financial_count}")
print(f"Non-Financial (Processed): {non_financial_count}")
print(f"Uncategorized (Not Processed): {uncategorized_count}")
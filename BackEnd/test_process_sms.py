import psycopg2
import uuid
import re
from datetime import datetime  # Import datetime for updated_at

print("Step 1: Starting script execution...")

# Database connection (PostgreSQL - Neon)
print("Step 2: Connecting to Neon PostgreSQL database...")
try:
    db = psycopg2.connect(
        host="ep-noisy-sun-a88xazp4-pooler.eastus2.azure.neon.tech",
        database="neondb",
        user="neondb_owner",
        password="npg_NFfl4qvhk8uX",
        sslmode="require"
    )
    cursor = db.cursor()
    print("Step 2: Database connection successful!")
except Exception as e:
    print(f"Step 2: Failed to connect to database - {e}")
    exit(1)

# User ID for testing
user_id = "c6762be8-7e98-4795-a4e2-896b01d758dc"
print(f"Step 3: Processing messages for user_id: {user_id}")

# Fetch up to 50 messages
print("Step 4: Fetching up to 50 messages from the database...")
try:
    cursor.execute("""
        SELECT id, message_body, received_at 
        FROM "Messages" 
        WHERE user_id = %s 
        LIMIT 50
    """, (user_id,))
    messages = cursor.fetchall()
    print(f"Step 4: Retrieved {len(messages)} messages")
except Exception as e:
    print(f"Step 4: Error fetching messages - {e}")
    cursor.close()
    db.close()
    exit(1)

# Process messages (rule-based for testing)
print("Step 5: Starting message processing...")
processed_count = 0
financial_count = 0

for msg_id, sms, received_at in messages:
    processed_count += 1
    print(f"Step 5.{processed_count}: Processing message ID: {msg_id} - Content: {sms}")
    
    # Improved financial detection
    is_financial = any(keyword in sms.lower() for keyword in [
        'credit', 'debit', 'account', 'inr', 'paid', 'transferred', 'credited', 'debited', 'upi', 'bal', 'balance'
    ])
    if is_financial:
        # Improved amount extraction
        amount_match = re.search(r'Rs\.?\s*(\d+\.?\d*)\s*(?:CR)?', sms, re.IGNORECASE)
        amount = float(amount_match.group(1)) if amount_match else 0
        trans_type = 'credit' if any(k in sms.lower() for k in ['credit', 'credited']) else 'debit'
        print(f"Step 5.{processed_count}: Detected financial - Amount: {amount}, Type: {trans_type}")

        try:
            cursor.execute("""
                INSERT INTO transactions 
                (id, user_id, account_number, transaction_type, amount, currency, transaction_date, description, reference_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                str(uuid.uuid4()),  # id
                user_id,           # user_id
                "unknown",         # account_number
                trans_type,        # transaction_type
                amount,            # amount
                "INR",             # currency
                received_at,       # transaction_date
                sms,               # description (using SMS content)
                str(msg_id),       # reference_id (using message ID)
                datetime.now(),    # created_at
                datetime.now()     # updated_at
            ))
            financial_count += 1
            print(f"Step 5.{processed_count}: Inserted into transactions table")
        except Exception as e:
            print(f"Step 5.{processed_count}: Error inserting into transactions - {e}")
            db.rollback()  # Rollback the transaction to avoid "transaction aborted" errors
    else:
        print(f"Step 5.{processed_count}: Not financial - Skipping")

# Commit and close
print("Step 6: Committing changes to database...")
db.commit()
print("Step 6: Changes committed successfully!")

print("Step 7: Closing database connection...")
cursor.close()
db.close()
print("Step 7: Database connection closed!")

print(f"Step 8: Execution complete! Processed {processed_count} messages, found {financial_count} financial transactions for user {user_id}")
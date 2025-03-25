import psycopg2
import subprocess
from datetime import datetime

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

# Process messages by calling categorize.py
print("Step 5: Starting message processing by calling categorize.py...")
processed_count = 0
financial_count = 0

for msg_id, sms, received_at in messages:
    processed_count += 1
    print(f"Step 5.{processed_count}: Processing message ID: {msg_id} - Content: {sms}")
    
    # Call categorize.py and pass the message details as arguments
    try:
        result = subprocess.run(
            [
                "python", "categorize.py",
                str(msg_id), user_id, sms, str(received_at)
            ],
            capture_output=True,
            text=True
        )
        # Check the output from categorize.py
        if result.returncode != 0:
            print(f"Step 5.{processed_count}: Error in categorize.py - {result.stderr}")
            continue

        # Parse the output from categorize.py
        output = result.stdout.strip().split("|")
        if len(output) != 3:
            print(f"Step 5.{processed_count}: Invalid output from categorize.py - {result.stdout}")
            continue

        is_financial, amount, trans_type = output
        is_financial = is_financial.lower() == "true"
        amount = float(amount) if amount else 0
        trans_type = trans_type if trans_type else "debit"

        if is_financial:
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
    except Exception as e:
        print(f"Step 5.{processed_count}: Error processing message - {e}")
        continue

# Commit and close
print("Step 6: Committing changes to database...")
db.commit()
print("Step 6: Changes committed successfully!")

print("Step 7: Closing database connection...")
cursor.close()
db.close()
print("Step 7: Database connection closed!")

print(f"Step 8: Execution complete! Processed {processed_count} messages, found {financial_count} financial transactions for user {user_id}")
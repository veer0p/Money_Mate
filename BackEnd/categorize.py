import sys
import re

# Get command-line arguments
if len(sys.argv) != 5:
    print("Error: Expected 4 arguments (msg_id, user_id, sms, received_at)", file=sys.stderr)
    sys.exit(1)

msg_id = sys.argv[1]
user_id = sys.argv[2]
sms = sys.argv[3]
received_at = sys.argv[4]

# Improved financial detection
is_financial = any(keyword in sms.lower() for keyword in [
    'credit', 'debit', 'account', 'inr', 'paid', 'transferred', 'credited', 'debited', 'upi', 'bal', 'balance'
])

# Initialize default values
amount = 0
trans_type = "debit"

if is_financial:
    # Improved amount extraction
    amount_match = re.search(r'Rs\.?\s*(\d+\.?\d*)\s*(?:CR)?', sms, re.IGNORECASE)
    amount = float(amount_match.group(1)) if amount_match else 0
    trans_type = 'credit' if any(k in sms.lower() for k in ['credit', 'credited']) else 'debit'

# Output the result in the format: is_financial|amount|trans_type
print(f"{is_financial}|{amount}|{trans_type}")
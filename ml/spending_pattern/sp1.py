import sys
import json
import pandas as pd
import re
from datetime import datetime
from sklearn.cluster import KMeans

def extract_transaction_details(message):
    amount_pattern = r'Rs\.?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)'
    amount_match = re.search(amount_pattern, message)
    amount = float(amount_match.group(1).replace(',', '')) if amount_match else None

    datetime_pattern = r'(\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2})'
    datetime_match = re.search(datetime_pattern, message)
    transaction_datetime = datetime.strptime(datetime_match.group(1), '%d-%m-%Y %H:%M:%S') if datetime_match else None

    return {'amount': amount, 'datetime': transaction_datetime}

try:
    input_data = sys.stdin.read()

    try:
        messages = json.loads(input_data)
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    if not isinstance(messages, list) or len(messages) == 0:
        print(json.dumps({"error": "Empty or invalid messages list"}))
        sys.exit(1)

    transactions = []
    for message in messages:
        transaction = extract_transaction_details(message['message_body'])
        if transaction['amount'] and transaction['datetime']:
            transactions.append(transaction)

    df = pd.DataFrame(transactions)

    if df.empty:
        print(json.dumps({"error": "No valid transactions found"}))
        sys.exit(1)

    df.set_index('datetime', inplace=True)

    if len(df) < 14:
        print(json.dumps({"status": "Analysis completed with warnings", "warning": "Not enough data"}))
        sys.exit(0)
    
    df['hour'] = df.index.hour
    X = df[['hour', 'amount']]
    kmeans = KMeans(n_clusters=3, random_state=42)
    df['cluster'] = kmeans.fit_predict(X)

    df.to_csv("processed_data.csv")

    result = {"status": "Analysis completed", "output": "processed_data.csv"}
    print(json.dumps(result))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)

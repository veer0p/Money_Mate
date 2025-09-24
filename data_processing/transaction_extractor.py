import requests
import sys
import re
from datetime import datetime
from typing import Dict, List, Optional
from enhanced_confidence_extractor import EnhancedConfidenceExtractor, MessageType
from transaction_categorizer import TransactionCategorizer

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

class TransactionExtractor:
    def __init__(self, api_base_url: str):
        self.api_base_url = api_base_url
        self.confidence_extractor = EnhancedConfidenceExtractor()
        self.categorizer = TransactionCategorizer()
        
        # Confidence thresholds
        self.HIGH_CONFIDENCE = 80
        self.MEDIUM_CONFIDENCE = 50
    
    def extract_transaction_data(self, message: Dict) -> Optional[Dict]:
        """Extract transaction data using confidence-based system"""
        message_body = message['message_body']
        
        # Use confidence extractor with sender info
        sender = message.get('sender', '')
        result = self.confidence_extractor.extract_with_confidence(message_body, sender)
        
        # Only process high and medium confidence transactions
        if not result['is_transaction'] or result['confidence'] < self.MEDIUM_CONFIDENCE:
            # Skip printing message content to avoid encoding issues
            print(f"Skipping message (confidence: {result.get('confidence', 0)}%)")
            return None
        
        # Log confidence level
        confidence_level = "HIGH" if result['confidence'] >= self.HIGH_CONFIDENCE else "MEDIUM"
        print(f"[{confidence_level} CONFIDENCE: {result['confidence']}%] Processing transaction: Rs.{result['amount']}")
        
        # Convert timestamp to proper format
        transaction_date = message['received_at']
        if isinstance(transaction_date, str):
            # If it's ISO string, convert to datetime
            try:
                from datetime import datetime
                transaction_date = datetime.fromisoformat(transaction_date.replace('Z', '+00:00'))
            except:
                transaction_date = datetime.now()
        
        # Categorize the transaction
        category = self.categorizer.categorize(message_body)
        
        return {
            'user_id': message['user_id'],
            'source_message_id': message['id'],
            'account_number': str(result['account_number']) if result['account_number'] else 'unknown',
            'transaction_type': result['transaction_type'],
            'category': category,
            'amount': float(result['amount']),
            'currency': 'INR',
            'transaction_date': transaction_date.isoformat() if hasattr(transaction_date, 'isoformat') else str(transaction_date),
            'description': message_body[:200] if message_body else '',
            'reference_id': result['reference_id'] if result['reference_id'] else None
        }
    
    def process_single_message(self, message: Dict) -> bool:
        """Process a single message and return success status"""
        transaction = self.extract_transaction_data(message)
        transactions = [transaction] if transaction else []
        processed_message_ids = [message['id']]
        
        return self.save_transactions(transactions, processed_message_ids)
    
    def fetch_unprocessed_messages_with_limit(self, limit: int = None) -> List[Dict]:
        """Fetch unprocessed messages with optional limit from API"""
        try:
            url = f"{self.api_base_url}/processing/messages/unprocessed"
            if limit:
                url += f"?limit={limit}"
            response = requests.get(url)
            response.raise_for_status()
            return response.json()['messages']
        except Exception as e:
            print(f"Error fetching messages: {e}")
            return []
    
    def save_transactions(self, transactions: List[Dict], processed_message_ids: List[str]) -> bool:
        """Save extracted transactions to API"""
        try:
            payload = {
                'transactions': transactions,
                'processedMessageIds': processed_message_ids
            }
            
            # Log sample transaction for debugging
            if transactions:
                print(f"Sample transaction: {transactions[0]}")
            
            response = requests.post(f"{self.api_base_url}/processing/transactions/bulk-create", json=payload)
            
            if response.status_code != 200:
                print(f"Server error response: {response.status_code}")
                print(f"Response body: {response.text}")
            
            response.raise_for_status()
            
            if transactions:
                print(f"Saved {len(transactions)} transactions, marked {len(processed_message_ids)} messages as processed")
            else:
                print(f"Marked {len(processed_message_ids)} messages as processed (no transactions)")
            
            return True
        except requests.exceptions.RequestException as e:
            print(f"Request error saving transactions: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            return False
        except Exception as e:
            print(f"Unexpected error saving transactions: {e}")
            return False
    
    def extract_balance_from_message(self, message_body: str) -> float:
        """Extract balance from message text"""
        balance_patterns = [
            r'avlbl amt:rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)',     # AvlBal: Rs2137.64
            r'avl bal:rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)',      # Avl Bal:Rs 96.92
            r'total bal:rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)',    # Total Bal:Rs.6106.44CR
            r'balance:rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)',      # Balance:Rs.1000
        ]
        
        for pattern in balance_patterns:
            match = re.search(pattern, message_body, re.IGNORECASE)
            if match:
                return float(match.group(1).replace(',', ''))
        
        return None
    
    def update_user_balance(self, messages: List[Dict]):
        """Update user balance from latest message with balance info"""
        try:
            # Find latest message with balance info
            latest_balance = None
            latest_user_id = None
            latest_date = None
            
            for message in messages:
                balance = self.extract_balance_from_message(message['message_body'])
                if balance:
                    message_date = message['received_at']
                    if not latest_date or message_date > latest_date:
                        latest_balance = balance
                        latest_user_id = message['user_id']
                        latest_date = message_date
            
            # Update user balance if found
            if latest_balance and latest_user_id:
                payload = {
                    'user_id': latest_user_id,
                    'balance': latest_balance
                }
                response = requests.post(f"{self.api_base_url}/user/update-balance", json=payload)
                response.raise_for_status()
                print(f"Updated user balance: Rs.{latest_balance}")
                
        except Exception as e:
            print(f"Error updating user balance: {e}")
    
    def process_messages(self, limit: int = None):
        """Main processing function for batch processing"""
        if limit:
            print(f"Starting confidence-based transaction extraction with limit: {limit}...")
        else:
            print("Starting confidence-based transaction extraction for ALL messages...")
        messages = self.fetch_unprocessed_messages_with_limit(limit)
        
        if not messages:
            print("No unprocessed messages found.")
            return
        
        print(f"Processing {len(messages)} messages...")
        
        transactions = []
        processed_message_ids = []
        confidence_stats = {'high': 0, 'medium': 0, 'low': 0, 'skipped': 0, 'duplicates': 0}
        seen_fingerprints = set()  # Track transaction fingerprints
        
        for message in messages:
            sender = message.get('sender', '')
            result = self.confidence_extractor.extract_with_confidence(message['message_body'], sender)
            
            # Check for duplicates using transaction fingerprint + user_id
            if result['is_transaction'] and 'transaction_fingerprint' in result:
                user_fingerprint = f"{message['user_id']}_{result['transaction_fingerprint']}"
                if user_fingerprint in seen_fingerprints:
                    confidence_stats['duplicates'] += 1
                    print(f"Skipping duplicate transaction: Rs.{result['amount']} for user {message['user_id']}")
                    processed_message_ids.append(message['id'])
                    continue
                seen_fingerprints.add(user_fingerprint)
            
            # Track confidence statistics
            if result['confidence'] >= self.HIGH_CONFIDENCE:
                confidence_stats['high'] += 1
            elif result['confidence'] >= self.MEDIUM_CONFIDENCE:
                confidence_stats['medium'] += 1
            elif result['confidence'] > 0:
                confidence_stats['low'] += 1
            else:
                confidence_stats['skipped'] += 1
            
            transaction = self.extract_transaction_data(message)
            if transaction:
                transactions.append(transaction)
            processed_message_ids.append(message['id'])
        
        print(f"Confidence Statistics:")
        print(f"   High (80-100%): {confidence_stats['high']} transactions")
        print(f"   Medium (50-79%): {confidence_stats['medium']} transactions") 
        print(f"   Low (1-49%): {confidence_stats['low']} transactions")
        print(f"   Skipped (0%): {confidence_stats['skipped']} messages")
        print(f"   Duplicates: {confidence_stats['duplicates']} transactions")
        
        if self.save_transactions(transactions, processed_message_ids):
            print(f"Successfully processed {len(messages)} messages, created {len(transactions)} transactions!")
            
            # Update user balance from latest message
            self.update_user_balance(messages)
        else:
            print("Failed to save transactions.")

if __name__ == "__main__":
    # Test with sample messages
    API_BASE_URL = "http://localhost:5000/api"
    
    extractor = TransactionExtractor(API_BASE_URL)
    
    # Real test messages from CSV with senders
    test_messages = [
        ("Rs.6000 Credited to A/c ...9212 thru UPI/511857530160 by atodariyadharme. Total Bal:Rs.6106.44CR. Avlbl Amt:Rs.6106.44(28-04-2025 07:40:39) - Bank of Baroda", "VM-BOBTXN"),
        ("Rs 40.00 debited from A/C XXXXXX9212 and credited to rsp9974-1@okicici UPI Ref:409594145449. Not you? Call 18005700 -BOB", "JK-BOBSMS"),
        ("Dear BOB UPI User: Your account is credited with INR 1.00 on 2025-07-21 12:22:21 PM by UPI Ref No 556899569329; AvlBal: Rs2137.64 - BOB", "VM-BOBSMS-S"),
        ("50% Daily Data quota used as on 21-Nov-24 22:13. Jio Number : 8487005334", "JE-JioPay"),
        ("Your Jugnoo OTP is 7481 and it is valid till 6:28 PM. Please do not share this OTP with anyone.", "+918153872832")
    ]
    
    print("Testing Confidence Extractor:")
    print("=" * 50)
    
    for i, (msg, sender) in enumerate(test_messages, 1):
        print(f"\nTest Message {i}:")
        print(f"Sender: {sender}")
        print(f"Message: {msg[:80]}...")
        
        result = extractor.confidence_extractor.extract_with_confidence(msg, sender)
        
        if result['is_transaction']:
            print(f"TRANSACTION DETECTED")
            print(f"   Amount: Rs.{result['amount']}")
            print(f"   Type: {result['transaction_type']}")
            print(f"   Confidence: {result['confidence']}%")
            print(f"   Account: {result['account_number']}")
            print(f"   Reference: {result['reference_id']}")
        else:
            print(f"NOT A TRANSACTION")
            print(f"   Reason: {result['reason']}")
        
        print("-" * 50)
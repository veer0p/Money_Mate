import re
from typing import Dict, List, Optional, Tuple
from enum import Enum

class MessageType(Enum):
    TRANSACTION = 'transaction'
    SECURITY_ALERT = 'security_alert'
    TELECOM = 'telecom'
    PROMOTIONAL = 'promotional'
    OTP = 'otp'
    OTHER = 'other'

class ConfidenceExtractor:
    def __init__(self):
        self.credit_keywords = ['credited', 'received', 'deposited', 'refund', 'cashback']
        self.debit_keywords = ['debited', 'transferred', 'paid', 'withdrawn', 'purchase']
        self.bank_keywords = ['account', 'upi', 'neft', 'rtgs', 'bank', 'atm', 'a/c']
        
    def classify_message(self, message_body: str) -> MessageType:
        """Classify message type with priority order"""
        message = message_body.lower()
        
        # Security alerts - highest priority
        if any(keyword in message for keyword in ['never share', 'fraud', 'suspicious', 'block']):
            return MessageType.SECURITY_ALERT
            
        # OTP messages
        if 'otp' in message and re.search(r'\d{4,6}', message):
            return MessageType.OTP
            
        # Telecom messages
        if any(keyword in message for keyword in ['data', 'gb', 'mb', 'missed call', 'jio', 'airtel']):
            return MessageType.TELECOM
            
        # Promotional messages
        if any(keyword in message for keyword in ['offer', 'discount', 'sale', 'click', 'download']):
            return MessageType.PROMOTIONAL
            
        # Transaction messages
        has_action = any(keyword in message for keyword in self.credit_keywords + self.debit_keywords)
        has_bank_context = any(keyword in message for keyword in self.bank_keywords)
        has_amount = bool(re.search(r'rs\.?\s*\d+|₹\s*\d+', message, re.IGNORECASE))
        
        if has_action and has_bank_context and has_amount:
            return MessageType.TRANSACTION
            
        return MessageType.OTHER
    
    def extract_with_confidence(self, message_body: str) -> Dict:
        """Extract transaction data using 4 different methods and calculate confidence"""
        
        # Only process if it's a transaction
        if self.classify_message(message_body) != MessageType.TRANSACTION:
            return {
                'is_transaction': False,
                'confidence': 0,
                'reason': 'Not classified as transaction'
            }
        
        # Run 4 extractors
        regex_result = self._regex_extractor(message_body)
        keyword_result = self._keyword_extractor(message_body)
        position_result = self._position_extractor(message_body)
        context_result = self._context_extractor(message_body)
        
        extractors = [regex_result, keyword_result, position_result, context_result]
        
        # Calculate consensus
        amounts = [r['amount'] for r in extractors if r['amount']]
        types = [r['type'] for r in extractors if r['type']]
        accounts = [r['account'] for r in extractors if r['account']]
        
        # Find most common values
        final_amount = self._get_consensus(amounts)
        final_type = self._get_consensus(types)
        final_account = self._get_consensus(accounts)
        
        # Calculate confidence based on agreement
        confidence = self._calculate_confidence(extractors, final_amount, final_type)
        
        # Validation checks
        confidence = self._apply_validation_rules(message_body, final_amount, confidence)
        
        return {
            'is_transaction': True,
            'amount': final_amount,
            'transaction_type': final_type,
            'account_number': final_account or 'unknown',
            'confidence': confidence,
            'extractor_results': extractors,
            'reference_id': self._extract_reference(message_body)
        }
    
    def _regex_extractor(self, message: str) -> Dict:
        """Current regex-based extraction"""
        result = {'amount': None, 'type': None, 'account': None, 'confidence': 0}
        
        # Transaction amount patterns
        patterns = [
            r'rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)\s+credited',
            r'rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)\s+debited',
            r'credited.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
            r'debited.*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                result['amount'] = float(match.group(1).replace(',', ''))
                result['type'] = 'credit' if 'credit' in pattern else 'debit'
                result['confidence'] = 85
                break
        
        # Account extraction
        acc_match = re.search(r'a/c[:\s]*[x]*(\d{4,})', message, re.IGNORECASE)
        if acc_match:
            result['account'] = acc_match.group(1)
            
        return result
    
    def _keyword_extractor(self, message: str) -> Dict:
        """Simple keyword-based extraction"""
        result = {'amount': None, 'type': None, 'account': None, 'confidence': 0}
        message_lower = message.lower()
        
        # Determine type by keywords
        if any(word in message_lower for word in self.credit_keywords):
            result['type'] = 'credit'
        elif any(word in message_lower for word in self.debit_keywords):
            result['type'] = 'debit'
        
        # Extract any amount
        amount_match = re.search(r'rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)', message, re.IGNORECASE)
        if amount_match:
            result['amount'] = float(amount_match.group(1).replace(',', ''))
            result['confidence'] = 70
            
        return result
    
    def _position_extractor(self, message: str) -> Dict:
        """Extract based on amount position in message"""
        result = {'amount': None, 'type': None, 'account': None, 'confidence': 0}
        
        # Find all amounts
        amounts = re.findall(r'rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)', message, re.IGNORECASE)
        
        if amounts:
            # First amount is usually transaction amount
            result['amount'] = float(amounts[0].replace(',', ''))
            
            # Determine type by position relative to keywords
            amount_pos = message.lower().find(amounts[0].lower())
            credit_pos = message.lower().find('credit')
            debit_pos = message.lower().find('debit')
            
            if credit_pos != -1 and abs(credit_pos - amount_pos) < 50:
                result['type'] = 'credit'
            elif debit_pos != -1 and abs(debit_pos - amount_pos) < 50:
                result['type'] = 'debit'
                
            result['confidence'] = 60
            
        return result
    
    def _context_extractor(self, message: str) -> Dict:
        """Extract based on surrounding context"""
        result = {'amount': None, 'type': None, 'account': None, 'confidence': 0}
        
        # Look for amounts with strong context indicators
        patterns = [
            (r'(\d+(?:,\d+)*(?:\.\d{2})?)\s+credited', 'credit'),
            (r'(\d+(?:,\d+)*(?:\.\d{2})?)\s+debited', 'debit'),
            (r'credited.*?(\d+(?:,\d+)*(?:\.\d{2})?)', 'credit'),
            (r'debited.*?(\d+(?:,\d+)*(?:\.\d{2})?)', 'debit')
        ]
        
        for pattern, trans_type in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                result['amount'] = float(match.group(1).replace(',', ''))
                result['type'] = trans_type
                result['confidence'] = 80
                break
                
        return result
    
    def _get_consensus(self, values: List) -> Optional[str]:
        """Get most common value from extractors"""
        if not values:
            return None
        
        # Count occurrences
        counts = {}
        for value in values:
            counts[value] = counts.get(value, 0) + 1
        
        # Return most common
        return max(counts.items(), key=lambda x: x[1])[0] if counts else None
    
    def _calculate_confidence(self, extractors: List[Dict], final_amount: float, final_type: str) -> int:
        """Calculate confidence based on extractor agreement"""
        agreements = 0
        total_extractors = len([e for e in extractors if e['amount']])
        
        if total_extractors == 0:
            return 0
        
        # Count agreements on amount
        for extractor in extractors:
            if extractor['amount'] == final_amount:
                agreements += 1
        
        # Calculate base confidence
        agreement_ratio = agreements / total_extractors
        
        if agreement_ratio >= 0.75:  # 3+ extractors agree
            return 90
        elif agreement_ratio >= 0.5:  # 2+ extractors agree
            return 70
        else:  # Low agreement
            return 40
    
    def _apply_validation_rules(self, message: str, amount: float, confidence: int) -> int:
        """Apply validation rules to adjust confidence"""
        if not amount:
            return 0
        
        # Amount range validation
        if amount < 1 or amount > 1000000:
            confidence -= 30
        
        # Bank context validation
        if not any(keyword in message.lower() for keyword in self.bank_keywords):
            confidence -= 20
        
        # Message format validation
        if len(message) < 20:  # Too short for bank SMS
            confidence -= 25
        
        return max(0, min(100, confidence))
    
    def _extract_reference(self, message: str) -> Optional[str]:
        """Extract reference ID"""
        patterns = [
            r'upi ref[:\s]*(\w+)',
            r'ref[:\s]*(\w+)',
            r'upi/(\w+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
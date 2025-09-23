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

class EnhancedConfidenceExtractor:
    def __init__(self):
        self.credit_keywords = ['credited', 'received', 'deposited', 'refund', 'cashback']
        self.debit_keywords = ['debited', 'transferred', 'paid', 'withdrawn', 'purchase']
        self.bank_keywords = ['account', 'upi', 'neft', 'rtgs', 'bank', 'atm', 'a/c']
        
        # Real message patterns from CSV analysis
        self.bank_senders = ['bobsms', 'bobtxn', 'icicit', 'hdfcmf']
        self.telecom_senders = ['jiopay', 'jiocpn', 'vicare']
        
    def classify_message(self, message_body: str, sender: str = "") -> MessageType:
        """Enhanced classification using sender and content"""
        message = message_body.lower()
        sender_lower = sender.lower()
        
        # Security alerts - highest priority
        if any(keyword in message for keyword in ['never share', 'fraud', 'suspicious', 'block', 'not you? call']):
            return MessageType.SECURITY_ALERT
            
        # OTP messages
        if ('otp' in message or 'verification' in message) and re.search(r'\d{4,6}', message):
            return MessageType.OTP
            
        # Telecom messages (enhanced with sender info)
        telecom_indicators = ['data', 'gb', 'mb', 'missed call', 'jio', 'airtel', 'vi', 'quota', 'recharge']
        if (any(keyword in message for keyword in telecom_indicators) or 
            any(sender_part in sender_lower for sender_part in self.telecom_senders)):
            return MessageType.TELECOM
            
        # Promotional messages
        if any(keyword in message for keyword in ['offer', 'discount', 'sale', 'click', 'download', 'coupon']):
            return MessageType.PROMOTIONAL
            
        # Transaction messages (enhanced with sender info)
        has_action = any(keyword in message for keyword in self.credit_keywords + self.debit_keywords)
        has_bank_context = (any(keyword in message for keyword in self.bank_keywords) or
                           any(sender_part in sender_lower for sender_part in self.bank_senders))
        has_amount = bool(re.search(r'rs\.?\s*\d+|₹\s*\d+|inr\s*\d+', message, re.IGNORECASE))
        
        if has_action and has_bank_context and has_amount:
            return MessageType.TRANSACTION
            
        return MessageType.OTHER
    
    def extract_with_confidence(self, message_body: str, sender: str = "") -> Dict:
        """Extract transaction data using 4 enhanced methods"""
        
        # Only process if it's a transaction
        if self.classify_message(message_body, sender) != MessageType.TRANSACTION:
            return {
                'is_transaction': False,
                'confidence': 0,
                'reason': 'Not classified as transaction'
            }
        
        # Run 4 enhanced extractors
        regex_result = self._enhanced_regex_extractor(message_body)
        keyword_result = self._enhanced_keyword_extractor(message_body)
        position_result = self._enhanced_position_extractor(message_body)
        context_result = self._enhanced_context_extractor(message_body, sender)
        
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
    
    def _enhanced_regex_extractor(self, message: str) -> Dict:
        """Enhanced regex using real CSV message patterns"""
        result = {'amount': None, 'type': None, 'account': None, 'confidence': 0}
        
        # Credit patterns from real messages
        credit_patterns = [
            r'rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)\s+credited',      # Rs.6000 Credited
            r'credited.*?rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)',       # credited with Rs.1000
            r'credited.*?inr\s+(\d+(?:,\d+)*(?:\.\d{2})?)',     # credited with INR 130.00
            r'account is credited.*?(\d+(?:,\d+)*(?:\.\d{2})?)', # account is credited with 1000.00
        ]
        
        # Debit patterns from real messages  
        debit_patterns = [
            r'rs\s+(\d+(?:,\d+)*(?:\.\d{2})?)\s+debited',       # Rs 40.00 debited
            r'rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)\s+transferred',   # Rs.527 transferred
            r'debited.*?rs\s+(\d+(?:,\d+)*(?:\.\d{2})?)',       # debited Rs 40.00
        ]
        
        # Try credit patterns
        for pattern in credit_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                result['amount'] = float(match.group(1).replace(',', ''))
                result['type'] = 'credit'
                result['confidence'] = 95
                break
        
        # Try debit patterns if no credit found
        if not result['amount']:
            for pattern in debit_patterns:
                match = re.search(pattern, message, re.IGNORECASE)
                if match:
                    result['amount'] = float(match.group(1).replace(',', ''))
                    result['type'] = 'debit'
                    result['confidence'] = 95
                    break
        
        # Enhanced account extraction
        account_patterns = [
            r'a/c[:\s]*\.{3}(\d{4})',           # A/c ...9212
            r'a/c[:\s]*x+(\d{4})',              # A/C XXXXXX9212
            r'from\s+a/c[:\s]*x+(\d{4})',       # from A/C XXXXXX9212
        ]
        
        for pattern in account_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                result['account'] = match.group(1)
                break
                
        return result
    
    def _enhanced_keyword_extractor(self, message: str) -> Dict:
        """Enhanced keyword-based extraction"""
        result = {'amount': None, 'type': None, 'account': None, 'confidence': 0}
        message_lower = message.lower()
        
        # Determine type by keywords with higher accuracy
        credit_score = sum(1 for word in self.credit_keywords if word in message_lower)
        debit_score = sum(1 for word in self.debit_keywords if word in message_lower)
        
        if credit_score > debit_score:
            result['type'] = 'credit'
        elif debit_score > credit_score:
            result['type'] = 'debit'
        
        # Enhanced amount extraction prioritizing transaction amounts
        amount_patterns = [
            r'(?:credited|debited|transferred).*?rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)',
            r'rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?).*?(?:credited|debited|transferred)',
            r'inr\s+(\d+(?:,\d+)*(?:\.\d{2})?)',
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                result['amount'] = float(match.group(1).replace(',', ''))
                result['confidence'] = 80
                break
                
        return result
    
    def _enhanced_position_extractor(self, message: str) -> Dict:
        """Enhanced position-based extraction"""
        result = {'amount': None, 'type': None, 'account': None, 'confidence': 0}
        
        # Find all amounts and their positions
        amounts_with_pos = []
        for match in re.finditer(r'rs\.?\s*(\d+(?:,\d+)*(?:\.\d{2})?)', message, re.IGNORECASE):
            amounts_with_pos.append((float(match.group(1).replace(',', '')), match.start()))
        
        if amounts_with_pos:
            # Find transaction keywords and their positions
            transaction_keywords = ['credited', 'debited', 'transferred']
            keyword_positions = []
            
            for keyword in transaction_keywords:
                for match in re.finditer(keyword, message, re.IGNORECASE):
                    keyword_positions.append((keyword, match.start()))
            
            # Find amount closest to transaction keyword
            best_amount = None
            best_distance = float('inf')
            best_type = None
            
            for amount, amt_pos in amounts_with_pos:
                for keyword, kw_pos in keyword_positions:
                    distance = abs(amt_pos - kw_pos)
                    if distance < best_distance and distance < 100:  # Within 100 characters
                        best_amount = amount
                        best_distance = distance
                        best_type = 'credit' if keyword == 'credited' else 'debit'
            
            if best_amount:
                result['amount'] = best_amount
                result['type'] = best_type
                result['confidence'] = 75
                
        return result
    
    def _enhanced_context_extractor(self, message: str, sender: str) -> Dict:
        """Enhanced context-based extraction using sender info"""
        result = {'amount': None, 'type': None, 'account': None, 'confidence': 0}
        
        # Bank-specific patterns based on real messages
        bank_patterns = {
            'bob': {
                'credit': r'rs\.?(\d+(?:,\d+)*(?:\.\d{2})?)\s+credited.*?bank of baroda',
                'debit': r'rs\s+(\d+(?:,\d+)*(?:\.\d{2})?)\s+debited.*?-bob'
            }
        }
        
        # Check sender for bank identification
        sender_lower = sender.lower()
        bank_identified = None
        
        if 'bob' in sender_lower:
            bank_identified = 'bob'
        
        # Use bank-specific patterns if identified
        if bank_identified and bank_identified in bank_patterns:
            patterns = bank_patterns[bank_identified]
            
            for trans_type, pattern in patterns.items():
                match = re.search(pattern, message, re.IGNORECASE)
                if match:
                    result['amount'] = float(match.group(1).replace(',', ''))
                    result['type'] = trans_type
                    result['confidence'] = 90
                    break
        
        # Fallback to general context patterns
        if not result['amount']:
            context_patterns = [
                (r'total bal:rs\.(\d+(?:,\d+)*(?:\.\d{2})?)', 'balance_indicator'),
                (r'avlbl amt:rs\.(\d+(?:,\d+)*(?:\.\d{2})?)', 'available_indicator'),
            ]
            
            # Look for transaction amount before balance indicators
            transaction_match = re.search(r'rs\.?(\d+(?:,\d+)*(?:\.\d{2})?).*?(?:credited|debited|transferred)', message, re.IGNORECASE)
            if transaction_match:
                result['amount'] = float(transaction_match.group(1).replace(',', ''))
                
                if 'credited' in message.lower():
                    result['type'] = 'credit'
                elif any(word in message.lower() for word in ['debited', 'transferred']):
                    result['type'] = 'debit'
                
                result['confidence'] = 85
                
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
        """Enhanced confidence calculation"""
        agreements = 0
        total_extractors = len([e for e in extractors if e['amount']])
        
        if total_extractors == 0:
            return 0
        
        # Count agreements on amount (with tolerance for floating point)
        for extractor in extractors:
            if extractor['amount'] and abs(extractor['amount'] - final_amount) < 0.01:
                agreements += 1
        
        # Calculate base confidence
        agreement_ratio = agreements / total_extractors
        
        if agreement_ratio >= 0.75:  # 3+ extractors agree
            return 95
        elif agreement_ratio >= 0.5:  # 2+ extractors agree
            return 80
        else:  # Low agreement
            return 50
    
    def _apply_validation_rules(self, message: str, amount: float, confidence: int) -> int:
        """Enhanced validation rules"""
        if not amount:
            return 0
        
        # Amount range validation (more realistic)
        if amount < 0.01 or amount > 10000000:  # 1 paisa to 1 crore
            confidence -= 40
        elif amount < 1 or amount > 1000000:    # Less than 1 rupee or more than 10 lakh
            confidence -= 20
        
        # Bank context validation
        bank_indicators = ['bank', 'upi', 'neft', 'rtgs', 'atm', 'a/c', '-bob', 'icici', 'hdfc', 'sbi']
        if not any(indicator in message.lower() for indicator in bank_indicators):
            confidence -= 30
        
        # Message format validation
        if len(message) < 30:  # Too short for typical bank SMS
            confidence -= 25
        
        # Reference ID presence (good indicator)
        if re.search(r'ref[:\s]*\w+|upi[:/]\w+', message, re.IGNORECASE):
            confidence += 10
        
        return max(0, min(100, confidence))
    
    def _extract_reference(self, message: str) -> Optional[str]:
        """Enhanced reference ID extraction"""
        patterns = [
            r'upi ref[:\s]*no[:\s]*(\w+)',     # UPI Ref No 556899569329
            r'upi ref[:\s]*(\w+)',             # UPI Ref:538074046613
            r'ref[:\s]*(\w+)',                 # Ref:553430571659
            r'upi[:/](\w+)',                   # UPI/453521403170
            r'thru upi[:/](\w+)',              # thru UPI/424360960073
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
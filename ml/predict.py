import fasttext
import re

class TransactionClassifier:
    def _init_(self, model_path):
        self.model = fasttext.load_model(model_path)
    
    def clean_text(self, text):
        # Improved cleaning pipeline
        text = re.sub(r'X+\d+', '[MASKED_ACCOUNT]', text)  # Mask account numbers
        text = re.sub(r'Rs\.?', 'Rs', text)               # Normalize currency
        text = re.sub(r'\b\d{10,}\b', '[MASKED_NUMBER]', text)  # Mask long numbers
        return text.strip()
    
    def predict(self, text):
        cleaned = self.clean_text(text)
        labels, confidences = self.model.predict(cleaned, k=1)  # Get top prediction
        
        # Extract clean label without _label_ prefix
        clean_label = labels[0].replace('_label_', '')
        
        return {
            'original_text': text,
            'cleaned_text': cleaned,
            'prediction': clean_label,
            'confidence': float(confidences[0]),
            'is_financial': clean_label == 'Financial'  # Direct comparison
        }

# Usage:
if __name__ == "_main_":
    classifier = TransactionClassifier('transaction_model_v2.bin')
    
    test_messages = [
        "Rs 398.00 debited from A/C XXXXXX4950 and credited to vithlaniaakash@okhdfcbank",
        "Dear Customer, You have a missed call from +911234567890",
        "Rs.190 Credited to A/c ...4950 thru UPI/466708862934",
        "Your benefit of 1GB/D expires TOMORROW. Enjoy your free benefit"
    ]
    
    for msg in test_messages:
        result = classifier.predict(msg)
        print("\n" + "="*50)
        print(f"Original: {result['original_text']}")
        print(f"Cleaned: {result['cleaned_text']}")
        print(f"Prediction: {result['prediction']} (Confidence: {result['confidence']:.2f})")
        print(f"Conclusion: {'Financial' if result['is_financial'] else 'Non-Financial'}")
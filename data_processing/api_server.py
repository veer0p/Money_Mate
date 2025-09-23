from flask import Flask, request, jsonify
from transaction_extractor import TransactionExtractor

app = Flask(__name__)

# Initialize the transaction extractor
API_BASE_URL = "http://localhost:5000/api"
extractor = TransactionExtractor(API_BASE_URL)

@app.route('/api/process-message', methods=['POST'])
def process_message():
    """Process a single message for transaction extraction"""
    try:
        data = request.get_json()
        message = data.get('message')
        
        if not message:
            return jsonify({'error': 'Message data required'}), 400
        
        # Process the message
        success = extractor.process_single_message(message)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Message processed successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to process message'
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/process-batch', methods=['POST'])
def process_batch():
    """Process batch of unprocessed messages"""
    try:
        data = request.get_json()
        limit = data.get('limit', 500)
        
        # Fetch and process messages
        messages = extractor.fetch_unprocessed_messages_with_limit(limit)
        
        if not messages:
            return jsonify({
                'message': 'No unprocessed messages found',
                'processed': 0,
                'transactions': 0
            })
        
        transactions = []
        processed_message_ids = []
        
        for message in messages:
            transaction = extractor.extract_transaction_data(message)
            if transaction:
                transactions.append(transaction)
            processed_message_ids.append(message['id'])
        
        # Save to database
        success = extractor.save_transactions(transactions, processed_message_ids)
        
        if success:
            return jsonify({
                'message': 'Processing completed successfully',
                'processed': len(messages),
                'transactions': len(transactions)
            })
        else:
            return jsonify({'error': 'Failed to save transactions'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auto-process', methods=['POST'])
def auto_process():
    """Automatically process all unprocessed messages"""
    try:
        print("🚀 Auto-processing triggered with confidence-based extraction...")
        
        # Fetch and process all unprocessed messages
        messages = extractor.fetch_unprocessed_messages_with_limit(1000)  # Process up to 1000
        
        if not messages:
            print("No unprocessed messages found")
            return jsonify({
                'message': 'No unprocessed messages found',
                'processed': 0,
                'transactions': 0
            })
        
        transactions = []
        processed_message_ids = []
        
        for message in messages:
            transaction = extractor.extract_transaction_data(message)
            if transaction:
                transactions.append(transaction)
            processed_message_ids.append(message['id'])
        
        # Save to database
        success = extractor.save_transactions(transactions, processed_message_ids)
        
        result = {
            'message': 'Auto-processing completed',
            'processed': len(messages),
            'transactions': len(transactions)
        }
        
        print(f"Auto-processing result: {result}")
        return jsonify(result)
            
    except Exception as e:
        print(f"Auto-processing error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    print("Starting transaction processing API server...")
    app.run(host='0.0.0.0', port=3001, debug=True)
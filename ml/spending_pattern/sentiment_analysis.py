from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Load sentiment analysis model
sentiment_analyzer = pipeline('sentiment-analysis')

@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    data = request.json
    message = data['message']
    
    # Analyze sentiment
    result = sentiment_analyzer(message)[0]
    return jsonify({
        'sentiment': result['label'],
        'score': result['score']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
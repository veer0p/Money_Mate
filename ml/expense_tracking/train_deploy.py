import pandas as pd
import re
import joblib
from flask import Flask, request, jsonify
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report

# Predefined categories and their associated sender keywords
categories = {
    "Banking": ["BOBTXN", "BOBSMS", "ICICIT", "SBIUPI", "HDFCBK"],
    "Shopping": ["AJIO", "FLIPKART", "AMAZON", "SWIGGY", "ZOMATO"],
    "Entertainment": ["INOX", "PVR", "HOTSTAR", "NETFLIX"],
    "Transport": ["UBER", "OLA", "TRAIND", "RAPIDO"],
    "Government": ["AADHAAR", "RBISAY", "GOVT"],
    "Other": []  # Fallback category
}

# Step 1: Load and preprocess the dataset
def load_and_preprocess_data(filepath):
    try:
        df = pd.read_csv(filepath)

        # Categorization function
        def categorize_message(sender, text):
            text = text.lower()
            sender = str(sender).upper()

            # Define OTP keywords and pattern
            otp_keywords = r'\b(otp|verification code|password|pin)\b'
            otp_pattern = r'\b\d{4,6}\b'  # Detects 4-6 digit numeric OTPs

            # Check if sender is a numeric ID (e.g., in scientific notation)
            if re.match(r'^\d+(\.\d+E\+\d+)?$', sender, re.IGNORECASE):
                if re.search(otp_keywords, text) or re.search(otp_pattern, text):
                    return 'OTP'
                else:
                    return 'Chat'

            # Check sender against predefined categories
            for category, keywords in categories.items():
                for keyword in keywords:
                    if keyword in sender:
                        return category

            # Fallback to "Other" if no match is found
            return 'Other'

        df['label'] = df.apply(lambda row: categorize_message(str(row['sender']), row['message_body']), axis=1)

        # Clean text
        def clean_text(text):
            text = text.lower()
            text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
            text = re.sub(r'\d+', '', text)      # Remove numbers
            return text

        df['cleaned_message'] = df['message_body'].apply(clean_text)

        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

# Step 2: Train the model
def train_model(df):
    try:
        X_train, X_test, y_train, y_test = train_test_split(df['cleaned_message'], df['label'], test_size=0.2, random_state=42)

        vectorizer = TfidfVectorizer(max_features=5000)
        X_train_tfidf = vectorizer.fit_transform(X_train)
        X_test_tfidf = vectorizer.transform(X_test)

        model = MultinomialNB()
        model.fit(X_train_tfidf, y_train)

        y_pred = model.predict(X_test_tfidf)
        print("Accuracy:", accuracy_score(y_test, y_pred))
        print("Classification Report:\n", classification_report(y_test, y_pred))

        return model, vectorizer
    except Exception as e:
        print(f"Error training model: {e}")
        return None, None

# Step 3: Save model and vectorizer
def save_model_and_vectorizer(model, vectorizer, model_path, vectorizer_path):
    try:
        joblib.dump(model, model_path)
        joblib.dump(vectorizer, vectorizer_path)
        print(f"Model saved to {model_path}")
        print(f"Vectorizer saved to {vectorizer_path}")
    except Exception as e:
        print(f"Error saving model: {e}")

# Step 4: Deploy model with Flask API
def deploy_model(model_path, vectorizer_path):
    app = Flask(__name__)

    try:
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
    except Exception as e:
        print(f"Error loading model or vectorizer: {e}")
        return

    # Clean text function
    def clean_text(text):
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
        text = re.sub(r'\d+', '', text)      # Remove numbers
        return text

    # Categorization function
    def categorize_message(sender, text):
        text = text.lower()
        sender = str(sender).upper()

        # Define OTP keywords and pattern
        otp_keywords = r'\b(otp|verification code|password|pin)\b'
        otp_pattern = r'\b\d{4,6}\b'  # Detects 4-6 digit numeric OTPs

        # Check if sender is a numeric ID (e.g., in scientific notation)
        if re.match(r'^\d+(\.\d+E\+\d+)?$', sender, re.IGNORECASE):
            if re.search(otp_keywords, text) or re.search(otp_pattern, text):
                return 'OTP'
            else:
                return 'Chat'

        # Check sender against predefined categories
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in sender:
                    return category

        # Fallback to "Other" if no match is found
        return 'Other'

    @app.route('/predict', methods=['POST'])
    def predict():
        try:
            data = request.get_json()

            if not data or 'message_body' not in data or 'sender' not in data:
                return jsonify({"error": "Missing 'sender' or 'message_body' key in request"}), 400

            sender = str(data['sender'])
            message = data['message_body']

            # Categorize the message
            category = categorize_message(sender, message)

            return jsonify({'id': data.get('id', ''), 'category': category})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    print("Model API is running at http://localhost:5000/predict")
    app.run(host='0.0.0.0', port=5000)

# Main execution
if __name__ == '__main__':
    data_file = r'D:\Money_Mate\ml\exported_data\messages_export.csv'
    model_file = 'finance_classifier.pkl'
    vectorizer_file = 'tfidf_vectorizer.pkl'

    df = load_and_preprocess_data(data_file)
    if df is not None:
        model, vectorizer = train_model(df)
        if model and vectorizer:
            save_model_and_vectorizer(model, vectorizer, model_file, vectorizer_file)
            deploy_model(model_file, vectorizer_file)
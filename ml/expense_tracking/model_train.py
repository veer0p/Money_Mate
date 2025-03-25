import pandas as pd
import re
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report
import joblib
from flask import Flask, request, jsonify

# Step 1: Load and preprocess the dataset
def load_and_preprocess_data(filepath):
    # Load dataset
    df = pd.read_csv(filepath)

    # Add a label column (finance or non-finance)
    df['label'] = df['message_body'].apply(lambda x: 'finance' if re.search(r'\$|bank|payment|transaction', x, re.IGNORECASE) else 'non-finance')

    # Clean and preprocess text
    def clean_text(text):
        text = text.lower()  # Convert to lowercase
        text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
        text = re.sub(r'\d+', '', text)  # Remove numbers
        return text

    df['cleaned_message'] = df['message_body'].apply(clean_text)

    return df

# Step 2: Train the model
def train_model(df):
    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(df['cleaned_message'], df['label'], test_size=0.2, random_state=42)

    # Convert text to numerical features using TF-IDF
    vectorizer = TfidfVectorizer(max_features=5000)
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    # Train a Naive Bayes classifier
    model = MultinomialNB()
    model.fit(X_train_tfidf, y_train)

    # Evaluate the model
    y_pred = model.predict(X_test_tfidf)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("Classification Report:\n", classification_report(y_test, y_pred))

    return model, vectorizer

# Step 3: Save the model and vectorizer
def save_model_and_vectorizer(model, vectorizer, model_path, vectorizer_path):
    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)
    print(f"Model saved to {model_path}")
    print(f"Vectorizer saved to {vectorizer_path}")

# Step 4: Deploy the model as a Flask API
def deploy_model(model_path, vectorizer_path):
    app = Flask(__name__)

    # Load the model and vectorizer
    model = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)

    # Preprocess function
    def clean_text(text):
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\d+', '', text)
        return text

    @app.route('/predict', methods=['POST'])
    def predict():
        data = request.json
        message = data['message']
        
        # Clean and vectorize the message
        cleaned_message = clean_text(message)
        message_tfidf = vectorizer.transform([cleaned_message])
        
        # Predict the category
        category = model.predict(message_tfidf)[0]
        
        return jsonify({'category': category})

    print("Model API is running at http://localhost:5000/predict")
    app.run(host='0.0.0.0', port=5000)

# Main function
if __name__ == '__main__':
    # Filepaths
    data_file = r'D:\Money_Mate\ml\exported_data\messages_export.csv'
    model_file = 'finance_classifier.pkl'
    vectorizer_file = 'tfidf_vectorizer.pkl'

    # Step 1: Load and preprocess data
    df = load_and_preprocess_data(data_file)

    # Step 2: Train the model
    model, vectorizer = train_model(df)

    # Step 3: Save the model and vectorizer
    save_model_and_vectorizer(model, vectorizer, model_file, vectorizer_file)

    # Step 4: Deploy the model
    deploy_model(model_file, vectorizer_file)
import pandas as pd
import numpy as np
import torch
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import LabelEncoder
from transformers import pipeline

# ✅ Check if GPU is available
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🚀 Using device: {device}")

# ✅ Load CSV File (Update with actual path)
csv_file_path ="D:\Money_Mate\ml\exported_data\messages_export.csv"
df = pd.read_csv(csv_file_path, dtype={"sender": str})

# ✅ Ensure required columns exist
if "sender" not in df.columns or "message_body" not in df.columns:
    raise ValueError("CSV file must contain 'sender' and 'message_body' columns")

# ✅ Define OTP-related keywords & regex pattern for OTP detection
otp_keywords = ["OTP", "one-time password", "verification code", "security code", "auth code"]
otp_pattern = r"\b\d{6}\b"  # Detects 6-digit numeric OTPs

# ✅ Function to categorize messages as OTP or Chat
def categorize_message(msg):
    msg_upper = str(msg).upper()
    if any(keyword in msg_upper for keyword in otp_keywords) or re.search(otp_pattern, msg_upper):
        return "OTP"
    return "Chat"

# ✅ Categorize messages
df["Message_Type"] = df["message_body"].apply(categorize_message)

# ✅ Function to check if sender is a number
def is_number(sender):
    return sender.isdigit()

# ✅ Categorize sender based on type
df["Sender_Type"] = df["sender"].apply(lambda x: "Number" if is_number(x) else "Text")

# ✅ If sender is a number → Use message-based categorization
df.loc[df["Sender_Type"] == "Number", "Category"] = df["Message_Type"]

# ✅ Define Expense Categories
categories = {
    "Banking": ["BOBTXN", "BOBSMS", "ICICIT", "SBIUPI", "HDFCBK"],
    "Shopping": ["AJIO", "FLIPKART", "AMAZON", "SWIGGY", "ZOMATO"],
    "Entertainment": ["INOX", "PVR", "HOTSTAR", "NETFLIX"],
    "Transport": ["UBER", "OLA", "TRAIND", "RAPIDO"],
    "Government": ["AADHAAR", "RBISAY", "GOVT"],
    "Other": []
}

# ✅ Function to categorize sender using keyword matching
def categorize_sender(sender):
    sender_upper = sender.upper()
    for category, keywords in categories.items():
        if any(keyword in sender_upper for keyword in keywords):
            return category
    return "Other"

# ✅ Apply sender categorization for text-based senders
df.loc[df["Sender_Type"] == "Text", "Category"] = df["sender"].apply(categorize_sender)

# ✅ Encode Labels
label_encoder = LabelEncoder()
df["Category_Encoded"] = label_encoder.fit_transform(df["Category"])

# ✅ Train Machine Learning Model (TF-IDF + Logistic Regression)
model = make_pipeline(
    TfidfVectorizer(max_features=1000),  # Text feature extraction
    LogisticRegression(max_iter=200)
)
model.fit(df["message_body"], df["Category_Encoded"])  # Train on message content

# ✅ Load Pre-trained AI Model (DistilBERT on GPU)
nlp = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device=0 if device == "cuda" else -1)

# ✅ Function to classify sender using AI
def classify_with_ai(sender):
    result = nlp(sender, candidate_labels=list(categories.keys()))
    return result["labels"][0]  # Highest probability category

# ✅ Apply AI Model (GPU Accelerated)
df["AI_Category"] = df["sender"].apply(classify_with_ai)

# ✅ Save Categorized Data to CSV
output_file = "my_data2.csv"
df.to_csv(output_file, index=False)
print(f"✅ Categorized data saved to {output_file}")

# ✅ Predict New Sender Category
test_sender = ["JM-BOBTXN"]
predicted_category = label_encoder.inverse_transform(model.predict(test_sender))
ai_category = classify_with_ai(test_sender[0])

print(df["Category"].value_counts())
print(f"🤖 Predicted (ML): {predicted_category[0]}")
print(f"🚀 Predicted (AI): {ai_category}")

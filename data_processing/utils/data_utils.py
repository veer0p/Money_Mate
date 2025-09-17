import pandas as pd
import numpy as np
from typing import Dict, List
from datetime import datetime
import uuid

def calculate_category_totals(df: pd.DataFrame) -> Dict[str, float]:
    """
    Calculate total amount spent per category
    """
    return df.groupby('category')['amount'].sum().to_dict()

def generate_insights(category_totals: Dict[str, float]) -> List[str]:
    """
    Generate insights based on category totals
    """
    insights = []
    
    # Calculate total spending
    total_spending = sum(category_totals.values())
    
    if total_spending > 0:
        # Find top spending category
        top_category = max(category_totals.items(), key=lambda x: x[1])
        insights.append(f"Your highest spending category is {top_category[0]} with ${top_category[1]:.2f}")
        
        # Calculate percentage of total spending for each category
        for category, amount in category_totals.items():
            percentage = (amount / total_spending) * 100
            insights.append(f"{category}: {percentage:.1f}% of total spending")
    
    return insights

def clean_transaction_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and preprocess transaction data
    """
    # Remove duplicates
    df = df.drop_duplicates()
    
    # Handle missing values
    df['category'] = df['category'].fillna('Uncategorized')
    df['amount'] = df['amount'].fillna(0)
    
    # Convert date to datetime if it's not already
    if not pd.api.types.is_datetime64_any_dtype(df['date']):
        df['date'] = pd.to_datetime(df['date'])
    
    return df

def detect_anomalies(df: pd.DataFrame, threshold: float = 2.0) -> pd.DataFrame:
    """
    Detect anomalous transactions using z-score
    """
    df['z_score'] = np.abs((df['amount'] - df['amount'].mean()) / df['amount'].std())
    anomalies = df[df['z_score'] > threshold]
    return anomalies

def calculate_spend_by_category(data: pd.DataFrame) -> List[Dict]:
    """
    Calculate total spend by category for each user
    """
    insights = []
    spend_by_category = data.groupby(["user_id", "name"])["amount"].sum().reset_index()
    
    for _, row in spend_by_category.iterrows():
        insights.append({
            "id": str(uuid.uuid4()),
            "user_id": row["user_id"],
            "metric_type": "total_spend_by_category",
            "metric_value": float(row["amount"]),
            "category_name": row["name"],
            "created_at": datetime.now()
        })
    
    return insights

def calculate_avg_transaction(data: pd.DataFrame) -> List[Dict]:
    """
    Calculate average transaction amount per user
    """
    insights = []
    avg_transaction = data.groupby("user_id")["amount"].mean().reset_index()
    
    for _, row in avg_transaction.iterrows():
        insights.append({
            "id": str(uuid.uuid4()),
            "user_id": row["user_id"],
            "metric_type": "avg_transaction_amount",
            "metric_value": float(row["amount"]),
            "category_name": None,
            "created_at": datetime.now()
        })
    
    return insights

def calculate_latest_balance(data: pd.DataFrame) -> List[Dict]:
    """
    Calculate latest balance for each user
    """
    insights = []
    latest_balance = data.groupby("user_id")["account_balance"].last().reset_index()
    
    for _, row in latest_balance.iterrows():
        insights.append({
            "id": str(uuid.uuid4()),
            "user_id": row["user_id"],
            "metric_type": "latest_balance",
            "metric_value": float(row["account_balance"]) if pd.notnull(row["account_balance"]) else 0.0,
            "category_name": None,
            "created_at": datetime.now()
        })
    
    return insights 
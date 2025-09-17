# import pandas as pd
# import numpy as np
# from datetime import datetime, timedelta
# import sys
# import os
# from pathlib import Path
# import psycopg2
# from psycopg2.extras import execute_values
# from dotenv import load_dotenv
# import uuid
# from sqlalchemy import create_engine
# import pytz

# # Load environment variables
# load_dotenv()

# # Database configuration with defaults
# DB_NAME = os.getenv("DB_NAME", "moneymate")
# DB_USER = os.getenv("DB_USER", "postgres")
# DB_PASS = os.getenv("DB_PASS", "postgres")
# DB_HOST = os.getenv("DB_HOST", "localhost")
# DB_PORT = os.getenv("DB_PORT", "5432")  # Default PostgreSQL port

# # Create database connection for psycopg2
# def get_db_connection():
#     try:
#         return psycopg2.connect(
#             dbname=DB_NAME,
#             user=DB_USER,
#             password=DB_PASS,
#             host=DB_HOST,
#             port=DB_PORT
#         )
#     except Exception as e:
#         print(f"Error connecting to database: {str(e)}")
#         raise

# # Create SQLAlchemy engine for pandas
# def get_sqlalchemy_engine():
#     try:
#         return create_engine(f'postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')
#     except Exception as e:
#         print(f"Error creating SQLAlchemy engine: {str(e)}")
#         raise

# def create_insight_row(insight_type, date_or_month=None, account_number=None, category=None,
#                       amount=None, income=None, expense=None, balance=None, notes=None, user_id=None,
#                       is_alert=False, alert_severity=None):
#     """Create a standardized insight row"""
#     return {
#         "id": str(uuid.uuid4()),  # Generate UUID for each insight
#         "insight_type": insight_type,
#         "date_or_month": date_or_month,
#         "account_number": account_number,
#         "category": category,
#         "amount": amount,
#         "income": income,
#         "expense": expense,
#         "balance": balance,
#         "notes": notes,
#         "user_id": user_id,
#         "is_alert": is_alert,
#         "alert_severity": alert_severity,
#         "alert_resolved": False
#     }

# def analyze_spending_patterns(transactions, user_id):
#     """Analyze spending patterns and habits"""
#     insights = []
    
#     # Convert transaction date to datetime
#     transactions['transaction_date'] = pd.to_datetime(transactions['transaction_date'])
#     transactions['day_of_week'] = transactions['transaction_date'].dt.day_name()
#     transactions['hour_of_day'] = transactions['transaction_date'].dt.hour
    
#     # Most active spending days
#     day_patterns = transactions[transactions['transaction_type'] == 'debit'] \
#         .groupby('day_of_week')['amount'].sum().sort_values(ascending=False)
    
#     # Most active spending hours
#     hour_patterns = transactions[transactions['transaction_type'] == 'debit'] \
#         .groupby('hour_of_day')['amount'].sum().sort_values(ascending=False)
    
#     for day, amount in day_patterns.head(3).items():
#         insights.append(create_insight_row(
#             "prediction",
#             date_or_month=day,
#             amount=amount,
#             notes=f"Top spending day",
#             user_id=user_id
#         ))
    
#     for hour, amount in hour_patterns.head(3).items():
#         insights.append(create_insight_row(
#             "prediction",
#             date_or_month=f"{hour}:00",
#             amount=amount,
#             notes=f"Peak spending hour",
#             user_id=user_id
#         ))
    
#     return insights

# def calculate_financial_health(transactions, user_id):
#     """Calculate financial health metrics"""
#     insights = []
    
#     # Convert transaction date to datetime if not already
#     transactions['transaction_date'] = pd.to_datetime(transactions['transaction_date'])
    
#     # Ensure timezone is UTC
#     if transactions['transaction_date'].dt.tz is None:
#         transactions['transaction_date'] = transactions['transaction_date'].dt.tz_localize('UTC')
#     else:
#         transactions['transaction_date'] = transactions['transaction_date'].dt.tz_convert('UTC')
    
#     # Convert to monthly periods
#     transactions['month'] = transactions['transaction_date'].dt.strftime('%Y-%m')
    
#     # Monthly Income vs Expenses
#     monthly_summary = transactions.groupby(['month', 'transaction_type'])['amount'].sum().unstack()
#     monthly_summary['savings_rate'] = (monthly_summary.get('credit', 0) - monthly_summary.get('debit', 0)) / monthly_summary.get('credit', 1)
    
#     # Emergency Fund Analysis
#     monthly_expenses = transactions[transactions['transaction_type'] == 'debit']['amount'].mean()
#     current_balance = transactions['account_balance'].iloc[-1]
#     emergency_fund_months = current_balance / monthly_expenses if monthly_expenses > 0 else 0
    
#     insights.append(create_insight_row(
#         "health",
#         amount=monthly_summary['savings_rate'].mean(),
#         notes=f"Average monthly savings rate",
#         user_id=user_id
#     ))
    
#     insights.append(create_insight_row(
#         "health",
#         balance=current_balance,
#         notes=f"Emergency fund covers {emergency_fund_months:.1f} months of expenses",
#         user_id=user_id
#     ))
    
#     return insights

# def identify_savings_opportunities(transactions, categories, user_id):
#     """Identify potential areas for savings"""
#     insights = []
    
#     # Merge transactions with categories
#     data = transactions.merge(categories, left_on='category_id', right_on='id', how='left')
    
#     # Calculate category-wise spending
#     category_spending = data[data['transaction_type'] == 'debit'] \
#         .groupby('name')['amount'].sum().sort_values(ascending=False)
    
#     # Top spending categories
#     for category, amount in category_spending.head(5).items():
#         insights.append(create_insight_row(
#             "suggestion",
#             category=category,
#             amount=amount,
#             notes="Consider reviewing expenses in this category",
#             user_id=user_id
#         ))
    
#     return insights

# def generate_basic_insights(transactions, categories, user_id):
#     """Generate basic financial insights"""
#     insights = []
    
#     # Convert transaction date to datetime if not already
#     transactions['transaction_date'] = pd.to_datetime(transactions['transaction_date'])
    
#     # Ensure timezone is UTC
#     if transactions['transaction_date'].dt.tz is None:
#         transactions['transaction_date'] = transactions['transaction_date'].dt.tz_localize('UTC')
#     else:
#         transactions['transaction_date'] = transactions['transaction_date'].dt.tz_convert('UTC')
    
#     # Convert to monthly periods
#     transactions['month'] = transactions['transaction_date'].dt.strftime('%Y-%m')
    
#     # 1. Monthly Spend Summary
#     monthly_spend = transactions[transactions['transaction_type'] == 'debit'] \
#         .groupby('month')['amount'].sum().reset_index()
#     for _, row in monthly_spend.iterrows():
#         insights.append(create_insight_row(
#             "comparison",
#             date_or_month=str(row['month']),
#             amount=row['amount'],
#             user_id=user_id
#         ))
    
#     # 2. Income vs Expense
#     grouped = transactions.groupby(['month', 'transaction_type'])['amount'].sum().unstack(fill_value=0).reset_index()
#     for _, row in grouped.iterrows():
#         net_savings = row.get('credit', 0) - row.get('debit', 0)
#         insights.append(create_insight_row(
#             "comparison",
#             date_or_month=str(row['month']),
#             income=row.get('credit'),
#             expense=row.get('debit'),
#             notes=f"Net Savings: {net_savings:.2f}",
#             user_id=user_id
#         ))
    
#     return insights

# def generate_alerts(insights, user_id):
#     """Generate real-time alerts based on insights"""
#     alerts = []
    
#     # Check for unusual spending patterns
#     for insight in insights:
#         if insight['insight_type'] == 'prediction' and insight['amount'] is not None:
#             if float(insight['amount']) > 1000:  # Threshold for unusual spending
#                 alerts.append(create_insight_row(
#                     "alert",  # Changed to match enum type
#                     date_or_month=insight['date_or_month'],
#                     amount=insight['amount'],
#                     notes=f"Unusually high spending detected on {insight['date_or_month']}",
#                     user_id=user_id,
#                     is_alert=True,
#                     alert_severity="high"
#                 ))
    
#     # Check for low balance alerts
#     for insight in insights:
#         if insight['insight_type'] == 'health' and insight.get('balance') is not None:
#             try:
#                 balance = float(insight['balance'])
#                 if balance < 1000:  # Low balance threshold
#                     alerts.append(create_insight_row(
#                         "alert",  # Changed to match enum type
#                         balance=balance,
#                         notes="Account balance is below recommended minimum",
#                         user_id=user_id,
#                         is_alert=True,
#                         alert_severity="medium"
#                     ))
#             except (ValueError, TypeError):
#                 print(f"Warning: Invalid balance value in insight: {insight['balance']}")
#                 continue
    
#     return alerts

# def save_insights_to_db(insights):
#     """Save insights to database"""
#     conn = get_db_connection()
#     try:
#         with conn.cursor() as cur:
#             # Convert numpy types to Python native types
#             insert_query = """
#                 INSERT INTO financial_insights 
#                 (id, insight_type, date_or_month, account_number, category, 
#                  amount, income, expense, balance, notes, user_id, created_at,
#                  updated_at, is_alert, alert_severity, alert_resolved)
#                 VALUES %s
#             """
            
#             current_time = datetime.now()
#             data = []
#             for insight in insights:
#                 data.append((
#                     str(insight['id']),
#                     insight['insight_type'],
#                     insight['date_or_month'],
#                     insight['account_number'],
#                     insight['category'],
#                     float(insight['amount']) if insight['amount'] is not None else None,
#                     float(insight['income']) if insight['income'] is not None else None,
#                     float(insight['expense']) if insight['expense'] is not None else None,
#                     float(insight['balance']) if insight['balance'] is not None else None,
#                     insight['notes'],
#                     str(insight['user_id']),
#                     current_time,  # created_at
#                     current_time,  # updated_at
#                     insight.get('is_alert', False),
#                     insight.get('alert_severity'),
#                     insight.get('alert_resolved', False)
#                 ))
            
#             execute_values(cur, insert_query, data)
#             conn.commit()
#             print(f"Successfully saved {len(insights)} insights to database")
            
#     except Exception as e:
#         conn.rollback()
#         print(f"Error saving insights to database: {str(e)}")
#         raise
#     finally:
#         conn.close()

# def delete_old_insights():
#     """Delete all existing insights from the database"""
#     conn = get_db_connection()
#     try:
#         with conn.cursor() as cur:
#             cur.execute("DELETE FROM financial_insights")
#             conn.commit()
#             print("Successfully deleted old insights")
#     except Exception as e:
#         conn.rollback()
#         print(f"Error deleting old insights: {str(e)}")
#         raise
#     finally:
#         conn.close()

# def process_insights():
#     """Main function to process all insights"""
#     try:
#         print("Loading data from database...")
        
#         # Use SQLAlchemy engine for pandas operations
#         engine = get_sqlalchemy_engine()
#         try:
#             transactions = pd.read_sql("SELECT * FROM transactions", engine)
#             categories = pd.read_sql("SELECT * FROM categories", engine)
#             users = pd.read_sql("SELECT * FROM users", engine)
#         except Exception as e:
#             print(f"Error reading data from database: {str(e)}")
#             raise
        
#         print(f"Found {len(transactions)} transactions, {len(categories)} categories, and {len(users)} users")
        
#         # Delete old insights before generating new ones
#         print("Deleting old insights...")
#         delete_old_insights()
        
#         # Generate insights for each user
#         all_insights = []
#         for _, user in users.iterrows():
#             user_id = user['id']
#             user_transactions = transactions[transactions['user_id'] == user_id]
            
#             if len(user_transactions) > 0:
#                 # Basic insights
#                 user_insights = generate_basic_insights(user_transactions, categories, user_id)
                
#                 # Advanced insights
#                 user_insights.extend(analyze_spending_patterns(user_transactions, user_id))
#                 user_insights.extend(calculate_financial_health(user_transactions, user_id))
#                 user_insights.extend(identify_savings_opportunities(user_transactions, categories, user_id))
                
#                 # Generate real-time alerts
#                 alerts = generate_alerts(user_insights, user_id)
#                 user_insights.extend(alerts)
                
#                 all_insights.extend(user_insights)
        
#         # Save insights to database using psycopg2
#         save_insights_to_db(all_insights)
        
#         # Also save to CSV for backup/analysis
#         insights_df = pd.DataFrame(all_insights)
#         output_file = "financial_insights.csv"
#         insights_df.to_csv(output_file, index=False)
        
#         print(f"Successfully generated {len(all_insights)} insights")
#         print(f"Backup CSV saved to {output_file}")
        
#     except Exception as e:
#         print(f"Error processing insights: {str(e)}")
#         raise

# if __name__ == "__main__":
#     process_insights() 
import os
import sys
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
from decimal import Decimal
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Database configuration
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Create database connection
def get_db_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )

def calculate_actual_balance(user_id):
    """
    Calculate the actual balance by summing all transactions.
    
    Args:
        user_id (str): The UUID of the user
        
    Returns:
        Decimal: The calculated actual balance
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Get all transactions
            cur.execute("""
                SELECT 
                    transaction_type,
                    amount
                FROM transactions
                WHERE user_id = %s
                ORDER BY transaction_date ASC
            """, (user_id,))
            
            # Calculate balance from transactions
            balance = Decimal('0.00')
            for row in cur.fetchall():
                amount = Decimal(str(row[1]))
                if row[0] == 'credit':
                    balance += amount
                else:
                    balance -= amount
            
            return balance
    finally:
        conn.close()

def update_actual_balance(user_id, new_balance):
    """
    Update the user's actual balance in the database.
    
    Args:
        user_id (str): The UUID of the user
        new_balance (Decimal): The new actual balance
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE users 
                SET account_balance = %s
                WHERE id = %s
            """, (new_balance, user_id))
            conn.commit()
    finally:
        conn.close()

def process_all_users():
    """
    Process all users and update their actual balances.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Get all active users
            cur.execute("SELECT id, first_name, last_name FROM users WHERE is_deleted = false")
            users = cur.fetchall()
            
            print(f"\nFound {len(users)} users to process")
            
            for user in users:
                print(f"\n{'='*50}")
                print(f"Processing User: {user[1]} {user[2]} (ID: {user[0]})")
                
                # Calculate actual balance
                actual_balance = calculate_actual_balance(user[0])
                print(f"Calculated actual balance: {actual_balance}")
                
                # Update user's balance
                update_actual_balance(user[0], actual_balance)
                print(f"Updated balance in database")
                
            print(f"\n{'='*50}")
            print("Balance calculation completed successfully!")
            
    finally:
        conn.close()

if __name__ == "__main__":
    process_all_users() 
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

def get_savings_status(user_id):
    """
    Get comprehensive savings status including actual and available balances.
    
    Args:
        user_id (str): The UUID of the user
        
    Returns:
        dict: Dictionary containing savings status
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Get account balance and savings percentage
            cur.execute("""
                SELECT account_balance, savings_percentage 
                FROM users 
                WHERE id = %s
            """, (user_id,))
            result = cur.fetchone()
            actual_balance = result[0] or Decimal('0.00')
            savings_percentage = result[1] or Decimal('20.00')

            # Calculate total savings amount
            total_savings = (actual_balance * savings_percentage) / Decimal('100.00')

            # Get saving goals
            cur.execute("""
                SELECT 
                    id,
                    title,
                    goal_amount,
                    saved_amount,
                    status,
                    start_date,
                    end_date
                FROM saving_goals
                WHERE user_id = %s 
                AND is_delete = false
                AND status IN ('upcoming', 'in_progress')
                ORDER BY end_date ASC
            """, (user_id,))
            goals = []
            total_allocated = Decimal('0.00')
            active_goals = []
            
            for row in cur.fetchall():
                goal = {
                    'id': row[0],
                    'title': row[1],
                    'goal_amount': row[2],
                    'saved_amount': row[3],
                    'status': row[4],
                    'start_date': row[5],
                    'end_date': row[6]
                }
                goals.append(goal)
                if goal['status'] in ['upcoming', 'in_progress']:
                    total_allocated += Decimal(str(goal['saved_amount']))
                    active_goals.append(goal)

            # Calculate available balance
            available_balance = actual_balance - total_allocated

            return {
                "actual_balance": actual_balance,
                "savings_percentage": savings_percentage,
                "total_savings": total_savings,
                "total_allocated": total_allocated,
                "available_balance": available_balance,
                "goals": goals,
                "active_goals": active_goals
            }
    finally:
        conn.close()

def distribute_savings(user_id, total_savings, active_goals):
    """
    Distribute savings amount evenly among active goals.
    
    Args:
        user_id (str): The UUID of the user
        total_savings (Decimal): Total amount to distribute
        active_goals (list): List of active saving goals
    """
    if not active_goals:
        return

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Calculate amount per goal
            amount_per_goal = total_savings / Decimal(str(len(active_goals)))

            # Update each goal's saved amount
            for goal in active_goals:
                new_saved_amount = Decimal(str(goal['saved_amount'])) + amount_per_goal
                
                # Don't exceed goal amount
                if new_saved_amount > Decimal(str(goal['goal_amount'])):
                    new_saved_amount = Decimal(str(goal['goal_amount']))
                
                cur.execute("""
                    UPDATE saving_goals 
                    SET saved_amount = %s,
                        status = CASE 
                            WHEN %s >= goal_amount THEN 'archived'
                            ELSE status
                        END
                    WHERE id = %s
                """, (new_saved_amount, new_saved_amount, goal['id']))
            
            conn.commit()
    finally:
        conn.close()

def update_available_balance(user_id, new_available_balance):
    """
    Update the user's available balance in the database.
    
    Args:
        user_id (str): The UUID of the user
        new_available_balance (Decimal): The new available balance
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE users 
                SET available_balance = %s
                WHERE id = %s
            """, (new_available_balance, user_id))
            conn.commit()
    finally:
        conn.close()

def process_all_users():
    """
    Process all users and update their savings status.
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
                
                # Get savings status
                savings_status = get_savings_status(user[0])
                print(f"Current balance: {savings_status['actual_balance']}")
                print(f"Available balance: {savings_status['available_balance']}")
                
                # Distribute savings
                distribute_savings(user[0], savings_status['total_savings'], savings_status['active_goals'])
                
                # Update available balance
                update_available_balance(user[0], savings_status['available_balance'])
                print(f"Updated available balance in database")
                
            print(f"\n{'='*50}")
            print("Savings tracking completed successfully!")
            
    finally:
        conn.close()

if __name__ == "__main__":
    process_all_users() 
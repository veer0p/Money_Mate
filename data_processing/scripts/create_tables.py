import os
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv()

# Database configuration
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

def create_tables():
    """Create necessary database tables"""
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )
    
    try:
        with conn.cursor() as cur:
            # Create financial_insights table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS financial_insights (
                    id UUID PRIMARY KEY,
                    insight_type VARCHAR(100) NOT NULL,
                    date_or_month VARCHAR(20),
                    account_number VARCHAR(50),
                    category VARCHAR(100),
                    amount DECIMAL(12,2),
                    income DECIMAL(12,2),
                    expense DECIMAL(12,2),
                    balance DECIMAL(12,2),
                    notes TEXT,
                    user_id UUID NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            
            # Create index on user_id for faster queries
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_financial_insights_user_id 
                ON financial_insights(user_id)
            """)
            
            conn.commit()
            print("Successfully created financial_insights table")
            
    except Exception as e:
        conn.rollback()
        print(f"Error creating tables: {str(e)}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    create_tables() 
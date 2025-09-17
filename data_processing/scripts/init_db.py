from config.db_config import engine
from models.base import Base
from data_processing.models.insights_1 import FinancialInsight
from models.user import User

def init_db():
    """Initialize database tables"""
    try:
        # Create all tables in the correct order
        Base.metadata.create_all(bind=engine)
        print("Successfully created database tables")
    except Exception as e:
        print(f"Error creating database tables: {str(e)}")
        raise

if __name__ == "__main__":
    init_db() 
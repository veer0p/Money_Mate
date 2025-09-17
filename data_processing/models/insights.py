from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .base import Base

class FinancialInsight(Base):
    __tablename__ = "financial_insights"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    insight_type = Column(String, nullable=False)
    date_or_month = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    category = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    income = Column(Float, nullable=True)
    expense = Column(Float, nullable=True)
    balance = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    # created_at = Column(DateTime, default=datetime.now)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Define the relationship
    user = relationship("User", back_populates="financial_insights") 
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class TransactionType(enum.Enum):
    CREDIT = 'credit'
    DEBIT = 'debit'

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    category_id = Column(String, ForeignKey('categories.id'))
    account_number = Column(String(50), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default='INR')
    account_balance = Column(Numeric(12, 2))
    transaction_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False) 
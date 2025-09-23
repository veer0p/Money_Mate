-- Update empty categories based on transaction descriptions
UPDATE transactions 
SET category = CASE 
    WHEN transaction_type = 'debit' AND description LIKE '%UPI%' THEN 'Transfer'
    WHEN transaction_type = 'credit' AND description LIKE '%UPI%' THEN 'Income'
    WHEN transaction_type = 'debit' THEN 'Expense'
    WHEN transaction_type = 'credit' THEN 'Income'
    ELSE 'Other'
END
WHERE category IS NULL OR category = '';
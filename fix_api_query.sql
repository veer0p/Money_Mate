-- Replace your current API query with this:
SELECT 
    CASE 
        WHEN transaction_type = 'debit' THEN 'Spending'
        WHEN transaction_type = 'credit' THEN 'Income'
    END as category,
    SUM(amount) as amount
FROM transactions 
WHERE transaction_type = 'debit'
AND transaction_date >= [your_date_filter]
GROUP BY transaction_type;
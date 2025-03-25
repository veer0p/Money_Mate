const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Function to call the Python Flask API for categorization
const categorizeMessage = async (message) => {
    try {
        const response = await axios.post('http://localhost:5000/predict', {
            message: message
        });
        return response.data.category;
    } catch (error) {
        console.error('Error calling AI API:', error);
        return 'non-finance'; // Default category
    }
};

// Function to extract financial details (e.g., amount, sender)
const extractFinanceDetails = (message) => {
    const details = {
        amount: null,
        sender: null,
        date: null
    };

    // Extract amount (e.g., $50)
    const amountMatch = message.match(/\$\d+/);
    if (amountMatch) {
        details.amount = amountMatch[0].replace('$', '');
    }

    // Extract sender (e.g., "Bank")
    const senderMatch = message.match(/from\s+(\w+)/i);
    if (senderMatch) {
        details.sender = senderMatch[1];
    }

    // Extract date (e.g., "2023-10-01")
    const dateMatch = message.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
        details.date = dateMatch[0];
    }

    return details;
};

// Endpoint to handle new messages
app.post('/message', async (req, res) => {
    const { id, sender, message_body, status, received_at } = req.body;

    // Step 1: Categorize the message
    const category = await categorizeMessage(message_body);

    // Step 2: If financial, extract details
    let amount = null;
    let financeDetails = null;
    if (category === 'finance') {
        financeDetails = extractFinanceDetails(message_body);
        amount = financeDetails.amount;
    }

    // Step 3: Store in the transactions table (mock function)
    const storeMessage = async (id, sender, message_body, status, received_at, category, amount) => {
        console.log('Storing message:', { id, sender, message_body, status, received_at, category, amount });
        // Replace this with actual database logic
    };

    await storeMessage(id, sender, message_body, status, received_at, category, amount);

    // Step 4: Respond to the client
    res.json({
        success: true,
        category,
        amount,
        financeDetails
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Node.js server is running at http://localhost:${PORT}`);
});
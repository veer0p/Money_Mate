const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS

// Function to call the Python Flask API for categorization
const categorizeMessage = async (message) => {
    try {
        const response = await axios.post('http://localhost:5000/predict', {
            message: message
        });
        return response.data.category; // Returns the predicted category
    } catch (error) {
        console.error('Error calling AI API:', error.message);
        return 'other'; // Default category if API call fails
    }
};

// Function to extract details (e.g., amount, sender, date)
const extractDetails = (message) => {
    const details = {
        amount: null,
        sender: null,
        date: null
    };

    // Extract amount (e.g., "$50" or "Rs.1000")
    const amountMatch = message.match(/(?:\$|Rs\.?)\s?(\d+(?:\.\d{1,2})?)/);
    if (amountMatch) {
        details.amount = amountMatch[1];
    }

    // Extract sender (e.g., "from Bank" or "by PayPal")
    const senderMatch = message.match(/(?:from|by)\s+(\w+)/i);
    if (senderMatch) {
        details.sender = senderMatch[1];
    }

    // Extract date (e.g., "2024-03-20" or "March 20, 2024")
    const dateMatch = message.match(/\b\d{4}-\d{2}-\d{2}\b|\b\w+\s\d{1,2},\s\d{4}\b/);
    if (dateMatch) {
        details.date = dateMatch[0];
    }

    return details;
};

// Mock function to store messages (replace with actual DB logic)
const storeMessage = async (id, sender, message_body, status, received_at, category, amount) => {
    console.log('Storing message:', { id, sender, message_body, status, received_at, category, amount });
    // TODO: Integrate with a real database (e.g., MySQL, MongoDB, PostgreSQL)
};

// Endpoint to handle new messages
app.post('/message', async (req, res) => {
    try {
        const { id, sender, message_body, status, received_at } = req.body;

        if (!id || !sender || !message_body || !status || !received_at) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Step 1: Categorize the message
        const category = await categorizeMessage(message_body);

        // Step 2: Extract details if applicable
        let amount = null;
        let details = null;
        if (category === 'banking' || category === 'shopping') {
            details = extractDetails(message_body);
            amount = details.amount;
        }

        // Step 3: Store message
        await storeMessage(id, sender, message_body, status, received_at, category, amount);

        // Step 4: Respond to the client
        res.json({
            success: true,
            category,
            amount,
            details
        });

    } catch (error) {
        console.error("Error processing message:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Node.js server is running at http://localhost:${PORT}`);
});

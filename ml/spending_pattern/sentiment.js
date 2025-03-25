const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Function to call Flask API for sentiment analysis
const analyzeSentiment = async (message) => {
    try {
        const response = await axios.post('http://localhost:5000/analyze-sentiment', { message });
        return response.data;
    } catch (error) {
        console.error('Error calling sentiment analysis API:', error);
        return { sentiment: 'neutral', score: 0 };
    }
};

// Function to detect message type
const detectMessageType = (message) => {
    message = message.toLowerCase();
    if (message.includes('fraud') || message.includes('compromised') || message.includes('hacked')) {
        return 'fraud_alert';
    } else if (message.includes('overdue') || message.includes('due date') || message.includes('pay now')) {
        return 'overdue_bill';
    } else if (message.includes('recharge') || message.includes('top-up') || message.includes('balance')) {
        return 'recharge_notification';
    } else {
        return 'other';
    }
};

// 📌 API to Upload CSV File
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
        message: "File uploaded successfully",
        filename: req.file.filename
    });
});

// 📌 API to Process CSV File
app.post('/process_csv', async (req, res) => {
    const filePath = `uploads/${req.body.filename}`;
    let results = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
            const message = row['message_body']; // Adjust based on your CSV column name
            const sentimentResult = await analyzeSentiment(message);
            const messageType = detectMessageType(message);

            results.push({
                id: row['id'],
                sender: row['sender'],
                message_body: message,
                sentiment: sentimentResult.sentiment,
                messageType,
                alertSent: messageType !== 'other'
            });
        })
        .on('end', () => {
            res.json({
                message: "CSV file processed",
                data: results
            });
        })
        .on('error', (error) => {
            res.status(500).json({ error: error.message });
        });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Node.js server running at http://localhost:${PORT}`);
});

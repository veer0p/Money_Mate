const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mongoose = require("mongoose");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json());

// Twilio Config
const twilioClient = twilio("ACf7acda962f8946a79b9dacd899398bfe", "81ec93bcb83a15280f9d37ba7c3568d9");
const TWILIO_PHONE_NUMBER = "+1234567890";
const USER_PHONE_NUMBER = "+0987654321";

// Connect to MongoDB (Replace with your DB connection)
mongoose.connect("mongodb://localhost:27017/financeApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema for Transaction
const TransactionSchema = new mongoose.Schema({
  userId: String,
  message: String,
  amount: Number,
  category: String,
  timestamp: Date,
});

const Transaction = mongoose.model("Transaction", TransactionSchema);

// 📩 Extracts messages & sends to AI
app.post("/process_message", async (req, res) => {
  const { userId, message } = req.body;

  // Send message to AI model (Python backend)
  try {
    const response = await axios.post("http://127.0.0.1:5001/analyze", { message });

    const { amount, category } = response.data;

    const transaction = new Transaction({
      userId,
      message,
      amount,
      category,
      timestamp: new Date(),
    });

    await transaction.save();

    res.json({ success: true, message: "Transaction stored successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});

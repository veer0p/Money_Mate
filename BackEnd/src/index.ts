import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import messageRouters from "./routes/messageRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import processingRoutes from "./routes/processingRoutes";
import bodyParser from "body-parser";
import path from "path";

const app = express();

// ✅ Enable CORS for frontend (Android app or Angular - http://localhost:4200)
app.use(
  cors({
    origin: "*", // Allow all origins (use this for development)
    // OR specify exact origins:
    // origin: ["http://localhost:4200", "http://<android-device-ip>:<port>"],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use(express.json({ limit: "50mb" })); // Increase JSON body limit
app.use(express.urlencoded({ extended: true, limit: "50mb" })); // Increase URL-encoded body limit

// API Request Logging Middleware
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${req.method} ${req.url}`);
  
  res.on('finish', () => {
    console.log(`[${time}] ${req.method} ${req.url} - ${res.statusCode}`);
  });
  
  next();
});

app.get("/", (req, res) => {
  res.send("Server is Live 🚀");
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ Load Routes AFTER enabling CORS
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRouters);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/processing", processingRoutes);

export default app;

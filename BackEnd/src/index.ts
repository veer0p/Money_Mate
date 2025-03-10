import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRouters from "./routes/messageRoutes";
import bodyParser from "body-parser";

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

app.get("/", (req, res) => {
  res.send("Server is Live 🚀");
});

// ✅ Load Routes AFTER enabling CORS
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRouters);

export default app;

import express from "express";
import cors from "cors";
import path from "path";
// ... other imports ...

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase payload limit for base64 images
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ... rest of your server setup code ...

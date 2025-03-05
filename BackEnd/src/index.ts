// import express from "express";
// import cors from "cors"; // ✅ Import CORS middleware
// import authRoutes from "./routes/authRoutes";
// import userRoutes from "./routes/userRoutes";
// import chatRoutes from "./routes/chatRoutes";
// import messageRouters from "./routes/messageRoutes";

// const app = express();

// // ✅ Enable CORS for frontend (Angular - http://localhost:4200)
// app.use(
//   cors({
//     origin: "http://localhost:4200", // Allow Angular app
//     methods: "GET,POST,PUT,DELETE",
//     allowedHeaders: "Content-Type,Authorization",
//   })
// );

// app.use(express.json());

// // ✅ Load Routes AFTER enabling CORS
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/messages", messageRouters);

// export default app;

import express from "express";
import cors from "cors"; // ✅ Import CORS middleware
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRouters from "./routes/messageRoutes";

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

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is Live 🚀");
});

// ✅ Load Routes AFTER enabling CORS
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRouters);

export default app;

import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import "dotenv/config";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";

const __dirname = path.resolve();

const PORT = process.env.PORT || 5000;

// Put your real frontend URL(s) here
const allowedOrigins = [
  "http://localhost:5173",                 // local dev (Vite)
  "https://my-chat-backend-y7d4.vercel.app" // deployed frontend (Vercel)
];

// ✅ Needed on Render / proxies if you use secure cookies
app.set("trust proxy", 1);

// ✅ CORS (works for both local + production + Postman)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header (Postman, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Static hosting (only if you're actually serving frontend from this backend)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Optional SPA fallback if you serve frontend here:
  // app.get("*", (req, res) => {
  //   res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  // });
}

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
  connectDB();
});

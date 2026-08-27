import "dotenv/config";

import express from "express";
import cors from "cors";
import client from "./src/config/database.js";

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Retirement Party Analytics Service is running",
  });
});

// Start server
async function startServer() {
  try {
    await client.connect();

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
   
  }
}

startServer();
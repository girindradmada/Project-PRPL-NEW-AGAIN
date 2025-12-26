import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors()); // Allows your frontend to talk to this server
app.use(express.json()); // Allows the server to understand JSON data

// Database Connection
// MAKE SURE THESE MATCH YOUR POSTGRES SETTINGS
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'SpendWiseDB', // Check your DB name!
  password: process.env.DB_PASSWORD || 'password', // Check your DB password!
  port: 5432,
});

// --- API ROUTES ---

// 1. Save a Chat Message
app.post('/api/save-chat', async (req, res) => {
  const { user_id, message_text, sender, timestamp } = req.body;

  try {
    const query = `
      INSERT INTO ChatLogs (user_id, message_text, sender, timestamp)
      VALUES ($1, $2, $3, $4)
    `;
    // We don't send log_id because the database should auto-generate it (SERIAL)
    await pool.query(query, [user_id, message_text, sender, timestamp]);
    
    res.status(200).json({ success: true, message: "Chat saved" });
  } catch (err) {
    console.error("Error saving chat:", err);
    res.status(500).json({ error: "Failed to save chat" });
  }
});

// 2. Fetch Chat History
app.get('/api/chat-history/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // We order by timestamp ASC so the chat reads from top to bottom
    const query = `
      SELECT * FROM ChatLogs 
      WHERE user_id = $1 
      ORDER BY timestamp ASC
    `;
    const result = await pool.query(query, [userId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
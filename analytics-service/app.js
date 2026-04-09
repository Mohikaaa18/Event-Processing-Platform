const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();

// ✅ Middleware
app.use(express.json());
app.use(cors());

// Extra safety CORS headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});

// 🔹 MongoDB Config
const MONGO_URL = "mongodb://mongo:27017";

let db;

// 🔹 Connect to MongoDB (with retry loop)
async function connectDB() {
    while (!db) {
        try {
            const client = new MongoClient(MONGO_URL);
            await client.connect();

            db = client.db("eventDB");

            console.log("✅ Connected to MongoDB");

        } catch (err) {
            console.log("❌ MongoDB not ready, retrying...");
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}

connectDB();

// 🔹 Get analytics data
app.get('/analytics', async (req, res) => {
    try {
        if (!db) {
            return res.status(500).json({ error: "DB not ready" });
        }

        const events = await db.collection("events").find().toArray();

        res.json({
            count: events.length,
            events: events
        });

    } catch (error) {
        console.error("❌ Error fetching analytics:", error);

        res.status(500).json({
            error: "Failed to fetch analytics"
        });
    }
});

// 🔹 Health endpoint (for frontend)
app.get('/health', (req, res) => {
    res.json({ status: "UP" });
});

// 🔹 Start server
app.listen(3003, () => {
    console.log("🚀 Analytics Service running on port 3003");
});
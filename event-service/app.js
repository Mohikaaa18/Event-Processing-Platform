const express = require('express');
const amqp = require('amqplib');
const client = require('prom-client');
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

// 🔹 Prometheus metrics setup
client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// 🔹 RabbitMQ Config
const RABBITMQ_URL = 'amqp://rabbitmq';

let channel;

// 🔹 Connect to RabbitMQ (with retry loop)
async function connectQueue() {
    while (!channel) {
        try {
            const connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();

            await channel.assertQueue('events');

            console.log("✅ Connected to RabbitMQ");

        } catch (error) {
            console.log("❌ RabbitMQ not ready, retrying...");
            await new Promise(res => setTimeout(res, 5000));
        }
    }
}

connectQueue();

// 🔹 Send event API
app.post('/event', async (req, res) => {
    try {
        const event = req.body;

        console.log("📥 Incoming event:", event);

        if (!channel) {
            return res.status(500).json({ error: "Queue not ready" });
        }

        channel.sendToQueue('events', Buffer.from(JSON.stringify(event)));

        console.log("📤 Event sent to queue");

        res.json({
            status: "success",
            message: "Event sent successfully",
            data: event
        });

    } catch (error) {
        console.error("❌ Error sending event:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to send event"
        });
    }
});

// 🔹 Health check (VERY IMPORTANT for frontend)
app.get('/health', (req, res) => {
    res.json({ status: "UP" });
});

// 🔹 Start server
app.listen(3002, () => {
    console.log("🚀 Event Service running on port 3002");
});
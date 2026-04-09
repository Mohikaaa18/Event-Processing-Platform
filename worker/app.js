const amqp = require('amqplib');
const { MongoClient } = require('mongodb');

const RABBITMQ_URL = 'amqp://rabbitmq';
const MONGO_URL = 'mongodb://mongo:27017';

let channel;
let db;

// 🔹 Connect to MongoDB
async function connectDB() {
    try {
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        db = client.db('eventDB');
        console.log("Connected to MongoDB ✅");
    } catch (err) {
        console.log("MongoDB connection failed 🔄 retrying...");
        setTimeout(connectDB, 5000);
    }
}

// 🔹 Connect to RabbitMQ
async function connectQueue() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertQueue('events');

        console.log("Worker connected to RabbitMQ ✅");

        // Start consuming messages
        consumeMessages();

    } catch (err) {
        console.log("RabbitMQ not ready 🔄 retrying...");
        setTimeout(connectQueue, 5000);
    }
}

// 🔹 Consume messages
function consumeMessages() {
    channel.consume('events', async (msg) => {
        if (msg !== null) {
            try {
                const event = JSON.parse(msg.content.toString());

                console.log("Processed event:", event);

                // Save to MongoDB
                if (db) {
                    await db.collection('events').insertOne(event);
                    console.log("Saved to DB ✅");
                } else {
                    console.log("DB not ready ❌");
                }

                channel.ack(msg);

            } catch (err) {
                console.log("Error processing message ❌", err);
            }
        }
    });
}

// 🔹 Initialize everything
async function init() {
    await connectDB();
    await connectQueue();
}

init();
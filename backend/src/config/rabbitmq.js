const amqplib = require("amqplib");

let channel = null;
let connection = null;

const QUEUE_NAME = process.env.RABBITMQ_QUEUE || "vcom_messages";

const connectRabbitMQ = async () => {
  try {
    connection = await amqplib.connect(
      process.env.RABBITMQ_URL || "amqp://localhost"
    );
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err.message);
      channel = null;
    });

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed");
      channel = null;
    });

    console.log("RabbitMQ connected, queue:", QUEUE_NAME);
  } catch (err) {
    console.error("RabbitMQ connection failed:", err.message);
    // Non-fatal – app still starts; messages will be saved directly to MongoDB
  }
};

const publishMessage = (payload) => {
  if (!channel) {
    console.warn("RabbitMQ channel unavailable, skipping publish");
    return false;
  }
  channel.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
  return true;
};

const consumeMessages = (handler) => {
  if (!channel) {
    console.warn("RabbitMQ channel unavailable, skipping consume");
    return;
  }
  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString());
      await handler(payload);
      channel.ack(msg);
    } catch (err) {
      console.error("Message processing error:", err.message);
      channel.nack(msg, false, false);
    }
  });
};

const closeRabbitMQ = async () => {
  try {
    if (connection) await connection.close();
  } catch (err) {
    console.warn("Error closing RabbitMQ:", err.message);
  }
};

module.exports = { connectRabbitMQ, publishMessage, consumeMessages, closeRabbitMQ };

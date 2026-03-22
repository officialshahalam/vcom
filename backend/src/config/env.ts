import dotenv from "dotenv";

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5001),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vcom",
  jwtSecret: process.env.JWT_SECRET || "change-this-secret",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:8081",
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
    exchange: process.env.RABBITMQ_EXCHANGE || "vcom.messages.exchange",
    queue: process.env.RABBITMQ_QUEUE || "vcom.message.persist",
    routingKey: process.env.RABBITMQ_ROUTING_KEY || "message.persist",
    batchSize: Number(process.env.MESSAGE_BATCH_SIZE || 200),
    flushIntervalMs: Number(process.env.MESSAGE_FLUSH_INTERVAL_MS || 1000),
  },
};

export default env;

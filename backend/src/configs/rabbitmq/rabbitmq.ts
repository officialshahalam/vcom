import amqp, { type Channel, type ChannelModel } from "amqplib";
import { QUEUES } from "../../packages/constants/app.constants";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;
const isProduction = process.env.NODE_ENV === "production";
let rabbitDisabledInDev = false;

const rabbitUrl = process.env.RABBITMQ_URL ?? "amqp://guest:guest@localhost:5672";

export const getRabbitChannel = async (): Promise<Channel> => {
  if (channel) {
    return channel;
  }

  if (rabbitDisabledInDev) {
    throw new Error("RabbitMQ disabled in development mode");
  }

  try {
    const conn = await amqp.connect(rabbitUrl);
    connection = conn;
    const ch = await conn.createChannel();
    channel = ch;

    await ch.assertQueue(QUEUES.OTP, { durable: true });
    await ch.assertQueue(QUEUES.NOTIFICATION, { durable: true });
    await ch.assertExchange(QUEUES.CHAT_MESSAGE, "topic", { durable: true });

    console.log("[RABBITMQ] connected");
    return ch;
  } catch (error) {
    if (isProduction) {
      throw error;
    }

    rabbitDisabledInDev = true;
    console.warn("[RABBITMQ] unavailable in development, queue features disabled");
    throw error;
  }
};

export const publishQueue = async <T>(queue: string, payload: T): Promise<void> => {
  try {
    const activeChannel = await getRabbitChannel();
    activeChannel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
  } catch (error) {
    if (isProduction) throw error;
    console.warn("[RABBITMQ] publishQueue skipped in development", queue);
  }
};

export const publishTopic = async <T>(exchange: string, routingKey: string, payload: T): Promise<void> => {
  try {
    const activeChannel = await getRabbitChannel();
    activeChannel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  } catch (error) {
    if (isProduction) throw error;
    console.warn("[RABBITMQ] publishTopic skipped in development", exchange, routingKey);
  }
};

export const startRabbitConsumers = async (
  onOtp: (payload: { mobileNumber: string; otp: string; type: "SIGNUP" | "RESET_PASSWORD" }) => Promise<void>,
  onChatMessage: (payload: { conversationId: number; messageId: number }) => Promise<void>,
): Promise<void> => {
  let activeChannel: Channel;
  try {
    activeChannel = await getRabbitChannel();
  } catch (error) {
    if (isProduction) throw error;
    console.warn("[RABBITMQ] consumers not started in development");
    return;
  }

  await activeChannel.consume(QUEUES.OTP, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as {
        mobileNumber: string;
        otp: string;
        type: "SIGNUP" | "RESET_PASSWORD";
      };
      await onOtp(payload);
      activeChannel.ack(msg);
    } catch (error) {
      console.error("[RABBITMQ][OTP] consumer failed", error);
      activeChannel.nack(msg, false, false);
    }
  });

  const queueName = `${QUEUES.CHAT_MESSAGE}.consumer`;
  await activeChannel.assertQueue(queueName, { durable: true });
  await activeChannel.bindQueue(queueName, QUEUES.CHAT_MESSAGE, "chat.message.*");

  await activeChannel.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      const payload = JSON.parse(msg.content.toString()) as {
        conversationId: number;
        messageId: number;
      };
      await onChatMessage(payload);
      activeChannel.ack(msg);
    } catch (error) {
      console.error("[RABBITMQ][CHAT] consumer failed", error);
      activeChannel.nack(msg, false, false);
    }
  });
};

export const closeRabbitConnection = async (): Promise<void> => {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
};

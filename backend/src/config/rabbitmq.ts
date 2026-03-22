import amqp, { Channel } from "amqplib";
import env from "./env";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

let connection: AmqpConnection | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  const conn = await amqp.connect(env.rabbitmq.url);
  const ch = await conn.createChannel();

  await ch.assertExchange(env.rabbitmq.exchange, "topic", { durable: true });
  await ch.assertQueue(env.rabbitmq.queue, { durable: true });
  await ch.bindQueue(env.rabbitmq.queue, env.rabbitmq.exchange, env.rabbitmq.routingKey);

  connection = conn;
  channel = ch;

  return ch;
}

export function getRabbitChannel(): Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }
  return channel;
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }

  if (connection) {
    await connection.close();
    connection = null;
  }
}

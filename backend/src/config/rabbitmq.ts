import amqplib, { Channel, ChannelModel } from "amqplib";
import { env } from "./env";

let channelModel: ChannelModel | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  try {
    channelModel = await amqplib.connect(env.rabbitmqUrl);
    channel = await channelModel.createChannel();
    console.log("RabbitMQ connected");
  } catch (error) {
    console.error("RabbitMQ connection error:", error);
  }
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialised. Call connectRabbitMQ() first.");
  }
  return channel;
}

export async function publishMessage(queue: string, payload: object): Promise<void> {
  const ch = getChannel();
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
}

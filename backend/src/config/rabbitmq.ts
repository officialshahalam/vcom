import amqp, { ChannelModel, Channel } from "amqplib";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<void> => {
  const url = process.env.RABBITMQ_URL as string;

  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    console.log("RabbitMQ connected");
  } catch (error) {
    console.error("RabbitMQ connection error:", error);
    // Non-fatal: the server can start without RabbitMQ, but message queuing will be unavailable.
    // Operators should ensure RabbitMQ is running before sending bulk messages.
  }
};

export const getChannel = (): Channel => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialised");
  }
  return channel;
};

export const publishMessage = async (
  queue: string,
  message: object
): Promise<void> => {
  const ch = getChannel();
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};

export const consumeMessages = async (
  queue: string,
  handler: (msg: object) => void
): Promise<void> => {
  const ch = getChannel();
  await ch.assertQueue(queue, { durable: true });
  ch.consume(queue, (msg) => {
    if (msg) {
      handler(JSON.parse(msg.content.toString()));
      ch.ack(msg);
    }
  });
};

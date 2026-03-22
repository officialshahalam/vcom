const amqp = require("amqplib");
const env = require("./env");

let connection;
let channel;

async function connectRabbitMQ() {
  if (channel) {
    return channel;
  }

  connection = await amqp.connect(env.rabbitmq.url);
  channel = await connection.createChannel();

  await channel.assertExchange(env.rabbitmq.exchange, "topic", { durable: true });
  await channel.assertQueue(env.rabbitmq.queue, { durable: true });
  await channel.bindQueue(env.rabbitmq.queue, env.rabbitmq.exchange, env.rabbitmq.routingKey);

  return channel;
}

function getRabbitChannel() {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }
  return channel;
}

async function closeRabbitMQ() {
  if (channel) {
    await channel.close();
    channel = null;
  }

  if (connection) {
    await connection.close();
    connection = null;
  }
}

module.exports = {
  connectRabbitMQ,
  getRabbitChannel,
  closeRabbitMQ,
};

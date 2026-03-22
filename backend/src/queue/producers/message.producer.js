const { getRabbitChannel } = require("../../config/rabbitmq");
const env = require("../../config/env");

async function publishMessageForPersistence(messageJob) {
  const channel = getRabbitChannel();
  const payload = Buffer.from(JSON.stringify(messageJob));

  channel.publish(env.rabbitmq.exchange, env.rabbitmq.routingKey, payload, {
    persistent: true,
    contentType: "application/json",
    messageId: messageJob.messageId,
  });
}

module.exports = {
  publishMessageForPersistence,
};

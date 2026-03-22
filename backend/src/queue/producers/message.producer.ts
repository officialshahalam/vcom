import { getRabbitChannel } from "../../config/rabbitmq";
import env from "../../config/env";
import { MessageData } from "../../modules/messages/message.repository";

export async function publishMessageForPersistence(messageJob: MessageData): Promise<void> {
  const channel = getRabbitChannel();
  const payload = Buffer.from(JSON.stringify(messageJob));

  channel.publish(env.rabbitmq.exchange, env.rabbitmq.routingKey, payload, {
    persistent: true,
    contentType: "application/json",
    messageId: messageJob.messageId,
  });
}

import { connectDatabase } from "../config/db";
import { connectRabbitMQ, closeRabbitMQ } from "../config/rabbitmq";
import env from "../config/env";
import { persistMessageBatch } from "../modules/messages/message.service";
import { logInfo, logError } from "../shared/logger";
import { MessageData } from "../modules/messages/message.repository";
import { ConsumeMessage } from "amqplib";

async function startWorker(): Promise<void> {
  await connectDatabase();
  logInfo("MongoDB connected (worker)");

  const channel = await connectRabbitMQ();
  logInfo("RabbitMQ connected (worker)");

  channel.prefetch(env.rabbitmq.batchSize);

  let batch: MessageData[] = [];
  let flushTimer: NodeJS.Timeout | null = null;

  async function flush(): Promise<void> {
    if (!batch.length) return;
    const toInsert = batch.splice(0, batch.length);
    try {
      await persistMessageBatch(toInsert);
      logInfo(`Persisted ${toInsert.length} messages`);
    } catch (err) {
      logError("Failed to persist message batch", err);
    }
  }

  function scheduleFlush(): void {
    if (flushTimer) return;
    flushTimer = setTimeout(async () => {
      flushTimer = null;
      await flush();
    }, env.rabbitmq.flushIntervalMs);
  }

  channel.consume(env.rabbitmq.queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const job = JSON.parse(msg.content.toString()) as MessageData;
      batch.push(job);
      channel.ack(msg);
      if (batch.length >= env.rabbitmq.batchSize) {
        await flush();
      } else {
        scheduleFlush();
      }
    } catch (err) {
      logError("Failed to parse message job", err);
      channel.nack(msg, false, false);
    }
  });

  process.on("SIGTERM", async () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
    }
    await flush();
    await closeRabbitMQ();
    process.exit(0);
  });
}

startWorker().catch((err) => {
  logError("Worker failed to start", err);
  process.exit(1);
});

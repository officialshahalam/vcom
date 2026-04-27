import cron, { type ScheduledTask } from "node-cron";
import { prisma } from "../configs/prisma/client";

let task: ScheduledTask | null = null;

/**
 * Wipes every row from the `Message` table. Dependent `MessageReadReceipt`
 * rows are removed automatically by the `onDelete: Cascade` relation. All
 * conversations and users are untouched.
 */
const runCleanup = async (): Promise<void> => {
  const startedAt = new Date();
  try {
    const { count } = await prisma.message.deleteMany({});
    console.log(
      `[CRON][cleanupMessages] deleted ${count} messages at ${startedAt.toISOString()}`,
    );
  } catch (error) {
    console.error("[CRON][cleanupMessages] failed", error);
  }
};

/**
 * Register the nightly cleanup cron. Runs every day at 01:00 Asia/Kolkata
 * (IST, UTC+5:30). Safe to call multiple times — only one task is ever
 * registered.
 */
export const startDailyMessageCleanup = (): void => {
  if (task) return;

  // "0 1 * * *" = minute 0, hour 1, every day. The `timezone` option is what
  // anchors this to IST regardless of the host's system clock.
  task = cron.schedule("0 1 * * *", runCleanup, {
    timezone: "Asia/Kolkata",
    name: "cleanupMessages",
  });

  console.log("[CRON][cleanupMessages] scheduled for 01:00 Asia/Kolkata daily");
};

export const stopDailyMessageCleanup = (): void => {
  if (!task) return;
  void task.stop();
  task = null;
};

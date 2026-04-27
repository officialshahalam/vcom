import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (error) => {
  console.error("❌ Redis connection error:", error);
});

export const ensureRedisConnection = async (): Promise<void> => {
  if (redis.status === "ready" || redis.status === "connecting") {
    return;
  }

  await redis.connect();
};

export { redis };
export default redis;

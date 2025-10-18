import { Redis } from "ioredis";

export const createRedisClient = (): Redis | null => {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (!url) {
    console.warn("REDIS_URL not set. Queues will be disabled.");
    return null;
  }
  try {
    const client = new Redis(url, {
      // BullMQ v5 requires this to be null
      maxRetriesPerRequest: null as unknown as number,
      // Recommended for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });
    return client;
  } catch (err) {
    console.error("Failed to create Redis client:", err);
    return null;
  }
};

export default createRedisClient;

import { Redis } from "ioredis";

export const createRedisClient = (): Redis | null => {
  let url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || "";
  // Sanitize accidental quotes or encoded quotes from env
  url = url.trim();
  url = url.replace(/^['"]|['"]$/g, ""); // strip surrounding ' or "
  url = url.replace(/^%22|%22$/g, ""); // strip encoded quotes

  if (!url) {
    console.warn("REDIS_URL not set. Queues will be disabled.");
    return null;
  }
  try {
    // Add scheme if missing
    if (!/^redis(s)?:\/\//i.test(url)) {
      url = `redis://${url}`;
    }
    const isSecure = url.startsWith("rediss://");
    const client = new Redis(url, {
      // BullMQ v5 requires this to be null
      maxRetriesPerRequest: null as unknown as number,
      // Recommended for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      tls: isSecure ? {} : undefined,
    });
    return client;
  } catch (err) {
    console.error("Failed to create Redis client:", err);
    return null;
  }
};

export default createRedisClient;

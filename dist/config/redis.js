"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = void 0;
const ioredis_1 = require("ioredis");
const createRedisClient = () => {
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
    if (!url) {
        console.warn("REDIS_URL not set. Queues will be disabled.");
        return null;
    }
    try {
        const client = new ioredis_1.Redis(url, {
            // BullMQ v5 requires this to be null
            maxRetriesPerRequest: null,
            // Recommended for BullMQ
            enableReadyCheck: false,
            lazyConnect: true,
        });
        return client;
    }
    catch (err) {
        console.error("Failed to create Redis client:", err);
        return null;
    }
};
exports.createRedisClient = createRedisClient;
exports.default = exports.createRedisClient;

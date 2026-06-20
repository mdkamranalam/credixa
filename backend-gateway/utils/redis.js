import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://credixa-redis:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    try {
        await redisClient.connect();
        console.log("Successfully connected to Redis");
    } catch (err) {
        console.error("Failed to connect to Redis:", err);
    }
})();

export default redisClient;

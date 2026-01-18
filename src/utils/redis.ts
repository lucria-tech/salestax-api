import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const restUrl = Bun.env.UPSTASH_REDIS_REST_URL;
    const restToken = Bun.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!restUrl || !restToken) {
      throw new Error(
        "Upstash Redis credentials not set. " +
        "Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env file or environment variables."
      );
    }

    redisClient = new Redis({
      url: restUrl,
      token: restToken,
    });

    console.log("✅ Connected to Upstash Redis");
  }

  return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
  // Upstash Redis REST client doesn't need explicit closing
  redisClient = null;
}

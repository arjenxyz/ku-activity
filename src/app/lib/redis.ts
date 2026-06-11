import { Redis } from "@upstash/redis";

// Environment variable kontrolleri eklenmeli
if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
  throw new Error("REDIS_URL ve REDIS_TOKEN environment variable'ları tanımlı değil");
}

// Redis istemcisi oluşturma
export const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

// Health check fonksiyonu ekleme (opsiyonel)
export async function checkRedisConnection() {
  try {
    await redis.ping();
    console.log("Redis bağlantısı başarılı");
  } catch (error) {
    console.error("Redis bağlantı hatası:", error);
    throw new Error("Redis'e bağlanılamadı");
  }
}

// Rate limit kullanımı için en iyi uygulama
import { Ratelimit } from "@upstash/ratelimit";

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, "60 s"), // Daha esnek bir limit
  analytics: true,
  prefix: "ratelimit", // Proje-specific prefix
});
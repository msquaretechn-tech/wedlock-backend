import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDISURL); // Upstash URL

redis.on('connect', () => {
  console.log('Redis Client Connected');
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

export { redis };

import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Clean copy-paste flags (like --tls, -u, or spaces) from the URL
REDIS_URL = REDIS_URL.trim()
    .replace(/--tls|-u|redis-cli|redissh/g, '')
    .replace(/\s+/g, '')
    .trim();

// Upstash requires a secure TLS (rediss://) connection
if (REDIS_URL.includes('upstash.io') && REDIS_URL.startsWith('redis://')) {
    REDIS_URL = REDIS_URL.replace('redis://', 'rediss://');
}

const redis = new Redis(REDIS_URL);

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err: any) => {
    console.error('Redis connection error:', err);
});

export const pushNotification = async (orgId: string, message: string) => {
    const key = `notifications:${orgId}`;
    
    // Create the notification object
    const notification = {
        id: Date.now().toString(),
        message,
        time: new Date().toISOString()
    };
    
    // Push to the left (newest first)
    await redis.lpush(key, JSON.stringify(notification));
    
    // Keep only the last 5 items (0 to 4)
    await redis.ltrim(key, 0, 4);
    
    return notification;
};

export const getNotifications = async (orgId: string) => {
    const key = `notifications:${orgId}`;
    const notifications = await redis.lrange(key, 0, 4);
    
    return notifications.map((n: string) => JSON.parse(n));
};

export default redis;

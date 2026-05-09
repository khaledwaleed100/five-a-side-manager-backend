import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Initialize Redis client for rate limiting (only if credentials provided)
let redisClient;
let store = null;

const initializeRedis = async () => {
    if (!process.env.REDIS_HOST) {
        console.log('No Redis configured - using in-memory rate limiter for local development');
        return;
    }

    try {
        redisClient = createClient({
            socket: {
                host: process.env.REDIS_HOST,
                port: parseInt(process.env.REDIS_PORT) || 6379,
                tls: true, // Upstash requires TLS
            },
            password: process.env.REDIS_PASSWORD,
            legacyMode: true, // Required for rate-limit-redis
        });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        
        await redisClient.connect();
        console.log('✓ Redis connected for rate limiting');
        
        store = new RedisStore({
            client: redisClient,
            prefix: 'rl:',
        });
    } catch (err) {
        console.warn('⚠ Redis connection failed, using in-memory rate limiter:', err.message);
        store = null;
    }
};

// Initialize Redis on startup
initializeRedis();

const apiLimiter = rateLimit({
    store: store || undefined, // Use Redis if available, otherwise in-memory
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Don't rate limit on /health check
        return req.path === '/health';
    },
});

const authLimiter = rateLimit({
    store: store || undefined, // Use Redis if available, otherwise in-memory
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: 'Too many login attempts from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});

export { apiLimiter, authLimiter };

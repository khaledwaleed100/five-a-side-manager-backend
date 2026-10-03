import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Don't rate limit on /health check.
        // Polls are limited separately: friends voting from the same venue Wi-Fi share one IP
        // and phones refresh an open poll, which would otherwise burn the shared 100/15min budget.
        return req.path === '/health' || req.path.startsWith('/polls');
    },
});

const pollLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // ~ a dozen phones on one Wi-Fi, each refreshing every 20-30s plus votes
    message: { message: 'Too many poll requests, slow down for a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: 'Too many login attempts from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});

export { apiLimiter, authLimiter, pollLimiter };

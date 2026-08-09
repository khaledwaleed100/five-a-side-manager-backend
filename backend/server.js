import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { default as connectDB } from './config/db.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notesRoutes from './routes/notes.js';
import statsRoutes from './routes/statsRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import cookieParser from 'cookie-parser';

// Resolve directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Process Error Handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Render's reverse proxy FIRST — must be before rate limiter
app.set('trust proxy', 1);

// Connect to Database
connectDB();

// CORS — must be FIRST middleware before helmet and everything else
const allowedOrigins = [
    'http://localhost:4200',
    process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const isAllowed =
            allowedOrigins.includes(origin) ||
            origin.endsWith('.onrender.com');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
};

// Handle OPTIONS preflight for ALL routes explicitly
app.options(/.*/, cors(corsOptions));
app.use(cors(corsOptions));

// Security & parsing
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(express.json());
app.use(cookieParser());

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint (no rate limit)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/stats', statsRoutes);

// Serve Frontend in Production (Render unified deployment)
const frontendPath = path.join(__dirname, '../frontend/dist/frontend/browser');
app.use(express.static(frontendPath));

app.use((req, res, next) => {
    if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        next();
    }
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

// Start the server (always — Render sets PORT via env)
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    server.close(() => {
        process.exit(1);
    });
});

export default app;

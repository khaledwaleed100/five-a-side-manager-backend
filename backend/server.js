require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middlewares/rateLimiter');

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
        // Allow requests with no origin (mobile apps, curl, Render health checks)
        if (!origin) return callback(null, true);
        
        // Check if origin is allowed or is a vercel.app subdomain for this project
        const isAllowed = allowedOrigins.includes(origin) || 
                         origin.includes('5-aside-xcsp') && origin.endsWith('.vercel.app');
        
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
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Security & parsing
app.use(helmet());
app.use(express.json());

// Rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/players', require('./routes/playerRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/notes', require('./routes/notes'));

// Error handling middleware
app.use(require('./middlewares/errorMiddleware'));

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});

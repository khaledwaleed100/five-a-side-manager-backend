require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:4200', // Angular default
    credentials: true
}));

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

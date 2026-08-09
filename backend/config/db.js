import { connect } from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await connect(process.env.MONGO_URI, {
            // Connection Pool
            maxPoolSize: 10,
            minPoolSize: 2,

            // Timeouts
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,

            // Server API
            serverApi: {
                version: '1',
                strict: true,
                deprecationErrors: true,
            }
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        const uriHost = process.env.MONGO_URI?.split('@')[1]?.split('/')[0] || 'unknown host';
        console.error(`MongoDB connection FAILED (host: ${uriHost})`);
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
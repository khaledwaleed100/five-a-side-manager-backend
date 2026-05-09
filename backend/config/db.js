import { connect } from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await connect(process.env.MONGO_URI, {
            // Connection Pool — critical for serverless/Railway
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
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
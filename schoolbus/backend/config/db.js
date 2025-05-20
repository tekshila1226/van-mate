import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export default async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully 🤩🎉');
    } catch (error) {
        console.error('😥 MongoDB connection failed:', error.message);
        process.exit(1);
    }
}
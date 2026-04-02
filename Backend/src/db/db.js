const mongoose = require('mongoose');

async function connectDb() {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not configured');
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000
        });
        console.log('Connected to MongoDB');
        return mongoose.connection;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = connectDb;

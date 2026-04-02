require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/db/db');
const initSocketServer = require('./src/sockets/socket.server');
const mongoose = require('mongoose');

const httpServer = require('http').createServer(app);
const PORT = process.env.PORT || 3000;

async function shutdownWithError(message) {
    console.error(message);

    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    } catch (disconnectError) {
        console.error('Failed to close MongoDB connection cleanly:', disconnectError.message);
    }

    process.exit(1);
}

async function startServer() {
    try {
        await connectDb();
        initSocketServer(httpServer);

        httpServer.once('error', async (error) => {
            if (error.code === 'EADDRINUSE') {
                await shutdownWithError(
                    `Port ${PORT} is already in use. Another Aurora AI backend is probably already running. Stop the existing process or start with a different port, for example: set PORT=3001 && npm start`
                );
                return;
            }

            await shutdownWithError(`Failed to start HTTP server: ${error.message}`);
        });

        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        await shutdownWithError(`Failed to start server: ${error.message}`);
    }
}

startServer();

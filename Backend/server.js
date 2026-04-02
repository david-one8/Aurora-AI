require('dotenv').config();
const app = require('./src/app');
const connectDb = require('./src/db/db');
const initSocketServer = require('./src/sockets/socket.server');

const httpServer = require('http').createServer(app);
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDb();
        initSocketServer(httpServer);

        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();

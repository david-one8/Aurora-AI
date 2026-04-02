const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const conversationService = require('../services/conversation.service');
const {
    createSocketRateLimiter,
    getRetryAfterSeconds
} = require('../middlewares/rate-limit.middleware');

function parseAllowedOrigins(value) {
    return (value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function isAllowedOrigin(origin, allowedOrigins) {
    if (!origin) {
        return true;
    }

    if (allowedOrigins.includes(origin)) {
        return true;
    }

    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function initSocketServer(httpServer) {
    const allowedOrigins = [
        ...parseAllowedOrigins(process.env.FRONTEND_URL),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ].filter(Boolean);

    const io = new Server(httpServer, {
        cors: {
            origin(origin, callback) {
                if (isAllowedOrigin(origin, allowedOrigins)) {
                    callback(null, true);
                    return;
                }

                callback(new Error('Not allowed by CORS'));
            },
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        }
    });
    const aiMessageRateLimiter = createSocketRateLimiter({
        name: 'socket-ai-messages',
        windowMs: 60 * 1000,
        limit: 12,
        keyGenerator: (socket) => socket.user?._id?.toString() || socket.handshake.address || socket.id
    });

    io.use(async (socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || '');

        if (!cookies.token) {
            next(new Error('Authentication error: No token provided'));
            return;
        }

        try {
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            const user = await userModel.findById(decoded.id);

            if (!user) {
                next(new Error('Authentication error: User not found'));
                return;
            }

            socket.user = user;
            next();
        } catch {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        socket.on('ai-message', async (messagePayload) => {
            try {
                const rateLimitResult = aiMessageRateLimiter(socket);

                if (!rateLimitResult.allowed) {
                    socket.emit('ai-response', {
                        content: `Too many AI messages sent too quickly. Please try again in ${getRetryAfterSeconds(rateLimitResult.resetAt)} seconds.`,
                        chat: messagePayload?.chat
                    });
                    return;
                }

                if (!messagePayload?.chat || !messagePayload?.content?.trim()) {
                    socket.emit('ai-response', {
                        content: 'Unable to send an empty message.',
                        chat: messagePayload?.chat,
                        clientMessageId: messagePayload?.clientMessageId
                    });
                    return;
                }

                const result = await conversationService.sendMessageAndGenerateReply({
                    chatId: messagePayload.chat,
                    userId: socket.user._id,
                    content: messagePayload.content
                });
                socket.emit('ai-response', {
                    content: result.responseMessage.content,
                    chat: messagePayload.chat,
                    clientMessageId: messagePayload?.clientMessageId,
                    userMessageId: result.userMessage._id,
                    responseMessageId: result.responseMessage._id
                });
            } catch (error) {
                console.error('Socket AI flow failed:', error);
                socket.emit('ai-response', {
                    content: error.status ? error.message : 'Aurora AI could not generate a response right now.',
                    chat: messagePayload?.chat,
                    clientMessageId: messagePayload?.clientMessageId
                });
            }
        });
    });
}

module.exports = initSocketServer;

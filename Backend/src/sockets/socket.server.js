const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const chatModel = require('../models/chat.model');
const aiService = require('../services/ai.service');
const messageModel = require('../models/message.model');
const { createMemory, queryMemory } = require('../services/vector.service');
const {
    createSocketRateLimiter,
    getRetryAfterSeconds
} = require('../middlewares/rate-limit.middleware');

function initSocketServer(httpServer) {
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ].filter(Boolean);

    const io = new Server(httpServer, {
        cors: {
            origin(origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
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
        } catch (error) {
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
                        chat: messagePayload?.chat
                    });
                    return;
                }

                const chat = await chatModel.findOne({
                    _id: messagePayload.chat,
                    user: socket.user._id
                });

                if (!chat) {
                    socket.emit('ai-response', {
                        content: 'Chat not found.',
                        chat: messagePayload.chat
                    });
                    return;
                }

                const content = messagePayload.content.trim();
                const [message, vectors] = await Promise.all([
                    messageModel.create({
                        chat: messagePayload.chat,
                        user: socket.user._id,
                        content,
                        role: 'user'
                    }),
                    aiService.generateVector(content),
                ]);

                await createMemory({
                    vectors,
                    messageId: message._id,
                    metadata: {
                        chat: String(messagePayload.chat),
                        user: String(socket.user._id),
                        text: content
                    }
                });

                const [memory, chatHistory] = await Promise.all([
                    queryMemory({
                        queryVector: vectors,
                        limit: 3,
                        metadata: {
                            user: String(socket.user._id)
                        }
                    }),
                    messageModel.find({
                        chat: messagePayload.chat
                    }).sort({ createdAt: -1 }).limit(20).lean().then((messages) => messages.reverse())
                ]);

                const shortTermMemory = chatHistory.map((item) => ({
                    role: item.role,
                    parts: [{ text: item.content }]
                }));

                const longTermMemory = [
                    {
                        role: 'user',
                        parts: [{
                            text: `
These are some previous messages from the chat. Use them to generate a response.

${memory.map((item) => item.metadata.text).join('\n')}
`
                        }]
                    }
                ];

                const response = await aiService.generateResponse([
                    ...longTermMemory,
                    ...shortTermMemory
                ]);

                socket.emit('ai-response', {
                    content: response,
                    chat: messagePayload.chat
                });

                const [responseMessage, responseVectors] = await Promise.all([
                    messageModel.create({
                        chat: messagePayload.chat,
                        user: socket.user._id,
                        content: response,
                        role: 'model'
                    }),
                    aiService.generateVector(response)
                ]);

                await createMemory({
                    vectors: responseVectors,
                    messageId: responseMessage._id,
                    metadata: {
                        chat: String(messagePayload.chat),
                        user: String(socket.user._id),
                        text: response
                    }
                });
            } catch (error) {
                console.error('Socket AI flow failed:', error);
                socket.emit('ai-response', {
                    content: aiService.getAiErrorMessage(error),
                    chat: messagePayload?.chat
                });
            }
        });
    });
}

module.exports = initSocketServer;

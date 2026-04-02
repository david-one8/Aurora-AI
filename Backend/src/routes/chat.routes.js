const express = require('express');
const authMiddleware = require("../middlewares/auth.middleware")
const chatController = require("../controllers/chat.controller")
const { createRateLimitMiddleware } = require('../middlewares/rate-limit.middleware');


const router = express.Router();
const chatReadRateLimiter = createRateLimitMiddleware({
    name: 'chat-read-routes',
    windowMs: 60 * 1000,
    limit: 120,
    message: 'Too many chat requests. Please slow down.',
    keyGenerator: (req) => req.user?._id?.toString() || req.ip || 'anonymous'
});
const chatWriteRateLimiter = createRateLimitMiddleware({
    name: 'chat-write-routes',
    windowMs: 60 * 1000,
    limit: 20,
    message: 'Too many chat updates. Please wait a moment before trying again.',
    keyGenerator: (req) => req.user?._id?.toString() || req.ip || 'anonymous'
});

/* POST /api/chat/ */
router.post('/', authMiddleware.authUser, chatWriteRateLimiter, chatController.createChat)


/* GET /api/chat/ */
router.get('/', authMiddleware.authUser, chatReadRateLimiter, chatController.getChats)


/* GET /api/chat/messages/:id */
router.get('/messages/:id', authMiddleware.authUser, chatReadRateLimiter, chatController.getMessages)


/* PATCH /api/chat/:id */
router.patch('/:id', authMiddleware.authUser, chatWriteRateLimiter, chatController.updateChat)


/* DELETE /api/chat/:id */
router.delete('/:id', authMiddleware.authUser, chatWriteRateLimiter, chatController.deleteChat)


/* PATCH /api/chat/messages/:id */
router.patch('/messages/:id', authMiddleware.authUser, chatWriteRateLimiter, chatController.editMessage)


module.exports = router;

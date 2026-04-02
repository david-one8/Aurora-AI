const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');

async function createChat(req, res) {
    try {
        const { title } = req.body;
        const user = req.user;

        if (!title?.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const chat = await chatModel.create({
            user: user._id,
            title: title.trim()
        });

        return res.status(201).json({
            message: 'Chat created successfully',
            chat: {
                _id: chat._id,
                title: chat.title,
                lastActivity: chat.lastActivity,
                user: chat.user
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to create chat right now' });
    }
}

async function getChats(req, res) {
    try {
        const user = req.user;
        const chats = await chatModel.find({ user: user._id }).sort({ lastActivity: -1 });

        return res.status(200).json({
            message: 'Chats retrieved successfully',
            chats: chats.map((chat) => ({
                _id: chat._id,
                title: chat.title,
                lastActivity: chat.lastActivity,
                user: chat.user
            }))
        });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to load chats right now' });
    }
}

async function getMessages(req, res) {
    try {
        const chatId = req.params.id;
        const user = req.user;
        const chat = await chatModel.findOne({ _id: chatId, user: user._id });

        if (!chat) {
            return res.status(404).json({ message: 'Chat not found' });
        }

        const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });

        return res.status(200).json({
            message: 'Messages retrieved successfully',
            messages
        });
    } catch (error) {
        return res.status(500).json({ message: 'Unable to load messages right now' });
    }
}

module.exports = {
    createChat,
    getChats,
    getMessages
};

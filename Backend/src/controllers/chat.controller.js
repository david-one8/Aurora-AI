const chatModel = require('../models/chat.model');
const conversationService = require('../services/conversation.service');

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
    } catch {
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
    } catch {
        return res.status(500).json({ message: 'Unable to load chats right now' });
    }
}

async function getMessages(req, res) {
    try {
        const chatId = req.params.id;
        const user = req.user;
        const messages = await conversationService.listChatMessagesForUser({
            chatId,
            userId: user._id
        });

        return res.status(200).json({
            message: 'Messages retrieved successfully',
            messages
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.status ? error.message : 'Unable to load messages right now'
        });
    }
}

async function updateChat(req, res) {
    try {
        const user = req.user;
        const chatId = req.params.id;
        const { title } = req.body;
        const chat = await conversationService.updateChatTitleForUser({
            chatId,
            userId: user._id,
            title
        });

        return res.status(200).json({
            message: 'Chat updated successfully',
            chat: {
                _id: chat._id,
                title: chat.title,
                lastActivity: chat.lastActivity,
                user: chat.user
            }
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.status ? error.message : 'Unable to update the chat right now'
        });
    }
}

async function editMessage(req, res) {
    try {
        const user = req.user;
        const messageId = req.params.id;
        const { content } = req.body;
        const result = await conversationService.editMessageAndGenerateReply({
            messageId,
            userId: user._id,
            content
        });
        const messages = await conversationService.listChatMessagesForUser({
            chatId: result.userMessage.chat,
            userId: user._id
        });

        return res.status(200).json({
            message: 'Message updated successfully',
            messages,
            editedMessageId: result.userMessage._id,
            responseMessageId: result.responseMessage._id
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.status ? error.message : 'Unable to edit the message right now'
        });
    }
}

async function deleteChat(req, res) {
    try {
        const user = req.user;
        const chatId = req.params.id;
        await conversationService.deleteChatForUser({
            chatId,
            userId: user._id
        });

        return res.status(200).json({
            message: 'Chat deleted successfully',
            chatId
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.status ? error.message : 'Unable to delete the chat right now'
        });
    }
}

module.exports = {
    createChat,
    getChats,
    getMessages,
    updateChat,
    editMessage,
    deleteChat
};

const chatModel = require('../models/chat.model');
const messageModel = require('../models/message.model');
const aiService = require('./ai.service');
const { createMemory, queryMemory, deleteMemories } = require('./vector.service');

function createServiceError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

async function getOwnedChat(chatId, userId) {
    const chat = await chatModel.findOne({ _id: chatId, user: userId });

    if (!chat) {
        throw createServiceError(404, 'Chat not found');
    }

    return chat;
}

async function listChatMessages(chatId) {
    return messageModel.find({ chat: chatId }).sort({ createdAt: 1 });
}

async function listChatMessagesForUser({ chatId, userId }) {
    await getOwnedChat(chatId, userId);
    return listChatMessages(chatId);
}

async function updateChatTitleForUser({ chatId, userId, title }) {
    const nextTitle = title?.trim();

    if (!nextTitle) {
        throw createServiceError(400, 'Title is required');
    }

    const chat = await getOwnedChat(chatId, userId);
    chat.title = nextTitle;
    chat.lastActivity = new Date();
    await chat.save();

    return chat;
}

async function deleteChatForUser({ chatId, userId }) {
    const chat = await getOwnedChat(chatId, userId);
    const messages = await messageModel.find({ chat: chat._id }).select('_id');
    const messageIds = messages.map((item) => String(item._id));

    if (messageIds.length > 0) {
        await deleteMemories(messageIds);
        await messageModel.deleteMany({ _id: { $in: messageIds } });
    }

    await chat.deleteOne();
}

function buildChatHistory(messages) {
    return messages.map((item) => ({
        role: item.role,
        parts: [ { text: item.content } ]
    }));
}

function buildMemoryPrompt(memoryMatches) {
    const memoryText = memoryMatches
        .map((item) => item?.metadata?.text)
        .filter(Boolean)
        .join('\n');

    if (!memoryText) {
        return [];
    }

    return [ {
        role: 'user',
        parts: [ {
            text: `
These are some previous messages from the chat. Use them to generate a response.

${memoryText}
`
        } ]
    } ];
}

async function createAiReplyForMessage({ chatId, userId, userMessage }) {
    const content = userMessage.content.trim();
    const vectors = await aiService.generateVector(content);

    await createMemory({
        vectors,
        messageId: userMessage._id,
        metadata: {
            chat: String(chatId),
            user: String(userId),
            role: 'user',
            text: content
        }
    });

    const [ memory, chatHistory ] = await Promise.all([
        queryMemory({
            queryVector: vectors,
            limit: 3,
            metadata: {
                chat: String(chatId),
                user: String(userId)
            }
        }),
        messageModel.find({ chat: chatId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean()
            .then((messages) => messages.reverse())
    ]);

    let responseContent;
    let shouldStoreResponseMemory = true;

    try {
        responseContent = await aiService.generateResponse([
            ...buildMemoryPrompt(memory),
            ...buildChatHistory(chatHistory)
        ]);
    } catch (error) {
        responseContent = aiService.getAiErrorMessage(error);
        shouldStoreResponseMemory = false;
    }

    const responseMessage = await messageModel.create({
        chat: chatId,
        user: userId,
        content: responseContent,
        role: 'model'
    });

    if (shouldStoreResponseMemory) {
        const responseVectors = await aiService.generateVector(responseContent);

        await createMemory({
            vectors: responseVectors,
            messageId: responseMessage._id,
            metadata: {
                chat: String(chatId),
                user: String(userId),
                role: 'model',
                text: responseContent
            }
        });
    }

    await chatModel.findByIdAndUpdate(chatId, { lastActivity: new Date() });

    return {
        userMessage,
        responseMessage
    };
}

async function sendMessageAndGenerateReply({ chatId, userId, content }) {
    const nextContent = content?.trim();

    if (!nextContent) {
        throw createServiceError(400, 'Unable to send an empty message.');
    }

    await getOwnedChat(chatId, userId);

    const userMessage = await messageModel.create({
        chat: chatId,
        user: userId,
        content: nextContent,
        role: 'user'
    });

    return createAiReplyForMessage({ chatId, userId, userMessage });
}

async function editMessageAndGenerateReply({ messageId, userId, content }) {
    const nextContent = content?.trim();

    if (!nextContent) {
        throw createServiceError(400, 'Message content is required');
    }

    const userMessage = await messageModel.findOne({
        _id: messageId,
        user: userId,
        role: 'user'
    });

    if (!userMessage) {
        throw createServiceError(404, 'User message not found');
    }

    const chatId = userMessage.chat;

    await getOwnedChat(chatId, userId);

    const laterMessages = await messageModel.find({
        chat: chatId,
        createdAt: { $gt: userMessage.createdAt }
    }).select('_id');

    const laterMessageIds = laterMessages.map((item) => String(item._id));

    if (laterMessageIds.length > 0) {
        await messageModel.deleteMany({
            _id: { $in: laterMessageIds }
        });
        await deleteMemories(laterMessageIds);
    }

    userMessage.content = nextContent;
    await userMessage.save();

    return createAiReplyForMessage({
        chatId,
        userId,
        userMessage
    });
}

module.exports = {
    listChatMessagesForUser,
    updateChatTitleForUser,
    deleteChatForUser,
    sendMessageAndGenerateReply,
    editMessageAndGenerateReply
};

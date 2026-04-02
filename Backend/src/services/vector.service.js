// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone')

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const cohortChatGptIndex = pc.Index('cohort-chat-gpt');

function normalizeMetadataValue(value) {
    if (value == null) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(normalizeMetadataValue);
    }

    if (typeof value === 'object' && typeof value.toString === 'function') {
        if (value.constructor?.name === 'ObjectId' || value._bsontype === 'ObjectId') {
            return value.toString();
        }
    }

    return value;
}

function normalizeMetadata(metadata = {}) {
    return Object.fromEntries(
        Object.entries(metadata).map(([ key, value ]) => [ key, normalizeMetadataValue(value) ])
    );
}

async function createMemory({ vectors, metadata, messageId }) {
    const normalizedMetadata = normalizeMetadata(metadata);

    await cohortChatGptIndex.upsert([ {
        id: String(messageId),
        values: vectors,
        metadata: normalizedMetadata
    } ])
}


async function queryMemory({ queryVector, limit = 5, metadata }) {
    const normalizedMetadata = metadata ? normalizeMetadata(metadata) : undefined;

    const data = await cohortChatGptIndex.query({
        vector: queryVector,
        topK: limit,
        filter: normalizedMetadata,
        includeMetadata: true
    })

    return data.matches

}

async function deleteMemories(messageIds = []) {
    if (!messageIds.length) {
        return;
    }

    await cohortChatGptIndex.deleteMany(messageIds.map(String));
}

module.exports = { createMemory, queryMemory, deleteMemories }

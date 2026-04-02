const stores = new Map();

function getStore(name) {
    if (!stores.has(name)) {
        stores.set(name, new Map());
    }

    return stores.get(name);
}

function cleanupExpiredEntries(store, now) {
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) {
            store.delete(key);
        }
    }
}

function consumeRateLimit({ store, key, windowMs, limit, now = Date.now() }) {
    cleanupExpiredEntries(store, now);

    const current = store.get(key);

    if (!current || current.resetAt <= now) {
        const nextEntry = {
            count: 1,
            resetAt: now + windowMs
        };
        store.set(key, nextEntry);

        return {
            allowed: true,
            remaining: Math.max(limit - nextEntry.count, 0),
            resetAt: nextEntry.resetAt
        };
    }

    current.count += 1;
    store.set(key, current);

    return {
        allowed: current.count <= limit,
        remaining: Math.max(limit - current.count, 0),
        resetAt: current.resetAt
    };
}

function getRetryAfterSeconds(resetAt, now = Date.now()) {
    return Math.max(Math.ceil((resetAt - now) / 1000), 1);
}

function createRateLimitMiddleware({
    name,
    windowMs,
    limit,
    message = 'Too many requests. Please try again later.',
    keyGenerator,
}) {
    const store = getStore(name);

    return function rateLimitMiddleware(req, res, next) {
        const key = keyGenerator ? keyGenerator(req) : (req.ip || 'anonymous');
        const result = consumeRateLimit({ store, key, windowMs, limit });

        res.setHeader('X-RateLimit-Limit', String(limit));
        res.setHeader('X-RateLimit-Remaining', String(result.remaining));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

        if (result.allowed) {
            next();
            return;
        }

        res.setHeader('Retry-After', String(getRetryAfterSeconds(result.resetAt)));
        res.status(429).json({ message });
    };
}

function createSocketRateLimiter({
    name,
    windowMs,
    limit,
    keyGenerator,
}) {
    const store = getStore(name);

    return function socketRateLimiter(socket) {
        const key = keyGenerator ? keyGenerator(socket) : (socket.user?._id?.toString() || socket.id);
        return consumeRateLimit({ store, key, windowMs, limit });
    };
}

module.exports = {
    createRateLimitMiddleware,
    createSocketRateLimiter,
    getRetryAfterSeconds
};

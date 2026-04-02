const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');

function parseAllowedOrigins(value) {
    return (value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

const app = express();
const builtFrontendDir = path.resolve(__dirname, '../../Frontend/dist');
const legacyPublicDir = path.resolve(__dirname, '../public');
const staticDir = fs.existsSync(builtFrontendDir) ? builtFrontendDir : legacyPublicDir;
const allowedOrigins = [
    ...parseAllowedOrigins(process.env.FRONTEND_URL),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
].filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

app.use(express.json());
app.use(cookieParser());
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.use(express.static(staticDir));

app.use('/api', cors(corsOptions));
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

module.exports = app;

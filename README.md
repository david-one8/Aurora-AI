# 🌟 Aurora AI

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-FF6B6B?style=for-the-badge)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)

*Intelligent chat application with Gemini API and real-time messaging*

## ✨ Features

🤖 **AI Chat** - Powered by Google Gemini 2.0 Flash  
⚡ **Real-time** - Socket.io WebSocket connections  
🔐 **Authentication** - JWT with bcrypt encryption  
🧠 **Vector Memory** - Pinecone database integration  
🎨 **Theme Toggle** - Dark/Light mode support  
📱 **Mobile Ready** - Responsive chat interface  
📝 **Auto-resize** - Smart textarea with keyboard shortcuts  
💾 **Persistent** - Chat history stored in MongoDB  

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React framework
- **Redux Toolkit** - State management
- **React Router v7** - Client routing
- **Vite 7** - Build tool
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js + Express 5** - Server framework
- **Socket.io** - WebSocket server
- **MongoDB + Mongoose** - Database
- **Google GenAI** - Gemini AI integration
- **Pinecone** - Vector database
- **JWT + bcrypt** - Authentication

## 🚀 Quick Start

### Prerequisites
```
Node.js 18+ | MongoDB Atlas | Google AI Studio | Pinecone Account
```

### API Keys Setup
1. **Gemini API** - Get from [Google AI Studio](https://aistudio.google.com/)
2. **Pinecone API** - Create account at [Pinecone](https://www.pinecone.io/)
3. **MongoDB** - Set up cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)

### Installation

```bash
# Clone repository
git clone https://github.com/david-one8/Aurora-AI.git
cd Aurora-AI

# Install backend
cd Backend && npm install

# Install frontend
cd ../Frontend && npm install
```

### Environment Setup
Create `.env` in Backend directory:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
```

### Run Application

```bash
# Start backend (Port 3000)
cd Backend && npm start

# Start frontend (Port 5173)
cd Frontend && npm run dev
```

## 📁 Project Structure

```
Aurora-AI/
├── Backend/
│   ├── src/
│   │   ├── controllers/     # auth, chat
│   │   ├── models/          # user, chat, message
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # ai, vector
│   │   ├── sockets/         # real-time messaging
│   │   ├── middlewares/     # auth middleware
│   │   └── db/             # database connection
│   └── server.js
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── chat/        # ChatComposer, ChatMessages, ChatSidebar
    │   │   └── ThemeToggle.jsx
    │   ├── pages/           # Home, Login, Register
    │   ├── store/           # Redux store
    │   └── styles/          # theme styles
    └── vite.config.js
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Chat
- `GET /api/chat` - Get chat history
- `POST /api/chat` - Send message
- `WebSocket` - Real-time messaging

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🐛 Bug Reports
- Use GitHub Issues to report bugs
- Include steps to reproduce
- Provide system information

### ✨ Feature Requests
- Open an issue with feature description
- Explain use case and benefits
- Discuss implementation approach

### 🔧 Development Setup
```bash
# 1. Fork & Clone
git clone https://github.com/your-username/Aurora-AI.git
cd Aurora-AI

# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Make changes & test
npm test

# 4. Commit with conventional format
git commit -m "feat: add amazing feature"

# 5. Push & create PR
git push origin feature/amazing-feature
```

### 📋 Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and descriptive

## 💻 Developer

<div align="center">

**David Fule ❤️** - *Full Stack Developer & AI Enthusiast*

[![GitHub](https://img.shields.io/badge/GitHub-david--one8-181717?style=for-the-badge&logo=github)](https://github.com/david-one8)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/david-one8)

*"Building the future of AI-powered conversations, one commit at a time."*

</div>

## 📄 License

ISC License

Copyright (c) 2024 David

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

<div align="center">

**⭐ Star this repo if you found it helpful!**

*Made with ❤️ by [David](https://github.com/david-one8)*

</div>
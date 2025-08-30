# Aurora AI

A full-stack AI chat application with real-time messaging capabilities.

## Features

- Real-time chat with AI using WebSocket connections
- User authentication and authorization
- Vector database integration for enhanced AI responses
- Modern React frontend with responsive design
- Node.js backend with Express.js
- MongoDB database integration

## Tech Stack

### Frontend
- React.js
- Redux Toolkit for state management
- CSS3 for styling
- Vite for build tooling

### Backend
- Node.js
- Express.js
- Socket.io for real-time communication
- MongoDB with Mongoose
- JWT for authentication
- Gemini AI API integration
- Pinecone vector database

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Gemini API key
- Pinecone API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/david-one8/Aurora-AI.git
cd Aurora-AI
```

2. Install backend dependencies
```bash
cd Backend
npm install
```

3. Install frontend dependencies
```bash
cd ../Frontend
npm install
```

4. Set up environment variables
Create a `.env` file in the Backend directory with:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
```

### Running the Application

1. Start the backend server
```bash
cd Backend
npm start
```

2. Start the frontend development server
```bash
cd Frontend
npm run dev
```

## Project Structure

```
Aurora-AI/
├── Backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── sockets/
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── store/
    └── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
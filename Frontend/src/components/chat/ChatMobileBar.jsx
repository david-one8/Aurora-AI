import React from 'react';
import './ChatMobileBar.css';
import './ChatLayout.css';

const ChatMobileBar = ({ onToggleSidebar, onNewChat, onLogout }) => (
  <header className="chat-mobile-bar">
    <button className="chat-icon-btn" onClick={onToggleSidebar} aria-label="Toggle chat history">
      Menu
    </button>
    <h1 className="chat-app-title">Chat</h1>
    <div className="chat-mobile-actions">
      <button className="chat-icon-btn" onClick={onNewChat} aria-label="New chat">
        New
      </button>
      <button className="chat-icon-btn subtle" onClick={onLogout} aria-label="Log out">
        Log out
      </button>
    </div>
  </header>
);

export default ChatMobileBar;

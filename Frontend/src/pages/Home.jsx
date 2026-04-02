import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ChatMobileBar from '../components/chat/ChatMobileBar.jsx';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ChatComposer from '../components/chat/ChatComposer.jsx';
import '../components/chat/ChatLayout.css';
import {
  startNewChat,
  selectChat,
  setChats,
  setInput,
  sendingStarted,
  sendingFinished,
} from '../store/chatSlice.js';
import { api, getErrorMessage, SOCKET_URL } from '../lib/api.js';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const chats = useSelector((state) => state.chat.chats);
  const activeChatId = useSelector((state) => state.chat.activeChatId);
  const input = useSelector((state) => state.chat.input);
  const isSending = useSelector((state) => state.chat.isSending);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const socketRef = useRef(null);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    let isMounted = true;

    async function loadChats() {
      try {
        const response = await api.get('/api/chat');

        if (!isMounted) {
          return;
        }

        const nextChats = response.data.chats.slice();
        dispatch(setChats(nextChats));

        if (!activeChatIdRef.current && nextChats.length > 0) {
          dispatch(selectChat(nextChats[0]._id));
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          navigate('/login');
          return;
        }

        setStatusMessage(getErrorMessage(error, 'Unable to load your chats.'));
      }
    }

    loadChats();

    return () => {
      isMounted = false;
    };
  }, [dispatch, navigate]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.on('ai-response', (messagePayload) => {
      if (messagePayload.chat !== activeChatIdRef.current) {
        dispatch(sendingFinished());
        return;
      }

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `${messagePayload.chat}-${prevMessages.length}`,
          type: 'ai',
          content: messagePayload.content,
        },
      ]);
      setStatusMessage('');
      dispatch(sendingFinished());
    });

    socket.on('connect_error', (error) => {
      if (error?.message?.includes('Authentication')) {
        return;
      }

      setStatusMessage('Realtime connection is unavailable. Please try again in a moment.');
      dispatch(sendingFinished());
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!activeChatId) {
        setMessages([]);
        return;
      }

      try {
        const response = await api.get(`/api/chat/messages/${activeChatId}`);

        if (!isMounted) {
          return;
        }

        setMessages(response.data.messages.map((message) => ({
          id: message._id,
          type: message.role === 'user' ? 'user' : 'ai',
          content: message.content,
        })));
        setStatusMessage('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          navigate('/login');
          return;
        }

        setStatusMessage(getErrorMessage(error, 'Unable to load the messages for this chat.'));
      }
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeChatId, navigate]);

  const handleNewChat = async () => {
    let title = window.prompt('Enter a title for the new chat:', '');
    if (title) {
      title = title.trim();
    }

    if (!title) {
      return;
    }

    try {
      setStatusMessage('');
      const response = await api.post('/api/chat', { title });
      dispatch(startNewChat(response.data.chat));
      setMessages([]);
      setSidebarOpen(false);
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }

      setStatusMessage(getErrorMessage(error, 'Unable to create a chat right now.'));
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();

    if (!trimmed || !activeChatId || isSending) {
      return;
    }

    if (!socketRef.current?.connected) {
      setStatusMessage('Realtime connection is not ready yet.');
      return;
    }

    dispatch(sendingStarted());
    setStatusMessage('');

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: `user-${Date.now()}`,
        type: 'user',
        content: trimmed,
      },
    ]);
    dispatch(setInput(''));

    socketRef.current.emit('ai-message', {
      chat: activeChatId,
      content: trimmed,
    });
  };

  return (
    <div className="chat-layout minimal">
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onNewChat={handleNewChat}
      />
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        open={sidebarOpen}
      />
      <main className="chat-main" role="main">
        {statusMessage && (
          <p className="chat-status" role="status">
            {statusMessage}
          </p>
        )}
        {messages.length === 0 && (
          <div className="chat-welcome" aria-hidden="true">
            <div className="chip">Hello, Dreamer!</div>
            <h1>Aurora AI</h1>
            <p>
              Ignite your ideas with Aurora AI, your smart real-time chat companion. Start a
              fresh conversation or pick up where you left off.
            </p>
          </div>
        )}
        <ChatMessages messages={messages} isSending={isSending} />
        {activeChatId && (
          <ChatComposer
            input={input}
            setInput={(value) => dispatch(setInput(value))}
            onSend={sendMessage}
            isSending={isSending}
          />
        )}
      </main>
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;

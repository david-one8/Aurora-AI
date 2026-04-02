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
  resetChatState,
  sendingStarted,
  sendingFinished,
} from '../store/chatSlice.js';
import { api, getErrorMessage, SOCKET_URL } from '../lib/api.js';

const STATUS_MESSAGE_DURATION_MS = 3200;

function mapServerMessage(message) {
  const createdAt = message.createdAt ? new Date(message.createdAt).getTime() : 0;
  const updatedAt = message.updatedAt ? new Date(message.updatedAt).getTime() : createdAt;

  return {
    id: message._id,
    type: message.role === 'user' ? 'user' : 'ai',
    content: message.content,
    pending: false,
    edited: updatedAt - createdAt > 1000,
  };
}

function createClientMessageId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
  const [editingMessageId, setEditingMessageId] = useState(null);
  const socketRef = useRef(null);
  const activeChatIdRef = useRef(activeChatId);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusMessage('');
    }, STATUS_MESSAGE_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusMessage]);

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
          if (isLoggingOutRef.current) {
            return;
          }

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

      setMessages((prevMessages) => {
        const nextMessages = prevMessages.map((message) => {
          if (message.clientId !== messagePayload.clientMessageId) {
            return message;
          }

          return {
            ...message,
            id: messagePayload.userMessageId || message.id,
            pending: false,
          };
        });

        if (!messagePayload.content) {
          return nextMessages;
        }

        const responseId = messagePayload.responseMessageId || `ai-${messagePayload.clientMessageId || Date.now()}`;

        if (nextMessages.some((message) => message.id === responseId)) {
          return nextMessages;
        }

        return [
          ...nextMessages,
          {
            id: responseId,
            type: 'ai',
            content: messagePayload.content,
            pending: false,
            edited: false,
          },
        ];
      });
      setStatusMessage('');
      dispatch(sendingFinished());
    });

    socket.on('connect_error', (error) => {
      if (isLoggingOutRef.current) {
        return;
      }

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
        setEditingMessageId(null);
        return;
      }

      try {
        const response = await api.get(`/api/chat/messages/${activeChatId}`);

        if (!isMounted) {
          return;
        }

        setMessages(response.data.messages.map(mapServerMessage));
        setEditingMessageId(null);
        setStatusMessage('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          if (isLoggingOutRef.current) {
            return;
          }

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
      setEditingMessageId(null);
      dispatch(setInput(''));
      setSidebarOpen(false);
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }

      setStatusMessage(getErrorMessage(error, 'Unable to create a chat right now.'));
    }
  };

  const handleRenameChat = async (chat) => {
    const initialTitle = chat?.title || '';
    let title = window.prompt('Rename this chat:', initialTitle);

    if (title == null) {
      return;
    }

    title = title.trim();

    if (!title || title === initialTitle) {
      return;
    }

    try {
      const response = await api.patch(`/api/chat/${chat._id}`, { title });
      const updatedChat = response.data.chat;
      const nextChats = chats.map((item) => (item._id === updatedChat._id ? updatedChat : item));
      dispatch(setChats(nextChats));
      setStatusMessage('');
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }

      setStatusMessage(getErrorMessage(error, 'Unable to rename this chat right now.'));
    }
  };

  const handleDeleteChat = async (chat) => {
    const shouldDelete = window.confirm(`Delete "${chat.title}"? This will remove its messages too.`);

    if (!shouldDelete) {
      return;
    }

    try {
      await api.delete(`/api/chat/${chat._id}`);
      const nextChats = chats.filter((item) => item._id !== chat._id);
      dispatch(setChats(nextChats));

      if (activeChatId === chat._id) {
        const nextActiveChatId = nextChats[0]?._id || null;
        dispatch(selectChat(nextActiveChatId));
        setMessages([]);
        setEditingMessageId(null);
        dispatch(setInput(''));
      }

      setStatusMessage('');
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }

      setStatusMessage(getErrorMessage(error, 'Unable to delete this chat right now.'));
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
    setEditingMessageId(null);

    const clientMessageId = createClientMessageId();

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: clientMessageId,
        clientId: clientMessageId,
        type: 'user',
        content: trimmed,
        pending: true,
        edited: false,
      },
    ]);
    dispatch(setInput(''));

    socketRef.current.emit('ai-message', {
      chat: activeChatId,
      content: trimmed,
      clientMessageId,
    });
  };

  const handleStartEditing = (message) => {
    if (!message?.id || message.pending || message.type !== 'user') {
      return;
    }

    setEditingMessageId(message.id);
    dispatch(setInput(message.content));
    setStatusMessage('Editing this message will replace the later replies in this chat.');
  };

  const handleCancelEditing = () => {
    setEditingMessageId(null);
    dispatch(setInput(''));
    setStatusMessage('');
  };

  const handleEditMessage = async () => {
    const trimmed = input.trim();

    if (!trimmed || !editingMessageId || isSending) {
      return;
    }

    dispatch(sendingStarted());
    setStatusMessage('');

    try {
      const response = await api.patch(`/api/chat/messages/${editingMessageId}`, {
        content: trimmed,
      });

      setMessages(response.data.messages.map(mapServerMessage));
      setEditingMessageId(null);
      dispatch(setInput(''));
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate('/login');
        return;
      }

      setStatusMessage(getErrorMessage(error, 'Unable to edit that message right now.'));
    } finally {
      dispatch(sendingFinished());
    }
  };

  const handleLogout = async () => {
    isLoggingOutRef.current = true;

    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      if (error?.response?.status && error.response.status !== 401) {
        isLoggingOutRef.current = false;
        setStatusMessage(getErrorMessage(error, 'Unable to log out right now.'));
        return;
      }
    }

    if (socketRef.current?.io?.opts) {
      socketRef.current.io.opts.reconnection = false;
    }
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
    dispatch(resetChatState());
    setMessages([]);
    setEditingMessageId(null);
    setStatusMessage('');
    setSidebarOpen(false);
    navigate('/login?logged_out=1', { replace: true });
  };

  return (
    <div className="chat-layout minimal">
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
      />
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setEditingMessageId(null);
          dispatch(setInput(''));
          setStatusMessage('');
          setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onLogout={handleLogout}
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
        <ChatMessages
          messages={messages}
          isSending={isSending}
          editingMessageId={editingMessageId}
          onEditMessage={handleStartEditing}
        />
        {activeChatId && (
          <ChatComposer
            input={input}
            setInput={(value) => dispatch(setInput(value))}
            onSend={editingMessageId ? handleEditMessage : sendMessage}
            isEditing={Boolean(editingMessageId)}
            onCancelEdit={handleCancelEditing}
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

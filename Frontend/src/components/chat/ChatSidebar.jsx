import React, { useEffect, useRef, useState } from 'react';
import './ChatSidebar.css';

const MENU_WIDTH = 132;
const MENU_HEIGHT = 104;
const MENU_GAP = 8;

const ChatSidebar = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onLogout,
  open,
}) => {
  const [menuState, setMenuState] = useState(null);
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);

  const closeMenu = () => {
    setMenuState(null);
  };

  const openMenu = (event, chat) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const preferredLeft = rect.right - MENU_WIDTH;
    const left = Math.min(
      Math.max(MENU_GAP, preferredLeft),
      viewportWidth - MENU_WIDTH - MENU_GAP
    );
    const opensUpward = rect.bottom + MENU_GAP + MENU_HEIGHT > viewportHeight - MENU_GAP;
    const top = opensUpward
      ? Math.max(MENU_GAP, rect.top - MENU_HEIGHT - MENU_GAP)
      : Math.min(rect.bottom + MENU_GAP, viewportHeight - MENU_HEIGHT - MENU_GAP);

    setMenuState({
      chat,
      top,
      left,
    });
  };

  useEffect(() => {
    function handlePointerDown(event) {
      if (menuRef.current?.contains(event.target)) {
        return;
      }

      if (!sidebarRef.current?.contains(event.target)) {
        closeMenu();
        return;
      }

      if (!event.target.closest('.chat-menu-trigger')) {
        closeMenu();
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    }

    function handleViewportChange() {
      closeMenu();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className={"chat-sidebar " + (open ? 'open' : '')}
      aria-label="Previous chats"
    >
      <div className="sidebar-header">
        <h2>Chats</h2>
        <button className="small-btn" onClick={onNewChat}>New</button>
      </div>
      <nav className="chat-list" aria-live="polite">
        {chats.map(c => (
          <div
            key={c._id}
            className={"chat-list-row " + (c._id === activeChatId ? 'active' : '')}
          >
            <button
              className={"chat-list-item " + (c._id === activeChatId ? 'active' : '')}
              onClick={() => onSelectChat(c._id)}
            >
              <span className="title-line">{c.title}</span>
            </button>
            <div className="chat-item-actions">
              <button
                type="button"
                className="chat-menu-trigger"
                aria-label={"Open chat options for " + c.title}
                aria-haspopup="menu"
                aria-expanded={menuState?.chat._id === c._id}
                onClick={(event) => {
                  if (menuState?.chat._id === c._id) {
                    closeMenu();
                    return;
                  }

                  openMenu(event, c);
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="5" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {chats.length === 0 && <p className="empty-hint">No chats yet.</p>}
      </nav>
      {menuState && (
        <div
          ref={menuRef}
          className="chat-menu"
          role="menu"
          aria-label={"Options for " + menuState.chat.title}
          style={{
            top: `${menuState.top}px`,
            left: `${menuState.left}px`,
          }}
        >
          <button
            type="button"
            className="chat-menu-item"
            role="menuitem"
            onClick={() => {
              const { chat } = menuState;
              closeMenu();
              onRenameChat(chat);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="chat-menu-item danger"
            role="menuitem"
            onClick={() => {
              const { chat } = menuState;
              closeMenu();
              onDeleteChat(chat);
            }}
          >
            Delete
          </button>
        </div>
      )}
      <div className="sidebar-footer">
        <button className="small-btn secondary" onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
};

export default ChatSidebar;

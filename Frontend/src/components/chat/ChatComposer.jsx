import React, { useCallback, useRef, useLayoutEffect } from 'react';
import './ChatComposer.css';

const ChatComposer = ({ input, setInput, onSend, isSending }) => {
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 320)}px`;
  }, [input]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (input.trim()) onSend();
    }
  }, [onSend, input]);

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (input.trim()) onSend();
      }}
    >
      <div className="composer-surface" data-state={isSending ? 'sending' : undefined}>
        <div className="composer-field">
          <textarea
            ref={textareaRef}
            className="composer-input"
            placeholder="Message Aurora AI..."
            aria-label="Message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            spellCheck
            autoComplete="off"
          />
          <div className="composer-hint" aria-hidden="true">
            Enter to send. Shift+Enter adds a new line.
          </div>
        </div>
        <button
          type="submit"
          className="send-btn icon-btn"
          disabled={!input.trim() || isSending}
          aria-label={isSending ? 'Sending...' : 'Send message'}
        >
          <span className="send-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>
    </form>
  );
};

export default ChatComposer;

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api.js';

const AuthRoute = ({ children, mode }) => {
  const [state, setState] = useState({
    loading: true,
    authenticated: false,
    errorMessage: '',
  });

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        await api.get('/api/auth/session');

        if (!isMounted) {
          return;
        }

        setState({
          loading: false,
          authenticated: true,
          errorMessage: '',
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.response?.status === 401) {
          setState({
            loading: false,
            authenticated: false,
            errorMessage: '',
          });
          return;
        }

        setState({
          loading: false,
          authenticated: false,
          errorMessage: getErrorMessage(error, 'Unable to verify your session right now.'),
        });
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card" role="status" aria-live="polite">
          <header className="auth-header">
            <div className="auth-chip">Aurora AI</div>
            <h1>Checking session</h1>
            <p className="auth-sub">Just a moment while we verify your access.</p>
          </header>
        </div>
      </div>
    );
  }

  if (mode === 'protected') {
    if (!state.authenticated) {
      return <Navigate to="/login" replace />;
    }

    return children;
  }

  if (state.authenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {state.errorMessage && (
        <div className="auth-route-banner" role="status">
          {state.errorMessage}
        </div>
      )}
      {children}
    </>
  );
};

export default AuthRoute;

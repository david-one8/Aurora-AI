import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api.js';

const AuthRoute = ({ children, mode }) => {
  const location = useLocation();
  const routeKey = useMemo(() => `${mode}:${location.pathname}`, [location.pathname, mode]);
  const [state, setState] = useState({
    routeKey,
    loading: true,
    authenticated: false,
    errorMessage: '',
  });

  useEffect(() => {
    let isMounted = true;

    setState((current) => ({
      ...current,
      routeKey,
      loading: true,
      errorMessage: '',
    }));

    async function checkSession() {
      try {
        const response = await api.get('/api/auth/session');

        if (!isMounted) {
          return;
        }

        if (!response.data?.authenticated) {
          setState({
            routeKey,
            loading: false,
            authenticated: false,
            errorMessage: '',
          });
          return;
        }

        setState({
          routeKey,
          loading: false,
          authenticated: true,
          errorMessage: '',
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          routeKey,
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
  }, [routeKey]);

  if (state.routeKey !== routeKey || state.loading) {
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

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../lib/api.js';

const SESSION_CHECK_ATTEMPTS = 5;
const SESSION_CHECK_DELAY_MS = 150;
const TRANSIENT_MESSAGE_DURATION_MS = 3200;

function waitForDelay(durationMs) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, durationMs);
    });
}

const Login = () => {
    const [ form, setForm ] = useState({ email: '', password: '' });
    const [ submitting, setSubmitting ] = useState(false);
    const [ errorMessage, setErrorMessage ] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const [ visibleSuccessMessage, setVisibleSuccessMessage ] = useState('');
    const successMessage = useMemo(() => {
        if (location.state?.successMessage) {
            return location.state.successMessage;
        }

        const params = new URLSearchParams(location.search);

        if (params.get('registered') === '1') {
            return 'Account created successfully. Please sign in.';
        }

        if (params.get('logged_out') === '1') {
            return 'You have been signed out.';
        }

        return '';
    }, [ location.search, location.state ]);

    useEffect(() => {
        if (!successMessage) {
            setVisibleSuccessMessage('');
            return undefined;
        }

        setVisibleSuccessMessage(successMessage);

        const timeoutId = window.setTimeout(() => {
            setVisibleSuccessMessage('');

            if (location.search || location.state?.successMessage) {
                navigate(location.pathname, { replace: true, state: null });
            }
        }, TRANSIENT_MESSAGE_DURATION_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [ location.pathname, location.search, location.state, navigate, successMessage ]);

    function handleChange(e) {
        const { name, value } = e.target;
        setForm({ ...form, [ name ]: value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage('');

        try {
            await api.post('/api/auth/login', {
                email: form.email,
                password: form.password
            });

            let authenticated = false;

            for (let attempt = 0; attempt < SESSION_CHECK_ATTEMPTS; attempt += 1) {
                const sessionResponse = await api.get('/api/auth/session');

                if (sessionResponse.data?.authenticated) {
                    authenticated = true;
                    break;
                }

                await waitForDelay(SESSION_CHECK_DELAY_MS);
            }

            if (!authenticated) {
                throw new Error('Signed in, but your session was not ready. Please try again.');
            }

            navigate('/', { replace: true });
        } catch (err) {
            setErrorMessage(getErrorMessage(err, 'Unable to sign in right now.'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-shell">
            <div className="auth-card" role="main" aria-labelledby="login-heading">
                <header className="auth-header">
                    <div className="auth-chip">Aurora AI</div>
                    <h1 id="login-heading">Sign in</h1>
                    <p className="auth-sub">Welcome back. We've missed you.</p>
                </header>
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    {visibleSuccessMessage && <p className="form-feedback success" role="status">{visibleSuccessMessage}</p>}
                    {errorMessage && <p className="form-feedback error" role="alert">{errorMessage}</p>}
                    <div className="field-group">
                        <label htmlFor="login-email">Email</label>
                        <input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" onChange={handleChange} required />
                    </div>
                    <div className="field-group">
                        <label htmlFor="login-password">Password</label>
                        <input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Your password" onChange={handleChange} required />
                    </div>
                    <button type="submit" className="primary-btn" disabled={submitting}>
                        {submitting ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                <p className="auth-alt">Need an account? <Link to="/register">Create one</Link></p>
            </div>
        </div>
    );
};

export default Login;


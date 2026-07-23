import { useEffect, useRef, useState } from 'react';
import {
  AUTH_EXPIRED_EVENT,
  getUserInfo,
  loginUser,
  signupUser,
  TOKEN_KEY
} from '../../api/index.js';

const SESSION_VALIDATION_INTERVAL_MS = 30000;

export function useAuthSession({
  setNotice,
  setLoading,
  onLogin,
  onSessionCleared,
  onValidationUnavailable
}) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '');
  const [authStatus, setAuthStatus] = useState(() => (
    localStorage.getItem(TOKEN_KEY) ? 'checking' : 'anonymous'
  ));
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const callbacksRef = useRef({ onLogin, onSessionCleared, onValidationUnavailable });

  callbacksRef.current = { onLogin, onSessionCleared, onValidationUnavailable };

  async function submitAuth(event) {
    event.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'signup') {
        await signupUser(authForm);
        setAuthMode('login');
        setNotice({ type: 'success', message: '회원가입이 완료되었습니다. 같은 정보로 로그인해 주세요.' });
        return;
      }

      const data = await loginUser(authForm);

      localStorage.setItem(TOKEN_KEY, data.accessToken);
      setToken(data.accessToken);
      setAuthStatus('checking');
      callbacksRef.current.onLogin?.();
      setNotice({ type: 'success', message: '로그인 정보를 확인하고 있습니다.' });
    } catch (error) {
      window.alert(error.message);
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setAuthStatus('anonymous');
    callbacksRef.current.onSessionCleared?.();
    setNotice({ type: 'info', message: '로그아웃되었습니다.' });
  }

  useEffect(() => {
    if (!token) {
      setAuthStatus('anonymous');
      return undefined;
    }

    let cancelled = false;

    async function validateSession() {
      try {
        await getUserInfo();

        if (!cancelled) {
          setAuthStatus('authenticated');
        }
      } catch (error) {
        if (cancelled || error.status === 401 || error.status === 403) {
          return;
        }

        setAuthStatus('unverified');
        callbacksRef.current.onValidationUnavailable?.();
        setNotice({
          type: 'error',
          message: '서버에서 로그인 상태를 확인하지 못했습니다. 서버 연결 후 다시 확인합니다.'
        });
      }
    }

    function validateVisibleSession() {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    }

    validateSession();
    window.addEventListener('focus', validateSession);
    document.addEventListener('visibilitychange', validateVisibleSession);
    const intervalId = window.setInterval(validateVisibleSession, SESSION_VALIDATION_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', validateSession);
      document.removeEventListener('visibilitychange', validateVisibleSession);
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    function expireSession() {
      localStorage.removeItem(TOKEN_KEY);
      setToken('');
      setAuthStatus('anonymous');
      callbacksRef.current.onSessionCleared?.();
      setNotice({ type: 'info', message: '로그인 세션이 만료되어 로그아웃되었습니다.' });
    }

    function syncToken(event) {
      if (event.key !== TOKEN_KEY) {
        return;
      }

      setToken(event.newValue ?? '');
      setAuthStatus(event.newValue ? 'checking' : 'anonymous');

      if (!event.newValue) {
        callbacksRef.current.onSessionCleared?.();
      }
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    window.addEventListener('storage', syncToken);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
      window.removeEventListener('storage', syncToken);
    };
  }, []);

  return {
    token,
    authStatus,
    authMode,
    setAuthMode,
    authForm,
    setAuthForm,
    submitAuth,
    logout
  };
}

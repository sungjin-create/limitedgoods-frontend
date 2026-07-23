export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
export const TOKEN_KEY = 'limitedgoods.accessToken';
export const AUTH_EXPIRED_EVENT = 'limitedgoods:auth-expired';

function unwrap(response) {
  return response?.data ?? response;
}

function formatFieldErrors(errors) {
  if (Array.isArray(errors)) {
    const messages = errors
      .map((error) => {
        if (typeof error === 'string') return error;

        const message = error?.message ?? error?.defaultMessage ?? error?.reason;
        if (!message) return null;

        const field = error?.field ?? error?.property ?? error?.path;
        return field ? `${field}: ${message}` : message;
      })
      .filter(Boolean);

    return messages.length ? messages.join('\n') : null;
  }

  if (errors && typeof errors === 'object') {
    const messages = Object.entries(errors)
      .map(([field, value]) => {
        const message = Array.isArray(value) ? value.join(', ') : value;
        return typeof message === 'string' ? `${field}: ${message}` : null;
      })
      .filter(Boolean);

    return messages.length ? messages.join('\n') : null;
  }

  return null;
}

function getErrorMessage(payload, fallbackMessage) {
  if (typeof payload === 'string') return payload;

  const message = payload?.message
    ?? payload?.detail
    ?? payload?.errorMessage
    ?? payload?.error?.message
    ?? payload?.data?.message;

  if (typeof message === 'string' && message.trim()) return message;

  return formatFieldErrors(
    payload?.errors
    ?? payload?.fieldErrors
    ?? payload?.violations
    ?? payload?.data?.errors
  ) ?? fallbackMessage;
}

export async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const { authRequired = false, ...fetchOptions } = options;

  if (authRequired && !token) {
    const error = new Error('로그인이 필요한 요청입니다.');
    error.status = 401;
    throw error;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestOptions = {
    ...fetchOptions,
    headers
  };

  // 목록 조회는 브라우저 캐시를 사용하지 않고 항상 서버의 최신 상태를 확인한다.
  if (!fetchOptions.method || fetchOptions.method.toUpperCase() === 'GET') {
    requestOptions.cache = 'no-store';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, requestOptions);

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(getErrorMessage(payload, '요청을 처리하지 못했습니다.'));
    error.status = response.status;
    error.code = payload?.code ?? payload?.errorCode;
    error.payload = payload;

    if (import.meta.env.DEV) {
      console.error(`[API ${response.status}] ${path}`, payload);
    }

    if (authRequired && token && (response.status === 401 || response.status === 403)) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    throw error;
  }

  return unwrap(payload);
}

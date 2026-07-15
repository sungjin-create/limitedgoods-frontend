export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
export const TOKEN_KEY = 'limitedgoods.accessToken';
export const AUTH_EXPIRED_EVENT = 'limitedgoods:auth-expired';

function unwrap(response) {
  return response?.data ?? response;
}

export async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const { authRequired = false, ...fetchOptions } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers
  });

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
    const error = new Error(payload?.message ?? '요청을 처리하지 못했습니다.');
    error.status = response.status;

    if (authRequired && token && (response.status === 401 || response.status === 403)) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    throw error;
  }

  return unwrap(payload);
}

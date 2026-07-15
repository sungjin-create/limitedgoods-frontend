import { request } from './client.js';

export function signupUser({ email, password, name }) {
  return request('/api/user/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });
}

export function loginUser({ email, password }) {
  return request('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

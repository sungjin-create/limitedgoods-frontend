import { request } from './client.js';

export function enterQueue(productId) {
  return request('/api/user/queue/enter', {
    authRequired: true,
    method: 'POST',
    body: JSON.stringify({ productId: Number(productId) })
  });
}

export function getQueueStatus(productId) {
  const query = new URLSearchParams({ productId: String(Number(productId)) });

  return request(`/api/user/queue/status?${query.toString()}`, {
    authRequired: true
  });
}
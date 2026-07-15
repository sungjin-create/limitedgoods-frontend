import { request } from './client.js';

export function getOrders() {
  return request('/api/user/order', { authRequired: true });
}

export function createOrder(items, { checkoutToken, admissionToken } = {}) {
  return request('/api/user/order/create', {
    authRequired: true,
    method: 'POST',
    body: JSON.stringify({
      checkoutToken,
      admissionToken,
      items: items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity)
      }))
    })
  });
}

export function payOrder(orderId, { forceFail = false } = {}) {
  return request(`/api/user/order/${orderId}/pay`, {
    authRequired: true,
    method: 'POST',
    headers: {
      'Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({ forceFail })
  });
}

export function cancelOrder(orderId) {
  return request(`/api/user/order/${orderId}/cancel`, { method: 'POST', authRequired: true });
}

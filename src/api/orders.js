import { request } from './client.js';

export function getOrders() {
  return request('/api/user/order', { authRequired: true });
}

export function getOrderDetail(orderId) {
  return request(`/api/user/order/${Number(orderId)}`, {
    authRequired: true
  });
}

export function createOrder(items, { checkoutToken, admissionToken } = {}) {
  if (!checkoutToken) {
    throw new Error('주문 생성에 필요한 checkoutToken이 없습니다.');
  }

  const body = {
    checkoutToken,
    items: items.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity)
    }))
  };

  if (admissionToken) {
    body.admissionToken = admissionToken;
  }

  return request('/api/user/order/create', {
    authRequired: true,
    method: 'POST',
    body: JSON.stringify(body)
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

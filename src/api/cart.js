import { request } from './client.js';

export function getCart() {
  return request('/api/cart', { authRequired: true });
}

export function addCartItem({ productId, quantity }) {
  return request('/api/cart/item/add', {
    authRequired: true,
    method: 'POST',
    body: JSON.stringify({
      productId: Number(productId),
      quantity: Number(quantity)
    })
  });
}

export function updateCartItem({ cartItemId, quantity }) {
  return request('/api/cart/item/update', {
    authRequired: true,
    method: 'POST',
    body: JSON.stringify({
      cartItemId: Number(cartItemId),
      quantity: Number(quantity)
    })
  });
}

export function deleteCartItem(cartItemId) {
  const params = new URLSearchParams({
    cartItemId: String(cartItemId)
  });

  return request(`/api/cart/item?${params.toString()}`, {
    authRequired: true,
    method: 'DELETE'
  });
}

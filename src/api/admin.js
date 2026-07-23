import { request } from './client.js';

export function registerProduct({ name, description, price, stock, maxPurchaseQuantity, type, status, saleStartAt, saleEndAt }) {
  return request('/api/admin/backoffice/product/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      maxPurchaseQuantity: maxPurchaseQuantity === '' || maxPurchaseQuantity == null ? null : Number(maxPurchaseQuantity),
      type,
      status,
      saleStartAt: saleStartAt || null,
      saleEndAt: saleEndAt || null
    })
  });
}

export function updateProductConfiguration(product) {
  return request('/api/admin/backoffice/product/update', {
    method: 'PUT',
    authRequired: true,
    body: JSON.stringify({
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      maxPurchaseQuantity: product.maxPurchaseQuantity ?? null,
      type: product.type,
      status: product.status,
      saleStartAt: product.saleStartAt || null,
      saleEndAt: product.saleEndAt || null,
      reason: product.changeReason ?? ''
    })
  });
}

export function adjustProductStock({ id, adjustmentType, quantity, reason }) {
  return request('/api/admin/backoffice/product/stock', {
    method: 'PUT',
    authRequired: true,
    body: JSON.stringify({
      id: Number(id),
      adjustmentType,
      quantity: Number(quantity),
      reason: reason.trim(),
    })
  });
}

export function getAdminProductStockOverview(productId) {
  return request(`/api/admin/backoffice/product/${Number(productId)}/stock-overview`, {
    authRequired: true
  });
}

export function getAdminMonitoringOverview() {
  return request('/api/admin/backoffice/monitoring/overview', {
    authRequired: true
  });
}

export function getAdminBusinessMetrics() {
  return request('/api/admin/backoffice/monitoring/business', {
    authRequired: true
  });
}

export function getAdminDashboard() {
  return request('/api/admin/backoffice/dashboard', {
    authRequired: true
  });
}

export function getAdminOrders({ startAt, endAt } = {}) {
  const params = new URLSearchParams();

  if (startAt) params.set('startAt', startAt);
  if (endAt) params.set('endAt', endAt);

  const query = params.toString();
  const path = query ? `/api/admin/backoffice/order?${query}` : '/api/admin/backoffice/order';

  return request(path, {
    authRequired: true
  });
}

export function completeAdminOrder(orderId) {
  return request(`/api/admin/backoffice/order/${Number(orderId)}/complete`, {
    method: 'PATCH',
    authRequired: true
  });
}

export function getAdminProducts({ status } = {}) {
  const params = new URLSearchParams();

  if (status && status !== 'ALL') {
    params.set('status', status);
  }

  const query = params.toString();
  const path = query ? `/api/admin/backoffice/product?${query}` : '/api/admin/backoffice/product';

  return request(path, {
    authRequired: true
  });
}

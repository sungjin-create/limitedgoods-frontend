import { request } from './client.js';

export function registerProduct({ name, description, price, stock, type, visible, saleStartAt, saleEndAt }) {
  return request('/api/admin/backoffice/product/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      type,
      visible,
      saleStartAt,
      saleEndAt
    })
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

export function getAdminProducts() {
  return request('/api/admin/backoffice/product', {
    authRequired: true
  });
}

import { request } from './client.js';

export async function getProducts({ page = 0, size = 10, keyword = '' } = {}) {
  const trimmedKeyword = keyword.trim();
  const params = new URLSearchParams({
    page: String(page),
    size: String(size)
  });

  if (trimmedKeyword) {
    params.set('keyword', trimmedKeyword);
    return request(`/api/product/search?${params.toString()}`);
  }

  return request(`/api/product?${params.toString()}`);
}

import { API_BASE_URL } from '../api/client.js';

export function resolveImageUrl(imagePath) {
  if (!imagePath) {
    return '';
  }

  if (/^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith('data:')) {
    return imagePath;
  }

  const safePath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_BASE_URL}${safePath}`;
}

export function getProductImages(product) {
  const rawImages = product?.images ?? product?.imageUrls ?? product?.image_urls ?? [];
  const images = Array.isArray(rawImages) ? rawImages : [rawImages];
  const normalizedImages = images
    .map((image) => (typeof image === 'string' ? image : image?.url ?? image?.imageUrl ?? image?.image_url))
    .filter(Boolean);

  const mainImage = product?.imageUrl
    ?? product?.image_url
    ?? product?.thumbnailUrl
    ?? product?.thumbnail_url
    ?? normalizedImages[0]
    ?? '';

  return [mainImage, ...normalizedImages.filter((image) => image !== mainImage)]
    .filter(Boolean)
    .map(resolveImageUrl);
}

export function getProductImage(product) {
  return getProductImages(product)[0] ?? '';
}

export function normalizeCartItems(payload) {
  const rawItems = Array.isArray(payload)
    ? payload
    : (payload?.items ?? payload?.cartItems ?? payload?.content ?? []);

  return rawItems.map((item, index) => {
    const product = item.product ?? item.productDto ?? item.productResponse ?? {};
    const productId =
      item.productId ??
      item.product_id ??
      product.productId ??
      product.product_id ??
      product.id ??
      item.id;
    const quantity = Number(item.quantity ?? item.count ?? 1);
    const price = Number(item.price ?? item.unitPrice ?? product.price ?? 0);
    const name =
      item.productName ??
      item.product_name ??
      item.productTitle ??
      item.product_title ??
      product.name ??
      product.productName ??
      product.product_name ??
      product.title ??
      item.name ??
      item.title ??
      `상품 #${productId ?? '-'}`;

    return {
      id: item.cartItemId ?? item.cart_item_id ?? item.id ?? `${productId}-${index}`,
      productId,
      name,
      description: item.description ?? product.description ?? '',
      imageUrl: item.imageUrl ?? item.image_url ?? product.imageUrl ?? product.image_url ?? '',
      price,
      quantity,
      stock: item.stock ?? product.stock,
      totalPrice: Number(item.totalPrice ?? item.total_price ?? price * quantity)
    };
  });
}

export function getCartSummary(items) {
  return items.reduce((summary, item) => ({
    count: summary.count + Number(item.quantity ?? 0),
    total: summary.total + Number(item.totalPrice ?? 0)
  }), { count: 0, total: 0 });
}

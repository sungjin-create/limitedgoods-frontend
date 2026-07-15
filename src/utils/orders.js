export function normalizeOrder(order, product, quantity) {
  return {
    orderId: order.orderId ?? order.id,
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    totalPrice: order.totalPrice ?? product.price * quantity,
    status: order.status ?? 'CREATED',
    createdAt: order.createdAt
  };
}

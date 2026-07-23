const CHECKOUT_TOKEN_PREFIX = 'limitedgoods.checkoutToken.';

export function buildCheckoutOrder(order, items) {
  const responseItems = order?.items ?? order?.orderItems ?? [];
  const sourceItems = responseItems.length > 0 ? responseItems : items;
  const normalizedItems = sourceItems.map((item, index) => {
    const product = item.product ?? {};
    const productId = item.productId ?? item.product_id ?? product.id ?? item.id;
    const quantity = Number(item.quantity ?? item.count ?? 1);
    const price = Number(item.price ?? item.unitPrice ?? product.price ?? 0);

    return {
      id: item.id ?? item.orderItemId ?? item.cartItemId ?? `${productId}-${index}`,
      productId,
      name: item.productName ?? item.product_name ?? product.name ?? item.name ?? `상품 #${productId ?? '-'}`,
      description: item.description ?? product.description ?? '',
      imageUrl: item.imageUrl ?? item.image_url ?? product.imageUrl ?? product.image_url ?? '',
      price,
      quantity,
      totalPrice: Number(item.totalPrice ?? item.total_price ?? price * quantity)
    };
  });
  const fallbackTotal = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    ...order,
    orderId: order?.orderId ?? order?.id,
    status: order?.status ?? 'CREATED',
    items: normalizedItems,
    totalPrice: Number(order?.totalPrice ?? order?.total_price ?? fallbackTotal)
  };
}

export function createCheckoutKey(items) {
  return items
    .map((item) => `${Number(item.productId)}:${Number(item.quantity)}`)
    .sort()
    .join('|');
}

export function getCheckoutToken(orderItems) {
  const checkoutKey = createCheckoutKey(orderItems);
  const storageKey = `${CHECKOUT_TOKEN_PREFIX}${checkoutKey}`;
  const savedToken = sessionStorage.getItem(storageKey);

  if (savedToken) {
    return { checkoutKey, checkoutToken: savedToken };
  }

  const checkoutToken = crypto.randomUUID();
  sessionStorage.setItem(storageKey, checkoutToken);

  return { checkoutKey, checkoutToken };
}

export function removeStoredCheckoutToken(checkoutKey) {
  if (checkoutKey) {
    sessionStorage.removeItem(`${CHECKOUT_TOKEN_PREFIX}${checkoutKey}`);
  }
}

export function clearStoredCheckoutTokens() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(CHECKOUT_TOKEN_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
}

export function normalizeQueueResponse(data) {
  const admitted = Boolean(data?.admitted ?? data?.isAdmitted ?? data?.allowed);
  const admissionToken = data?.admissionToken ?? data?.token ?? '';
  const positionValue = data?.position ?? data?.queuePosition ?? data?.waitingPosition ?? data?.rank;
  const positionNumber = Number(positionValue);

  return {
    admitted,
    admissionToken,
    position: Number.isFinite(positionNumber) && positionNumber > 0 ? positionNumber : null
  };
}

export function validateAdmissionSnapshot(snapshot) {
  if (snapshot.admitted && !snapshot.admissionToken) {
    throw new Error('입장은 허용됐지만 admissionToken을 받지 못했습니다. 대기열에 다시 진입해 주세요.');
  }
}

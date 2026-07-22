function toDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatSaleDateTime(value) {
  const date = toDate(value);
  if (!date) return null;

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function getProductAvailability(product, now = new Date()) {
  const status = String(product?.status ?? 'ACTIVE').toUpperCase();
  const stock = Number(product?.stock ?? 0);
  const saleStartAt = toDate(product?.saleStartAt);
  const saleEndAt = toDate(product?.saleEndAt);
  const startsInFuture = saleStartAt && saleStartAt > now;
  const saleEnded = saleEndAt && now >= saleEndAt;

  if (status === 'PAUSED') {
    return { status, label: '판매 중지', tone: 'paused', canPurchase: false, message: '현재 판매가 일시 중지되었습니다.' };
  }

  if (status === 'HIDDEN') {
    return { status, label: '비공개', tone: 'hidden', canPurchase: false, message: '현재 공개되지 않은 상품입니다.' };
  }

  if (status === 'ARCHIVED') {
    return { status, label: '판매 종료', tone: 'ended', canPurchase: false, message: '판매가 종료된 상품입니다.' };
  }

  if (status === 'SCHEDULED' && (!saleStartAt || startsInFuture)) {
    return {
      status,
      label: '판매 예정',
      tone: 'scheduled',
      canPurchase: false,
      message: saleStartAt ? `${formatSaleDateTime(saleStartAt)} 판매 시작` : '판매 일정을 준비 중입니다.'
    };
  }

  if (startsInFuture) {
    return {
      status,
      label: '판매 예정',
      tone: 'scheduled',
      canPurchase: false,
      message: `${formatSaleDateTime(saleStartAt)} 판매 시작`
    };
  }

  if (status === 'PREPARING' || status === 'DRAFT') {
    return { status, label: '준비 중', tone: 'preparing', canPurchase: false, message: '판매 일정을 준비 중입니다.' };
  }

  if (saleEnded) {
    return { status, label: '판매 종료', tone: 'ended', canPurchase: false, message: '판매가 종료된 상품입니다.' };
  }

  if (stock <= 0) {
    return { status, label: '품절', tone: 'soldout', canPurchase: false, message: '현재 품절된 상품입니다.' };
  }

  return {
    status,
    label: '판매 중',
    tone: 'active',
    canPurchase: true,
    message: status === 'SCHEDULED' ? '판매가 시작되었습니다.' : '지금 바로 구매할 수 있습니다.'
  };
}

export function getPurchaseLimit(product) {
  const limit = Number(product?.maxPurchaseQuantity);
  return Number.isInteger(limit) && limit > 0 ? limit : null;
}

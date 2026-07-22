import React from 'react';
import { ChevronDown, CreditCard, XCircle } from 'lucide-react';
import { won } from '../../utils/format.js';

const STATUS_TEXT = {
  CREATED: '주문 생성',
  PAYMENT_PENDING: '결제 진행',
  PAYMENT_APPROVED: '결제 승인',
  PAID: '결제 완료',
  PAYMENT_FAILED: '결제 실패',
  CANCEL_REQUESTED: '취소 요청',
  CANCEL_FAILED: '취소 실패',
  REFUNDED: '환불 완료',
  CANCELED: '주문 취소',
  COMPLETED: '주문 완료',
  EXPIRED: '주문 만료'
};

const PAYABLE_STATUSES = new Set(['CREATED', 'PAYMENT_PENDING', 'PAYMENT_APPROVED', 'PAYMENT_FAILED']);
const CANCELLABLE_STATUSES = new Set(['CREATED', 'PAYMENT_PENDING', 'PAYMENT_APPROVED', 'PAID', 'PAYMENT_FAILED', 'CANCEL_FAILED']);

function formatOrderTime(value) {
  if (!value) {
    return '주문 시간 정보 없음';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '주문 시간 정보 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsedDate);
}

function normalizeOrderItems(order) {
  const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.orderItems) ? order.orderItems : []);

  if (items.length > 0) {
    return items.map((item, index) => {
      const product = item.product ?? {};
      const productId = item.productId ?? item.product_id ?? product.id ?? index;
      const quantity = Number(item.quantity ?? item.count ?? 1);
      const price = Number(item.price ?? item.unitPrice ?? product.price ?? 0);

      return {
        id: item.id ?? item.orderItemId ?? `${productId}-${index}`,
        name: item.productName ?? `상품 #${productId ?? '-'}`,
        quantity,
        price,
        totalPrice: Number(item.lineTotalPrice ?? item.totalPrice ?? item.total_price ?? price * quantity)
      };
    });
  }

  return [];
}

function getPayButtonLabel(status) {
  if (status === 'PAYMENT_PENDING') {
    return '결제 진행 중';
  }

  if (status === 'PAYMENT_APPROVED') {
    return '결제 승인 확인 중';
  }

  if (status === 'PAYMENT_FAILED') {
    return '결제 재시도';
  }

  if (status === 'PAID' || status === 'COMPLETED') {
    return '결제 완료';
  }

  return '결제하기';
}

function getCancelButtonLabel(status) {
  if (status === 'CANCEL_REQUESTED') {
    return '취소 요청 중';
  }

  if (status === 'CANCEL_FAILED') {
    return '취소 재시도';
  }

  if (status === 'CANCELED' || status === 'REFUNDED') {
    return '취소 완료';
  }

  return '주문 취소';
}

export function OrderCard({ order, loading, onLoadOrderDetail, onPayOrder, onCancelOrder }) {
  const [isItemsOpen, setIsItemsOpen] = React.useState(false);
  const [isDetailLoading, setIsDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState('');
  const orderId = order.orderId ?? order.id;
  const status = String(order.status ?? 'CREATED').toUpperCase();
  const hasLoadedDetail = Array.isArray(order.items) || Array.isArray(order.orderItems);
  const orderItems = normalizeOrderItems(order);
  const itemCount = orderItems.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  const displayTotal = Number(order.totalPrice ?? orderItems.reduce((sum, item) => sum + Number(item.totalPrice ?? 0), 0));
  const canPay = PAYABLE_STATUSES.has(status);
  const canCancel = CANCELLABLE_STATUSES.has(status);

  async function handleItemsToggle() {
    if (isItemsOpen) {
      setIsItemsOpen(false);
      return;
    }

    setIsItemsOpen(true);
    setDetailError('');

    if (hasLoadedDetail || !orderId || !onLoadOrderDetail) {
      return;
    }

    setIsDetailLoading(true);

    try {
      await onLoadOrderDetail(orderId);
    } catch (error) {
      setDetailError(error.message ?? '주문 상세를 불러오지 못했습니다.');
    } finally {
      setIsDetailLoading(false);
    }
  }

  return (
    <article className="order-card">
      <div className="order-main">
        <div className="order-head-row">
          <span className={`status ${status.toLowerCase()}`}>{STATUS_TEXT[status] ?? status}</span>
          <p className="order-time">주문일시: {formatOrderTime(order.createdAt ?? order.created_date)}</p>
        </div>

        <h3>주문번호 #{orderId ?? '-'}</h3>
        <p className="order-summary">
          {hasLoadedDetail ? `총 ${itemCount.toLocaleString('ko-KR')}개 · ` : '주문 금액 · '}
          {won.format(displayTotal)}
        </p>

        <button
          className="order-items-toggle"
          type="button"
          onClick={handleItemsToggle}
          aria-expanded={isItemsOpen}
        >
          주문 아이템 {hasLoadedDetail ? `${itemCount.toLocaleString('ko-KR')}개 ` : ''}{isItemsOpen ? '접기' : '보기'}
          <ChevronDown size={16} className={isItemsOpen ? 'open' : ''} />
        </button>

        {isItemsOpen && (
          <>
            {isDetailLoading && <p className="order-items-state">주문 아이템을 불러오는 중입니다.</p>}
            {!isDetailLoading && detailError && <p className="order-items-state error">{detailError}</p>}
            {!isDetailLoading && !detailError && hasLoadedDetail && orderItems.length === 0 && (
              <p className="order-items-state">표시할 주문 아이템이 없습니다.</p>
            )}
            {!isDetailLoading && !detailError && orderItems.length > 0 && (
              <ul className="order-item-list">
                {orderItems.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <span>{Number(item.quantity ?? 1).toLocaleString('ko-KR')}개</span>
                    <strong>{won.format(item.totalPrice ?? 0)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      <div className="order-actions">
        {canPay && (
          <button className="secondary-button" type="button" disabled={loading} onClick={() => onPayOrder(orderId)}>
            <CreditCard size={17} />
            {getPayButtonLabel(status)}
          </button>
        )}
        {canCancel && (
          <button className="danger-button" type="button" disabled={loading} onClick={() => onCancelOrder(orderId)}>
            <XCircle size={17} />
            {getCancelButtonLabel(status)}
          </button>
        )}
      </div>
    </article>
  );
}

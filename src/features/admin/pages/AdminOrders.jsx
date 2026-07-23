import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Eye, ListFilter, RefreshCw, Search } from 'lucide-react';
import { completeAdminOrder, getAdminOrders } from '../../../api/admin.js';
import { SectionHeader, STATUS_LABEL, StatusBadge, won } from '../components/AdminUi.jsx';

function toDateInputValue(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toLocalDateTimeString(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');
  const second = String(value.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

function getTodayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  return {
    startAt: toLocalDateTimeString(start),
    endAt: toLocalDateTimeString(now)
  };
}

function getWeekRange(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return {
    startAt: toLocalDateTimeString(start),
    endAt: toLocalDateTimeString(now)
  };
}

function getMonthRange(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  return {
    startAt: toLocalDateTimeString(start),
    endAt: toLocalDateTimeString(now)
  };
}

function getCustomRange(fromDate, toDate) {
  if (!fromDate || !toDate) return null;

  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T23:59:59`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return null;
  }

  return {
    startAt: toLocalDateTimeString(start),
    endAt: toLocalDateTimeString(end)
  };
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function normalizeOrdersPayload(payload) {
  const list = Array.isArray(payload?.orders) ? payload.orders : [];

  return list.map((order, index) => {
    const orderItems = Array.isArray(order?.orderItems) ? order.orderItems : [];
    const normalizedItems = orderItems.map((item, itemIndex) => ({
      id: item?.orderItemId ?? item?.productId ?? `${order?.orderId ?? index + 1}-${itemIndex + 1}`,
      name: item?.productName ?? '상품 정보 없음',
      quantity: Number(item?.quantity ?? 0),
      price: Number(item?.price ?? item?.unitPrice ?? 0)
    }));
    const productNames = orderItems
      .map((item) => item?.productName)
      .filter(Boolean);
    const totalQuantity = orderItems.reduce((sum, item) => {
      return sum + Number(item?.quantity ?? 0);
    }, 0);
    const primaryProduct = productNames[0] ?? '상품 정보 없음';
    const product = productNames.length > 1
      ? `${primaryProduct} 외 ${productNames.length - 1}건`
      : primaryProduct;

    return {
      id: order?.orderId ?? index + 1,
      customer: order?.userEmail ?? '-',
      product,
      quantity: totalQuantity,
      amount: Number(order?.totalPrice ?? 0),
      status: order?.status ?? 'CREATED',
      createdAt: formatDateTime(order?.createdAt),
      channel: '-',
      items: normalizedItems,
      raw: order
    };
  });
}

function buildSummary(payload, normalizedOrders) {
  const summary = payload?.summary;
  if (summary) {
    return {
      paymentPending: Number(summary.paymentPendingCount ?? 0),
      paid: Number(summary.paidCount ?? 0),
      cancelRequested: Number(summary.cancelRequestedCount ?? 0),
      paymentFailed: Number(summary.paymentFailedCount ?? 0)
    };
  }

  return normalizedOrders.reduce(
    (acc, order) => {
      if (order.status === 'PAYMENT_PENDING' || order.status === 'PAYMENT_APPROVED') acc.paymentPending += 1;
      if (order.status === 'PAID' || order.status === 'COMPLETED') acc.paid += 1;
      if (order.status === 'CANCEL_REQUESTED') acc.cancelRequested += 1;
      if (order.status === 'PAYMENT_FAILED' || order.status === 'EXPIRED' || order.status === 'CANCEL_FAILED') acc.paymentFailed += 1;

      return acc;
    },
    {
      paymentPending: 0,
      paid: 0,
      cancelRequested: 0,
      paymentFailed: 0
    }
  );
}

export function AdminOrders() {
  const todayInput = toDateInputValue(new Date());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [periodType, setPeriodType] = useState('TODAY');
  const [customFromDate, setCustomFromDate] = useState(todayInput);
  const [customToDate, setCustomToDate] = useState(todayInput);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    paymentPending: 0,
    paid: 0,
    cancelRequested: 0,
    paymentFailed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState(null);
  const [completingOrderId, setCompletingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const latestRequestRef = useRef(0);
  const filters = [
    'ALL',
    'CREATED',
    'PAYMENT_PENDING',
    'PAYMENT_APPROVED',
    'PAYMENT_FAILED',
    'CANCEL_FAILED',
    'REFUNDED',
    'CANCELED',
    'COMPLETED',
    'EXPIRED'
  ];

  const periodLabel = periodType === 'TODAY'
    ? '오늘'
    : periodType === 'WEEK'
      ? '일주일'
      : periodType === 'MONTH'
        ? '한달'
        : '기간설정';

  function resolveRange(type = periodType) {
    if (type === 'TODAY') return getTodayRange();
    if (type === 'WEEK') return getWeekRange();
    if (type === 'MONTH') return getMonthRange();
    return getCustomRange(customFromDate, customToDate);
  }

  async function loadOrders(type = periodType) {
    const range = resolveRange(type);
    if (!range) {
      setError('기간 설정이 올바르지 않습니다. 시작일과 종료일을 확인해 주세요.');
      return;
    }

    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    setLoading(true);
    setError('');

    try {
      const payload = await getAdminOrders(range);
      const normalizedOrders = normalizeOrdersPayload(payload);
      if (latestRequestRef.current !== requestId) return;
      setOrders(normalizedOrders);
      setSummary(buildSummary(payload, normalizedOrders));
    } catch (err) {
      if (latestRequestRef.current !== requestId) return;
      setError(err.message || '주문 데이터를 불러오지 못했습니다.');
      setOrders([]);
      setSummary({
        paymentPending: 0,
        paid: 0,
        cancelRequested: 0,
        paymentFailed: 0
      });
    } finally {
      if (latestRequestRef.current === requestId) setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders('TODAY');

    return () => {
      latestRequestRef.current += 1;
    };
  }, []);

  function handlePeriodClick(type) {
    setPeriodType(type);

    if (type !== 'CUSTOM') {
      loadOrders(type);
    }
  }

  function handleCustomSearch() {
    setPeriodType('CUSTOM');
    loadOrders('CUSTOM');
  }

  async function handleCompleteOrder(order) {
    if (order.status !== 'PAID' || completingOrderId !== null) return;

    const confirmed = window.confirm(`주문 #${order.id}을 주문 완료 상태로 변경할까요?`);
    if (!confirmed) return;

    setCompletingOrderId(order.id);
    setActionMessage(null);

    try {
      await completeAdminOrder(order.id);
      setOrders((currentOrders) => currentOrders.map((item) => (
        item.id === order.id ? { ...item, status: 'COMPLETED' } : item
      )));
      setSelectedOrder((currentOrder) => (
        currentOrder?.id === order.id ? { ...currentOrder, status: 'COMPLETED' } : currentOrder
      ));
      setActionMessage({ type: 'success', message: `주문 #${order.id}을 완료 처리했습니다.` });
    } catch (err) {
      setActionMessage({ type: 'error', message: err.message || '주문 완료 처리에 실패했습니다.' });
    } finally {
      setCompletingOrderId(null);
    }
  }

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesFilter = filter === 'ALL' || order.status === filter;
    const keyword = query.trim().toLowerCase();
    return matchesFilter
      && (
        !keyword
        || String(order.id).includes(keyword)
        || String(order.customer).toLowerCase().includes(keyword)
        || String(order.product).toLowerCase().includes(keyword)
      );
  }), [orders, filter, query]);

  const priorityCounts = useMemo(() => orders.reduce(
    (counts, order) => {
      if (order.status === 'PAID') counts.paid += 1;
      if (order.status === 'CANCEL_REQUESTED') counts.cancelRequested += 1;
      return counts;
    },
    { paid: 0, cancelRequested: 0 }
  ), [orders]);

  return (
    <div className="admin-page-stack">
      <SectionHeader eyebrow="Order management" title="주문 관리" description="결제가 끝난 PAID 주문을 확인하고 COMPLETED 상태로 완료 처리합니다." action={<button className="admin-primary-button" type="button" onClick={() => loadOrders(periodType)} disabled={loading}><RefreshCw size={16} /> {loading ? '동기화 중' : '주문 동기화'}</button>} />

      {error && (
        <section className="admin-card admin-alert-item critical">
          <span className="admin-alert-icon"><AlertTriangle size={18} /></span>
          <div>
            <strong>주문 목록 조회 실패</strong>
            <p>{error}</p>
            <small>백엔드의 /api/admin/backoffice/order 응답을 확인해 주세요.</small>
          </div>
        </section>
      )}

      {actionMessage && (
        <section className={`admin-order-action-message ${actionMessage.type}`} role="status">
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionMessage.message}</span>
        </section>
      )}

      <section className="admin-order-summary">
        <div><span>결제 대기</span><strong>{loading ? '-' : summary.paymentPending}</strong><small>처리 필요 주문</small></div>
        <div><span>결제 완료</span><strong>{loading ? '-' : summary.paid}</strong><small>조회 범위 누적</small></div>
        <div><span>취소 요청</span><strong>{loading ? '-' : summary.cancelRequested}</strong><small>처리 필요</small></div>
        <div><span>결제 실패</span><strong>{loading ? '-' : summary.paymentFailed}</strong><small>실패/만료 포함</small></div>
      </section>
      <section className="admin-card admin-table-card">
        <div className="admin-table-toolbar">
          <label className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="주문번호, 고객 이메일, 상품명 검색" /></label>
          <button className={`admin-outline-button ${periodType === 'TODAY' ? 'active' : ''}`} type="button" onClick={() => handlePeriodClick('TODAY')}><CalendarClock size={16} /> 오늘</button>
          <button className={`admin-outline-button ${periodType === 'WEEK' ? 'active' : ''}`} type="button" onClick={() => handlePeriodClick('WEEK')}><CalendarClock size={16} /> 일주일</button>
          <button className={`admin-outline-button ${periodType === 'MONTH' ? 'active' : ''}`} type="button" onClick={() => handlePeriodClick('MONTH')}><CalendarClock size={16} /> 한달</button>
          <button className={`admin-outline-button ${periodType === 'CUSTOM' ? 'active' : ''}`} type="button" onClick={() => handlePeriodClick('CUSTOM')}><ListFilter size={16} /> 기간설정</button>
          <span aria-live="polite">선택 기간: {periodLabel}</span>
          {periodType === 'CUSTOM' && (
            <>
              <input type="date" value={customFromDate} onChange={(event) => setCustomFromDate(event.target.value)} aria-label="시작일" />
              <input type="date" value={customToDate} onChange={(event) => setCustomToDate(event.target.value)} aria-label="종료일" />
              <button className="admin-outline-button" type="button" onClick={handleCustomSearch}>조회</button>
            </>
          )}
        </div>
        <div className="admin-priority-filter-area">
          <div className="admin-priority-filter-heading">
            <strong>우선 처리</strong>
            <span>관리자의 확인이 필요한 주문입니다.</span>
          </div>
          <div className="admin-priority-filters">
            <button
              className={`admin-priority-filter paid ${filter === 'PAID' ? 'active' : ''}`}
              type="button"
              onClick={() => setFilter('PAID')}
            >
              <span className="admin-priority-filter-icon"><CheckCircle2 size={18} /></span>
              <span className="admin-priority-filter-copy">
                <strong>완료 처리 대기</strong>
                <small>PAID · 완료 전환 필요</small>
              </span>
              <strong className="admin-priority-filter-count">{loading ? '-' : priorityCounts.paid}<small>건</small></strong>
            </button>
            <button
              className={`admin-priority-filter cancel ${filter === 'CANCEL_REQUESTED' ? 'active' : ''}`}
              type="button"
              onClick={() => setFilter('CANCEL_REQUESTED')}
            >
              <span className="admin-priority-filter-icon"><AlertTriangle size={18} /></span>
              <span className="admin-priority-filter-copy">
                <strong>취소 처리 대기</strong>
                <small>취소 요청 · 확인 필요</small>
              </span>
              <strong className="admin-priority-filter-count">{loading ? '-' : priorityCounts.cancelRequested}<small>건</small></strong>
            </button>
          </div>
        </div>
        <div className="admin-filter-tabs">
          {filters.map((item) => (
            <button className={filter === item ? 'active' : ''} type="button" key={item} onClick={() => setFilter(item)}>
              {item === 'ALL' ? '전체 주문' : STATUS_LABEL[item]}
            </button>
          ))}
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th>주문번호</th><th>고객</th><th>상품</th><th>결제금액</th><th>상태</th><th>주문일시</th><th /></tr></thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7}>{loading ? '주문 데이터를 불러오는 중입니다.' : '조회된 주문이 없습니다.'}</td>
                </tr>
              )}

              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td><strong>#{order.id}</strong><small>{order.channel}</small></td>
                  <td>{order.customer}</td>
                  <td><strong>{order.product}</strong><small>{order.quantity}개</small></td>
                  <td><strong>{won.format(order.amount)}</strong></td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>{order.createdAt}</td>
                  <td>
                    <div className="admin-action-buttons">
                      {order.status === 'PAID' && (
                        <button className="admin-primary-button admin-complete-button" type="button" disabled={completingOrderId !== null} onClick={() => handleCompleteOrder(order)}>
                          <CheckCircle2 size={15} />
                          {completingOrderId === order.id ? '처리 중' : '완료 처리'}
                        </button>
                      )}
                      <button className="admin-icon-button" type="button" aria-label={`주문 ${order.id} 상세 보기`} onClick={() => setSelectedOrder(order)}><Eye size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-table-footer"><span>총 {filteredOrders.length}건 표시</span><div><button type="button" disabled>이전</button><b>1</b><button type="button">다음</button></div></div>
      </section>
      {selectedOrder && (
        <div className="admin-drawer-backdrop" role="presentation" onMouseDown={() => setSelectedOrder(null)}>
          <aside className="admin-order-drawer" role="dialog" aria-modal="true" aria-label="주문 상세" onMouseDown={(event) => event.stopPropagation()}>
            <div className="admin-drawer-head"><div><p className="eyebrow">Order detail</p><h3>주문 #{selectedOrder.id}</h3></div><button type="button" onClick={() => setSelectedOrder(null)}>×</button></div>
            <StatusBadge status={selectedOrder.status} />
            <div className="admin-detail-block"><span>주문 상품</span><strong>{selectedOrder.product}</strong><p>{selectedOrder.quantity}개 · {won.format(selectedOrder.amount)}</p></div>
            <div className="admin-detail-block">
              <span>주문 아이템</span>
              {selectedOrder.items?.length ? (
                <ul className="admin-order-item-list">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id}>
                      <strong>{item.name}</strong>
                      <span>{item.quantity}개{item.price > 0 ? ` · ${won.format(item.price)}` : ''}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>아이템 정보가 없습니다.</p>
              )}
            </div>
            <div className="admin-detail-grid"><div><span>고객</span><strong>{selectedOrder.customer}</strong></div><div><span>채널</span><strong>{selectedOrder.channel}</strong></div><div><span>주문 일시</span><strong>{selectedOrder.createdAt}</strong></div><div><span>사용자 ID</span><strong>USER-{selectedOrder.id - 9200}</strong></div></div>
            <div className="admin-timeline"><div className="done"><b /><span><strong>주문 생성</strong><small>14:29:02</small></span></div><div className={selectedOrder.status === 'PAYMENT_FAILED' ? 'failed' : 'done'}><b /><span><strong>결제 승인 요청</strong><small>14:29:08</small></span></div><div><b /><span><strong>주문 처리 완료</strong><small>대기 중</small></span></div></div>
            {selectedOrder.status === 'PAID' && (
              <div className="admin-drawer-actions single">
                <button className="admin-primary-button" type="button" disabled={completingOrderId !== null} onClick={() => handleCompleteOrder(selectedOrder)}>
                  <CheckCircle2 size={16} />
                  {completingOrderId === selectedOrder.id ? '완료 처리 중' : '주문 완료 처리'}
                </button>
              </div>
            )}
            {selectedOrder.status === 'COMPLETED' && (
              <p className="admin-completed-note"><CheckCircle2 size={17} /> 이미 완료 처리된 주문입니다.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

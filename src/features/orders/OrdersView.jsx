import React from 'react';
import { RefreshCw } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState.jsx';
import { OrderCard } from './OrderCard.jsx';

export function OrdersView({
  orders,
  loading,
  isSignedIn,
  onRefresh,
  onLoadOrderDetail,
  onPayOrder,
  onCancelOrder
}) {

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Order desk</p>
          <h2>내 주문</h2>
        </div>
        <button className="secondary-button" type="button" disabled={!isSignedIn} onClick={onRefresh}>
          <RefreshCw size={17} />
          새로고침
        </button>
      </div>

      <div className="order-list">
        {orders.length === 0 ? (
          <EmptyState />
        ) : (
          orders.map((order, index) => (
            <OrderCard
              key={`${order.orderId ?? order.id ?? 'unknown'}-${index}`}
              order={order}
              loading={loading}
              onLoadOrderDetail={onLoadOrderDetail}
              onPayOrder={onPayOrder}
              onCancelOrder={onCancelOrder}
            />
          ))
        )}
      </div>
    </section>
  );
}

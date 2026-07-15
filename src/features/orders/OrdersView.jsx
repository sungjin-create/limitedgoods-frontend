import React from 'react';
import { RefreshCw } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState.jsx';
import { OrderCard } from './OrderCard.jsx';

function getOrderItemFallback(order, index) {
  return {
    id: order.orderItemId ?? `${order.orderId ?? order.id}-item-${index}`,
    productId: order.productId,
    productName: order.productName,
    quantity: Number(order.quantity ?? 1),
    totalPrice: Number(order.totalPrice ?? 0),
    price: Number(order.unitPrice ?? order.price ?? 0)
  };
}

function collectOrderItems(order, index) {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }

  if (Array.isArray(order.orderItems) && order.orderItems.length > 0) {
    return order.orderItems;
  }

  return [getOrderItemFallback(order, index)];
}

function groupOrdersByOrderId(orders) {
  const grouped = new Map();

  orders.forEach((order, index) => {
    const orderId = order.orderId ?? order.id;
    const groupKey = orderId ?? `unknown-${index}`;
    const items = collectOrderItems(order, index);

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, {
        ...order,
        orderId,
        items: [...items]
      });
      return;
    }

    const existing = grouped.get(groupKey);
    existing.items = [...existing.items, ...items];

    if (!existing.totalPrice && order.totalPrice) {
      existing.totalPrice = order.totalPrice;
    }
  });

  return Array.from(grouped.values()).map((order) => {
    const hasExplicitTotal = Number(order.totalPrice ?? 0) > 0;

    if (hasExplicitTotal) {
      return order;
    }

    const derivedTotal = (order.items ?? []).reduce((sum, item) => {
      const quantity = Number(item.quantity ?? item.count ?? 1);
      const itemTotal = Number(item.totalPrice ?? item.total_price ?? (item.price ?? item.unitPrice ?? 0) * quantity);
      return sum + itemTotal;
    }, 0);

    return {
      ...order,
      totalPrice: derivedTotal
    };
  });
}

export function OrdersView({ orders, loading, isSignedIn, onRefresh, onPayOrder, onCancelOrder }) {
  const groupedOrders = React.useMemo(() => groupOrdersByOrderId(orders), [orders]);

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
        {groupedOrders.length === 0 ? (
          <EmptyState />
        ) : (
          groupedOrders.map((order, index) => (
            <OrderCard
              key={`${order.orderId ?? order.id ?? 'unknown'}-${index}`}
              order={order}
              loading={loading}
              onPayOrder={onPayOrder}
              onCancelOrder={onCancelOrder}
            />
          ))
        )}
      </div>
    </section>
  );
}

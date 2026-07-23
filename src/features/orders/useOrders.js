import { useRef, useState } from 'react';
import { cancelOrder, getOrderDetail, getOrders, payOrder } from '../../api/index.js';

export function useOrders({ setNotice, setLoading }) {
  const [orders, setOrders] = useState([]);
  const latestRequestRef = useRef(0);

  async function loadOrders() {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    try {
      const data = await getOrders();
      if (latestRequestRef.current !== requestId) return;
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      if (latestRequestRef.current !== requestId) return;
      setOrders([]);
    }
  }

  async function loadOrderDetail(orderId) {
    const detail = await getOrderDetail(orderId);

    setOrders((current) => current.map((order) => {
      const currentOrderId = order.orderId ?? order.id;

      if (String(currentOrderId) !== String(orderId)) {
        return order;
      }

      return {
        ...order,
        ...detail,
        orderId: detail.orderId ?? detail.id ?? currentOrderId,
        items: Array.isArray(detail.items) ? detail.items : []
      };
    }));

    return detail;
  }

  async function payExistingOrder(orderId, forceFail = false) {
    setLoading(true);

    try {
      await payOrder(orderId, { forceFail });
      await loadOrders();
      setNotice({
        type: forceFail ? 'error' : 'success',
        message: forceFail ? '결제 실패 시나리오를 확인했습니다.' : '결제가 완료되었습니다.'
      });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function cancelExistingOrder(orderId) {
    setLoading(true);

    try {
      await cancelOrder(orderId);
      await loadOrders();
      setNotice({ type: 'success', message: '주문을 취소했습니다.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function clearOrders() {
    latestRequestRef.current += 1;
    setOrders([]);
  }

  return {
    orders,
    setOrders,
    clearOrders,
    loadOrders,
    loadOrderDetail,
    payExistingOrder,
    cancelExistingOrder
  };
}

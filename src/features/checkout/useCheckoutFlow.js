import { useEffect, useMemo, useRef, useState } from 'react';
import { createOrder, enterQueue, getQueueStatus, payOrder } from '../../api/index.js';
import { getCartSummary } from '../../utils/cart.js';
import { normalizeOrder } from '../../utils/orders.js';
import { getProductAvailability, getPurchaseLimit } from '../../utils/productAvailability.js';
import {
  buildCheckoutOrder,
  clearStoredCheckoutTokens,
  getCheckoutToken,
  normalizeQueueResponse,
  removeStoredCheckoutToken,
  validateAdmissionSnapshot
} from './checkoutFlowUtils.js';

const QUEUE_POLL_INTERVAL_MS = 2500;
const PAYMENT_COMPLETE_BACK_WARNING = '이미 결제가 완료된 주문서입니다. 안전을 위해 메인 화면으로 이동합니다.';

export function useCheckoutFlow({
  selectedProduct,
  quantity,
  cartItems,
  setOrders,
  loadOrders,
  loadCart,
  navigate,
  protectCurrentEntry,
  setNotice,
  setLoading
}) {
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [queueState, setQueueState] = useState(null);
  const isCreatingCheckout = useRef(false);
  const queueSessionRef = useRef(0);
  const queuePollTimerRef = useRef(null);
  const queueRequestRef = useRef(null);

  const checkoutItems = useMemo(() => checkoutOrder?.items ?? [], [checkoutOrder]);
  const checkoutSummary = useMemo(() => {
    const summary = getCartSummary(checkoutItems);

    return {
      ...summary,
      total: Number(checkoutOrder?.totalPrice ?? checkoutOrder?.total_price ?? summary.total)
    };
  }, [checkoutItems, checkoutOrder]);

  function clearQueuePolling() {
    if (queuePollTimerRef.current) {
      window.clearTimeout(queuePollTimerRef.current);
      queuePollTimerRef.current = null;
    }
  }

  function resetQueueState() {
    queueSessionRef.current += 1;
    queueRequestRef.current = null;
    clearQueuePolling();
    setQueueState(null);
  }

  function clearCheckout() {
    setCheckoutOrder(null);
  }

  function resetCheckoutFlow() {
    clearCheckout();
    resetQueueState();
    clearStoredCheckoutTokens();
  }

  async function createCheckoutOrder(orderItems, {
    checkoutKey,
    checkoutToken,
    admissionToken,
    successMessage
  }) {
    const data = await createOrder(
      orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      { checkoutToken, admissionToken }
    );

    // 서버가 주문 생성 결과를 확정했을 때만 다음 주문에서 새 토큰을 사용한다.
    removeStoredCheckoutToken(checkoutKey);

    if (String(data?.status ?? '').toUpperCase() === 'EXPIRED') {
      throw new Error('기존 주문서가 만료되었습니다. 새 주문서를 다시 생성해 주세요.');
    }

    setCheckoutOrder({
      ...buildCheckoutOrder(data, orderItems),
      checkoutKey,
      checkoutToken,
      admissionToken
    });
    navigate('checkout');
    setNotice({ type: 'success', message: successMessage });
  }

  async function pollQueueStatus(sessionId) {
    const queueRequest = queueRequestRef.current;

    if (!queueRequest || queueRequest.sessionId !== sessionId) {
      return;
    }

    try {
      const snapshot = normalizeQueueResponse(await getQueueStatus(queueRequest.productId));

      validateAdmissionSnapshot(snapshot);

      if (queueSessionRef.current !== sessionId) {
        return;
      }

      setQueueState((current) => current ? {
        ...current,
        phase: snapshot.admitted ? 'admitted' : 'waiting',
        position: snapshot.position ?? current.position,
        admissionToken: snapshot.admissionToken || current.admissionToken
      } : current);

      if (snapshot.admitted) {
        clearQueuePolling();
        queueRequestRef.current = null;
        setLoading(true);

        try {
          await createCheckoutOrder(queueRequest.orderItems, {
            checkoutKey: queueRequest.checkoutKey,
            checkoutToken: queueRequest.checkoutToken,
            admissionToken: snapshot.admissionToken,
            successMessage: `${queueRequest.productName} 주문서를 생성했습니다.`
          });
        } finally {
          setLoading(false);
          resetQueueState();
        }

        return;
      }
    } catch (error) {
      if (queueSessionRef.current !== sessionId) {
        return;
      }

      clearQueuePolling();
      setQueueState((current) => current ? { ...current, phase: 'error' } : current);
      setNotice({ type: 'error', message: `대기열 상태를 확인하지 못했습니다. ${error.message}` });
      return;
    }

    queuePollTimerRef.current = window.setTimeout(() => {
      pollQueueStatus(sessionId);
    }, QUEUE_POLL_INTERVAL_MS);
  }

  async function beginQueuedCheckout(orderItems) {
    const firstItem = orderItems[0];
    const productId = Number(firstItem?.productId);

    if (!Number.isFinite(productId) || productId <= 0) {
      throw new Error('대기열에 진입할 상품을 찾지 못했습니다.');
    }

    clearQueuePolling();
    queueRequestRef.current = null;

    const { checkoutKey, checkoutToken } = getCheckoutToken(orderItems);
    const sessionId = queueSessionRef.current + 1;

    queueSessionRef.current = sessionId;
    queueRequestRef.current = {
      sessionId,
      productId,
      productName: firstItem?.name ?? `상품 #${productId}`,
      orderItems,
      checkoutKey,
      checkoutToken
    };
    setQueueState({
      phase: 'entering',
      product: {
        id: productId,
        name: firstItem?.name ?? `상품 #${productId}`,
        description: firstItem?.description ?? '',
        imageUrl: firstItem?.imageUrl ?? '',
        price: Number(firstItem?.price ?? 0),
        stock: Number(selectedProduct?.stock ?? 0)
      },
      productId,
      productName: firstItem?.name ?? `상품 #${productId}`,
      quantity: Number(firstItem?.quantity ?? 1),
      position: null,
      admissionToken: '',
      totalPrice: Number(firstItem?.totalPrice ?? Number(firstItem?.price ?? 0) * Number(firstItem?.quantity ?? 1))
    });

    const snapshot = normalizeQueueResponse(await enterQueue(productId));

    validateAdmissionSnapshot(snapshot);

    if (queueSessionRef.current !== sessionId) {
      return;
    }

    if (snapshot.admitted) {
      queueRequestRef.current = null;
      setLoading(true);

      try {
        await createCheckoutOrder(orderItems, {
          checkoutKey,
          checkoutToken,
          admissionToken: snapshot.admissionToken,
          successMessage: `${firstItem?.name ?? '상품'} 주문서를 생성했습니다.`
        });
      } finally {
        setLoading(false);
        resetQueueState();
      }

      return;
    }

    setQueueState((current) => current ? {
      ...current,
      phase: 'waiting',
      position: snapshot.position,
      admissionToken: snapshot.admissionToken || current.admissionToken
    } : current);
    navigate('queue');
    setLoading(false);
    clearQueuePolling();
    queuePollTimerRef.current = window.setTimeout(() => {
      pollQueueStatus(sessionId);
    }, QUEUE_POLL_INTERVAL_MS);
  }

  async function createProductOrder() {
    if (!selectedProduct) {
      setNotice({ type: 'error', message: '주문할 상품을 먼저 선택해 주세요.' });
      return;
    }

    const availability = getProductAvailability(selectedProduct);
    if (!availability.canPurchase) {
      setNotice({ type: 'error', message: availability.message });
      return;
    }

    const purchaseLimit = getPurchaseLimit(selectedProduct);
    const maxQuantity = Math.min(Number(selectedProduct.stock ?? 0), purchaseLimit ?? Number.MAX_SAFE_INTEGER);
    const safeQuantity = Math.max(1, Math.min(maxQuantity, Number(quantity) || 1));

    if (isCreatingCheckout.current) {
      return;
    }

    isCreatingCheckout.current = true;
    setLoading(true);

    try {
      const orderItems = [{
        productId: selectedProduct.id,
        name: selectedProduct.name,
        description: selectedProduct.description,
        imageUrl: selectedProduct.imageUrl,
        price: selectedProduct.price,
        quantity: safeQuantity
      }];

      if (selectedProduct.type === 'LIMITED') {
        await beginQueuedCheckout(orderItems);
      } else {
        const { checkoutKey, checkoutToken } = getCheckoutToken(orderItems);

        await createCheckoutOrder(orderItems, {
          checkoutKey,
          checkoutToken,
          successMessage: `${selectedProduct.name} 주문서를 생성했습니다.`
        });
      }
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      isCreatingCheckout.current = false;
      setLoading(false);
    }
  }

  async function createCartOrder() {
    if (cartItems.length === 0) {
      setNotice({ type: 'error', message: '주문할 장바구니 상품이 없습니다.' });
      return;
    }

    if (isCreatingCheckout.current) {
      return;
    }

    isCreatingCheckout.current = true;
    setLoading(true);

    try {
      const orderItems = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice
      }));
      const { checkoutKey, checkoutToken } = getCheckoutToken(orderItems);

      await createCheckoutOrder(orderItems, {
        checkoutKey,
        checkoutToken,
        successMessage: '장바구니 상품 주문서를 생성했습니다.'
      });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      isCreatingCheckout.current = false;
      setLoading(false);
    }
  }

  async function payCheckoutOrder() {
    if (!checkoutOrder?.orderId) {
      setNotice({ type: 'error', message: '결제할 주문서가 없습니다.' });
      return;
    }

    setLoading(true);

    try {
      const paidData = await payOrder(checkoutOrder.orderId);
      const paidOrder = {
        ...checkoutOrder,
        ...paidData,
        status: paidData.status ?? 'PAID'
      };
      const firstItem = checkoutOrder.items[0] ?? {};

      setOrders((current) => [normalizeOrder(paidOrder, {
        id: firstItem.productId,
        name: firstItem.name,
        price: firstItem.price
      }, firstItem.quantity ?? 1), ...current]);

      if (checkoutOrder.checkoutKey) {
        removeStoredCheckoutToken(checkoutOrder.checkoutKey);
      }

      await loadOrders();
      await loadCart();
      protectCurrentEntry(PAYMENT_COMPLETE_BACK_WARNING);
      clearCheckout();
      setNotice({ type: 'success', message: '결제가 완료되었습니다.' });
      navigate('orders');
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => () => {
    clearQueuePolling();
  }, []);

  return {
    checkoutItems,
    checkoutSummary,
    queueState,
    clearCheckout,
    resetQueueState,
    resetCheckoutFlow,
    createProductOrder,
    createCartOrder,
    payCheckoutOrder
  };
}

import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Clock3, Gauge } from 'lucide-react';
import {
  addCartItem,
  AUTH_EXPIRED_EVENT,
  cancelOrder,
  createOrder,
  deleteCartItem,
  getCart,
  getOrders,
  getProducts,
  enterQueue,
  getQueueStatus,
  loginUser,
  payOrder,
  registerProduct,
  signupUser,
  TOKEN_KEY,
  updateCartItem
} from './api/index.js';
import { Metric } from './components/Metric.jsx';
import { Notice } from './components/Notice.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Topbar } from './components/Topbar.jsx';
import { AdminShell } from './features/admin/AdminShell.jsx';
import { AuthPanel } from './features/auth/AuthPanel.jsx';
import { CartView } from './features/cart/CartView.jsx';
import { OrderSheetView } from './features/checkout/OrderSheetView.jsx';
import { OrdersView } from './features/orders/OrdersView.jsx';
import { QueueView } from './features/queue/QueueView.jsx';
import { ShopView } from './features/shop/ShopView.jsx';
import { isAdminToken } from './utils/auth.js';
import { getCartSummary, normalizeCartItems } from './utils/cart.js';
import { normalizeOrder } from './utils/orders.js';
import { INITIAL_PRODUCT_FORM } from "./types/product.js";

const PRODUCT_PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;
const SESSION_VALIDATION_INTERVAL_MS = 30000;
const CHECKOUT_TOKEN_PREFIX = 'limitedgoods.checkoutToken.';
const QUEUE_POLL_INTERVAL_MS = 2500;

const initialNotice = {
  type: 'info',
  message: '상품 정보를 불러오고 있습니다.'
};

function buildCheckoutOrder(order, items) {
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

function createCheckoutToken() {
  return crypto.randomUUID();
}

function createCheckoutKey(items) {
  return items
    .map((item) => `${Number(item.productId)}:${Number(item.quantity)}`)
    .sort()
    .join('|');
}

function normalizeQueueResponse(data) {
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

function getCheckoutStorageKey(checkoutKey) {
  return `${CHECKOUT_TOKEN_PREFIX}${checkoutKey}`;
}

function removeStoredCheckoutToken(checkoutKey) {
  if (!checkoutKey) {
    return;
  }

  sessionStorage.removeItem(getCheckoutStorageKey(checkoutKey));
}

function clearStoredCheckoutTokens() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(CHECKOUT_TOKEN_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
}

export default function App() {
  const [activeView, setActiveView] = useState('shop');
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? '');
  const [authStatus, setAuthStatus] = useState(() => (
    localStorage.getItem(TOKEN_KEY) ? 'checking' : 'anonymous'
  ));
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(0);
  const [totalProductPages, setTotalProductPages] = useState(1);
  const [isFirstProductPage, setIsFirstProductPage] = useState(true);
  const [isLastProductPage, setIsLastProductPage] = useState(true);
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [queueState, setQueueState] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [adminForm, setAdminForm] = useState(INITIAL_PRODUCT_FORM);
  const [notice, setNotice] = useState(initialNotice);
  const [loading, setLoading] = useState(false);
  const didMountSearch = useRef(false);
  const isCreatingCheckout = useRef(false);
  const queueSessionRef = useRef(0);
  const queuePollTimerRef = useRef(null);
  const queueRequestRef = useRef(null);
  const isSignedIn = authStatus === 'authenticated';
  const isAdmin = isSignedIn && isAdminToken(token);
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0] ?? null;
  const cartSummary = useMemo(() => getCartSummary(cartItems), [cartItems]);
  const checkoutItems = useMemo(() => checkoutOrder?.items ?? [], [checkoutOrder]);
  const checkoutSummary = useMemo(() => {
    const summary = getCartSummary(checkoutItems);

    return {
      ...summary,
      total: Number(checkoutOrder?.totalPrice ?? checkoutOrder?.total_price ?? summary.total)
    };
  }, [checkoutItems, checkoutOrder]);

  const metrics = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + Number(product.stock ?? 0), 0);
    const reserved = orders.filter((order) => order.status === 'RESERVED' || order.status === 'CREATED').length;
    const paid = orders.filter((order) => order.status === 'PAID').length;

    return { totalStock, reserved, paid };
  }, [orders, products]);

  function getCheckoutToken(orderItems) {
    const checkoutKey = createCheckoutKey(orderItems);
    const storageKey = getCheckoutStorageKey(checkoutKey);
    const savedToken = sessionStorage.getItem(storageKey);

    if (savedToken) {
      return { checkoutKey, checkoutToken: savedToken };
    }

    const checkoutToken = createCheckoutToken();
    sessionStorage.setItem(storageKey, checkoutToken);

    return { checkoutKey, checkoutToken };
  }

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

  async function createCheckoutOrder(orderItems, { checkoutKey, checkoutToken, admissionToken, successMessage }) {
    const data = await createOrder(
      orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      { checkoutToken, admissionToken }
    );

    setCheckoutOrder({
      ...buildCheckoutOrder(data, orderItems),
      checkoutKey,
      checkoutToken,
      admissionToken
    });
    setActiveView('checkout');
    setNotice({ type: 'success', message: successMessage });
  }

  async function pollQueueStatus(sessionId) {
    const queueRequest = queueRequestRef.current;

    if (!queueRequest || queueRequest.sessionId !== sessionId) {
      return;
    }

    try {
      const snapshot = normalizeQueueResponse(await getQueueStatus(queueRequest.productId));

      if (queueSessionRef.current !== sessionId) {
        return;
      }

      setQueueState((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          phase: snapshot.admitted ? 'admitted' : 'waiting',
          position: snapshot.position ?? current.position,
          admissionToken: snapshot.admissionToken || current.admissionToken
        };
      });

      if (snapshot.admitted) {
        clearQueuePolling();
        queueRequestRef.current = null;
        setLoading(true);

        try {
          await createCheckoutOrder(queueRequest.orderItems, {
            checkoutKey: queueRequest.checkoutKey,
            checkoutToken: queueRequest.checkoutToken,
            admissionToken: snapshot.admissionToken,
            successMessage: `${queueRequest.productName} 주문서가 생성되었습니다.`
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
      setQueueState((current) => (current ? { ...current, phase: 'error' } : current));
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
          successMessage: `${firstItem?.name ?? '상품'} 주문서가 생성되었습니다.`
        });
      } finally {
        setLoading(false);
        resetQueueState();
      }

      return;
    }

    setQueueState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        phase: 'waiting',
        position: snapshot.position,
        admissionToken: snapshot.admissionToken || current.admissionToken
      };
    });
    setActiveView('queue');
    setLoading(false);
    clearQueuePolling();
    queuePollTimerRef.current = window.setTimeout(() => {
      pollQueueStatus(sessionId);
    }, QUEUE_POLL_INTERVAL_MS);
  }

  useEffect(() => {
    loadProducts(0, '');
  }, []);

  useEffect(() => {
    if (!token) {
      setAuthStatus('anonymous');
      setCartItems([]);
      return undefined;
    }

    let cancelled = false;

    async function validateSession() {
      try {
        const data = await getCart();

        if (!cancelled) {
          setCartItems(normalizeCartItems(data));
          setAuthStatus('authenticated');
        }
      } catch (error) {
        if (cancelled || error.status === 401 || error.status === 403) {
          return;
        }

        setCartItems([]);
        setAuthStatus('unverified');
        setNotice({ type: 'error', message: '서버에서 로그인 상태를 확인하지 못했습니다. 서버 연결 후 다시 확인합니다.' });
      }
    }

    function validateVisibleSession() {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    }

    validateSession();
    window.addEventListener('focus', validateSession);
    document.addEventListener('visibilitychange', validateVisibleSession);
    const intervalId = window.setInterval(validateVisibleSession, SESSION_VALIDATION_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', validateSession);
      document.removeEventListener('visibilitychange', validateVisibleSession);
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    if (isSignedIn) {
      loadOrders();
    } else {
      setOrders([]);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (activeView === 'admin' && !isAdmin) {
      setActiveView('shop');
      setNotice({ type: 'error', message: '관리자만 접근할 수 있는 메뉴입니다.' });
    }
  }, [activeView, isAdmin]);

  useEffect(() => {
    function expireSession() {
      localStorage.removeItem(TOKEN_KEY);
      setToken('');
      setAuthStatus('anonymous');
      setOrders([]);
      setCartItems([]);
      setCheckoutOrder(null);
      resetQueueState();
      clearStoredCheckoutTokens();
      setActiveView('shop');
      setNotice({ type: 'info', message: '로그인 세션이 만료되어 로그아웃되었습니다.' });
    }

    function syncToken(event) {
      if (event.key === TOKEN_KEY) {
        setToken(event.newValue ?? '');
        setAuthStatus(event.newValue ? 'checking' : 'anonymous');
      }
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    window.addEventListener('storage', syncToken);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
      window.removeEventListener('storage', syncToken);
    };
  }, []);

  useEffect(() => {
    const hasSelectedProduct = products.some((product) => product.id === selectedProductId);

    if (products.length > 0 && !hasSelectedProduct) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsProductDetailOpen(false);
      loadProducts(0, searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  async function loadProducts(page = 0, keyword = searchQuery) {
    try {
      const data = await getProducts({ page, size: PRODUCT_PAGE_SIZE, keyword });
      const nextProducts = Array.isArray(data) ? data : (data.content ?? []);

      setProducts(nextProducts);
      setProductPage(data.number ?? page);
      setTotalProductPages(Array.isArray(data) ? 1 : (data.totalPages || 1));
      setIsFirstProductPage(Array.isArray(data) ? true : Boolean(data.first));
      setIsLastProductPage(Array.isArray(data) ? true : Boolean(data.last));
      setNotice({ type: 'success', message: '상품 목록을 최신 상태로 불러왔습니다.' });
    } catch (error) {
      setProducts([]);
      setProductPage(0);
      setTotalProductPages(1);
      setIsFirstProductPage(true);
      setIsLastProductPage(true);
      setNotice({ type: 'error', message: `상품 목록을 불러오지 못했습니다. ${error.message}` });
    }
  }

  async function loadCart() {
    if (!isSignedIn) {
      setCartItems([]);
      return;
    }

    try {
      const data = await getCart();
      setCartItems(normalizeCartItems(data));
    } catch (error) {
      setCartItems([]);
      setNotice({ type: 'error', message: `장바구니를 불러오지 못했습니다. ${error.message}` });
    }
  }

  function handleProductPageChange(nextPage) {
    if (nextPage < 0 || nextPage >= totalProductPages || nextPage === productPage) {
      return;
    }

    setIsProductDetailOpen(false);
    loadProducts(nextPage);
  }

  function handleSearchChange(nextQuery) {
    setSearchQuery(nextQuery);
    setIsProductDetailOpen(false);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'signup') {
        await signupUser(authForm);
        setAuthMode('login');
        setNotice({ type: 'success', message: '회원가입이 완료되었습니다. 같은 정보로 로그인해 주세요.' });
        return;
      }

      const data = await loginUser(authForm);

      localStorage.setItem(TOKEN_KEY, data.accessToken);
      setToken(data.accessToken);
      setAuthStatus('checking');
      setActiveView('shop');
      setNotice({ type: 'success', message: '로그인 정보를 확인하고 있습니다.' });
    } catch (error) {
      window.alert(error.message);
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!selectedProduct) {
      setNotice({ type: 'error', message: '장바구니에 담을 상품을 먼저 선택해 주세요.' });
      return;
    }

    if (!isSignedIn) {
      setNotice({ type: 'error', message: '로그인 후 장바구니에 담을 수 있습니다.' });
      openAuthView();
      return;
    }

    const safeQuantity = Math.max(1, Number(quantity) || 1);
    setLoading(true);

    try {
      await addCartItem({
        productId: selectedProduct.id,
        quantity: safeQuantity
      });
      await loadCart();
      setNotice({ type: 'success', message: `${selectedProduct.name} ${safeQuantity}개를 장바구니에 담았습니다.` });
    } catch (error) {
      window.alert(error.message);
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrder() {
    if (!selectedProduct) {
      setNotice({ type: 'error', message: '주문할 상품을 먼저 선택해 주세요.' });
      return;
    }

    if (isCreatingCheckout.current) {
      return;
    }

    isCreatingCheckout.current = true;
    setLoading(true);

    try {
      const orderItems = [
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          description: selectedProduct.description,
          imageUrl: selectedProduct.imageUrl,
          price: selectedProduct.price,
          quantity: Number(quantity)
        }
      ];
      await beginQueuedCheckout(orderItems);
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      isCreatingCheckout.current = false;
      setLoading(false);
    }
  }

  async function handleOpenOrderSheet() {
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
      const data = await createOrder(orderItems, { checkoutToken });

      setCheckoutOrder({
        ...buildCheckoutOrder(data, orderItems),
        checkoutKey,
        checkoutToken
      });
      setActiveView('checkout');
      setNotice({ type: 'success', message: '장바구니 상품 주문서가 생성되었습니다.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      isCreatingCheckout.current = false;
      setLoading(false);
    }
  }

  async function handlePayCartOrders() {
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

      setCheckoutOrder(paidOrder);
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
      setNotice({ type: 'success', message: '결제가 완료되었습니다.' });
      setActiveView('orders');
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCartItemQuantity(cartItemId, nextQuantity) {
    const safeQuantity = Math.max(1, Number(nextQuantity) || 1);
    setLoading(true);

    try {
      await updateCartItem({ cartItemId, quantity: safeQuantity });
      await loadCart();
      setNotice({ type: 'success', message: '장바구니 수량을 변경했습니다.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCartItem(cartItemId) {
    setLoading(true);

    try {
      await deleteCartItem(cartItemId);
      await loadCart();
      setNotice({ type: 'success', message: '장바구니에서 상품을 삭제했습니다.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handlePayOrder(orderId, forceFail = false) {
    setLoading(true);

    try {
      const data = await payOrder(orderId, { forceFail });

      setOrders((current) => current.map((order) => (
        order.orderId === orderId ? { ...order, ...data, status: data.status ?? 'PAID' } : order
      )));
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

  async function handleCancelOrder(orderId) {
    setLoading(true);

    try {
      const data = await cancelOrder(orderId);
      setOrders((current) => current.map((order) => (
        order.orderId === orderId ? { ...order, ...data, status: data.status ?? 'CANCELED' } : order
      )));
      setNotice({ type: 'success', message: '주문이 취소되었습니다.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    }
  }

  async function handleRegisterProduct(event) {
    event.preventDefault();

    if (!isAdmin) {
      setActiveView('shop');
      setNotice({ type: 'error', message: '관리자만 상품을 등록할 수 있습니다.' });
      return;
    }

    setLoading(true);

    try {
      const data = await registerProduct(adminForm);

      await loadProducts(productPage);
      setAdminForm(INITIAL_PRODUCT_FORM);
      setNotice({ type: 'success', message: `${data.name ?? adminForm.name} 상품을 등록했습니다.` });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function handleCartClick() {
    setActiveView('cart');
    setIsProductDetailOpen(false);
    loadCart();
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setAuthStatus('anonymous');
    setOrders([]);
    setCartItems([]);
    setCheckoutOrder(null);
    resetQueueState();
    clearStoredCheckoutTokens();
    setActiveView('shop');
    setNotice({ type: 'info', message: '로그아웃되었습니다.' });
  }

  function openAuthView() {
    setAuthMode('login');
    setActiveView('auth');
  }

  function handleNavigate(nextView) {
    if (nextView === 'admin' && !isAdmin) {
      setNotice({ type: 'error', message: '관리자만 접근할 수 있는 메뉴입니다.' });
      setActiveView('shop');
      return;
    }

    setActiveView(nextView);
  }

  function handleBackToStore() {
    resetQueueState();
    setActiveView('shop');
    setIsProductDetailOpen(false);
  }

  function handleBackFromQueue() {
    resetQueueState();
    setActiveView('shop');
    setNotice({ type: 'info', message: '대기열을 종료하고 쇼핑 화면으로 돌아왔습니다.' });
  }

  useEffect(() => () => {
    clearQueuePolling();
  }, []);

  if (activeView === 'admin' && isAdmin) {
    return (
      <AdminShell
        adminForm={adminForm}
        loading={loading}
        notice={notice}
        products={products}
        setAdminForm={setAdminForm}
        onSubmit={handleRegisterProduct}
        onBackToStore={handleBackToStore}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <main className="app-shell">
      <Sidebar
        activeView={activeView}
        isSignedIn={isSignedIn}
        isAdmin={isAdmin}
        onNavigate={handleNavigate}
      />

      <section className="workspace">
        <Topbar
          isSignedIn={isSignedIn}
          isAuthChecking={authStatus === 'checking'}
          cartCount={cartSummary.count}
          onCartClick={handleCartClick}
          onLogout={handleLogout}
          onLoginClick={openAuthView}
        />
        <Notice notice={notice} />

        {activeView !== 'auth' && activeView !== 'shop' && activeView !== 'cart' && activeView !== 'checkout' && activeView !== 'admin' && (
          <section className="metric-grid">
            <Metric icon={Boxes} label="총 재고" value={metrics.totalStock.toLocaleString('ko-KR')} />
            <Metric icon={Clock3} label="예약 주문" value={metrics.reserved.toLocaleString('ko-KR')} />
            <Metric icon={Gauge} label="결제 완료" value={metrics.paid.toLocaleString('ko-KR')} />
          </section>
        )}

        {activeView === 'shop' && (
          <ShopView
            products={products}
            selectedProduct={selectedProduct}
            selectedProductId={selectedProductId}
            quantity={quantity}
            loading={loading}
            isSignedIn={isSignedIn}
            searchQuery={searchQuery}
            productPage={productPage}
            totalProductPages={totalProductPages}
            isFirstProductPage={isFirstProductPage}
            isLastProductPage={isLastProductPage}
            isDetailOpen={isProductDetailOpen}
            onSearchChange={handleSearchChange}
            onSelectProduct={setSelectedProductId}
            onOpenProductDetail={() => setIsProductDetailOpen(true)}
            onCloseProductDetail={() => setIsProductDetailOpen(false)}
            onQuantityChange={setQuantity}
            onCreateOrder={handleCreateOrder}
            onAddToCart={handleAddToCart}
            onRefreshProducts={() => loadProducts(productPage)}
            onProductPageChange={handleProductPageChange}
          />
        )}

        {activeView === 'queue' && (
          <QueueView
            queueState={queueState}
            onBackToStore={handleBackFromQueue}
          />
        )}

        {activeView === 'cart' && (
          <CartView
            cartItems={cartItems}
            cartSummary={cartSummary}
            loading={loading}
            isSignedIn={isSignedIn}
            onBackToShop={() => setActiveView('shop')}
            onRefreshCart={loadCart}
            onUpdateCartItemQuantity={handleUpdateCartItemQuantity}
            onDeleteCartItem={handleDeleteCartItem}
            onCreateCartOrders={handleOpenOrderSheet}
          />
        )}

        {activeView === 'checkout' && (
          <OrderSheetView
            cartItems={checkoutItems}
            cartSummary={checkoutSummary}
            loading={loading}
            onBackToCart={() => setActiveView('cart')}
            onPayCartOrders={handlePayCartOrders}
          />
        )}

        {activeView === 'auth' && (
          <div className="auth-view">
            <AuthPanel
              authMode={authMode}
              authForm={authForm}
              loading={loading}
              setAuthMode={setAuthMode}
              setAuthForm={setAuthForm}
              onSubmit={handleAuthSubmit}
            />
          </div>
        )}

        {activeView === 'orders' && (
          <OrdersView
            orders={orders}
            loading={loading}
            isSignedIn={isSignedIn}
            onRefresh={loadOrders}
            onPayOrder={handlePayOrder}
            onCancelOrder={handleCancelOrder}
          />
        )}

      </section>
    </main>
  );
}

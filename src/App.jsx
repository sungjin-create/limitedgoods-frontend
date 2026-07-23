import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Clock3, Gauge } from 'lucide-react';
import { registerProduct } from './api/index.js';
import { Metric } from './components/Metric.jsx';
import { Notice } from './components/Notice.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Topbar } from './components/Topbar.jsx';
import { AdminShell } from './features/admin/AdminShell.jsx';
import { AuthPanel } from './features/auth/AuthPanel.jsx';
import { useAuthSession } from './features/auth/useAuthSession.js';
import { CartView } from './features/cart/CartView.jsx';
import { useCart } from './features/cart/useCart.js';
import { OrderSheetView } from './features/checkout/OrderSheetView.jsx';
import { useCheckoutFlow } from './features/checkout/useCheckoutFlow.js';
import { useAppNavigation } from './features/navigation/useAppNavigation.js';
import { OrdersView } from './features/orders/OrdersView.jsx';
import { useOrders } from './features/orders/useOrders.js';
import { QueueView } from './features/queue/QueueView.jsx';
import { ShopView } from './features/shop/ShopView.jsx';
import { useProducts } from './features/shop/useProducts.js';
import { isAdminToken } from './utils/auth.js';
import { INITIAL_PRODUCT_FORM } from "./types/product.js";

const initialNotice = {
  type: 'info',
  message: '상품 정보를 불러오고 있습니다.'
};

export default function App() {
  const [adminForm, setAdminForm] = useState(INITIAL_PRODUCT_FORM);
  const [notice, setNotice] = useState(initialNotice);
  const [loading, setLoading] = useState(false);
  const checkoutFlowRef = useRef(null);
  const sessionActionsRef = useRef(null);
  const {
    token,
    authStatus,
    authMode,
    setAuthMode,
    authForm,
    setAuthForm,
    submitAuth: handleAuthSubmit,
    logout: handleLogout
  } = useAuthSession({
    setNotice,
    setLoading,
    onLogin: () => sessionActionsRef.current?.navigateToShop(),
    onSessionCleared: () => sessionActionsRef.current?.clearSessionData(),
    onValidationUnavailable: () => sessionActionsRef.current?.clearCartOnly()
  });
  const {
    products,
    setProducts,
    selectedProduct,
    selectedProductId,
    setSelectedProductId,
    quantity,
    setQuantity,
    searchQuery,
    productPage,
    totalProductPages,
    isFirstProductPage,
    isLastProductPage,
    loadProducts,
    handleProductPageChange,
    handleSearchChange
  } = useProducts({ setNotice });
  const isSignedIn = authStatus === 'authenticated';
  const isAdmin = isSignedIn && isAdminToken(token);
  const {
    activeView,
    isProductDetailOpen,
    navigate: updateBrowserHistory,
    goBack: goBackInApp,
    protectCurrentEntry: replaceCurrentHistoryWithSafeRedirect
  } = useAppNavigation({
    selectedProductId,
    onSelectProduct: setSelectedProductId,
    onLeaveQueue: () => checkoutFlowRef.current?.resetQueueState(),
    onUnsafeBack: (message) => {
      checkoutFlowRef.current?.clearCheckout();
      setNotice({ type: 'info', message });
    }
  });
  const {
    cartItems,
    cartSummary,
    clearCart,
    loadCart,
    addProduct: addCartProduct,
    updateQuantity: handleUpdateCartItemQuantity,
    removeItem: handleDeleteCartItem
  } = useCart({
    isSignedIn,
    setNotice,
    setLoading,
    onAuthRequired: openAuthView
  });
  const {
    orders,
    setOrders,
    clearOrders,
    loadOrders,
    loadOrderDetail,
    payExistingOrder: handlePayOrder,
    cancelExistingOrder: handleCancelOrder
  } = useOrders({ setNotice, setLoading });
  const checkoutFlow = useCheckoutFlow({
    selectedProduct,
    quantity,
    cartItems,
    setOrders,
    loadOrders,
    loadCart,
    navigate: updateBrowserHistory,
    protectCurrentEntry: replaceCurrentHistoryWithSafeRedirect,
    setNotice,
    setLoading
  });
  checkoutFlowRef.current = checkoutFlow;
  const {
    checkoutItems,
    checkoutSummary,
    queueState,
    resetQueueState,
    resetCheckoutFlow,
    createProductOrder: handleCreateOrder,
    createCartOrder: handleOpenOrderSheet,
    payCheckoutOrder: handlePayCartOrders
  } = checkoutFlow;
  sessionActionsRef.current = {
    navigateToShop: () => updateBrowserHistory('shop', { replace: true }),
    clearCartOnly: clearCart,
    clearSessionData: () => {
      clearOrders();
      clearCart();
      resetCheckoutFlow();
      updateBrowserHistory('shop', { replace: true });
    }
  };

  const metrics = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + Number(product.stock ?? 0), 0);
    const reserved = orders.filter((order) => order.status === 'RESERVED' || order.status === 'CREATED').length;
    const paid = orders.filter((order) => order.status === 'PAID').length;

    return { totalStock, reserved, paid };
  }, [orders, products]);

  useEffect(() => {
    if (isSignedIn) {
      loadOrders();
      loadCart();
    } else {
      clearOrders();
      clearCart();
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (activeView === 'admin' && !isAdmin) {
      updateBrowserHistory('shop', { replace: true });
      setNotice({ type: 'error', message: '관리자만 접근할 수 있는 메뉴입니다.' });
    }
  }, [activeView, isAdmin]);

  useEffect(() => {
    refreshView(activeView);
  }, [activeView]);

  function refreshView(view) {
    if (view === 'shop' || view === 'admin') {
      return loadProducts(view === 'shop' ? productPage : 0);
    }

    if (view === 'cart') {
      return loadCart();
    }

    if (view === 'orders') {
      return loadOrders();
    }

    return undefined;
  }

  async function handleRegisterProduct(event) {
    event.preventDefault();

    if (!isAdmin) {
      updateBrowserHistory('shop', { replace: true });
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
    if (activeView === 'cart') {
      refreshView('cart');
      return;
    }

    updateBrowserHistory('cart');
  }

  function openAuthView() {
    setAuthMode('login');
    updateBrowserHistory('auth');
  }

  function handleNavigate(nextView) {
    if (nextView === 'admin' && !isAdmin) {
      setNotice({ type: 'error', message: '관리자만 접근할 수 있는 메뉴입니다.' });
      updateBrowserHistory('shop', { replace: true });
      return;
    }

    if (activeView === nextView) {
      refreshView(nextView);
      return;
    }

    updateBrowserHistory(nextView);
  }

  function handleBackToStore() {
    resetQueueState();
    goBackInApp('shop');
  }

  function handleBackFromQueue() {
    resetQueueState();
    goBackInApp('shop');
    setNotice({ type: 'info', message: '대기열을 종료하고 쇼핑 화면으로 돌아왔습니다.' });
  }

  if (activeView === 'admin' && isAdmin) {
    return (
      <AdminShell
        adminForm={adminForm}
        loading={loading}
        notice={notice}
        products={products}
        setAdminForm={setAdminForm}
        onSubmit={handleRegisterProduct}
        onProductUpdated={(updatedProduct) => {
          setProducts((current) => current.map((product) => (
            product.id === updatedProduct.id ? { ...product, ...updatedProduct } : product
          )));
        }}
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
            onOpenProductDetail={() => updateBrowserHistory('shop', { detailOpen: true })}
            onCloseProductDetail={() => goBackInApp('shop')}
            onQuantityChange={setQuantity}
            onCreateOrder={handleCreateOrder}
            onAddToCart={() => addCartProduct(selectedProduct, quantity)}
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
            onBackToShop={() => goBackInApp('shop')}
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
            onBackToCart={() => goBackInApp('cart')}
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
            onLoadOrderDetail={loadOrderDetail}
            onPayOrder={handlePayOrder}
            onCancelOrder={handleCancelOrder}
          />
        )}

      </section>
    </main>
  );
}

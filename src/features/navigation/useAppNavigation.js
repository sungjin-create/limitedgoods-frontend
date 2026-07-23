import { useEffect, useRef, useState } from 'react';

const APP_HISTORY_KEY = 'limitedgoodsNavigation';
const APP_VIEWS = new Set(['shop', 'queue', 'cart', 'checkout', 'auth', 'orders', 'admin']);

export function useAppNavigation({
  selectedProductId,
  onSelectProduct,
  onLeaveQueue,
  onUnsafeBack
}) {
  const [activeView, setActiveView] = useState('shop');
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const historyIndexRef = useRef(0);
  const currentViewRef = useRef('shop');
  const selectedProductIdRef = useRef(selectedProductId);
  const callbacksRef = useRef({ onSelectProduct, onLeaveQueue, onUnsafeBack });

  selectedProductIdRef.current = selectedProductId;
  callbacksRef.current = { onSelectProduct, onLeaveQueue, onUnsafeBack };

  function getCurrentHistoryState() {
    const state = window.history.state;

    return state?.[APP_HISTORY_KEY] === true ? state : null;
  }

  function navigate(nextView, {
    detailOpen = false,
    productId = selectedProductIdRef.current,
    replace = false
  } = {}) {
    const nextDetailOpen = nextView === 'shop' && detailOpen;
    const currentState = getCurrentHistoryState();

    if (
      !replace
      && currentState?.view === nextView
      && Boolean(currentState.detailOpen) === nextDetailOpen
      && String(currentState.productId ?? '') === String(productId ?? '')
    ) {
      return;
    }

    const nextIndex = replace ? historyIndexRef.current : historyIndexRef.current + 1;
    const nextState = {
      [APP_HISTORY_KEY]: true,
      index: nextIndex,
      view: nextView,
      detailOpen: nextDetailOpen,
      productId: productId ?? null
    };

    window.history[replace ? 'replaceState' : 'pushState'](nextState, '', window.location.href);
    historyIndexRef.current = nextIndex;
    currentViewRef.current = nextView;
    setActiveView(nextView);
    setIsProductDetailOpen(nextDetailOpen);

    if (productId != null) {
      callbacksRef.current.onSelectProduct?.(productId);
    }
  }

  function goBack(fallbackView = 'shop') {
    const currentState = getCurrentHistoryState();

    if (currentState && Number(currentState.index) > 0) {
      window.history.back();
      return;
    }

    navigate(fallbackView, { replace: true });
  }

  function protectCurrentEntry(message) {
    const currentState = getCurrentHistoryState();
    const currentIndex = Number.isFinite(Number(currentState?.index))
      ? Number(currentState.index)
      : historyIndexRef.current;

    window.history.replaceState({
      [APP_HISTORY_KEY]: true,
      index: currentIndex,
      view: 'shop',
      detailOpen: false,
      productId: null,
      backWarning: message
    }, '', window.location.href);
  }

  useEffect(() => {
    const currentState = getCurrentHistoryState();
    const initialIndex = Number.isFinite(Number(currentState?.index))
      ? Number(currentState.index)
      : 0;

    historyIndexRef.current = initialIndex;
    currentViewRef.current = 'shop';
    window.history.replaceState({
      [APP_HISTORY_KEY]: true,
      index: initialIndex,
      view: 'shop',
      detailOpen: false,
      productId: null
    }, '', window.location.href);

    function handlePopState(event) {
      const state = event.state;
      const nextView = APP_VIEWS.has(state?.view) ? state.view : 'shop';

      if (state?.backWarning) {
        const { backWarning, ...safeState } = state;

        window.history.replaceState(safeState, '', window.location.href);
        window.alert(backWarning);
        callbacksRef.current.onUnsafeBack?.(backWarning);
      }

      if (currentViewRef.current === 'queue' && nextView !== 'queue') {
        callbacksRef.current.onLeaveQueue?.();
      }

      historyIndexRef.current = Number.isFinite(Number(state?.index)) ? Number(state.index) : 0;
      currentViewRef.current = nextView;
      setActiveView(nextView);
      setIsProductDetailOpen(nextView === 'shop' && Boolean(state?.detailOpen));

      if (state?.productId != null) {
        callbacksRef.current.onSelectProduct?.(state.productId);
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    activeView,
    isProductDetailOpen,
    navigate,
    goBack,
    protectCurrentEntry
  };
}

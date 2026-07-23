import { useMemo, useRef, useState } from 'react';
import { addCartItem, deleteCartItem, getCart, updateCartItem } from '../../api/index.js';
import { getCartSummary, normalizeCartItems } from '../../utils/cart.js';
import { getProductAvailability, getPurchaseLimit } from '../../utils/productAvailability.js';

export function useCart({ isSignedIn, setNotice, setLoading, onAuthRequired }) {
  const [cartItems, setCartItems] = useState([]);
  const cartSummary = useMemo(() => getCartSummary(cartItems), [cartItems]);
  const latestRequestRef = useRef(0);

  async function loadCart() {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    if (!isSignedIn) {
      setCartItems([]);
      return;
    }

    try {
      const data = await getCart();
      if (latestRequestRef.current !== requestId) return;
      setCartItems(normalizeCartItems(data));
    } catch (error) {
      if (latestRequestRef.current !== requestId) return;
      setCartItems([]);
      setNotice({ type: 'error', message: `장바구니를 불러오지 못했습니다. ${error.message}` });
    }
  }

  function clearCart() {
    latestRequestRef.current += 1;
    setCartItems([]);
  }

  async function addProduct(selectedProduct, quantity) {
    if (!selectedProduct) {
      setNotice({ type: 'error', message: '장바구니에 담을 상품을 먼저 선택해 주세요.' });
      return;
    }

    if (!isSignedIn) {
      setNotice({ type: 'error', message: '로그인 후 장바구니에 담을 수 있습니다.' });
      onAuthRequired?.();
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
    setLoading(true);

    try {
      await addCartItem({ productId: selectedProduct.id, quantity: safeQuantity });
      await loadCart();
      setNotice({
        type: 'success',
        message: `${selectedProduct.name} ${safeQuantity}개를 장바구니에 담았습니다.`
      });
    } catch (error) {
      window.alert(error.message);
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(cartItemId, nextQuantity) {
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

  async function removeItem(cartItemId) {
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

  return {
    cartItems,
    cartSummary,
    clearCart,
    loadCart,
    addProduct,
    updateQuantity,
    removeItem
  };
}

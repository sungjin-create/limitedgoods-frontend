import React from 'react';
import { Image, Minus, Plus, ShoppingBag, ShoppingCart, Sparkles } from 'lucide-react';
import { won } from '../../utils/format.js';
import { getProductImage } from '../../utils/images.js';
import { getProductAvailability, getPurchaseLimit } from '../../utils/productAvailability.js';
import { ScheduledSaleNotice } from './ScheduledSaleNotice.jsx';

export function PurchasePanel({ selectedProduct, quantity, loading, isSignedIn, onQuantityChange, onCreateOrder, onAddToCart }) {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const imageUrl = getProductImage(selectedProduct);
  const isLimitedProduct = selectedProduct?.type === 'LIMITED';
  const availability = getProductAvailability(selectedProduct);
  const purchaseLimit = getPurchaseLimit(selectedProduct);
  const maxQuantity = Math.max(1, Math.min(99, Number(selectedProduct?.stock ?? 0), purchaseLimit ?? 99));

  if (!selectedProduct) {
    return (
      <section className="purchase-panel">
        <div className="product-visual empty">
          <Sparkles size={26} />
          <span>Ready</span>
        </div>
        <div className="purchase-copy">
          <p className="eyebrow">Selected item</p>
          <h2>상품을 기다리는 중</h2>
          <p>상품 목록에서 원하는 아이템을 선택하면 이곳에서 가격, 재고, 주문 정보를 확인할 수 있습니다.</p>
        </div>
        <div className="purchase-actions">
          <button className="secondary-button" type="button" disabled>
            <ShoppingCart size={18} />
            장바구니
          </button>
          <button className="primary-button" type="button" disabled>
            <ShoppingBag size={18} />
            주문하기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="purchase-panel">
      <div className="product-visual">
        {imageUrl ? <img src={imageUrl} alt={selectedProduct.name} /> : <span className="image-placeholder"><Image size={28} /></span>}
        <span>{selectedProduct?.tag ?? 'Limited'}</span>
      </div>

      <div className="purchase-copy">
        <p className="eyebrow">Selected item</p>
        <h2>{selectedProduct?.name}</h2>
        <p>{selectedProduct?.description}</p>
        <span className={`store-status ${availability.tone}`}>{availability.label}</span>
        <small className="purchase-availability">{availability.message}</small>
        <ScheduledSaleNotice product={selectedProduct} />
      </div>

      <div className="buy-box">
        <div>
          <span>판매가</span>
          <strong>{won.format(selectedProduct?.price ?? 0)}</strong>
        </div>
        <div>
          <span>남은 수량</span>
          <strong>{selectedProduct?.stock ?? '-'}</strong>
        </div>
        <div>
          <span>1인 구매 제한</span>
          <strong>{purchaseLimit ? `${purchaseLimit}개` : '없음'}</strong>
        </div>
      </div>

      <div className="quantity-control" aria-label="수량 선택">
        <span>수량</span>
        <div>
          <button type="button" disabled={!availability.canPurchase || safeQuantity <= 1} onClick={() => onQuantityChange(Math.max(1, safeQuantity - 1))}>
            <Minus size={16} />
          </button>
          <input min="1" max={maxQuantity} disabled={!availability.canPurchase} type="number" value={Math.min(safeQuantity, maxQuantity)} onChange={(event) => onQuantityChange(Math.min(maxQuantity, Math.max(1, Number(event.target.value))))} />
          <button type="button" disabled={!availability.canPurchase || safeQuantity >= maxQuantity} onClick={() => onQuantityChange(Math.min(maxQuantity, safeQuantity + 1))}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="purchase-actions">
        <button className="secondary-button cart-add-button" type="button" disabled={loading || isLimitedProduct || !availability.canPurchase} onClick={onAddToCart}>
          <ShoppingCart size={18} />
          {isLimitedProduct ? '한정 상품은 바로 주문만 가능' : '장바구니에 담기'}
        </button>
        <button className="primary-button purchase-button" type="button" disabled={!isSignedIn || loading || !availability.canPurchase} onClick={onCreateOrder}>
          <ShoppingBag size={18} />
          {!availability.canPurchase ? availability.label : isSignedIn ? '바로 주문하기' : '로그인 후 주문하기'}
        </button>
      </div>
    </section>
  );
}

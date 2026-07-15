import React from 'react';
import { ArrowLeft, Image, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { won } from '../../utils/format.js';
import { getProductImage } from '../../utils/images.js';

export function CartView({
  cartItems,
  cartSummary,
  loading,
  isSignedIn,
  onBackToShop,
  onRefreshCart,
  onUpdateCartItemQuantity,
  onDeleteCartItem,
  onCreateCartOrders
}) {
  return (
    <section className="cart-view">
      <div className="cart-heading">
        <button className="back-button" type="button" onClick={onBackToShop}>
          <ArrowLeft size={18} />
          쇼핑 계속하기
        </button>
        <button className="secondary-button" type="button" disabled={!isSignedIn || loading} onClick={onRefreshCart}>
          <ShoppingCart size={18} />
          새로고침
        </button>
      </div>

      <div className="cart-layout">
        <section className="cart-list-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Cart</p>
              <h2>장바구니</h2>
            </div>
            <span className="cart-count-pill">{cartSummary.count.toLocaleString('ko-KR')}개</span>
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-product-list">
              <ShoppingCart size={30} />
              <strong>장바구니가 비어 있습니다.</strong>
              <span>마음에 드는 상품을 담으면 이곳에서 주문할 수 있습니다.</span>
            </div>
          ) : (
            <div className="cart-item-list">
              {cartItems.map((item) => {
                const imageUrl = getProductImage(item);
                const quantity = Math.max(1, Number(item.quantity) || 1);

                return (
                  <article className="cart-item" key={item.id}>
                    <div className="cart-item-image">
                      {imageUrl ? <img src={imageUrl} alt={item.name} /> : <Image size={24} />}
                    </div>
                    <div className="cart-item-copy">
                      <strong>{item.name}</strong>
                      {item.description && <p>{item.description}</p>}
                      <div className="cart-quantity-control" aria-label={`${item.name} 수량 변경`}>
                        <button
                          type="button"
                          disabled={loading || quantity <= 1}
                          onClick={() => onUpdateCartItemQuantity(item.id, quantity - 1)}
                        >
                          <Minus size={15} />
                        </button>
                        <span>{quantity.toLocaleString('ko-KR')}</span>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => onUpdateCartItemQuantity(item.id, quantity + 1)}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-price">
                      <strong>{won.format(item.totalPrice)}</strong>
                      <span>{won.format(item.price)} / 개</span>
                    </div>
                    <button
                      className="icon-button"
                      type="button"
                      title="장바구니에서 삭제"
                      disabled={loading}
                      onClick={() => onDeleteCartItem(item.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="cart-summary-panel">
          <p className="eyebrow">Order summary</p>
          <h2>주문 요약</h2>
          <div className="summary-row">
            <span>상품 수량</span>
            <strong>{cartSummary.count.toLocaleString('ko-KR')}개</strong>
          </div>
          <div className="summary-row total">
            <span>총 결제 예상 금액</span>
            <strong>{won.format(cartSummary.total)}</strong>
          </div>
          <button
            className="primary-button cart-order-button"
            type="button"
            disabled={!isSignedIn || loading || cartItems.length === 0}
            onClick={onCreateCartOrders}
          >
            <ShoppingBag size={18} />
            주문하기
          </button>
          {!isSignedIn && <p className="cart-help">로그인 후 장바구니 주문을 진행할 수 있습니다.</p>}
        </aside>
      </div>
    </section>
  );
}

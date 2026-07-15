import React from 'react';
import { ArrowLeft, CreditCard, Image, ShieldCheck, Truck } from 'lucide-react';
import { won } from '../../utils/format.js';
import { getProductImage } from '../../utils/images.js';

export function OrderSheetView({
  cartItems,
  cartSummary,
  loading,
  onBackToCart,
  onPayCartOrders
}) {
  const deliveryFee = cartItems.length > 0 ? 0 : 0;
  const paymentTotal = cartSummary.total + deliveryFee;

  return (
    <section className="order-sheet-view">
      <button className="back-button" type="button" onClick={onBackToCart}>
        <ArrowLeft size={18} />
        장바구니로 돌아가기
      </button>

      <div className="order-sheet-layout">
        <section className="order-sheet-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Checkout</p>
              <h2>주문서</h2>
            </div>
            <span className="cart-count-pill">{cartSummary.count.toLocaleString('ko-KR')}개</span>
          </div>

          <div className="checkout-section">
            <h3>주문 상품</h3>
            <div className="checkout-item-list">
              {cartItems.map((item) => {
                const imageUrl = getProductImage(item);

                return (
                  <article className="checkout-item" key={item.id}>
                    <div className="checkout-item-image">
                      {imageUrl ? <img src={imageUrl} alt={item.name} /> : <Image size={22} />}
                    </div>
                    <div className="checkout-item-copy">
                      <strong>{item.name}</strong>
                      <span>{Number(item.quantity ?? 1).toLocaleString('ko-KR')}개</span>
                    </div>
                    <div className="checkout-item-price">
                      <strong>{won.format(item.totalPrice)}</strong>
                      <span>{won.format(item.price)} / 개</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="checkout-section">
            <h3>배송 정보</h3>
            <div className="checkout-info-grid">
              <div>
                <Truck size={19} />
                <span>배송지</span>
                <strong>기본 배송지</strong>
              </div>
              <div>
                <ShieldCheck size={19} />
                <span>결제 보호</span>
                <strong>안전 결제 진행</strong>
              </div>
            </div>
          </div>
        </section>

        <aside className="payment-summary-panel">
          <p className="eyebrow">Payment</p>
          <h2>결제 금액</h2>
          <div className="summary-row">
            <span>상품 금액</span>
            <strong>{won.format(cartSummary.total)}</strong>
          </div>
          <div className="summary-row">
            <span>배송비</span>
            <strong>{deliveryFee === 0 ? '무료' : won.format(deliveryFee)}</strong>
          </div>
          <div className="summary-row total">
            <span>최종 결제 금액</span>
            <strong>{won.format(paymentTotal)}</strong>
          </div>
          <button
            className="primary-button payment-button"
            type="button"
            disabled={loading || cartItems.length === 0}
            onClick={onPayCartOrders}
          >
            <CreditCard size={18} />
            결제하기
          </button>
        </aside>
      </div>
    </section>
  );
}

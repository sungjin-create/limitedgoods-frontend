import React from 'react';
import { ArrowLeft, Image, Minus, Plus, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Truck } from 'lucide-react';
import { won } from '../../utils/format.js';
import { getProductImages } from '../../utils/images.js';
import { formatSaleDateTime, getProductAvailability, getPurchaseLimit } from '../../utils/productAvailability.js';
import { ScheduledSaleNotice } from './ScheduledSaleNotice.jsx';

export function ProductDetail({
  product,
  quantity,
  loading,
  isSignedIn,
  onBack,
  onQuantityChange,
  onCreateOrder,
  onAddToCart
}) {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const imageUrls = getProductImages(product);
  const mainImageUrl = imageUrls[0] ?? '';
  const thumbnailUrls = imageUrls.slice(0, 3);
  const isLimitedProduct = product?.type === 'LIMITED';
  const availability = getProductAvailability(product);
  const purchaseLimit = getPurchaseLimit(product);
  const maxQuantity = Math.max(1, Math.min(99, Number(product?.stock ?? 0), purchaseLimit ?? 99));

  if (!product) {
    return null;
  }

  return (
    <section className="product-detail">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        목록으로 돌아가기
      </button>

      <div className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-main-image">
            {mainImageUrl ? (
              <img src={mainImageUrl} alt={product.name} />
            ) : (
              <span className="image-placeholder detail-placeholder"><Image size={36} /></span>
            )}
            <span className={`detail-image-badge badge-${product.type?.toLowerCase() ?? 'drop'}`}>
              {product.type ?? 'Drop'}
            </span>
          </div>
          <div className="detail-thumbnails" aria-label="상품 이미지">
            {(thumbnailUrls.length > 0 ? thumbnailUrls : ['', '', '']).map((imageUrl, index) => (
              <span className="detail-thumbnail" key={`${imageUrl || 'empty'}-${index}`}>
                {imageUrl ? <img src={imageUrl} alt={`${product.name} 이미지 ${index + 1}`} /> : <Image size={20} />}
              </span>
            ))}
          </div>
        </div>

        <div className="detail-info">
          <p className="eyebrow">Limited drop</p>
          <h2>{product.name}</h2>
          <p className="detail-description">{product.description ?? '한정 판매 상품입니다.'}</p>

          <div className="detail-status-row">
            <span className={`store-status ${availability.tone}`}>{availability.label}</span>
            <span>{availability.message}</span>
          </div>

          <ScheduledSaleNotice product={product} />

          <div className="detail-price-row">
            <strong>{won.format(product.price ?? 0)}</strong>
            <span>남은 수량 {product.stock ?? '-'}</span>
          </div>

          <dl className="product-detail-specs">
            <div><dt>1인 구매 제한</dt><dd>{purchaseLimit ? `${purchaseLimit}개` : '제한 없음'}</dd></div>
            <div><dt>판매 기간</dt><dd>{product.saleStartAt || product.saleEndAt ? `${formatSaleDateTime(product.saleStartAt) ?? '즉시'} ~ ${formatSaleDateTime(product.saleEndAt) ?? '상시'}` : '상시 판매'}</dd></div>
            <div><dt>상품 상태</dt><dd>{availability.label}</dd></div>
          </dl>

          <div className="detail-benefits">
            <div>
              <Truck size={18} />
              <span>주문 즉시 재고를 예약합니다.</span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>로그인 후 결제 테스트를 진행할 수 있습니다.</span>
            </div>
            <div>
              <Sparkles size={18} />
              <span>드롭 상품은 빠르게 품절될 수 있습니다.</span>
            </div>
          </div>

          <div className="quantity-control detail-quantity" aria-label="수량 선택">
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

          <div className="detail-actions">
            <button className="secondary-button" type="button" disabled={loading || isLimitedProduct || !availability.canPurchase} onClick={onAddToCart}>
              <ShoppingCart size={18} />
              {isLimitedProduct ? '한정 상품은 바로 주문만 가능' : '장바구니에 담기'}
            </button>
            <button className="primary-button" type="button" disabled={!isSignedIn || loading || !availability.canPurchase} onClick={onCreateOrder}>
              <ShoppingBag size={18} />
              {!availability.canPurchase ? availability.label : isSignedIn ? '바로 주문하기' : '로그인 후 주문하기'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

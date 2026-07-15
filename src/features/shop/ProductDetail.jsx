import React from 'react';
import { ArrowLeft, Image, Minus, Plus, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Truck } from 'lucide-react';
import { won } from '../../utils/format.js';
import { getProductImages } from '../../utils/images.js';

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

          <div className="detail-price-row">
            <strong>{won.format(product.price ?? 0)}</strong>
            <span>남은 수량 {product.stock ?? '-'}</span>
          </div>

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
              <button type="button" onClick={() => onQuantityChange(Math.max(1, safeQuantity - 1))}>
                <Minus size={16} />
              </button>
              <input min="1" max="99" type="number" value={safeQuantity} onChange={(event) => onQuantityChange(Number(event.target.value))} />
              <button type="button" onClick={() => onQuantityChange(Math.min(99, safeQuantity + 1))}>
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="detail-actions">
            <button className="secondary-button" type="button" disabled={loading || isLimitedProduct} onClick={onAddToCart}>
              <ShoppingCart size={18} />
              {isLimitedProduct ? '한정 상품은 바로 주문만 가능' : '장바구니에 담기'}
            </button>
            <button className="primary-button" type="button" disabled={!isSignedIn || loading} onClick={onCreateOrder}>
              <ShoppingBag size={18} />
              {isSignedIn ? '바로 주문하기' : '로그인 후 주문하기'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

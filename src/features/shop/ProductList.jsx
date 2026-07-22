import React from 'react';
import { ChevronLeft, ChevronRight, Heart, Image, RefreshCw, ShoppingBag } from 'lucide-react';
import { won } from '../../utils/format.js';
import { getProductImage } from '../../utils/images.js';
import { getProductAvailability, getPurchaseLimit } from '../../utils/productAvailability.js';
import { ScheduledSaleNotice } from './ScheduledSaleNotice.jsx';

export function ProductList({
  products,
  selectedProductId,
  productPage,
  totalProductPages,
  isFirstProductPage,
  isLastProductPage,
  searchQuery,
  onSelectProduct,
  onOpenProductDetail,
  onRefreshProducts,
  onProductPageChange
}) {
  const pageNumbers = getVisiblePageNumbers(productPage, totalProductPages);
  const hasSearch = searchQuery.trim().length > 0;

  function handleProductSelect(productId) {
    onSelectProduct(productId);
  }

  function handleOpenDetail(event, productId) {
    event.stopPropagation();
    onSelectProduct(productId);
    onOpenProductDetail();
  }

  return (
    <section className="shop-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Shop the drop</p>
          <h2>{hasSearch ? '검색 결과' : '지금 구매 가능한 상품'}</h2>
        </div>
        <button className="icon-button" type="button" title="상품 새로고침" onClick={onRefreshProducts}>
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="product-list">
        {products.length === 0 ? (
          <div className="empty-product-list">
            <ShoppingBag size={28} />
            <strong>{hasSearch ? '검색 결과가 없습니다.' : '아직 등록된 상품이 없습니다.'}</strong>
            <span>{hasSearch ? '다른 검색어로 다시 찾아보세요.' : '관리자 화면에서 상품을 등록하면 이곳에 쇼핑 카드로 표시됩니다.'}</span>
          </div>
        ) : products.map((product) => {
          const imageUrl = getProductImage(product);
          const availability = getProductAvailability(product);
          const purchaseLimit = getPurchaseLimit(product);

          return (
            <article
              className={`product-card ${selectedProductId === product.id ? 'selected' : ''}`}
              key={product.id}
            >
              <button
                className="product-card-select"
                type="button"
                onClick={() => handleProductSelect(product.id)}
              >
                <span className="product-image" aria-hidden="true">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" />
                  ) : (
                    <span className="image-placeholder"><Image size={28} /></span>
                  )}
                  <span className={`product-badge badge-${product.type?.toLowerCase() ?? 'drop'}`}>{product.type ?? 'Drop'}</span>
                  <Heart className="wish-icon" size={18} />
                </span>
                  <span className="product-card-body">
                  <span className={`store-status ${availability.tone}`}>{availability.label}</span>
                  <strong>{product.name}</strong>
                  <small>{product.description ?? '한정 판매 상품'}</small>
                  <ScheduledSaleNotice product={product} compact />
                  <span className="product-card-meta">
                    <span>{availability.message}</span>
                    <span>{purchaseLimit ? `1인 최대 ${purchaseLimit}개` : '구매 수량 제한 없음'}</span>
                  </span>
                  <span className="product-card-footer">
                    <b>{won.format(product.price ?? 0)}</b>
                    <span>{availability.canPurchase ? `재고 ${product.stock ?? '-'}` : availability.label}</span>
                  </span>
                </span>
              </button>
              <div className="product-card-actions">
                <button
                  className="secondary-button product-detail-button"
                  type="button"
                  onClick={(event) => handleOpenDetail(event, product.id)}
                >
                  상세보기
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {totalProductPages > 1 && (
        <nav className="pagination" aria-label="상품 페이지">
          <button
            className="pagination-button"
            type="button"
            disabled={isFirstProductPage}
            onClick={() => onProductPageChange(productPage - 1)}
          >
            <ChevronLeft size={17} />
            이전
          </button>

          <div className="page-number-list">
            {pageNumbers.map((pageNumber) => (
              <button
                className={`page-number ${pageNumber === productPage ? 'active' : ''}`}
                key={pageNumber}
                type="button"
                aria-current={pageNumber === productPage ? 'page' : undefined}
                onClick={() => onProductPageChange(pageNumber)}
              >
                {pageNumber + 1}
              </button>
            ))}
          </div>

          <button
            className="pagination-button"
            type="button"
            disabled={isLastProductPage}
            onClick={() => onProductPageChange(productPage + 1)}
          >
            다음
            <ChevronRight size={17} />
          </button>
        </nav>
      )}
    </section>
  );
}

function getVisiblePageNumbers(currentPage, totalPages) {
  const visibleCount = 5;
  const safeTotalPages = Math.max(totalPages, 1);
  const half = Math.floor(visibleCount / 2);
  const start = Math.max(0, Math.min(currentPage - half, safeTotalPages - visibleCount));
  const end = Math.min(safeTotalPages, start + visibleCount);

  return Array.from({ length: end - start }, (_, index) => start + index);
}

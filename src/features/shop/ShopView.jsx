import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getProductImage } from '../../utils/images.js';
import { ProductDetail } from './ProductDetail.jsx';
import { ProductList } from './ProductList.jsx';
import { PurchasePanel } from './PurchasePanel.jsx';

export function ShopView({
  products,
  selectedProduct,
  selectedProductId,
  quantity,
  loading,
  isSignedIn,
  searchQuery,
  productPage,
  totalProductPages,
  isFirstProductPage,
  isLastProductPage,
  isDetailOpen,
  onSearchChange,
  onSelectProduct,
  onOpenProductDetail,
  onCloseProductDetail,
  onQuantityChange,
  onCreateOrder,
  onAddToCart,
  onRefreshProducts,
  onProductPageChange
}) {
  const [availabilityTick, setAvailabilityTick] = useState(0);
  const heroImageUrl = getProductImage(selectedProduct);
  const heroStyle = heroImageUrl ? { '--hero-image': `url("${heroImageUrl}")` } : undefined;

  useEffect(() => {
    const now = Date.now();
    const nextTransition = products
      .flatMap((product) => [product.saleStartAt, product.saleEndAt])
      .map((value) => value ? new Date(value).getTime() : NaN)
      .filter((time) => Number.isFinite(time) && time > now)
      .sort((first, second) => first - second)[0];

    if (!nextTransition) return undefined;

    const timeoutId = window.setTimeout(
      () => setAvailabilityTick((tick) => tick + 1),
      Math.max(0, nextTransition - now) + 100
    );

    return () => window.clearTimeout(timeoutId);
  }, [products, availabilityTick]);

  if (isDetailOpen && selectedProduct) {
    return (
      <ProductDetail
        product={selectedProduct}
        quantity={quantity}
        loading={loading}
        isSignedIn={isSignedIn}
        onBack={onCloseProductDetail}
        onQuantityChange={onQuantityChange}
        onCreateOrder={onCreateOrder}
        onAddToCart={onAddToCart}
      />
    );
  }

  return (
    <div className="shop-home">
      <section className="shop-hero" style={heroStyle}>
        <div className="shop-hero-copy">
          <p className="eyebrow">Limited Goods</p>
          <h2>오늘 공개된 한정 상품을 가장 먼저 만나보세요.</h2>
          <p>
            빠르게 품절되는 드롭 상품을 둘러보고, 원하는 수량을 선택해 바로 주문할 수 있습니다.
          </p>
        </div>
        <div className="hero-product-card">
          <span>New drop</span>
          <strong>{selectedProduct?.name ?? 'Limited edition'}</strong>
          <small>{selectedProduct?.tag ?? 'Curated pick'}</small>
        </div>
      </section>

      <label className="shop-search">
        <Search size={20} />
        <input
          type="search"
          value={searchQuery}
          placeholder="상품명, 설명, 태그로 검색"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="shop-commerce-grid">
        <ProductList
          products={products}
          selectedProductId={selectedProductId}
          productPage={productPage}
          totalProductPages={totalProductPages}
          isFirstProductPage={isFirstProductPage}
          isLastProductPage={isLastProductPage}
          searchQuery={searchQuery}
          onSelectProduct={onSelectProduct}
          onOpenProductDetail={onOpenProductDetail}
          onRefreshProducts={onRefreshProducts}
          onProductPageChange={onProductPageChange}
        />
        <PurchasePanel
          selectedProduct={selectedProduct}
          quantity={quantity}
          loading={loading}
          isSignedIn={isSignedIn}
          onQuantityChange={onQuantityChange}
          onCreateOrder={onCreateOrder}
          onAddToCart={onAddToCart}
        />
      </div>
    </div>
  );
}

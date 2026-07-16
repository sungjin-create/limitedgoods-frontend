import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, ListFilter, PackagePlus, RefreshCw, Search, Settings2, XCircle } from 'lucide-react';
import { getAdminProducts } from '../../../api/admin.js';
import { SectionHeader, won } from '../components/AdminUi.jsx';

function parseSummary(payload) {
  const source = payload?.summary;
  if (!source || typeof source !== 'object') return null;

  const total = Number(
    source.totalCount
    ?? source.totalProductCount
    ?? source.total
  );
  const onSale = Number(
    source.onSaleCount
    ?? source.saleCount
    ?? source.sellingCount
    ?? source.activeCount
  );
  const lowStock = Number(
    source.lowStockCount
    ?? source.warningStockCount
    ?? source.imminentStockCount
  );
  const soldOut = Number(
    source.soldOutCount
    ?? source.outOfStockCount
    ?? source.soldoutCount
  );

  return {
    total: Number.isFinite(total) ? total : null,
    onSale: Number.isFinite(onSale) ? onSale : null,
    lowStock: Number.isFinite(lowStock) ? lowStock : null,
    soldOut: Number.isFinite(soldOut) ? soldOut : null
  };
}

function normalizeAdminProducts(payload) {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.products)
      ? payload.products
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.content)
          ? payload.content
          : [];

  const products = source.map((product, index) => {
    const id = product?.id ?? product?.productId ?? index + 1;
    const name = product?.name ?? product?.productName ?? '상품명 미정';
    const stock = Number(product?.stock ?? product?.availableStock ?? 0);
    const reserved = Number(product?.reserved ?? product?.reservedStock ?? 0);
    const sold = Number(product?.sold ?? product?.salesCount ?? 0);
    const status = product?.statusLabel
      ?? product?.status
      ?? (stock === 0 ? '품절' : '판매중');
    const type = product?.type ?? product?.productType;
    const visible = product?.visible ?? product?.isVisible ?? true;
    const saleStartAt = product?.saleStartAt ?? product?.saleStartDate ?? null;
    const saleEndAt = product?.saleEndAt ?? product?.saleEndDate ?? null;
    const soldCount = Number(product?.soldCount ?? product?.salesCount ?? 0);
    const initialStock = Number(product?.initialStock ?? product?.stock ?? 0);
    const maxPurchaseQuantity = product?.maxPurchaseQuantity ?? null;


    return {
      id,
      name,
      price: Number(product?.price ?? 0),
      stock,
      reserved,
      initialStock,
      soldCount,
      dropAt: product?.dropAt ?? product?.dropDate ?? '상시 판매',
      status,
      type,
      visible,
      saleStartAt,
      saleEndAt,
      maxPurchaseQuantity
    };
  });

  return {
    products,
    summary: parseSummary(payload)
  };
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return "";

  return new Date(dateTime).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function AdminProducts({ onMove }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');

    try {
      const payload = await getAdminProducts();
      const normalized = normalizeAdminProducts(payload);
      setProducts(normalized.products);
      setSummary(normalized.summary);
    } catch (err) {
      setError(err.message || '상품 데이터를 불러오지 못했습니다.');
      setProducts([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const keyword = query.trim().toLowerCase();
  const filtered = useMemo(() => products.filter((product) => {
    if (!keyword) return true;

    return String(product.name).toLowerCase().includes(keyword)
      || String(product.id).toLowerCase().includes(keyword);
  }), [products, keyword]);

  const lowStockCount = products.filter((item) => {
    const stock = Number(item.stock ?? 0);
    return stock > 0 && stock <= 10;
  }).length;

  const soldOutCount = products.filter((item) => Number(item.stock ?? 0) === 0).length;
  const onSaleCount = products.filter((item) => Number(item.stock ?? 0) > 0).length;

  const totalValue = summary?.total ?? products.length;
  const onSaleValue = summary?.onSale ?? onSaleCount;
  const lowStockValue = summary?.lowStock ?? lowStockCount;
  const soldOutValue = summary?.soldOut ?? soldOutCount;



  return (
    <div className="admin-page-stack">
      <SectionHeader eyebrow="Catalog management" title="상품 관리" description="판매 상품, 가용 재고와 예약 수량을 관리합니다." action={<button className="admin-primary-button" type="button" onClick={() => onMove('product-create')}><PackagePlus size={16} /> 새 상품 등록</button>} />

      {error && (
        <section className="admin-card admin-alert-item critical">
          <span className="admin-alert-icon"><AlertTriangle size={18} /></span>
          <div>
            <strong>상품 목록 조회 실패</strong>
            <p>{error}</p>
            <small>백엔드의 /api/admin/backoffice/product 응답을 확인해 주세요.</small>
          </div>
        </section>
      )}

      <section className="admin-product-summary">
        <div><Boxes size={20} /><span>전체 상품<strong>{loading ? '-' : totalValue}</strong></span></div>
        <div><CheckCircle2 size={20} /><span>판매중<strong>{loading ? '-' : onSaleValue}</strong></span></div>
        <div><AlertTriangle size={20} /><span>재고 임박<strong>{loading ? '-' : lowStockValue}</strong></span></div>
        <div><XCircle size={20} /><span>품절<strong>{loading ? '-' : soldOutValue}</strong></span></div>
      </section>
      <section className="admin-card admin-table-card">
        <div className="admin-table-toolbar"><label className="admin-search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="상품명/상품번호 검색" /></label>
          <button className="admin-outline-button" type="button"><ListFilter size={16} /> 판매 상태</button>
          <button className="admin-outline-button" type="button" onClick={loadProducts} disabled={loading}><RefreshCw size={16} /> {loading ? '불러오는 중' : '새로고침'}</button></div>
        <div className="admin-table-scroll"><table className="admin-table product-table"><thead>
          <tr>
            <th>ID</th>
            <th>상품명</th>
            <th>판매가</th>
            <th>초기 재고</th>
            <th>현재 재고</th>
            <th>누적 판매</th>
            <th>1인당 구매 갯수</th>
            <th>타입</th>
            <th>판매 일정</th>
            <th>상품 노출 여부</th>
            <th></th>
            <th />
          </tr></thead><tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9}>{loading ? '상품 데이터를 불러오는 중입니다.' : '조회된 상품이 없습니다.'}</td>
              </tr>
            )}
            {
              filtered.map((product) => {
                const status = product.status ?? (stock === 0 ? "품절" : "판매중");
                const type = product.type;

                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.id}</strong>
                    </td>

                    <td>
                      <div className="admin-product-cell">
                        <div>
                          <strong>{product.name}</strong>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>{won.format(product.price)}</strong>
                    </td>

                    <td>
                      <strong >
                        {product.initialStock}개
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {product.stock}개
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {product.soldCount}개
                      </strong>
                    </td>

                    <td>
                      <span>
                        {product.maxPurchaseQuantity == null ? "제한 없음" : product.maxPurchaseQuantity + "개"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-product-type ${type === "NORMAL"
                          ? "normal"
                          : type === "LIMITED"
                            ? "limited"
                            : ""
                          }`}
                      >
                        {type}
                      </span>
                    </td>

                    <td>
                      <div className="admin-sale-period">
                        {product.saleStartAt ? (
                          <>
                            <span>{formatDateTime(product.saleStartAt)}</span>
                            <span>~ {formatDateTime(product.saleEndAt)}</span>
                          </>
                        ) : (
                          <span className="admin-sale-always">상시 판매</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <label className="admin-switch">
                        <input
                          type="checkbox"
                          checked={product.visible}
                          disabled
                          readOnly
                        />
                        <span className="admin-slider"></span>
                      </label>
                    </td>

                    <td>
                      <div className="admin-action-buttons">
                        <button
                          className="admin-outline-button"
                          onClick={() => navigate(`/admin/products/${product.id}`)}
                        >
                          상세
                        </button>

                        <button
                          className="admin-outline-button"
                          onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                        >
                          수정
                        </button>

                        <button
                          className="admin-danger-button"
                          onClick={() => navigate(`/admin/products/${product.id}/delete`)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody></table></div>
      </section>
    </div>
  );
}

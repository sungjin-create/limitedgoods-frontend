import React, { useEffect, useState } from 'react';
import { ClipboardCheck, FilePenLine, Package } from 'lucide-react';
import { SectionHeader, won } from '../components/AdminUi.jsx';

const INITIAL_FORM = {
  code: '',
  name: '',
  price: '',
  type: 'NORMAL',
  maxPurchaseQuantity: ''
};

function createForm(product) {
  if (!product) return INITIAL_FORM;

  return {
    code: String(product.id ?? product.code ?? ''),
    name: product.name ?? '',
    price: String(product.price ?? ''),
    type: product.type ?? 'NORMAL',
    maxPurchaseQuantity: product.maxPurchaseQuantity == null ? '' : String(product.maxPurchaseQuantity)
  };
}

export function AdminProductUpdate({ product, onMove, onProductDraftChange }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setForm(createForm(product));
    setIsSaved(false);
  }, [product]);

  function handleSubmit(event) {
    event.preventDefault();
    onProductDraftChange({
      ...product,
      name: form.name,
      price: Number(form.price),
      type: form.type,
      maxPurchaseQuantity: form.maxPurchaseQuantity === '' ? null : Number(form.maxPurchaseQuantity)
    });
    setIsSaved(true);
    onMove('product-status');
  }

  return (
    <div className="admin-page-stack">
      <SectionHeader
        eyebrow="Product edit"
        title="상품 변경"
        description="등록된 상품의 기본 정보와 판매 조건을 수정합니다."
      />
      <ol className="admin-product-flow" aria-label="상품 변경 단계"><li className="active"><b>1</b>상품 정보</li><li><b>2</b>상태 관리</li><li><b>3</b>판매 일정</li></ol>

      {isSaved && (
        <section className="admin-card admin-alert-item info">
          <span className="admin-alert-icon"><ClipboardCheck size={18} /></span>
          <div>
            <strong>변경 요청을 저장했습니다</strong>
            <p>검수 후 반영되도록 처리 큐에 전달됩니다.</p>
            <small>실제 API 연결 전까지는 데모 동작입니다.</small>
          </div>
        </section>
      )}

      {!product ? (
        <section className="admin-card admin-empty-selection">
          <Package size={22} />
          <div><strong>선택된 상품이 없습니다</strong><p>상품 관리 목록에서 수정할 상품을 선택해 주세요.</p></div>
          <button className="admin-outline-button" type="button" onClick={() => onMove('products')}>상품 목록으로</button>
        </section>
      ) : (
        <form className="admin-register-layout" onSubmit={handleSubmit}>
          <section className="admin-card admin-register-form">
            <div className="admin-form-section">
              <div><span>01</span><h3>기본 정보</h3></div>
              <div className="admin-form-grid">
                <label>
                  <span>상품 코드</span>
                  <input value={form.code} readOnly />
                </label>
                <label>
                  <span>상품명</span>
                  <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </label>
              </div>
            </div>

            <div className="admin-form-section">
              <div><span>02</span><h3>판매 정보</h3></div>
              <div className="admin-form-grid">
                <label>
                  <span>판매 가격</span>
                  <div className="admin-input-prefix"><b>₩</b><input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div>
                </label>
                <label>
                  <span>1인 구매 제한</span>
                  <div className="admin-input-suffix"><input type="number" min="1" value={form.maxPurchaseQuantity} onChange={(event) => setForm({ ...form, maxPurchaseQuantity: event.target.value })} placeholder="제한 없음" /><b>개</b></div>
                </label>
                <label>
                  <span>상품 타입</span>
                  <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                    <option value="NORMAL">일반</option>
                    <option value="LIMITED">한정</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="admin-form-section">
              <div><span>03</span><h3>변경 확인</h3></div>
              <p className="admin-update-note">변경 내용을 저장하면 운영 검수 후 상품 정보에 반영됩니다.</p>
            </div>

            <div className="admin-register-actions">
              <button className="admin-outline-button" type="button" onClick={() => onMove('products')}>목록으로</button>
              <button className="admin-primary-button" type="submit"><FilePenLine size={16} /> 다음: 상태 관리</button>
            </div>
          </section>

          <aside className="admin-register-side">
            <section className="admin-card admin-product-context-card">
            <div className="admin-product-context-title"><Package size={18} /><span>현재 상품 정보</span></div>
            <strong>{product.name}</strong>
            <span className={`admin-product-type ${product.type === 'LIMITED' ? 'limited' : 'normal'}`}>{product.type ?? 'NORMAL'}</span>
            <dl className="admin-product-context-list">
              <div><dt>현재 판매가</dt><dd>{won.format(product.price ?? 0)}</dd></div>
              <div><dt>가용 재고</dt><dd>{Number(product.stock ?? 0).toLocaleString()}개</dd></div>
              <div><dt>초기 재고</dt><dd>{Number(product.initialStock ?? product.stock ?? 0).toLocaleString()}개</dd></div>
              <div><dt>판매 수량</dt><dd>{Number(product.soldCount ?? 0).toLocaleString()}개</dd></div>
              <div><dt>1인 구매 제한</dt><dd>{product.maxPurchaseQuantity == null ? '제한 없음' : `${product.maxPurchaseQuantity}개`}</dd></div>
              <div><dt>노출 상태</dt><dd>{product.visible ? '노출 중' : '비공개'}</dd></div>
            </dl>
            </section>
            <section className="admin-card admin-checklist">
              <h3>변경 전 체크</h3>
              <label><input type="checkbox" defaultChecked /> 가격과 재고 변경 사항 확인</label>
              <label><input type="checkbox" defaultChecked /> 구매 제한 정책 확인</label>
              <label><input type="checkbox" /> 판매 상태 변경 영향 확인</label>
            </section>
          </aside>
        </form>
      )}
    </div>
  );
}

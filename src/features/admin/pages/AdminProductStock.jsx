import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Boxes, ClipboardCheck, CreditCard, Minus, Package, Plus, RefreshCw, ShoppingCart, Warehouse } from 'lucide-react';
import { adjustProductStock, getAdminProductStockOverview } from '../../../api/admin.js';
import { SectionHeader, won } from '../components/AdminUi.jsx';

const ADJUSTMENT_TYPES = {
  INCREASE: { label: '입고', description: '현재 가용 재고에 수량을 더합니다.' },
  DECREASE: { label: '차감', description: '현재 가용 재고에서 수량을 뺍니다.' }
};

function toNullableNumber(...values) {
  const value = values.find((item) => item !== undefined && item !== null);
  if (value === undefined) return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeStockOverview(payload, fallbackStock) {
  const source = payload?.stockOverview ?? payload ?? {};

  return {
    availableStock: toNullableNumber(source.availableStock, source.currentStock, source.stock, fallbackStock),
    orderPendingStock: toNullableNumber(source.orderPendingStock, source.pendingOrderStock, source.reservedStock),
    paymentPendingStock: toNullableNumber(source.paymentPendingStock, source.pendingPaymentStock),
    snapshotAt: source.snapshotAt ?? source.updatedAt ?? new Date().toISOString()
  };
}

function formatStockCount(value, loading) {
  if (loading || value == null) return '-';
  return `${value.toLocaleString('ko-KR')}개`;
}

export function AdminProductStock({ product, onMove, onStockAdjusted }) {
  const [adjustmentType, setAdjustmentType] = useState('INCREASE');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [stockOverview, setStockOverview] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState('');
  const stockRequestRef = useRef(0);

  useEffect(() => {
    setAdjustmentType('INCREASE');
    setQuantity('');
    setReason('');
    setResult(null);
    setStockOverview(null);
    loadStockOverview();

    return () => {
      stockRequestRef.current += 1;
    };
  }, [product?.id]);

  const currentStock = Number(stockOverview?.availableStock ?? product?.stock ?? 0);
  const productStatus = String(product?.status ?? '').toUpperCase();
  const isStockAdjustmentBlocked = productStatus === 'ACTIVE' || productStatus === 'ARCHIVED';
  const inputQuantity = Number(quantity) || 0;
  const stockDelta = adjustmentType === 'INCREASE' ? inputQuantity : -inputQuantity;
  const expectedStock = currentStock + stockDelta;
  const isValidAdjustment = !isStockAdjustmentBlocked && inputQuantity > 0 && expectedStock >= 0 && reason.trim().length > 0;

  const adjustmentSummary = useMemo(() => {
    const prefix = stockDelta >= 0 ? '+' : '';
    return `${prefix}${stockDelta.toLocaleString()}개 ${ADJUSTMENT_TYPES[adjustmentType].label}`;
  }, [adjustmentType, inputQuantity, stockDelta]);

  async function loadStockOverview() {
    if (!product?.id) return;

    const requestId = stockRequestRef.current + 1;
    stockRequestRef.current = requestId;
    setStockLoading(true);
    setStockError('');

    try {
      const payload = await getAdminProductStockOverview(product.id);
      if (stockRequestRef.current !== requestId) return;
      setStockOverview(normalizeStockOverview(payload, product.stock));
    } catch (error) {
      if (stockRequestRef.current !== requestId) return;
      setStockError(error.message || '재고 상세 현황을 불러오지 못했습니다.');
    } finally {
      if (stockRequestRef.current === requestId) setStockLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isValidAdjustment || submitting) return;

    setSubmitting(true);
    setResult(null);

    try {
      const response = await adjustProductStock({
        id: product.id,
        adjustmentType,
        quantity: inputQuantity,
        reason,
      });
      setResult({ type: 'success', summary: adjustmentSummary, stock: Number(response.stock ?? expectedStock) });
      setStockOverview((current) => ({
        ...current,
        availableStock: Number(response.stock ?? expectedStock),
        snapshotAt: new Date().toISOString()
      }));
      onStockAdjusted?.(response);
      setQuantity('');
      setReason('');
    } catch (error) {
      setResult({ type: 'error', message: error.message, status: error.status, code: error.code });
    } finally {
      setSubmitting(false);
    }
  }

  if (!product) {
    return (
      <div className="admin-page-stack">
        <SectionHeader eyebrow="Stock management" title="재고 관리" description="입고와 차감으로 가용 재고를 안전하게 관리합니다." />
        <section className="admin-card admin-empty-selection">
          <Warehouse size={22} />
          <div><strong>선택된 상품이 없습니다</strong><p>상품 관리 목록에서 재고를 조정할 상품을 선택해 주세요.</p></div>
          <button className="admin-outline-button" type="button" onClick={() => onMove('products')}>상품 목록으로</button>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page-stack">
      <SectionHeader
        eyebrow="Stock management"
        title="재고 관리"
        description="가용 재고와 주문·결제 진행 재고를 확인하고 입고와 차감을 처리합니다."
        action={<button className="admin-outline-button" type="button" onClick={loadStockOverview} disabled={stockLoading}><RefreshCw size={16} /> {stockLoading ? '불러오는 중' : '새로고침'}</button>}
      />

      <section className="admin-stock-overview-grid" aria-label="재고 상세 현황">
        <article className="admin-card">
          <span className="admin-stock-overview-icon available"><Boxes size={19} /></span>
          <div><span>현재 가용 재고</span><strong>{formatStockCount(stockOverview?.availableStock ?? currentStock, false)}</strong><small>신규 주문에 사용할 수 있는 수량</small></div>
        </article>
        <article className="admin-card">
          <span className="admin-stock-overview-icon order"><ShoppingCart size={19} /></span>
          <div><span>주문 진행 재고</span><strong>{formatStockCount(stockOverview?.orderPendingStock, stockLoading)}</strong><small>주문 생성 후 결제 대기 중인 수량</small></div>
        </article>
        <article className="admin-card">
          <span className="admin-stock-overview-icon payment"><CreditCard size={19} /></span>
          <div><span>결제 진행 재고</span><strong>{formatStockCount(stockOverview?.paymentPendingStock, stockLoading)}</strong><small>결제 처리 단계에 있는 수량</small></div>
        </article>
      </section>
      {stockOverview?.snapshotAt && <p className="admin-stock-snapshot-time">마지막 조회: {new Date(stockOverview.snapshotAt).toLocaleString('ko-KR')}</p>}

      {stockError && (
        <section className="admin-card admin-alert-item critical">
          <span className="admin-alert-icon"><AlertTriangle size={18} /></span>
          <div><strong>재고 상세 현황을 불러오지 못했습니다</strong><p>{stockError}</p><small>마지막 조회값 또는 상품 목록에서 받은 가용 재고를 표시합니다.</small></div>
          <button className="admin-outline-button" type="button" onClick={loadStockOverview}>다시 시도</button>
        </section>
      )}

      {isStockAdjustmentBlocked && (
        <section className="admin-card admin-alert-item critical">
          <span className="admin-alert-icon"><AlertTriangle size={18} /></span>
          <div>
            <strong>{productStatus === 'ACTIVE' ? '판매 중에는 재고를 변경할 수 없습니다' : '운영 종료 상품은 재고를 변경할 수 없습니다'}</strong>
            <p>{productStatus === 'ACTIVE' ? '상품 상태를 PAUSED 등 비활성 상태로 변경한 후 다시 시도해 주세요.' : 'ARCHIVED 상태는 최종 상태이므로 재고 조정이 제한됩니다.'}</p>
            <small>현재 상품 상태: {productStatus}</small>
          </div>
          {productStatus === 'ACTIVE' && <button className="admin-outline-button" type="button" onClick={() => onMove('product-status')}>상태 변경하기</button>}
        </section>
      )}

      {result?.type === 'success' && (
        <section className="admin-card admin-alert-item info">
          <span className="admin-alert-icon"><ClipboardCheck size={18} /></span>
          <div>
            <strong>재고 조정이 완료되었습니다</strong>
            <p>{result.summary} · 현재 재고 {result.stock.toLocaleString()}개</p>
            <small>백엔드의 최신 재고가 상품 목록과 판매 화면에 반영되었습니다.</small>
          </div>
        </section>
      )}
      {result?.type === 'error' && (
        <section className="admin-card admin-alert-item critical">
          <span className="admin-alert-icon"><AlertTriangle size={18} /></span>
          <div><strong>재고를 조정하지 못했습니다</strong><p>{result.message}</p><small>{result.status ? `HTTP ${result.status}` : '네트워크 오류'}{result.code ? ` · ${result.code}` : ''}</small></div>
        </section>
      )}

      <form className="admin-stock-layout" onSubmit={handleSubmit}>
        <section className="admin-card admin-register-form">
          <div className="admin-form-section">
            <div><span>01</span><h3>조정 대상</h3></div>
            <div className="admin-form-grid">
              <label><span>상품 코드</span><input value={product.id ?? ''} readOnly /></label>
              <label><span>상품명</span><input value={product.name ?? ''} readOnly /></label>
            </div>
          </div>

          <div className="admin-form-section">
            <div><span>02</span><h3>재고 조정</h3></div>
            <div className="admin-stock-type-list" role="radiogroup" aria-label="재고 조정 방식">
              {Object.entries(ADJUSTMENT_TYPES).map(([value, option]) => (
                <label className={`${adjustmentType === value ? 'selected' : ''}${isStockAdjustmentBlocked ? ' disabled' : ''}`} key={value}>
                  <input disabled={isStockAdjustmentBlocked} type="radio" name="adjustmentType" value={value} checked={adjustmentType === value} onChange={(event) => setAdjustmentType(event.target.value)} />
                  {value === 'INCREASE' ? <Plus size={16} /> : <Minus size={16} />}
                  <span><strong>{option.label}</strong><small>{option.description}</small></span>
                </label>
              ))}
            </div>
            <div className="admin-form-grid">
              <label>
                <span>조정 수량</span>
                <div className="admin-input-suffix"><input disabled={isStockAdjustmentBlocked} required min="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="예: 20" /><b>개</b></div>
              </label>
              <div className="admin-stock-preview">
                <span>조정 후 예상 재고</span>
                <strong className={expectedStock < 0 ? 'invalid' : ''}>{expectedStock.toLocaleString()}개</strong>
                <small>{adjustmentSummary}</small>
              </div>
            </div>
            {expectedStock < 0 && <p className="admin-stock-error">현재 가용 재고보다 더 많이 차감할 수 없습니다.</p>}
          </div>

          <div className="admin-form-section">
            <div><span>03</span><h3>조정 사유</h3></div>
            <label><span>운영 기록에 남길 사유</span><textarea disabled={isStockAdjustmentBlocked} required rows="4" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="예: 2차 물량 입고, 파손 재고 차감" /></label>
          </div>

          <div className="admin-register-actions">
            <button className="admin-outline-button" type="button" onClick={() => onMove('products')}>취소</button>
            <button className="admin-primary-button" type="submit" disabled={!isValidAdjustment || submitting}><Boxes size={17} /> {isStockAdjustmentBlocked ? '현재 상태에서는 조정 불가' : submitting ? '재고 조정 중...' : '재고 조정 요청'}</button>
          </div>
        </section>

        <aside className="admin-register-side">
          <section className="admin-card admin-stock-summary-card">
            <div className="admin-product-context-title"><Package size={18} /><span>현재 재고 현황</span></div>
            <strong>{product.name}</strong>
            <dl className="admin-product-context-list">
              <div><dt>가용 재고</dt><dd>{currentStock.toLocaleString()}개</dd></div>
              <div><dt>상품 상태</dt><dd>{productStatus || '-'}</dd></div>
              <div><dt>초기 재고</dt><dd>{Number(product.initialStock ?? currentStock).toLocaleString()}개</dd></div>
              <div><dt>판매 수량</dt><dd>{Number(product.soldCount ?? 0).toLocaleString()}개</dd></div>
              <div><dt>판매가</dt><dd>{won.format(product.price ?? 0)}</dd></div>
            </dl>
          </section>
          <section className="admin-card admin-checklist">
            <h3>조정 전 체크</h3>
            <label><input type="checkbox" defaultChecked /> 실물 재고 수량 확인</label>
            <label><input type="checkbox" defaultChecked /> 미처리 주문 영향 확인</label>
            <label><input type="checkbox" /> 조정 사유 및 증빙 확인</label>
          </section>
        </aside>
      </form>
    </div>
  );
}

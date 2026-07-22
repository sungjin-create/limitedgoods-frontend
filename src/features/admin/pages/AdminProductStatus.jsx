import React, { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardCheck, Package, ToggleRight } from 'lucide-react';
import { SectionHeader } from '../components/AdminUi.jsx';

const STATUS_META = {
  DRAFT: { label: '임시저장', description: '고객에게 노출되지 않는 작성 중 상태입니다.' },
  PREPARING: { label: '준비 중', description: '상품은 공개할 수 있지만 주문은 받을 수 없습니다.' },
  SCHEDULED: { label: '판매 예정', description: '판매 시작·종료 시간이 필수이며 주문은 시작 전까지 차단됩니다.' },
  ACTIVE: { label: '판매 가능', description: '판매 기간과 재고가 유효하면 고객이 주문할 수 있습니다.' },
  PAUSED: { label: '판매 중지', description: '새 주문을 일시 중지합니다.' },
  HIDDEN: { label: '비공개', description: '고객 화면에서 상품을 숨깁니다.' },
  ARCHIVED: { label: '운영 종료/보관', description: '판매를 종료하고 상품을 보관합니다.' }
};

const STATUS_POLICIES = [
  { status: 'DRAFT', schedule: '선택', exposure: '비노출', purchasable: '불가', transitions: 'PREPARING, SCHEDULED, ACTIVE' },
  { status: 'PREPARING', schedule: '선택', exposure: '노출', purchasable: '불가', transitions: 'SCHEDULED, ACTIVE, PAUSED, HIDDEN, ARCHIVED' },
  { status: 'SCHEDULED', schedule: '필수',  exposure: '노출', purchasable: '불가', transitions: 'ACTIVE, PAUSED, HIDDEN, ARCHIVED' },
  { status: 'ACTIVE', schedule: '상시 또는 유효 기간', exposure: '노출', purchasable: '가능', transitions: 'PAUSED, HIDDEN, ARCHIVED' },
  { status: 'PAUSED', schedule: '선택', exposure: '노출', purchasable: '불가', transitions: 'PREPARING, SCHEDULED, ACTIVE, ARCHIVED' },
  { status: 'HIDDEN', schedule: '선택', exposure: '비노출', purchasable: '불가', transitions: 'PREPARING, SCHEDULED, ACTIVE, ARCHIVED' },
  { status: 'ARCHIVED', schedule: '선택', exposure: '기본 목록 제외 / 아카이브 노출', purchasable: '불가', transitions: '-' }
];

const ALLOWED_TARGETS = {
  DRAFT: ['PREPARING', 'SCHEDULED', 'ACTIVE'],
  PREPARING: ['SCHEDULED', 'ACTIVE', 'PAUSED', 'HIDDEN', 'ARCHIVED'],
  SCHEDULED: ['ACTIVE', 'PAUSED', 'HIDDEN', 'ARCHIVED'],
  ACTIVE: ['PAUSED', 'HIDDEN', 'ARCHIVED'],
  PAUSED: ['PREPARING', 'SCHEDULED', 'ACTIVE', 'ARCHIVED'],
  HIDDEN: ['PREPARING', 'SCHEDULED', 'ACTIVE', 'ARCHIVED'],
  ARCHIVED: []
};

function statusClass(status) {
  return String(status ?? '').toLowerCase();
}

export function AdminProductStatus({ product, originalStatus, onMove, onProductDraftChange }) {
  const currentStatus = String(originalStatus ?? product?.status ?? 'DRAFT').toUpperCase();
  const transitionOptions = Object.keys(STATUS_META);
  const allowedTargets = ALLOWED_TARGETS[currentStatus] ?? [];
  const [nextStatus, setNextStatus] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const canSubmit = Boolean(nextStatus);

  useEffect(() => {
    setNextStatus(String(product?.status ?? currentStatus).toUpperCase());
    setSubmitted(false);
  }, [product, currentStatus]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    // 상태 전환 API가 연결되면 이 지점에서 productId, nextStatus, reason을 전송합니다.
    onProductDraftChange({ ...product, status: nextStatus });
    setSubmitted(true);
    onMove('product-schedule');
  }

  if (!product) {
    return <EmptyStatusSelection onMove={onMove} />;
  }

  return (
    <div className="admin-page-stack">
      <SectionHeader eyebrow="Status transition" title="상품 상태 관리" description="판매 상태 변경은 주문 가능 여부와 고객 노출에 즉시 영향을 줍니다." />
      <ol className="admin-product-flow" aria-label="상품 변경 단계"><li className="done"><b>1</b>상품 정보</li><li className="active"><b>2</b>상태 관리</li><li><b>3</b>판매 일정</li></ol>

      <section className="admin-card admin-status-policy-card">
        <div className="admin-card-head"><div><span className="admin-card-kicker">STATUS POLICY</span><h3>상태별 운영 기준</h3></div><small>현재 상태와 선택한 상태를 비교해 변경 영향을 확인하세요.</small></div>
        <div className="admin-status-policy-scroll">
          <table className="admin-status-policy-table">
            <thead><tr><th>상태</th><th>시작/종료 시간</th><th>고객 노출</th><th>주문 가능</th><th>변경 가능한 상태</th></tr></thead>
            <tbody>
              {STATUS_POLICIES.map((policy) => (
                <tr className={`${policy.status === currentStatus ? 'current' : ''} ${policy.status === nextStatus ? 'selected' : ''}`} key={policy.status}>
                  <td><span className={`admin-product-status ${statusClass(policy.status)}`}>{STATUS_META[policy.status].label}</span>{policy.status === currentStatus && <small>현재</small>}{policy.status === nextStatus && policy.status !== currentStatus && <small>변경 대상</small>}</td>
                  <td>{policy.schedule}</td><td>{policy.exposure}</td><td>{policy.purchasable}</td><td>{policy.transitions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {submitted && (
        <section className="admin-card admin-alert-item info">
          <span className="admin-alert-icon"><ClipboardCheck size={18} /></span>
          <div><strong>상태 변경 요청을 준비했습니다</strong><p>{STATUS_META[currentStatus]?.label}에서 {STATUS_META[nextStatus]?.label}(으)로 변경합니다.</p><small>상태 전환 API 연결 후 이력과 함께 실제 반영됩니다.</small></div>
        </section>
      )}

      <form className="admin-status-layout" onSubmit={handleSubmit}>
        <section className="admin-card admin-register-form">
          <div className="admin-form-section">
            <div><span>01</span><h3>현재 상태 확인</h3></div>
            <div className="admin-status-current">
              <span className={`admin-product-status ${statusClass(currentStatus)}`}>{STATUS_META[currentStatus]?.label ?? currentStatus}</span>
              <div><strong>{product.name}</strong><small>상품 ID {product.id} · 가용 재고 {Number(product.stock ?? 0).toLocaleString()}개</small></div>
            </div>
          </div>

          <div className="admin-form-section">
            <div><span>02</span><h3>변경할 상태 선택</h3></div>
            {transitionOptions.length ? (
              <div className="admin-status-option-list">
                {transitionOptions.map((status) => {
                  const canSelect = status === currentStatus || allowedTargets.includes(status);

                  return (
                  <label className={`${nextStatus === status ? 'selected' : ''} ${currentStatus === status ? 'current' : ''} ${canSelect ? '' : 'disabled'}`} key={status}>
                    <input disabled={!canSelect} type="radio" name="nextStatus" value={status} checked={nextStatus === status} onChange={(event) => setNextStatus(event.target.value)} />
                    <span className={`admin-product-status ${statusClass(status)}`}>{STATUS_META[status].label}</span>
                    <small>{!canSelect ? `현재 상태에서는 ${STATUS_META[status].label}(으)로 변경할 수 없습니다.` : currentStatus === status ? `현재 상태 · ${STATUS_META[status].description}` : status === 'SCHEDULED' ? '다음 단계에서 판매 시작·종료 시간을 반드시 설정합니다.' : STATUS_META[status].description}</small>
                  </label>
                  );
                })}
              </div>
            ) : (
              <div className="admin-status-warning"><AlertTriangle size={17} /><span>판매 종료 상품은 재오픈 대신 새 판매 회차를 생성하는 것을 권장합니다.</span></div>
            )}
            {nextStatus && (
              <div className="admin-status-impact"><strong>{STATUS_META[nextStatus].label} 전환 영향</strong><span>{STATUS_META[nextStatus].description}</span></div>
            )}
          </div>

          <div className="admin-register-actions">
            <button className="admin-outline-button" type="button" onClick={() => onMove('product-update')}>이전: 상품 정보</button>
            <button className="admin-primary-button" type="submit" disabled={!canSubmit}><ToggleRight size={17} /> 다음: 판매 일정</button>
          </div>
        </section>

        <aside className="admin-register-side">
          <section className="admin-card admin-checklist">
            <h3>상태별 운영 기준</h3>
            <label><input type="checkbox" defaultChecked /> 판매 예정은 일정 설정 필요</label>
            <label><input type="checkbox" defaultChecked /> 판매 중지는 신규 주문 차단</label>
            <label><input type="checkbox" defaultChecked /> 판매 종료는 재오픈 제한</label>
          </section>
        </aside>
      </form>
    </div>
  );
}

function EmptyStatusSelection({ onMove }) {
  return (
    <div className="admin-page-stack">
      <SectionHeader eyebrow="Status transition" title="상품 상태 관리" description="판매 상태 전환을 관리합니다." />
      <section className="admin-card admin-empty-selection"><Package size={22} /><div><strong>선택된 상품이 없습니다</strong><p>상품 관리 목록에서 상태를 변경할 상품을 선택해 주세요.</p></div><button className="admin-outline-button" type="button" onClick={() => onMove('products')}>상품 목록으로</button></section>
    </div>
  );
}

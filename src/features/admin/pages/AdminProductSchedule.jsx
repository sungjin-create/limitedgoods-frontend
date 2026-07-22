import React, { useEffect, useState } from 'react';
import { CalendarClock, ClipboardCheck, Package } from 'lucide-react';
import { SectionHeader } from '../components/AdminUi.jsx';

function toDateTimeInput(value) {
  return value ? String(value).slice(0, 16) : '';
}

function formatDateTime(value) {
  if (!value) return '상시 판매';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('ko-KR');
}

export function AdminProductSchedule({ product, onMove, onProductDraftChange }) {
  const [saleStartAt, setSaleStartAt] = useState('');
  const [saleEndAt, setSaleEndAt] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const status = String(product?.status ?? 'DRAFT').toUpperCase();
  const isScheduled = status === 'SCHEDULED';
  const isActive = status === 'ACTIVE';
  const hasSchedule = Boolean(saleStartAt || saleEndAt);
  const isDateRangeValid = !hasSchedule || (saleStartAt && saleEndAt && saleStartAt < saleEndAt);
  const isEndShortened = isActive && product?.saleEndAt && saleEndAt && new Date(saleEndAt) < new Date(product.saleEndAt);
  const isValid = isDateRangeValid && !isEndShortened && reason.trim() && confirmed && (!isScheduled || (saleStartAt && saleEndAt));

  useEffect(() => {
    setSaleStartAt(toDateTimeInput(product?.saleStartAt));
    setSaleEndAt(toDateTimeInput(product?.saleEndAt));
    setReason('');
    setConfirmed(false);
    setSubmitted(false);
  }, [product]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!isValid) return;

    // 판매 일정 변경 API가 연결되면 이 지점에서 productId, saleStartAt, saleEndAt, reason을 전송합니다.
    onProductDraftChange({ ...product, saleStartAt: saleStartAt || null, saleEndAt: saleEndAt || null, changeReason: reason });
    setSubmitted(true);
    onMove('product-review');
  }

  if (!product) {
    return (
      <div className="admin-page-stack"><SectionHeader eyebrow="Sale schedule" title="판매 일정 관리" description="판매 시작과 종료 시간을 안전하게 변경합니다." /><section className="admin-card admin-empty-selection"><Package size={22} /><div><strong>선택된 상품이 없습니다</strong><p>상품 관리 목록에서 일정을 변경할 상품을 선택해 주세요.</p></div><button className="admin-outline-button" type="button" onClick={() => onMove('products')}>상품 목록으로</button></section></div>
    );
  }

  return (
    <div className="admin-page-stack">
      <SectionHeader eyebrow="Sale schedule" title="판매 일정 관리" description="주문이 발생한 판매 일정은 변경 영향을 확인한 뒤 조정합니다." />
      <ol className="admin-product-flow" aria-label="상품 변경 단계"><li className="done"><b>1</b>상품 정보</li><li className="done"><b>2</b>상태 관리</li><li className="active"><b>3</b>판매 일정</li></ol>
      {submitted && <section className="admin-card admin-alert-item info"><span className="admin-alert-icon"><ClipboardCheck size={18} /></span><div><strong>판매 일정 변경 요청을 준비했습니다</strong><p>{saleStartAt || '상시'} ~ {saleEndAt || '상시'}</p><small>판매 일정 변경 API 연결 후 변경 이력과 함께 실제 반영됩니다.</small></div></section>}

      <form className="admin-schedule-layout" onSubmit={handleSubmit}>
        <section className="admin-card admin-register-form">
          <div className="admin-form-section">
            <div><span>01</span><h3>현재 판매 일정</h3></div>
            <div className="admin-schedule-current"><strong>{product.name}</strong><span>현재 시작: {formatDateTime(product.saleStartAt)}</span><span>현재 종료: {formatDateTime(product.saleEndAt)}</span></div>
          </div>

          <div className="admin-form-section">
            <div><span>02</span><h3>변경할 판매 일정</h3></div>
            <p className="admin-update-note">{isActive ? '판매 중인 상품은 시작 시간을 변경할 수 없으며, 종료 시간 단축은 제한됩니다.' : isScheduled ? '판매 예정 상품은 시작과 종료 시간을 모두 입력해야 합니다.' : '시작·종료 시간을 모두 비우면 상시 판매로 설정됩니다.'}</p>
            <div className="admin-form-grid">
              <label><span>판매 시작 {isScheduled && <b className="admin-required">필수</b>}</span><input required={isScheduled} readOnly={isActive} step="600" type="datetime-local" value={saleStartAt} onChange={(event) => setSaleStartAt(event.target.value)} /></label>
              <label><span>판매 종료 {isScheduled && <b className="admin-required">필수</b>}</span><input required={isScheduled} step="600" type="datetime-local" value={saleEndAt} onChange={(event) => setSaleEndAt(event.target.value)} /></label>
            </div>
            {!isDateRangeValid && <p className="admin-stock-error">판매 시작 시간은 판매 종료 시간보다 앞서야 합니다.</p>}
            {isEndShortened && <p className="admin-stock-error">판매 중인 상품의 종료 시간 단축은 별도 운영 검토가 필요합니다.</p>}
          </div>

          <div className="admin-form-section">
            <div><span>03</span><h3>변경 사유</h3></div>
            <label><span>운영 기록에 남길 사유</span><textarea required rows="4" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="예: 드롭 오픈 시간 변경" /></label>
            <label className="admin-change-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>상품 정보, 판매 상태, 판매 일정의 변경 내용을 모두 확인했습니다.</span></label>
          </div>

          <div className="admin-register-actions"><button className="admin-outline-button" type="button" onClick={() => onMove('product-status')}>이전: 상태 관리</button><button className="admin-primary-button" type="submit" disabled={!isValid}><CalendarClock size={17} /> 다음: 변경 검토</button></div>
        </section>

        <aside className="admin-register-side"><section className="admin-card admin-checklist"><h3>일정 변경 전 체크</h3><label><input type="checkbox" defaultChecked /> 판매 상태와 일정 일치 확인</label><label><input type="checkbox" defaultChecked /> 미결제 주문 영향 확인</label><label><input type="checkbox" /> 고객 공지 필요 여부 확인</label></section></aside>
      </form>
    </div>
  );
}

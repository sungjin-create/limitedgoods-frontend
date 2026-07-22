import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Package, Send } from 'lucide-react';
import { updateProductConfiguration } from '../../../api/admin.js';
import { SectionHeader, won } from '../components/AdminUi.jsx';

const STATUS_LABELS = {
  DRAFT: '임시저장',
  PREPARING: '준비 중',
  SCHEDULED: '판매 예정',
  ACTIVE: '판매 가능',
  PAUSED: '판매 중지',
  HIDDEN: '비공개',
  ARCHIVED: '운영 종료/보관'
};

function formatDateTime(value) {
  if (!value) return '상시 판매';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('ko-KR');
}

export function AdminProductReview({ product, onMove }) {
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);

    try {
      const response = await updateProductConfiguration(product);
      setResult({ type: 'success', response });
    } catch (error) {
      setResult({
        type: 'error',
        message: error.message,
        status: error.status,
        code: error.code
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!product) {
    return (
      <div className="admin-page-stack"><SectionHeader eyebrow="Change review" title="변경 검토" description="상품 변경 내용을 최종 검토합니다." /><section className="admin-card admin-empty-selection"><Package size={22} /><div><strong>변경할 상품이 없습니다</strong><p>상품 목록에서 상품을 선택해 변경 흐름을 시작해 주세요.</p></div><button className="admin-outline-button" type="button" onClick={() => onMove('products')}>상품 목록으로</button></section></div>
    );
  }

  return (
    <div className="admin-page-stack">
      <SectionHeader eyebrow="Change review" title="변경 검토 및 결과" description="아래 변경 내용을 확인한 뒤 백엔드에 최종 요청을 보냅니다." />
      <ol className="admin-product-flow" aria-label="상품 변경 단계"><li className="done"><b>1</b>상품 정보</li><li className="done"><b>2</b>상태 관리</li><li className="done"><b>3</b>판매 일정</li><li className="active"><b>4</b>변경 검토</li></ol>

      {result?.type === 'success' && (
        <section className="admin-card admin-alert-item info"><span className="admin-alert-icon"><CheckCircle2 size={18} /></span><div><strong>상품 변경이 완료되었습니다</strong><p>{product.name}의 변경 내용이 반영되었습니다.</p><small>백엔드 응답을 정상적으로 받았습니다.</small></div></section>
      )}
      {result?.type === 'error' && (
        <section className="admin-card admin-alert-item critical"><span className="admin-alert-icon"><AlertTriangle size={18} /></span><div><strong>상품 변경을 완료하지 못했습니다</strong><p className="admin-result-error-message">{result.message}</p><small>{result.status ? `HTTP ${result.status}` : '네트워크 또는 API 설정 오류'}{result.code ? ` · ${result.code}` : ''}</small></div></section>
      )}

      <div className="admin-review-layout">
        <section className="admin-card admin-review-card">
          <div className="admin-card-head"><div><span className="admin-card-kicker">REQUEST PREVIEW</span><h3>전송할 상품 설정</h3></div><ClipboardCheck size={18} /></div>
          <dl className="admin-review-list">
            <div><dt>상품 코드</dt><dd>{product.id}</dd></div>
            <div><dt>상품명</dt><dd>{product.name}</dd></div>
            <div><dt>판매가</dt><dd>{won.format(product.price ?? 0)}</dd></div>
            <div><dt>상품 타입</dt><dd>{product.type === 'LIMITED' ? '한정' : '일반'}</dd></div>
            <div><dt>1인 구매 제한</dt><dd>{product.maxPurchaseQuantity == null ? '제한 없음' : `${product.maxPurchaseQuantity}개`}</dd></div>
            <div><dt>판매 상태</dt><dd>{STATUS_LABELS[product.status] ?? product.status}</dd></div>
            <div><dt>판매 시작</dt><dd>{formatDateTime(product.saleStartAt)}</dd></div>
            <div><dt>판매 종료</dt><dd>{formatDateTime(product.saleEndAt)}</dd></div>
            <div><dt>변경 사유</dt><dd>{product.changeReason || '-'}</dd></div>
          </dl>
        </section>

        <aside className="admin-register-side">
          <section className="admin-card admin-checklist"><h3>백엔드 검증 항목</h3><label><input type="checkbox" defaultChecked /> 상태와 판매 일정 유효성</label><label><input type="checkbox" defaultChecked /> 주문 영향 및 상태 전이 정책</label><label><input type="checkbox" defaultChecked /> 동시 변경 여부</label></section>
          <section className="admin-card admin-review-actions">
            <strong>최종 요청</strong>
            <p>실패하면 백엔드가 보낸 메시지와 상태 코드를 이 화면에 표시합니다.</p>
            {result?.type === 'success' ? (
              <button className="admin-primary-button" type="button" onClick={() => onMove('products')}>상품 목록으로</button>
            ) : (
              <>
                <button className="admin-outline-button" type="button" onClick={() => onMove('product-schedule')}>이전: 판매 일정</button>
                <button className="admin-primary-button" type="button" disabled={submitting} onClick={handleSubmit}><Send size={16} /> {submitting ? '요청 전송 중...' : '변경 요청 보내기'}</button>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

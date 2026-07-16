import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { SectionHeader } from '../components/AdminUi.jsx';

export function AdminProductDelete({ onMove }) {
  const [targetCode, setTargetCode] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [requested, setRequested] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setRequested(true);
  }

  return (
    <div className="admin-page-stack">
      <SectionHeader
        eyebrow="Product remove"
        title="상품 삭제"
        description="운영 상품을 판매 목록에서 제거하거나 비활성화 요청을 보냅니다."
      />

      <section className="admin-card admin-alert-item warning">
        <span className="admin-alert-icon"><AlertTriangle size={18} /></span>
        <div>
          <strong>주의: 삭제 후 즉시 재판매가 제한될 수 있습니다</strong>
          <p>재고와 주문 상태를 확인한 뒤 진행하세요.</p>
          <small>권장: 먼저 판매중지 처리 후 삭제 요청</small>
        </div>
      </section>

      {requested && (
        <section className="admin-card admin-alert-item info">
          <span className="admin-alert-icon"><Trash2 size={18} /></span>
          <div>
            <strong>삭제 요청이 접수되었습니다</strong>
            <p>운영 승인 후 비활성화 처리됩니다.</p>
            <small>실제 API 연결 전까지는 데모 동작입니다.</small>
          </div>
        </section>
      )}

      <form className="admin-card admin-register-form" onSubmit={handleSubmit}>
        <label>
          <span>삭제 대상 상품 코드</span>
          <input
            required
            value={targetCode}
            onChange={(event) => setTargetCode(event.target.value)}
            placeholder="예: LG-2026-001"
          />
        </label>

        <label>
          <span>삭제 사유</span>
          <textarea
            required
            rows="4"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="예: 시즌 종료 및 리오더 예정 없음"
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          삭제 정책과 주문 영향도를 확인했습니다.
        </label>

        <div className="admin-register-actions">
          <button className="admin-outline-button" type="button" onClick={() => onMove('products')}>
            취소
          </button>
          <button className="admin-primary-button" type="submit" disabled={!confirmed}>
            <Trash2 size={16} /> 삭제 요청
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { ClipboardCheck, FilePenLine } from 'lucide-react';
import { SectionHeader } from '../components/AdminUi.jsx';

const INITIAL_FORM = {
  code: '',
  name: '',
  price: '',
  stock: '',
  status: 'active'
};

export function AdminProductUpdate({ onMove }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSaved, setIsSaved] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setIsSaved(true);
  }

  return (
    <div className="admin-page-stack">
      <SectionHeader
        eyebrow="Product edit"
        title="상품 변경"
        description="등록된 상품의 이름, 가격, 재고, 상태를 수정합니다."
      />

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

      <form className="admin-card admin-register-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label>
            <span>상품 코드</span>
            <input
              required
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              placeholder="예: LG-2026-001"
            />
          </label>
          <label>
            <span>상품명</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="예: Archive Varsity Jacket"
            />
          </label>
          <label>
            <span>변경 가격</span>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              placeholder="예: 159000"
            />
          </label>
          <label>
            <span>변경 재고</span>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
              placeholder="예: 120"
            />
          </label>
          <label>
            <span>판매 상태</span>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="active">판매중</option>
              <option value="scheduled">판매 예정</option>
              <option value="hidden">비공개</option>
            </select>
          </label>
        </div>

        <div className="admin-register-actions">
          <button className="admin-outline-button" type="button" onClick={() => onMove('products')}>
            목록으로
          </button>
          <button className="admin-primary-button" type="submit">
            <FilePenLine size={16} /> 변경 저장
          </button>
        </div>
      </form>
    </div>
  );
}

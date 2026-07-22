import React from 'react';
import { Package, PackagePlus } from 'lucide-react';
import { SectionHeader } from '../components/AdminUi.jsx';



export function AdminProductRegister({ adminForm, loading, setAdminForm, onSubmit }) {

const isScheduled = adminForm.status === 'SCHEDULED';
const isAlwaysOnSale = !adminForm.saleStartAt && !adminForm.saleEndAt;

const handleChange = (event) => {
  const { name, value, type, checked } = event.target;

  setAdminForm((prev) => ({
    ...prev,
    [name]:
      type === "checkbox"
        ? checked
        : name === "maxPurchaseQuantity" && value === ""
        ? null
        : type === "number"
        ? Number(value)
        : value,
  }));
};

  return (
    <div className="admin-page-stack">
      <SectionHeader eyebrow="New product" title="상품 등록" description="새 한정판 굿즈의 판매 정보와 초도 재고를 등록합니다." />
      <form className="admin-register-layout" onSubmit={onSubmit}>
        <section className="admin-card admin-register-form">
          <div className="admin-form-section">
            <div>
              <span>01</span>
              <h3>기본 정보</h3>
            </div>
            <label>
              <span>상품명</span>
              <input required name="name" value={adminForm.name} onChange={handleChange} placeholder="예: Archive Varsity Jacket" />
            </label>
            <label>
              <span>상품 설명</span>
                <textarea rows="5" name="description" value={adminForm.description} onChange={handleChange} placeholder="상품의 소재, 넘버링, 구성품을 입력하세요." />
            </label>
          </div>

          <div className="admin-form-section">
            <div>
              <span>02</span>
              <h3>판매 정보</h3>
            </div>
            <div className="admin-form-grid">
              <label>
                <span>판매 가격</span>
                <div className="admin-input-prefix">
                  <b>₩</b>
                  <input min="0" type="number" name="price" value={adminForm.price} onChange={handleChange} />
                </div>
              </label>
              <label>
                <span>초도 재고</span>
                <div className="admin-input-suffix">
                  <input min="1" type="number" name="stock" value={adminForm.stock} onChange={handleChange} />
                  <b>개</b>
                </div>
              </label>
              <label>
                <span>구매 제한</span>
                <div className="admin-input-suffix">
                  <input min="1" type="number" name="maxPurchaseQuantity" value={adminForm.maxPurchaseQuantity ?? ''} onChange={handleChange} placeholder="제한 없음" />
                  <b>개</b>
                </div>
              </label>
              <label>
                <span>상품 타입</span>
                <select name="type" value={adminForm.type} onChange={handleChange}>
                  <option value="NORMAL">일반</option>
                  <option value="LIMITED">한정</option>
                </select>
              </label>
              <label>
                <span>판매 상태</span>
                <select name="status" value={adminForm.status} onChange={handleChange}>
                  <option value="DRAFT">임시저장</option>
                  <option value="PREPARING">준비 중</option>
                  <option value="SCHEDULED">판매 예정</option>
                  <option value="ACTIVE">판매 중</option>
                </select>
              </label>
            </div>
          </div>
          <div className="admin-form-section">
            <div>
              <span>03</span>
              <h3>판매 일정</h3>
            </div>
            <label className="admin-schedule-option">
              <input
                type="checkbox"
                checked={isAlwaysOnSale}
                disabled={isScheduled}
                onChange={(event) => event.target.checked && setAdminForm((previous) => ({ ...previous, saleStartAt: '', saleEndAt: '' }))}
              />
              <span>상시 판매 <small>{isScheduled ? '판매 예정 상품은 판매 기간을 반드시 설정해야 합니다.' : '판매 시작·종료 시간을 비워 두면 null로 저장됩니다.'}</small></span>
            </label>
            <div className="admin-form-grid">
              <label>
                <span>판매 시작 {isScheduled && <b className="admin-required">필수</b>}</span>
                <input required={isScheduled} step="600" type="datetime-local" name="saleStartAt" value={adminForm.saleStartAt} onChange={handleChange} />
              </label>
              <label>
                <span>판매 종료 {isScheduled && <b className="admin-required">필수</b>}</span>
                <input required={isScheduled} step="600" type="datetime-local" name="saleEndAt" value={adminForm.saleEndAt} onChange={handleChange} />
              </label>
            </div>
          </div>
          <div className="admin-register-actions">
            <button className="admin-primary-button" type="submit" disabled={loading}>
              <PackagePlus size={17} /> {loading ? '등록 중...' : '상품 등록'}
            </button>
          </div>
        </section>
        <aside className="admin-register-side">
          <div className="admin-card admin-upload-card">
            <span className="admin-upload-placeholder">
              <Package size={30} />
            </span>
            <h3>대표 이미지</h3>
            <p>권장 크기 1200 × 1200px<br />JPG, PNG 최대 10MB</p>
            <button className="admin-outline-button" type="button">이미지 선택</button>
          </div>
          <div className="admin-card admin-checklist">
            <h3>등록 전 체크</h3>
            <label><input type="checkbox" defaultChecked /> 판매 가격과 재고 확인</label>
            <label><input type="checkbox" defaultChecked /> 구매 제한 정책 확인</label>
            <label><input type="checkbox" /> 상품 이미지 저작권 확인</label>
            <label><input type="checkbox" /> 드롭 일정 최종 확인</label>
          </div>
        </aside>
      </form>
    </div>
  );
}

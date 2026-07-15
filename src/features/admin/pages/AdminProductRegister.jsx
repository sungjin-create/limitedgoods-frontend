import React from 'react';
import { Package, PackagePlus } from 'lucide-react';
import { SectionHeader } from '../components/AdminUi.jsx';

export function AdminProductRegister({ adminForm, loading, setAdminForm, onSubmit }) {
  return (
    <div className="admin-page-stack">
      <SectionHeader eyebrow="New product" title="상품 등록" description="새 한정판 굿즈의 판매 정보와 초도 재고를 등록합니다." />
      <form className="admin-register-layout" onSubmit={onSubmit}>
        <section className="admin-card admin-register-form">
          <div className="admin-form-section"><div><span>01</span><h3>기본 정보</h3></div><label><span>상품명</span><input required value={adminForm.name} onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} placeholder="예: Archive Varsity Jacket" /></label><label><span>상품 설명</span><textarea rows="5" value={adminForm.description} onChange={(event) => setAdminForm({ ...adminForm, description: event.target.value })} placeholder="상품의 소재, 넘버링, 구성품을 입력하세요." /></label></div>
          <div className="admin-form-section"><div><span>02</span><h3>판매 정보</h3></div><div className="admin-form-grid"><label><span>판매 가격</span><div className="admin-input-prefix"><b>₩</b><input min="0" type="number" value={adminForm.price} onChange={(event) => setAdminForm({ ...adminForm, price: event.target.value })} /></div></label><label><span>초도 재고</span><div className="admin-input-suffix"><input min="1" type="number" value={adminForm.stock} onChange={(event) => setAdminForm({ ...adminForm, stock: event.target.value })} /><b>개</b></div></label><label><span>구매 제한</span><select defaultValue="2"><option value="1">1인 1개</option><option value="2">1인 2개</option><option value="3">1인 3개</option></select></label><label><span>판매 상태</span><select defaultValue="scheduled"><option value="scheduled">판매 예정</option><option value="active">즉시 판매</option><option value="hidden">비공개</option></select></label></div></div>
          <div className="admin-form-section"><div><span>03</span><h3>드롭 일정</h3></div><div className="admin-form-grid"><label><span>판매 시작</span><input type="datetime-local" defaultValue="2026-07-13T20:00" /></label><label><span>판매 종료</span><input type="datetime-local" defaultValue="2026-07-14T20:00" /></label></div></div>
          <div className="admin-register-actions"><button className="admin-outline-button" type="button">임시 저장</button><button className="admin-primary-button" type="submit" disabled={loading}><PackagePlus size={17} /> {loading ? '등록 중...' : '상품 등록'}</button></div>
        </section>
        <aside className="admin-register-side"><div className="admin-card admin-upload-card"><span className="admin-upload-placeholder"><Package size={30} /></span><h3>대표 이미지</h3><p>권장 크기 1200 × 1200px<br />JPG, PNG 최대 10MB</p><button className="admin-outline-button" type="button">이미지 선택</button></div><div className="admin-card admin-checklist"><h3>등록 전 체크</h3><label><input type="checkbox" defaultChecked /> 판매 가격과 재고 확인</label><label><input type="checkbox" defaultChecked /> 구매 제한 정책 확인</label><label><input type="checkbox" /> 상품 이미지 저작권 확인</label><label><input type="checkbox" /> 드롭 일정 최종 확인</label></div></aside>
      </form>
    </div>
  );
}

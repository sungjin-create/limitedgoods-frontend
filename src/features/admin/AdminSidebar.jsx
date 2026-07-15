import React from 'react';
import { ArrowLeft, ChevronRight, ShieldCheck, ShoppingBag, X } from 'lucide-react';

export function AdminSidebar({ sections, activeSection, isOpen, onSelect, onBackToStore, onClose }) {
  return (
    <aside className={`admin-shell-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="admin-shell-brand">
        <span><ShieldCheck size={21} /></span>
        <div><strong>Limited Goods</strong><small>Backoffice</small></div>
        <button type="button" aria-label="관리자 메뉴 닫기" onClick={onClose}><X size={19} /></button>
      </div>

      <div className="admin-shell-nav-label">OPERATIONS</div>
      <nav aria-label="관리자 메뉴">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              className={activeSection === section.id ? 'active' : ''}
              type="button"
              key={section.id}
              onClick={() => onSelect(section.id)}
            >
              <span className="admin-shell-nav-icon"><Icon size={18} /></span>
              <span><strong>{section.label}</strong><small>{section.description}</small></span>
              <ChevronRight size={16} />
            </button>
          );
        })}
      </nav>

      <div className="admin-shell-sidebar-footer">
        <div className="admin-shell-api-state"><span /><div><strong>모든 시스템 정상</strong><small>마지막 확인 방금 전</small></div></div>
        <button className="admin-store-back" type="button" onClick={onBackToStore}>
          <ArrowLeft size={17} />
          <span><strong>스토어로 돌아가기</strong><small>고객 화면 열기</small></span>
          <ShoppingBag size={17} />
        </button>
      </div>
    </aside>
  );
}

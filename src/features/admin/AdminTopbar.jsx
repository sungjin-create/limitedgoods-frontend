import React from 'react';
import { ArrowLeft, Bell, LogOut, Menu, Radio } from 'lucide-react';

export function AdminTopbar({ section, onMenuOpen, onBackToStore, onLogout }) {
  return (
    <header className="admin-shell-topbar">
      <div className="admin-shell-title">
        <button className="admin-mobile-menu-button" type="button" aria-label="관리자 메뉴 열기" onClick={onMenuOpen}><Menu size={20} /></button>
        <div><p className="eyebrow">Backoffice / Operations</p><h1>{section.label}</h1></div>
      </div>
      <div className="admin-shell-actions">
        <span className="admin-shell-live"><Radio size={14} /> LIVE</span>
        <button className="admin-shell-action-button notification" type="button" aria-label="운영 알림"><Bell size={18} /><b>3</b></button>
        <button className="admin-shell-store-button" type="button" onClick={onBackToStore}><ArrowLeft size={16} /> 스토어</button>
        <div className="admin-shell-admin-profile"><span>AD</span><div><strong>관리자</strong><small>Administrator</small></div></div>
        <button className="admin-shell-action-button" type="button" aria-label="로그아웃" onClick={onLogout}><LogOut size={18} /></button>
      </div>
    </header>
  );
}

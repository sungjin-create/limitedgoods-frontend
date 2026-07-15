import React from 'react';
import { CreditCard, LayoutDashboard, PackagePlus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { NavButton } from './NavButton.jsx';

export function Sidebar({ activeView, isSignedIn, isAdmin, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <ShoppingBag size={21} />
        </div>
        <div>
          <strong>Limited Goods</strong>
          <span>Drop commerce</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="주요 메뉴">
        <NavButton icon={LayoutDashboard} label="스토어" active={activeView === 'shop'} onClick={() => onNavigate('shop')} />
        <NavButton icon={CreditCard} label="주문/결제" active={activeView === 'orders'} onClick={() => onNavigate('orders')} />
        {isAdmin && (
          <NavButton icon={PackagePlus} label="관리자" active={activeView === 'admin'} onClick={() => onNavigate('admin')} />
        )}
      </nav>

      <div className="account-panel">
        <ShieldCheck size={18} />
        <div>
          <strong>{isAdmin ? '관리자 로그인' : (isSignedIn ? '로그인됨' : '게스트 모드')}</strong>
          <span>
            {isAdmin
              ? '상품 등록과 관리 기능을 사용할 수 있습니다.'
              : (isSignedIn ? '주문과 결제 기능을 사용할 수 있습니다.' : '로그인하면 주문 테스트가 가능합니다.')}
          </span>
        </div>
      </div>
    </aside>
  );
}

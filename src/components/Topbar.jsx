import React from 'react';
import { LogIn, LogOut, ShoppingCart } from 'lucide-react';

export function Topbar({
  isSignedIn,
  isAuthChecking,
  cartCount,
  eyebrow = 'Flash drop store',
  title = '한정판 상품을 발견하고, 빠르게 주문하세요.',
  showCart = true,
  onCartClick,
  onLogout,
  onLoginClick
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        {showCart && (
          <button className="cart-button" type="button" title="장바구니" onClick={onCartClick}>
            <ShoppingCart size={18} />
            <span>장바구니</span>
            {cartCount > 0 && <b>{cartCount}</b>}
          </button>
        )}
        <button
          className="ghost-button"
          type="button"
          disabled={isAuthChecking}
          onClick={isSignedIn ? onLogout : onLoginClick}
        >
          {isSignedIn ? <LogOut size={18} /> : <LogIn size={18} />}
          {isAuthChecking ? '로그인 확인 중' : (isSignedIn ? '로그아웃' : '로그인')}
        </button>
      </div>
    </header>
  );
}

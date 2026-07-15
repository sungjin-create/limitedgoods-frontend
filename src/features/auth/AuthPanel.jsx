import React from 'react';
import { LogIn, UserPlus } from 'lucide-react';

export function AuthPanel({ authMode, authForm, loading, setAuthMode, setAuthForm, onSubmit }) {
  return (
    <section className="panel auth-panel">
      <div className="auth-heading">
        <p className="eyebrow">Account access</p>
        <h2>{authMode === 'login' ? '로그인' : '회원가입'}</h2>
      </div>

      <div className="segmented">
        <button className={authMode === 'login' ? 'active' : ''} type="button" onClick={() => setAuthMode('login')}>
          <LogIn size={16} />
          로그인
        </button>
        <button className={authMode === 'signup' ? 'active' : ''} type="button" onClick={() => setAuthMode('signup')}>
          <UserPlus size={16} />
          가입
        </button>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        {authMode === 'signup' && (
          <label className="field">
            <span>이름</span>
            <input
              placeholder="구매자"
              value={authForm.name}
              onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
            />
          </label>
        )}
        <label className="field">
          <span>이메일</span>
          <input
            type="email"
            placeholder="buyer@example.com"
            value={authForm.email}
            onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
          />
        </label>
        <label className="field">
          <span>비밀번호</span>
          <input
            type="password"
            placeholder="LocalTest!2026"
            value={authForm.password}
            onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {authMode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          {authMode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>
    </section>
  );
}

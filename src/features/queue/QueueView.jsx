import React from 'react';
import { ArrowLeft, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import { won } from '../../utils/format.js';
import { getProductImage } from '../../utils/images.js';

export function QueueView({ queueState, onBackToStore }) {
  const product = queueState?.product ?? null;
  const productImageUrl = getProductImage(product);
  const position = Number(queueState?.position);
  const hasPosition = Number.isFinite(position) && position > 0;
  const waitingLabel = queueState?.phase === 'entering'
    ? '대기열에 진입하는 중입니다.'
    : queueState?.phase === 'admitted'
      ? '입장 허용됨. 주문서를 생성하고 있습니다.'
      : hasPosition
        ? `현재 ${position.toLocaleString('ko-KR')}번째 대기 중입니다.`
        : '대기 순서를 확인하는 중입니다.';

  return (
    <section className="queue-view">
      <button className="back-button" type="button" onClick={onBackToStore}>
        <ArrowLeft size={18} />
        쇼핑으로 돌아가기
      </button>

      <div className="queue-layout">
        <section className="queue-panel queue-hero">
          <div className="queue-visual">
            {productImageUrl ? <img src={productImageUrl} alt={product?.name ?? '대기 상품'} /> : <Sparkles size={32} />}
          </div>
          <div className="queue-copy">
            <p className="eyebrow">Queue</p>
            <h2>{product?.name ?? '주문 대기열'}</h2>
            <p>{waitingLabel}</p>
            <div className="queue-meta">
              <span>
                <Clock3 size={16} />
                {queueState?.phase === 'admitted' ? '입장 완료' : '대기 중'}
              </span>
              <span>
                <ShieldCheck size={16} />
                {product?.stock != null ? `남은 수량 ${Number(product.stock).toLocaleString('ko-KR')}` : '재고 보호 중'}
              </span>
            </div>
          </div>
        </section>

        <aside className="queue-panel queue-summary">
          <p className="eyebrow">Waiting room</p>
          <h2>잠시만 기다려 주세요</h2>
          <div className="summary-row">
            <span>대기 상태</span>
            <strong>{queueState?.phase === 'admitted' ? '입장 허용' : '대기 중'}</strong>
          </div>
          <div className="summary-row">
            <span>주문 수량</span>
            <strong>{Number(queueState?.quantity ?? 1).toLocaleString('ko-KR')}개</strong>
          </div>
          <div className="summary-row total">
            <span>예상 결제 금액</span>
            <strong>{won.format(Number(queueState?.totalPrice ?? 0))}</strong>
          </div>
          <p className="queue-note">
            이 화면에서 대기 상태를 확인합니다. 돌아가면 대기열은 종료됩니다.
          </p>
        </aside>
      </div>
    </section>
  );
}
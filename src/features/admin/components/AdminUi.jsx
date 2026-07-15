import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  ShoppingCart
} from 'lucide-react';
import { trafficSeries } from '../adminData.js';

export const won = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0
});

export const STATUS_LABEL = {
  CREATED: '주문 생성',
  PAYMENT_PENDING: '결제 진행',
  PAYMENT_APPROVED: '승인 완료',
  PAID: '결제 완료',
  PAYMENT_FAILED: '결제 실패',
  CANCEL_REQUESTED: '취소 요청',
  CANCEL_FAILED: '취소 실패',
  REFUNDED: '환불 완료',
  CANCELED: '주문 취소',
  COMPLETED: '처리 완료',
  EXPIRED: '주문 만료'
};

export function MetricCard({ metric, index }) {
  const icons = [ShoppingCart, CircleDollarSign, CheckCircle2, Gauge];
  const Icon = icons[index];
  const isUp = metric.trend === 'up';

  return (
    <article className="admin-metric-card">
      <div className="admin-metric-head">
        <span>{metric.label}</span>
        <span className="admin-metric-icon"><Icon size={18} /></span>
      </div>
      <strong>{metric.value}</strong>
      <div className="admin-metric-foot">
        <span className={isUp ? 'trend-up' : 'trend-down'}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {metric.change}
        </span>
        <small>{metric.detail}</small>
      </div>
    </article>
  );
}

export function StatusBadge({ status }) {
  return <span className={`admin-status status-${status.toLowerCase()}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function TrafficChart({ compact = false }) {
  const max = Math.max(...trafficSeries.map((item) => item.requests));

  return (
    <div className={`admin-bar-chart ${compact ? 'compact' : ''}`} aria-label="시간대별 요청량 차트">
      {trafficSeries.map((item) => (
        <div className="admin-bar-column" key={item.time}>
          <div className="admin-bar-stack">
            <span className="admin-bar-failure" style={{ height: `${Math.max(4, (item.failures / max) * 100)}%` }} />
            <span className="admin-bar-request" style={{ height: `${(item.requests / max) * 100}%` }} />
          </div>
          {!compact && <small>{item.time}</small>}
        </div>
      ))}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="admin-section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Package,
  RefreshCw,
  Siren
} from 'lucide-react';
import { getAdminDashboard } from '../../../api/admin.js';
import { MetricCard, SectionHeader, won } from '../components/AdminUi.jsx';

const numberFormatter = new Intl.NumberFormat('ko-KR');

const STATUS_LABEL = {
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

function formatCount(value, suffix = '건') {
  return `${numberFormatter.format(Number(value) || 0)}${suffix}`;
}

function formatPercent(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '0%';

  return `${numericValue.toFixed(1)}%`;
}

function formatTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function buildMetricCards(summary = {}) {
  return [
    {
      label: '오늘 주문',
      value: formatCount(summary.todayOrderCount),
      change: formatPercent(summary.orderGrowthRate),
      trend: Number(summary.orderGrowthRate) >= 0 ? 'up' : 'down',
      detail: '전일 같은 시간 대비'
    },
    {
      label: '오늘 매출',
      value: won.format(summary.todayRevenue ?? 0),
      change: formatPercent(summary.revenueGrowthRate),
      trend: Number(summary.revenueGrowthRate) >= 0 ? 'up' : 'down',
      detail: '결제 완료 기준'
    },
    {
      label: '결제 완료율',
      value: formatPercent(summary.paymentCompletionRate),
      change: formatCount(summary.todayPaidOrderCount),
      trend: 'up',
      detail: '오늘 결제 완료 주문'
    },
    {
      label: '재고 주의',
      value: formatCount(summary.lowStockProductCount, '개'),
      change: formatCount(summary.soldOutProductCount, '개'),
      trend: Number(summary.lowStockProductCount) > 0 ? 'down' : 'up',
      detail: '품절 상품 수'
    }
  ];
}

function buildOrderFlow(flow = {}) {
  const items = [
    { key: 'created', label: '주문 생성', value: flow.createdCount ?? 0 },
    { key: 'paid', label: '결제 완료', value: flow.paidCount ?? 0 },
    { key: 'pending', label: '결제 대기', value: flow.pendingCount ?? 0 },
    { key: 'failed', label: '실패/만료', value: flow.failedOrExpiredCount ?? 0, danger: true }
  ];
  const max = Math.max(1, ...items.map((item) => Number(item.value) || 0));

  return items.map((item) => ({
    ...item,
    width: `${Math.max(8, ((Number(item.value) || 0) / max) * 100)}%`
  }));
}

function normalizeAlerts(alerts = []) {
  return alerts.length > 0 ? alerts : [
    {
      level: 'info',
      title: '처리할 운영 알림이 없습니다',
      detail: '주문, 재고, 취소 요청 상태가 안정적입니다.',
      time: '방금'
    }
  ];
}

function alertIcon(level) {
  if (level === 'critical') return <Siren size={18} />;
  if (level === 'warning') return <AlertTriangle size={18} />;
  return <Activity size={18} />;
}

export function AdminDashboard({ onMove }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.message || '운영대시보드 데이터를 불러오지 못했습니다.');
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = dashboard?.summary ?? {};
  const metricCards = useMemo(() => buildMetricCards(summary), [summary]);
  const orderFlow = useMemo(() => buildOrderFlow(dashboard?.orderFlow), [dashboard]);
  const alerts = useMemo(() => normalizeAlerts(dashboard?.alerts), [dashboard]);
  const recentOrders = dashboard?.recentOrders ?? [];

  return (
    <div className="admin-page-stack">
      <SectionHeader
        eyebrow="Live operations"
        title="오늘의 운영 대시보드"
        description="주문, 매출, 결제, 재고처럼 바로 판단이 필요한 운영 지표를 모아봅니다."
        action={
          <button className="admin-outline-button" type="button" onClick={loadDashboard} disabled={loading}>
            <RefreshCw size={16} /> {loading ? '갱신 중' : '새로고침'}
          </button>
        }
      />

      {error && (
        <section className="admin-card admin-alert-item critical">
          <span className="admin-alert-icon"><AlertTriangle size={18} /></span>
          <div>
            <strong>대시보드 조회 실패</strong>
            <p>{error}</p>
            <small>백엔드의 /api/admin/backoffice/dashboard 응답을 확인해 주세요.</small>
          </div>
        </section>
      )}

      <section className="admin-metric-grid">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={metric.label}
            metric={{
              ...metric,
              value: loading ? '-' : metric.value,
              change: loading ? '-' : metric.change
            }}
            index={index}
          />
        ))}
      </section>

      <section className="admin-dashboard-grid lower">
        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-card-kicker">ORDER FLOW</span>
              <h3>오늘 주문 처리 흐름</h3>
            </div>
            <button className="admin-text-button" type="button" onClick={() => onMove('orders')}>
              전체 주문 <ChevronRight size={15} />
            </button>
          </div>

          <div className="admin-funnel">
            {orderFlow.map((item) => (
              <div key={item.key}>
                <strong>{loading ? '-' : numberFormatter.format(item.value)}</strong>
                <span>{item.label}</span>
                <b className={item.danger ? 'danger' : undefined} style={{ width: item.width }} />
              </div>
            ))}
          </div>

          <div className="admin-recent-orders">
            {recentOrders.length === 0 && (
              <button type="button" onClick={() => onMove('orders')}>
                <span className="admin-order-avatar"><Package size={16} /></span>
                <span>
                  <strong>{loading ? '최근 주문을 불러오는 중입니다' : '최근 주문이 없습니다'}</strong>
                  <small>주문이 생성되면 이곳에 표시됩니다.</small>
                </span>
                <span className="admin-status">대기</span>
                <b>{won.format(0)}</b>
              </button>
            )}

            {recentOrders.slice(0, 5).map((order) => (
              <button type="button" key={order.id} onClick={() => onMove('orders')}>
                <span className="admin-order-avatar">#{String(order.id).slice(-2)}</span>
                <span>
                  <strong>{order.productName ?? order.product ?? '상품 정보 없음'}</strong>
                  <small>{order.customerEmail ?? order.customer ?? formatTime(order.createdAt)}</small>
                </span>
                <span className={`admin-status status-${String(order.status).toLowerCase()}`}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
                <b>{won.format(order.amount ?? order.totalPrice ?? 0)}</b>
              </button>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-card-kicker">ACTION REQUIRED</span>
              <h3>운영 알림</h3>
            </div>
            <span className="admin-count-badge">{alerts.filter((alert) => alert.level !== 'info').length}</span>
          </div>

          <div className="admin-alert-list">
            {alerts.map((alert) => (
              <div className={`admin-alert-item ${alert.level ?? 'info'}`} key={`${alert.title}-${alert.time}`}>
                <span className="admin-alert-icon">{alertIcon(alert.level)}</span>
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.detail}</p>
                  <small>{alert.time ?? '방금'}</small>
                </div>
                <ChevronRight size={17} />
              </div>
            ))}
          </div>

          <button className="admin-wide-button" type="button" onClick={() => onMove('products')}>
            상품 재고 확인
          </button>
        </article>
      </section>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  Radio,
  RefreshCw,
  Server,
  ShoppingCart,
  XCircle,
  Zap
} from 'lucide-react';
import { getAdminBusinessMetrics, getAdminMonitoringOverview } from '../../../api/admin.js';
import { endpointMetrics } from '../adminData.js';
import { SectionHeader, TrafficChart, won } from '../components/AdminUi.jsx';

const numberFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 2
});

function prometheusValue(response) {
  const result = response?.data?.result;
  if (!Array.isArray(result) || result.length === 0) return null;

  const rawValue = result[0]?.value?.[1];
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatNumber(value, fallback = '-') {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return numberFormatter.format(value);
}

function formatMilliseconds(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return '-';
  }

  return `${numberFormatter.format(seconds * 1000)}ms`;
}

function buildSummaryCards(overview, business) {
  const requestsPerSecond = prometheusValue(overview?.requestsPerSecond);
  const errorRate = prometheusValue(overview?.errorRate);
  const avgLatency = prometheusValue(overview?.avgLatency);

  return [
    {
      label: '오늘 주문',
      value: `${formatNumber(business?.todayOrderCount, '0')}건`,
      detail: 'DB 집계',
      icon: ShoppingCart
    },
    {
      label: '오늘 매출',
      value: won.format(business?.todayRevenue ?? 0),
      detail: '결제 완료 기준',
      icon: CheckCircle2
    },
    {
      label: '초당 요청 수',
      value: `${formatNumber(requestsPerSecond, '0')} RPS`,
      detail: 'Prometheus 1분 평균',
      icon: Zap
    },
    {
      label: '5xx 에러',
      value: `${formatNumber(errorRate, '0')} /s`,
      detail: 'Prometheus 1분 평균',
      icon: XCircle
    },
    {
      label: '평균 응답',
      value: formatMilliseconds(avgLatency),
      detail: 'HTTP 요청 평균',
      icon: Gauge
    },
    {
      label: '품절 상품',
      value: `${formatNumber(business?.soldOutProductCount, '0')}개`,
      detail: 'stock 0 이하',
      icon: AlertTriangle
    }
  ];
}

export function AdminMonitoring() {
  const [overview, setOverview] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadMonitoring() {
    setLoading(true);
    setError('');

    try {
      const [overviewData, businessData] = await Promise.all([
        getAdminMonitoringOverview(),
        getAdminBusinessMetrics()
      ]);

      setOverview(overviewData);
      setBusiness(businessData);
    } catch (err) {
      setError(err.message || '모니터링 지표를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonitoring();
  }, []);

  const summaryCards = useMemo(() => buildSummaryCards(overview, business), [overview, business]);

  return (
    <div className="admin-page-stack">
      <SectionHeader
        eyebrow="Observability"
        title="운영 지표 모니터링"
        description="Prometheus와 DB에서 가져온 백오피스 핵심 지표입니다."
        action={
          <button className="admin-primary-button" type="button" onClick={loadMonitoring} disabled={loading}>
            <RefreshCw size={16} /> {loading ? '갱신 중' : '새로고침'}
          </button>
        }
      />

      {error && (
        <section className="admin-card admin-alert-item critical">
          <span className="admin-alert-icon"><AlertTriangle size={18} /></span>
          <div>
            <strong>지표 조회 실패</strong>
            <p>{error}</p>
            <small>백엔드 서버, Prometheus 실행 상태, 관리자 권한을 확인해 주세요.</small>
          </div>
        </section>
      )}

      <section className="admin-monitor-summary">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label}>
              <Icon size={19} />
              <span>
                {card.label}
                <strong>{loading ? '-' : card.value}</strong>
                <small>{card.detail}</small>
              </span>
            </div>
          );
        })}
      </section>

      <section className="admin-monitor-grid">
        <article className="admin-card admin-traffic-card">
          <div className="admin-card-head">
            <div>
              <span className="admin-card-kicker">HTTP REQUESTS</span>
              <h3>요청 트래픽</h3>
            </div>
            <div className="admin-chart-legend"><span className="request" />요청 <span className="failure" />실패</div>
          </div>
          <div className="admin-chart-summary">
            <strong>{loading ? '-' : summaryCards[2].value}</strong>
            <span className="neutral">Prometheus 기준 현재 요청량</span>
          </div>
          <TrafficChart />
        </article>

        <article className="admin-card admin-request-result">
          <div className="admin-card-head">
            <div>
              <span className="admin-card-kicker">BUSINESS</span>
              <h3>오늘 주문 흐름</h3>
            </div>
          </div>
          <div className="admin-result-list">
            <div><span><b className="success-dot" />생성된 주문</span><strong>{formatNumber(business?.todayOrderCount, '0')}건</strong></div>
            <div><span><b className="success-dot" />결제 완료</span><strong>{formatNumber(business?.todayPaidOrderCount, '0')}건</strong></div>
            <div><span><b className="timeout-dot" />오늘 매출</span><strong>{won.format(business?.todayRevenue ?? 0)}</strong></div>
            <div><span><b className="failure-dot" />품절 상품</span><strong>{formatNumber(business?.soldOutProductCount, '0')}개</strong></div>
          </div>
        </article>
      </section>

      <section className="admin-card admin-endpoint-card">
        <div className="admin-card-head">
          <div>
            <span className="admin-card-kicker">ENDPOINT PERFORMANCE</span>
            <h3>주요 API 성능</h3>
          </div>
          <span className="admin-live-pill"><span /> Prometheus 연동 대기</span>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>엔드포인트</th>
                <th>요청량</th>
                <th>p95 응답</th>
                <th>성공률</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {endpointMetrics.map((metric) => (
                <tr key={metric.endpoint}>
                  <td><code>{metric.endpoint}</code></td>
                  <td>{metric.rps} RPS</td>
                  <td><strong>{metric.p95}</strong></td>
                  <td>
                    <div className="admin-success-meter">
                      <span><b style={{ width: `${metric.success}%` }} /></span>
                      <strong>{metric.success}%</strong>
                    </div>
                  </td>
                  <td><span className="admin-live-pill"><span /> 정상</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-infra-grid">
        <article className="admin-card"><Server size={20} /><span>Application<strong>UP</strong><small>Actuator metrics</small></span></article>
        <article className="admin-card"><Database size={20} /><span>PostgreSQL<strong>DB 집계</strong><small>Business metrics</small></span></article>
        <article className="admin-card"><Radio size={20} /><span>Prometheus<strong>조회 API</strong><small>/api/v1/query</small></span></article>
        <article className="admin-card"><Zap size={20} /><span>Frontend<strong>관리자 전용</strong><small>/api/admin/backoffice/monitoring</small></span></article>
      </section>

      <section className="admin-metric-reference">
        <div><code>order.created</code><span>주문 생성 성공 카운터</span></div>
        <div><code>http_server_requests</code><span>Spring HTTP 요청 지표</span></div>
        <div><code>orders</code><span>오늘 주문/매출 DB 집계</span></div>
        <div><code>products.stock</code><span>품절 상품 DB 집계</span></div>
      </section>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Clock3 } from 'lucide-react';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatScheduledDate(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatRemainingTime(milliseconds) {
  if (milliseconds <= 0) return '판매 시작 처리 중';

  const days = Math.floor(milliseconds / DAY);
  const hours = Math.floor((milliseconds % DAY) / HOUR);
  const minutes = Math.floor((milliseconds % HOUR) / MINUTE);
  const seconds = Math.floor((milliseconds % MINUTE) / SECOND);
  const time = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');

  return days > 0 ? `${days}일 ${time} 남음` : `${time} 남음`;
}

export function ScheduledSaleNotice({ product, compact = false }) {
  const status = String(product?.status ?? '').toUpperCase();
  const saleStartAt = useMemo(() => {
    const date = new Date(product?.saleStartAt);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [product?.saleStartAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== 'SCHEDULED' || !saleStartAt) return undefined;

    setNow(Date.now());
    const timerId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      if (currentTime >= saleStartAt.getTime()) {
        window.clearInterval(timerId);
      }
    }, SECOND);

    return () => window.clearInterval(timerId);
  }, [saleStartAt, status]);

  if (status !== 'SCHEDULED' || !saleStartAt) return null;

  return (
    <span className={`scheduled-sale-notice${compact ? ' compact' : ''}`}>
      <Clock3 size={compact ? 17 : 20} aria-hidden="true" />
      <span className="scheduled-sale-copy">
        <span className="scheduled-sale-label">판매 시작</span>
        <strong>{formatScheduledDate(saleStartAt)}</strong>
        <span className="scheduled-sale-countdown">{formatRemainingTime(saleStartAt.getTime() - now)}</span>
      </span>
    </span>
  );
}

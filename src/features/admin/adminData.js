export const trafficSeries = [
  { time: '09:00', requests: 34, failures: 2 },
  { time: '10:00', requests: 42, failures: 3 },
  { time: '11:00', requests: 51, failures: 3 },
  { time: '12:00', requests: 68, failures: 5 },
  { time: '13:00', requests: 58, failures: 4 },
  { time: '14:00', requests: 76, failures: 6 },
  { time: '15:00', requests: 92, failures: 8 },
  { time: '16:00', requests: 84, failures: 6 },
  { time: '17:00', requests: 100, failures: 7 },
  { time: '18:00', requests: 88, failures: 4 },
  { time: '19:00', requests: 72, failures: 3 },
  { time: '20:00', requests: 61, failures: 2 }
];

export const endpointMetrics = [
  { endpoint: 'POST /api/user/order/create', p95: '184ms', rps: 126, success: 98.7 },
  { endpoint: 'POST /api/user/order/{id}/pay', p95: '642ms', rps: 84, success: 96.8 },
  { endpoint: 'GET /api/product', p95: '72ms', rps: 218, success: 99.9 },
  { endpoint: 'GET /api/cart', p95: '96ms', rps: 74, success: 99.5 },
  { endpoint: 'POST /api/cart/item/add', p95: '138ms', rps: 51, success: 98.9 }
];

export const dropSchedule = [
  { name: 'Archive Drop 07', date: '오늘 20:00', products: 4, stock: 500, status: '진행 예정', progress: 72 },
  { name: 'Member Only Silver', date: '07.18 20:00', products: 3, stock: 320, status: '준비 중', progress: 48 },
  { name: 'Summer Numbered Goods', date: '07.25 18:00', products: 6, stock: 900, status: '검수 필요', progress: 26 }
];

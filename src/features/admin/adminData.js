export const dashboardMetrics = [
  { label: '오늘 주문', value: '1,284', change: '+18.6%', trend: 'up', detail: '지난주 같은 요일 대비' },
  { label: '결제 거래액', value: '₩84.2M', change: '+12.4%', trend: 'up', detail: '결제 승인 기준' },
  { label: '결제 성공률', value: '96.8%', change: '+1.2%p', trend: 'up', detail: '최근 15분 평균' },
  { label: '현재 요청량', value: '428 RPS', change: '-8.1%', trend: 'down', detail: '피크 1,840 RPS' }
];

export const trafficSeries = [
  { time: '09:00', requests: 34, failures: 2 },
  { time: '10:00', requests: 42, failures: 3 },
  { time: '11:00', requests: 51, failures: 3 },
  { time: '12:00', requests: 68, failures: 5 },
  { time: '13:00', requests: 58, failures: 4 },
  { time: '14:00', requests: 76, failures: 6 },
  { time: '15:00', requests: 92, failures: 8 },
  { time: '16:00', requests: 84, failures: 5 },
  { time: '17:00', requests: 100, failures: 7 },
  { time: '18:00', requests: 88, failures: 4 },
  { time: '19:00', requests: 72, failures: 3 },
  { time: '20:00', requests: 61, failures: 2 }
];

export const orders = [
  { id: 10482, customer: 'minji.kim@example.com', product: 'Archive Varsity Jacket', quantity: 1, amount: 289000, status: 'PAYMENT_PENDING', createdAt: '오늘 14:32', channel: 'WEB' },
  { id: 10481, customer: 'jun.park@example.com', product: 'Founders Hoodie', quantity: 2, amount: 238000, status: 'PAID', createdAt: '오늘 14:31', channel: 'WEB' },
  { id: 10480, customer: 'seo.yun@example.com', product: 'Numbered Tote', quantity: 1, amount: 79000, status: 'PAYMENT_FAILED', createdAt: '오늘 14:29', channel: 'MOBILE' },
  { id: 10479, customer: 'hyun.lee@example.com', product: 'Archive Ball Cap', quantity: 1, amount: 59000, status: 'CREATED', createdAt: '오늘 14:26', channel: 'WEB' },
  { id: 10478, customer: 'jisu.choi@example.com', product: 'Founders Hoodie', quantity: 1, amount: 119000, status: 'CANCEL_REQUESTED', createdAt: '오늘 14:22', channel: 'MOBILE' },
  { id: 10477, customer: 'do.kang@example.com', product: 'Silver Member Keyring', quantity: 3, amount: 117000, status: 'COMPLETED', createdAt: '오늘 14:18', channel: 'WEB' },
  { id: 10476, customer: 'ara.song@example.com', product: 'Numbered Tote', quantity: 2, amount: 158000, status: 'EXPIRED', createdAt: '오늘 14:15', channel: 'WEB' },
  { id: 10475, customer: 'woo.jang@example.com', product: 'Archive Varsity Jacket', quantity: 1, amount: 289000, status: 'REFUNDED', createdAt: '오늘 14:11', channel: 'MOBILE' }
];

export const demoProducts = [
  { id: 101, name: 'Archive Varsity Jacket', price: 289000, stock: 8, reserved: 6, sold: 86, status: '판매중', dropAt: '07.13 20:00' },
  { id: 102, name: 'Founders Hoodie', price: 119000, stock: 42, reserved: 12, sold: 248, status: '판매중', dropAt: '07.13 20:00' },
  { id: 103, name: 'Numbered Tote', price: 79000, stock: 0, reserved: 0, sold: 150, status: '품절', dropAt: '07.12 18:00' },
  { id: 104, name: 'Archive Ball Cap', price: 59000, stock: 17, reserved: 4, sold: 79, status: '판매중', dropAt: '07.14 12:00' },
  { id: 105, name: 'Silver Member Keyring', price: 39000, stock: 76, reserved: 2, sold: 121, status: '판매예정', dropAt: '07.18 20:00' }
];

export const alerts = [
  { level: 'critical', title: 'Archive Varsity Jacket 재고 임계치', detail: '판매 가능 재고가 8개 남았습니다.', time: '2분 전' },
  { level: 'warning', title: '결제 실패율 상승', detail: '최근 5분 실패율이 5.4%로 증가했습니다.', time: '7분 전' },
  { level: 'info', title: '드롭 트래픽 피크 감지', detail: '평균 대비 요청량이 3.8배 증가했습니다.', time: '18분 전' }
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

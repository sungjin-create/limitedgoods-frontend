import {
  Activity,
  LayoutDashboard,
  Pencil,
  Package,
  PackagePlus,
  ShoppingCart,
  Sparkles,
  Trash2
} from 'lucide-react';

export const ADMIN_SECTIONS = [
  { id: 'overview', label: '운영 대시보드', description: '주문과 시스템 운영 현황', icon: LayoutDashboard },
  { id: 'orders', label: '주문 관리', description: '주문 조회와 상태 처리', icon: ShoppingCart },
  {
    id: 'products',
    label: '상품 관리',
    description: '상품과 재고 관리',
    icon: Package,
    children: [
      { id: 'product-create', label: '상품 등록', description: '새로운 굿즈 등록', icon: PackagePlus },
      { id: 'product-update', label: '상품 변경', description: '상품 정보 수정', icon: Pencil },
      { id: 'product-delete', label: '상품 삭제', description: '상품 비활성/삭제', icon: Trash2 }
    ]
  },
  { id: 'monitoring', label: '모니터링', description: '트래픽과 요청 지표', icon: Activity },
  { id: 'drops', label: '드롭 운영', description: '판매 일정과 오픈 준비', icon: Sparkles }
];

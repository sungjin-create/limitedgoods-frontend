import React from 'react';
import { ShoppingBag } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="empty-state">
      <ShoppingBag size={30} />
      <strong>아직 주문이 없습니다.</strong>
      <span>스토어에서 상품을 선택하고 주문을 생성해 보세요.</span>
    </div>
  );
}

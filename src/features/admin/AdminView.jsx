import React from 'react';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { AdminDrops } from './pages/AdminDrops.jsx';
import { AdminMonitoring } from './pages/AdminMonitoring.jsx';
import { AdminOrders } from './pages/AdminOrders.jsx';
import { AdminProductRegister } from './pages/AdminProductRegister.jsx';
import { AdminProductStock } from './pages/AdminProductStock.jsx';
import { AdminProductStatus } from './pages/AdminProductStatus.jsx';
import { AdminProductSchedule } from './pages/AdminProductSchedule.jsx';
import { AdminProductReview } from './pages/AdminProductReview.jsx';
import { AdminProducts } from './pages/AdminProducts.jsx';
import { AdminProductUpdate } from './pages/AdminProductUpdate.jsx';

export function AdminView({
  activeSection,
  adminForm,
  loading,
  products = [],
  selectedProduct,
  productDraft,
  setActiveSection,
  onProductAction,
  onProductDraftChange,
  onStockAdjusted,
  setAdminForm,
  onSubmit
}) {
  if (activeSection === 'orders') return <AdminOrders />;
  if (activeSection === 'products') return <AdminProducts products={products} onMove={setActiveSection} onProductAction={onProductAction} />;
  if (activeSection === 'product-create' || activeSection === 'register') {
    return (
      <AdminProductRegister
        adminForm={adminForm}
        loading={loading}
        setAdminForm={setAdminForm}
        onSubmit={onSubmit}
      />
    );
  }
  if (activeSection === 'product-update') return <AdminProductUpdate product={productDraft} onMove={setActiveSection} onProductDraftChange={onProductDraftChange} />;
  if (activeSection === 'product-stock') return <AdminProductStock product={selectedProduct} onMove={setActiveSection} onStockAdjusted={onStockAdjusted} />;
  if (activeSection === 'product-status') return <AdminProductStatus product={productDraft} originalStatus={selectedProduct?.status} onMove={setActiveSection} onProductDraftChange={onProductDraftChange} />;
  if (activeSection === 'product-schedule') return <AdminProductSchedule product={productDraft} onMove={setActiveSection} onProductDraftChange={onProductDraftChange} />;
  if (activeSection === 'product-review') return <AdminProductReview product={productDraft} onMove={setActiveSection} />;
  if (activeSection === 'monitoring') return <AdminMonitoring />;
  if (activeSection === 'drops') return <AdminDrops />;

  return <AdminDashboard onMove={setActiveSection} />;
}

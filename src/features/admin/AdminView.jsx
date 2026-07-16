import React from 'react';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { AdminDrops } from './pages/AdminDrops.jsx';
import { AdminMonitoring } from './pages/AdminMonitoring.jsx';
import { AdminProductDelete } from './pages/AdminProductDelete.jsx';
import { AdminOrders } from './pages/AdminOrders.jsx';
import { AdminProductRegister } from './pages/AdminProductRegister.jsx';
import { AdminProducts } from './pages/AdminProducts.jsx';
import { AdminProductUpdate } from './pages/AdminProductUpdate.jsx';

export function AdminView({
  activeSection,
  adminForm,
  loading,
  products = [],
  setActiveSection,
  setAdminForm,
  onSubmit
}) {
  if (activeSection === 'orders') return <AdminOrders />;
  if (activeSection === 'products') return <AdminProducts products={products} onMove={setActiveSection} />;
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
  if (activeSection === 'product-update') return <AdminProductUpdate onMove={setActiveSection} />;
  if (activeSection === 'product-delete') return <AdminProductDelete onMove={setActiveSection} />;
  if (activeSection === 'monitoring') return <AdminMonitoring />;
  if (activeSection === 'drops') return <AdminDrops />;

  return <AdminDashboard onMove={setActiveSection} />;
}

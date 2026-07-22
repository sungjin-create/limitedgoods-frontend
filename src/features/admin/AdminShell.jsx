import React, { useMemo, useState } from 'react';
import { Notice } from '../../components/Notice.jsx';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminTopbar } from './AdminTopbar.jsx';
import { AdminView } from './AdminView.jsx';
import { ADMIN_SECTIONS } from './adminNavigation.js';

export function AdminShell({
  adminForm,
  loading,
  notice,
  products,
  setAdminForm,
  onSubmit,
  onProductUpdated,
  onBackToStore,
  onLogout
}) {
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDraft, setProductDraft] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentSection = useMemo(() => {
    const directSection = ADMIN_SECTIONS.find((section) => section.id === activeSection);
    if (directSection) return directSection;

    for (const section of ADMIN_SECTIONS) {
      if (!Array.isArray(section.children)) continue;

      const child = section.children.find((item) => item.id === activeSection);
      if (child) return child;
    }

    return ADMIN_SECTIONS[0];
  }, [activeSection]);

  function handleSectionChange(sectionId) {
    setActiveSection(sectionId);
    setIsMenuOpen(false);
  }

  function handleProductAction(product, sectionId) {
    setSelectedProduct(product);
    setProductDraft(product);
    handleSectionChange(sectionId);
  }

  function handleProductDraftChange(nextDraft) {
    setProductDraft(nextDraft);
  }

  function handleStockAdjusted(updatedProduct) {
    setSelectedProduct((current) => current?.id === updatedProduct.id ? { ...current, ...updatedProduct } : current);
    setProductDraft((current) => current?.id === updatedProduct.id ? { ...current, ...updatedProduct } : current);
    onProductUpdated?.(updatedProduct);
  }

  return (
    <main className="admin-shell">
      <AdminSidebar
        sections={ADMIN_SECTIONS}
        activeSection={activeSection}
        isOpen={isMenuOpen}
        onSelect={handleSectionChange}
        onBackToStore={onBackToStore}
        onClose={() => setIsMenuOpen(false)}
      />
      {isMenuOpen && <button className="admin-shell-overlay" type="button" aria-label="관리자 메뉴 닫기" onClick={() => setIsMenuOpen(false)} />}

      <section className="admin-shell-main">
        <AdminTopbar
          section={currentSection}
          onMenuOpen={() => setIsMenuOpen(true)}
          onBackToStore={onBackToStore}
          onLogout={onLogout}
        />
        <div className="admin-shell-notice"><Notice notice={notice} /></div>
        <div className="admin-shell-body">
          <AdminView
            activeSection={activeSection}
            adminForm={adminForm}
            loading={loading}
            products={products}
            selectedProduct={selectedProduct}
            productDraft={productDraft ?? selectedProduct}
            setActiveSection={handleSectionChange}
            onProductAction={handleProductAction}
            onProductDraftChange={handleProductDraftChange}
            onStockAdjusted={handleStockAdjusted}
            setAdminForm={setAdminForm}
            onSubmit={onSubmit}
          />
        </div>
      </section>
    </main>
  );
}

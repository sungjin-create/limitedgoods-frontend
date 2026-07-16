import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, ShieldCheck, ShoppingBag, X } from 'lucide-react';

function isSectionGroupActive(section, activeSection) {
  if (section.id === activeSection) return true;

  if (!Array.isArray(section.children)) return false;

  return section.children.some((child) => child.id === activeSection);
}

export function AdminSidebar({ sections, activeSection, isOpen, onSelect, onBackToStore, onClose }) {
  const [expandedGroups, setExpandedGroups] = useState({});

  const productSection = useMemo(
    () => sections.find((section) => section.id === 'products'),
    [sections]
  );

  useEffect(() => {
    const isProductActive = productSection
      ? isSectionGroupActive(productSection, activeSection)
      : false;

    if (isProductActive) {
      setExpandedGroups((previous) => ({ ...previous, products: true }));
    }
  }, [activeSection, productSection]);

  function handleSectionClick(section) {
    if (Array.isArray(section.children) && section.children.length > 0) {
      setExpandedGroups((previous) => {
        const isOpenGroup = Boolean(previous[section.id]);
        const nextValue = activeSection === section.id ? !isOpenGroup : true;

        return { ...previous, [section.id]: nextValue };
      });
    }

    onSelect(section.id);
  }

  return (
    <aside className={`admin-shell-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="admin-shell-brand">
        <span><ShieldCheck size={21} /></span>
        <div><strong>Limited Goods</strong><small>Backoffice</small></div>
        <button type="button" aria-label="관리자 메뉴 닫기" onClick={onClose}><X size={19} /></button>
      </div>

      <div className="admin-shell-nav-label">OPERATIONS</div>
      <nav aria-label="관리자 메뉴">
        {sections.map((section) => {
          const Icon = section.icon;
          const hasChildren = Array.isArray(section.children) && section.children.length > 0;
          const groupActive = isSectionGroupActive(section, activeSection);
          const expanded = Boolean(expandedGroups[section.id]) || groupActive;

          return (
            <React.Fragment key={section.id}>
              <button
                className={groupActive ? 'active' : ''}
                type="button"
                onClick={() => handleSectionClick(section)}
              >
                <span className="admin-shell-nav-icon"><Icon size={18} /></span>
                <span><strong>{section.label}</strong><small>{section.description}</small></span>
                {hasChildren
                  ? (expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)
                  : <ChevronRight size={16} />}
              </button>

              {hasChildren && expanded && (
                <div className="admin-shell-subnav" role="group" aria-label={`${section.label} 하위 메뉴`}>
                  {section.children.map((child) => {
                    const ChildIcon = child.icon;

                    return (
                      <button
                        className={activeSection === child.id ? 'active' : ''}
                        type="button"
                        key={child.id}
                        onClick={() => onSelect(child.id)}
                      >
                        <span className="admin-shell-subnav-icon"><ChildIcon size={14} /></span>
                        <span>
                          <strong>{child.label}</strong>
                          <small>{child.description}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="admin-shell-sidebar-footer">
        <div className="admin-shell-api-state"><span /><div><strong>모든 시스템 정상</strong><small>마지막 확인 방금 전</small></div></div>
        <button className="admin-store-back" type="button" onClick={onBackToStore}>
          <ArrowLeft size={17} />
          <span><strong>스토어로 돌아가기</strong><small>고객 화면 열기</small></span>
          <ShoppingBag size={17} />
        </button>
      </div>
    </aside>
  );
}

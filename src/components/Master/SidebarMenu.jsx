import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useSessionStore from '../../store/useSessionStore';

const SidebarMenu = () => {
  const menuItemsRaw = useSessionStore((state) => state.menuItems);
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const organizeMenuItems = (items) => {
    if (!items) return [];
    const mainMenu = items.filter(
      (item) =>
        item.ParentId === null ||
        item.ParentId === 'null' ||
        item.ParentId === 0 ||
        item.ParentId === '0'
    );

    const subMenus = items.filter(
      (item) => item.ParentId !== null && item.ParentId !== 'null'
    );

    return mainMenu.map((menuItem) => ({
      ...menuItem,
      subItems: subMenus.filter(
        (subItem) => subItem.ParentId == menuItem.MenuId
      ),
    }));
  };

  const menuItems = useMemo(
    () => organizeMenuItems(menuItemsRaw),
    [menuItemsRaw]
  );

  useEffect(() => {
    const matchedParent = menuItems.find((parent) =>
      parent.subItems?.some(
        (sub) => `/${sub.MenuURL?.replace(/^\/+/, '')}` === location.pathname
      )
    );
    if (matchedParent) {
      setOpenSubmenu(matchedParent.MenuId);
    }
  }, [location.pathname, menuItems]);

  const renderSubMenuItems = (subItems) => {
    if (!subItems || subItems.length === 0) return null;

    return (
      <ul className="submenu">
        {subItems.map((subItem) => {
          const path = `/${subItem.MenuURL?.replace(/^\/+/, '')}`;
          const isActive = location.pathname === path;

          return (
            <li key={subItem.MenuId}>
              <Link to={path} className={isActive ? 'active' : ''}>
                {subItem.MenuName}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderMenuItems = (items) => {
    return items.map((item) => (
      <div key={item.MenuId} className="menu-item">
        <div className="accordion-item border-0">
          <a
            href="#!"
            className={`accordion-button ${
              item.subItems?.length ? '' : 'no-submenu'
            } overline_textB ${openSubmenu === item.MenuId ? '' : 'collapsed'}`}
            onClick={() => {
              if (item.subItems?.length) {
                setOpenSubmenu(
                  openSubmenu === item.MenuId ? null : item.MenuId
                );
              }
            }}
            aria-expanded={openSubmenu === item.MenuId}
          >
            {item.IconClass && (
              <span className="material-icons">{item.IconClass}</span>
            )}
            {item.MenuName}
          </a>

          {item.subItems?.length > 0 && (
            <div
              id={`collapse${item.MenuId}`}
              className={`accordion-collapse collapse ${
                openSubmenu === item.MenuId ? 'show' : ''
              }`}
            >
              {renderSubMenuItems(item.subItems)}
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="sidebar">
      {/* Scrollable menu area */}
      <div className="sidebar-menu-wrapper">
        <div className="accordion" id="accordionExample">
          {renderMenuItems(menuItems)}
        </div>
      </div>

      {/* Fixed help section at bottom */}
      <div className="sidebar-help-section">
        <div className="cardx help p-3">
          <span className="material-icons mb-3">help</span>
          <p className="overline_text_sm">Need help?</p>
          <p className="small mt-2 mb-3">
            Please connect with our support team.
          </p>
          <div className="d-grid">
            <button className="btn btn-sm btn-outline-secondary fw-bold">
              <small>GET IN TOUCH</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarMenu;
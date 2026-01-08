import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useSessionStore from '../../store/useSessionStore';

const SidebarMenu = () => {
  const menuItemsRaw = useSessionStore((state) => state.menuItems);
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [openNestedMenu, setOpenNestedMenu] = useState({});

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

    return mainMenu.map((menuItem) => {
      let children = subMenus.filter(
        (subItem) => subItem.ParentId == menuItem.MenuId
      );

      // Filter logic removed to allow Replicate Roster
      // children = children.filter(child => {
      //   const name = child.MenuName?.toLowerCase() || '';
      //   const url = child.MenuURL?.toLowerCase() || '';
      //   return !name.includes('replicate') && !url.includes('replicate');
      // });

      // Grouping logic for Reports
      if (menuItem.MenuName === 'Reports' && children.length > 0) {
        const billingReports = [];
        const operationalReports = [];

        children.forEach((child) => {
          const name = child.MenuName?.toLowerCase() || '';
          if (name.includes('billing')) {
            billingReports.push(child);
          } else {
            operationalReports.push(child);
          }
        });

        return {
          ...menuItem,
          isGrouped: true,
          groups: [
            {
              id: 'billing_reports',
              name: 'Billing Reports',
              IconClass: 'receipt_long',
              items: billingReports,
            },
            {
              id: 'operational_reports',
              name: 'Operational Reports',
              IconClass: 'analytics',
              items: operationalReports,
            },
          ],
        };
      }

      return {
        ...menuItem,
        subItems: children,
      };
    })
    // Filter logic removed
    // .filter(menuItem => {
    //   const menuName = menuItem.MenuName?.toLowerCase() || '';
    //   const menuURL = menuItem.MenuURL?.toLowerCase() || '';
    //   return !menuName.includes('replicate') && !menuURL.includes('replicate');
    // });
  };

  const menuItems = useMemo(
    () => organizeMenuItems(menuItemsRaw),
    [menuItemsRaw]
  );

  useEffect(() => {
    const matchedParent = menuItems.find((parent) => {
      if (parent.isGrouped) {
        return parent.groups.some((group) =>
          group.items.some(
            (sub) => `/${sub.MenuURL?.replace(/^\/+/, '')}` === location.pathname
          )
        );
      }
      return parent.subItems?.some(
        (sub) => `/${sub.MenuURL?.replace(/^\/+/, '')}` === location.pathname
      );
    });

    if (matchedParent) {
      setOpenSubmenu(matchedParent.MenuId);

      if (matchedParent.isGrouped) {
        matchedParent.groups.forEach((group) => {
          const hasActiveItem = group.items.some(
            (sub) => `/${sub.MenuURL?.replace(/^\/+/, '')}` === location.pathname
          );
          if (hasActiveItem) {
            setOpenNestedMenu((prev) => ({ ...prev, [group.id]: true }));
          }
        });
      }
    }
  }, [location.pathname, menuItems]);

  const toggleNested = (groupId) => {
    setOpenNestedMenu((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const renderSubMenuItems = (item) => {
    if (item.isGrouped) {
      return (
        <ul className="submenu">
          {item.groups.map((group) => {
            if (!group.items || group.items.length === 0) return null;

            const isOpen = openNestedMenu[group.id];

            return (
              <li key={group.id} className="nested-group-item">
                <a
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleNested(group.id);
                  }}
                  className={`d-flex align-items-center justify-content-between ${
                    isOpen ? 'active-group' : ''
                  }`}
                  style={{
                    padding: '8px 15px',
                    color: '#6c757d',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  <div className="d-flex align-items-center">
                    <span
                      className="material-icons me-2"
                      style={{ fontSize: '18px' }}
                    >
                      {group.IconClass}
                    </span>
                    <span>{group.name}</span>
                  </div>
                  <span className="material-icons" style={{ fontSize: '16px' }}>
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </a>

                {isOpen && (
                  <ul
                    className="submenu nested-submenu"
                    style={{ paddingLeft: '15px', listStyle: 'none' }}
                  >
                    {group.items.map((subItem) => {
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
                )}
              </li>
            );
          })}
        </ul>
      );
    }

    const subItems = item.subItems;
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
              item.subItems?.length || item.isGrouped ? '' : 'no-submenu'
            } overline_textB ${openSubmenu === item.MenuId ? '' : 'collapsed'}`}
            onClick={() => {
              if (item.subItems?.length || item.isGrouped) {
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

          {(item.subItems?.length > 0 || item.isGrouped) && (
            <div
              id={`collapse${item.MenuId}`}
              className={`accordion-collapse collapse ${
                openSubmenu === item.MenuId ? 'show' : ''
              }`}
            >
              {renderSubMenuItems(item)}
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
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiService } from '../../services/api';

const SidebarMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const currentPath = location.pathname;

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const userID = sessionStorage.getItem('ID');
        const menuItems = await apiService.Spr_GetMenuItem_V2({ userID });

        const organizedMenu = organizeMenuItems(menuItems);
        const allowedPaths = menuItems
          .filter((item) => item.MenuURL)
          .map((item) => `/${item.MenuURL?.replace(/^\/+/, '')}`);

        sessionStorage.setItem(
          'allowedPaths',
          JSON.stringify(allowedPaths)
        );
        setMenuItems(organizedMenu);
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
        setError('Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  useEffect(() => {
    const matchedParent = menuItems.find((parent) =>
      parent.subItems?.some(
        (sub) =>
          `/${sub.MenuURL?.replace(/^\/+/, '')}` === location.pathname
      )
    );
    if (matchedParent) {
      setOpenSubmenu(matchedParent.MenuId);
    }
  }, [location.pathname, menuItems]);

  const organizeMenuItems = (items) => {
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
            } overline_textB ${
              openSubmenu === item.MenuId ? '' : 'collapsed'
            }`}
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

  if (loading) return <div>Loading menu...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="sidebar">
      <div className="accordion mb-5" id="accordionExample">
        {renderMenuItems(menuItems)}
      </div>

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
  );
};

export default SidebarMenu;
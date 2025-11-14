import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import sessionManager from '../../utils/SessionManager';
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Header = ({ 
  mainTitle, 
  pageTitle, 
  showAdhocButton = false, 
  showNewButton = false, 
  onNewButtonClick 
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const headerRef = useRef(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          '--header-height',
          `${height}px`
        );
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const userData = sessionManager.getUserSession();
  const employeeName = userData.empName || 'Guest';

  const sidebarToggle = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    
    // Toggle body class
    document.body.classList.toggle('sidebar-collapsed', newState);
    
    // Toggle sidebar class
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed', newState);
    }
    
    // Toggle middle class
    const middle = document.querySelector('.middle');
    if (middle) {
      middle.classList.toggle('expanded', newState);
    }
  };

  return (
    <div className="header" ref={headerRef}>
      <style>{`
        @media (max-width: 767px) {
          .header .header-mid {
            flex-wrap: wrap;
          }
          .header .breadcrumb-cnt {
            display: none;
          }
          .header .link-right .company_logo {
            display: none;
          }
          .header .logo {
            margin-left: 0;
          }
        }
      `}</style>
      
      <ul className="me-3 mt-2">
        <li>
          <a 
            href="#!" 
            onClick={sidebarToggle} 
            className="text-dark"
            aria-label={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            <span className="material-icons">
              {isSidebarCollapsed ? 'menu' : 'close'}
            </span>
          </a>
        </li>
      </ul>
      
      <div className="logo">
        <img src="images/logo.svg" alt="Logo" />
      </div>
      
      <div className="header-mid">
        <div className="breadcrumb-cnt">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item text1-body">
              <a href="#">Etms</a>
            </li>
            <li 
              className="breadcrumb-item text1-body active" 
              aria-current="page"
            >
              {mainTitle}
            </li>
          </ol>
          <span className="subtitle">
            <strong className="text-grey5">{pageTitle}</strong>
          </span>
        </div>
        
        {showAdhocButton && (
          <button 
            className="btn btn-primary ms-auto" 
            data-bs-toggle="offcanvas" 
            data-bs-target="#addAdhoc" 
            aria-controls="addAdhoc"
          >
            <span className="material-icons me-2">add_circle</span> 
            Add Adhoc
          </button>
        )}
        
        {showNewButton && (
          <button 
            className="btn btn-primary ms-auto" 
            onClick={onNewButtonClick} 
            aria-controls="offcanvasRight"
          >
            <span className="material-icons me-2">add_circle</span> 
            New
          </button>
        )}
        
        <ul className="link-right">
          <li>
            <a href="#!" className="company_logo">
              <img src="images/logo.svg" alt="Company Logo" />
            </a>
          </li>
          <li className="dropdown">
            <a 
              href="#!" 
              data-bs-toggle="offcanvas" 
              data-bs-target="#profileSidebar" 
              aria-controls="profileSidebar"
            >
              <img src="public/images/al1i.png" alt="Profile" /> 
              {employeeName}
            </a>
          </li>
          <li>
            <a 
              href="/" 
              onClick={handleLogout} 
              className="text-dark"
              aria-label="Logout"
            >
              <FiLogOut />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

Header.propTypes = {
  mainTitle: PropTypes.string.isRequired,
  pageTitle: PropTypes.string.isRequired,
  showAdhocButton: PropTypes.bool,
  showNewButton: PropTypes.bool,
  onNewButtonClick: PropTypes.func,
};

export default Header;
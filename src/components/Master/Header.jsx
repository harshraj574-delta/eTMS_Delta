import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import sessionManager from '../../utils/SessionManager';
import { useNavigate } from "react-router-dom";
import useSessionStore from '../../store/useSessionStore';
import { Offcanvas } from "bootstrap";
import { apiService } from "../../services/api";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Avatar } from 'primereact/avatar';
import { OverlayPanel } from 'primereact/overlaypanel';
const Header = ({ 
  mainTitle, 
  pageTitle, 
  showAdhocButton = false, 
  showNewButton = false, 
  onNewButtonClick 
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Default to collapsed on mobile (< 768px)
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [profileData, setProfileData] = useState(null);
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const profileMenuRef = useRef(null);
  const logout = useSessionStore((state) => state.logout);

  const prevWidth = useRef(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const handleResize = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          '--header-height',
          `${height}px`
        );
      }
      
      const currWidth = window.innerWidth;
      // Auto-collapse if transitioning from Desktop (>=768) to Mobile (<768)
      if (currWidth < 768 && prevWidth.current >= 768) {
        setIsSidebarCollapsed(true);
      }
      prevWidth.current = currWidth;
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = sessionManager.getUserSession().ID;
        const data = await apiService.GetEmpGeoCodeDetails({ empid: userId });
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;
        setProfileData(Array.isArray(parsedData) ? parsedData[0] : parsedData);
      } catch (err) {
        console.error("API Error:", err);
      }
    };
    fetchProfile();
  }, []);

  // Sync DOM classes with React state whenever isSidebarCollapsed changes
  useEffect(() => {
    // Update body class
    document.body.classList.toggle('sidebar-collapsed', isSidebarCollapsed);
    
    // Update sidebar class
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed', isSidebarCollapsed);
    }
    
    // Update middle class
    const middle = document.querySelector('.middle');
    if (middle) {
      middle.classList.toggle('expanded', isSidebarCollapsed);
    }
  }, [isSidebarCollapsed]);

  // Listen for sidebar expand event (dispatched from SidebarMenu when icon is clicked in collapsed mode)
  useEffect(() => {
    const handleSidebarExpand = () => {
      setIsSidebarCollapsed(false);
      // DOM classes will be synced by the above useEffect
    };
    
    window.addEventListener('sidebarExpand', handleSidebarExpand);
    return () => window.removeEventListener('sidebarExpand', handleSidebarExpand);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userData = sessionManager.getUserSession();
  const employeeName = userData.empName || 'Guest';

  const sidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    // DOM classes are synced by the useEffect above
  };

  return (
    <div className="header" ref={headerRef}>
      <style>{`
        .header {
          overflow: hidden;
          box-sizing: border-box !important;
        }

        .header .link-right li:nth-child(1)::before,
        .header .link-right li:nth-child(2)::before {
          height: 75px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
        }
        
        @media (max-width: 767px) {
          .header .header-mid {
            flex-wrap: nowrap;
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
          .header-user-info {
            display: none !important;
          }
        }
        
        @media (max-width: 576px) {
          .header .header-mid {
            gap: 8px;
          }
          .header .btn .btn-text {
            display: none;
          }
          .header .btn .material-icons {
            margin-right: 0 !important;
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
        <div className="breadcrumb-cnt d-none d-lg-block">
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
            <style>{`
              .header-profile-trigger {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 6px 12px;
                border-radius: 8px;
                transition: all 0.2s ease;
                cursor: pointer;
                text-decoration: none;
              }
              .header-profile-trigger:hover {
                background: rgba(0, 0, 0, 0.04);
              }
              .header-profile-trigger .p-avatar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
              }
              .header-user-info {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                line-height: 1.3;
              }
              .header-user-name-text {
                font-size: 14px;
                font-weight: 600;
                color: #1a1a2e;
                white-space: nowrap;
              }
              .header-dropdown-icon {
                color: #9ca3af;
                font-size: 20px !important;
                transition: transform 0.2s ease;
              }
              .header-profile-trigger:hover .header-dropdown-icon {
                color: #6b7280;
              }
              @media (max-width: 576px) {
                .header-user-info {
                  display: none;
                }
              }
              
              /* Profile Dropdown Styles */
              .profile-dropdown {
                border-radius: 12px !important;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
                border: 1px solid #e5e7eb !important;
                padding: 0 !important;
                min-width: 280px;
                z-index: 1300 !important;
              }
              .profile-dropdown::before,
              .profile-dropdown::after {
                display: none !important;
              }
              .profile-dropdown-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                border-bottom: 1px solid #f3f4f6;
              }
              .profile-dropdown-header .p-avatar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff;
                font-weight: 700;
                width: 48px;
                height: 48px;
                font-size: 18px;
              }
              .profile-dropdown-header-info h6 {
                margin: 0;
                font-size: 15px;
                font-weight: 600;
                color: #1a1a2e;
              }
              .profile-dropdown-header-info span {
                font-size: 13px;
                color: #6b7280;
              }
              .profile-dropdown-menu {
                list-style: none;
                margin: 0;
                padding: 8px 0;
              }
              .profile-dropdown-menu li {
                padding: 0;
              }
              .profile-dropdown-menu a,
              .profile-dropdown-menu button {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 16px;
                text-decoration: none;
                color: #374151;
                font-size: 14px;
                font-weight: 500;
                transition: background 0.15s ease;
                border: none;
                background: transparent;
                width: 100%;
                cursor: pointer;
                text-align: left;
              }
              .profile-dropdown-menu a:hover,
              .profile-dropdown-menu button:hover {
                background: #f9fafb;
              }
              .profile-dropdown-menu .material-icons {
                font-size: 20px;
                color: #9ca3af;
              }
              .profile-dropdown-menu .logout-item {
                color: #dc2626;
                border-top: 1px solid #f3f4f6;
                margin-top: 4px;
                padding-top: 12px;
              }
              .profile-dropdown-menu .logout-item .material-icons {
                color: #dc2626;
              }
            `}</style>
            <a 
              href="#!" 
              onClick={(e) => profileMenuRef.current.toggle(e)}
              className="header-profile-trigger"
            >
              <Avatar 
                label={employeeName ? employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                size="normal"
                shape="circle"
              />
              <div className="header-user-info">
                <span className="header-user-name-text">{employeeName}</span>
              </div>
              <ArrowDropDownIcon className="header-dropdown-icon" />
            </a>
            
            {/* Profile Dropdown Menu */}
            <OverlayPanel ref={profileMenuRef} className="profile-dropdown" dismissable appendTo={document.body}>
              <div className="profile-dropdown-header">
                <Avatar 
                  label={employeeName ? employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                  size="large"
                  shape="circle"
                />
                <div className="profile-dropdown-header-info">
                  <h6>{employeeName}</h6>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                    <span className="material-icons" style={{ fontSize: '14px' }}>email</span>
                    {profileData?.Email || "No Email"}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                    <span className="material-icons" style={{ fontSize: '14px' }}>call</span>
                    {profileData?.mobile || "No Contact"}
                  </div>
                </div>
              </div>
              
              {/* Transport Info Section */}
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                padding: '12px 16px', 
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: profileData?.tptReqText === "Yes" ? 'rgba(16, 185, 129, 0.08)' : 'rgba(107, 114, 128, 0.08)',
                  border: profileData?.tptReqText === "Yes" ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(107, 114, 128, 0.15)'
                }}>
                  <span className="material-icons" style={{ 
                    fontSize: '18px', 
                    color: profileData?.tptReqText === "Yes" ? '#10b981' : '#6b7280'
                  }}>directions_car</span>
                  <div>
                    <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transport</div>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: profileData?.tptReqText === "Yes" ? '#10b981' : '#6b7280'
                    }}>
                      {profileData?.tptReqText === "Yes" ? "Required" : "Not Required"}
                    </div>
                  </div>
                </div>
                <div style={{ 
                  flex: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(102, 126, 234, 0.06)',
                  border: '1px solid rgba(102, 126, 234, 0.15)'
                }}>
                  <span className="material-icons" style={{ fontSize: '18px', color: '#667eea' }}>location_on</span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nodal Point</div>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      color: '#1a1a2e',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {profileData?.landmark || "Not Set"}
                    </div>
                  </div>
                </div>
              </div>
              <ul className="profile-dropdown-menu">
                <li>
                  <a href="#!" onClick={() => { profileMenuRef.current.hide(); navigate('/MyProfile'); }}>
                    <span className="material-icons">person</span>
                    My Profile
                  </a>
                </li>
                <li>
                  <a href="#!" onClick={() => profileMenuRef.current.hide()}>
                    <span className="material-icons">help_outline</span>
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#!" onClick={() => profileMenuRef.current.hide()}>
                    <span className="material-icons">menu_book</span>
                    Help Documents
                  </a>
                </li>
                <li>
                  <a href="#!" onClick={() => profileMenuRef.current.hide()}>
                    <span className="material-icons">description</span>
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <button className="logout-item" onClick={() => { profileMenuRef.current.hide(); handleLogout(); }}>
                    <span className="material-icons">logout</span>
                    Logout
                  </button>
                </li>
              </ul>
            </OverlayPanel>
          </li>
          {/* Removed direct logout button */}
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
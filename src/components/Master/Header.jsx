import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import sessionManager from '../../utils/SessionManager';
import { useNavigate } from "react-router-dom";
import useSessionStore from '../../store/useSessionStore';
import { Offcanvas } from "bootstrap";
import { apiService } from "../../services/api";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const Header = ({ 
  mainTitle, 
  pageTitle, 
  showAdhocButton = false, 
  showNewButton = false, 
  onNewButtonClick 
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const logout = useSessionStore((state) => state.logout);

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

  const handleLogout = () => {
    logout();
    navigate("/");
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
              className="d-flex align-items-center text-decoration-none"
            >
              <img src="images/al1i.png" alt="Profile" className="rounded-circle" width="32" height="32" /> 
              <span className="header-user-name ms-2">{employeeName}</span>
              <ArrowDropDownIcon className="ms-2 text-dark" />
            </a>
          </li>
          {/* Removed direct logout button */}
        </ul>
      </div>

      {/* Profile Sidebar */}
      <div 
        className="offcanvas offcanvas-end profile-sidebar" 
        tabIndex="-1" 
        id="profileSidebar" 
        aria-labelledby="profileSidebarLabel"
      >
        <div className="offcanvas-body position-relative p-0">
          <button type="button" className="btn-close text-reset btn-close-fixed" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          <div className="d-flex justify-content-start align-items-start p-3">
            <img src="images/al1i.png" className="me-3 profile-sidebar-img" alt="Profile" />
            <div>
              <h5 className="profile-sidebar-name mb-1"> {employeeName}</h5>
              <ul className="personal_info">
                <li><span className="material-icons">email</span> <span className="profile-contact-text">{profileData?.Email || "No Email"}</span></li>
                <li><span className="material-icons">call</span> <span className="profile-contact-text">{profileData?.mobile || "No Contact"}</span></li>
              </ul>

              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-outline-secondary profile-action-btn profile-btn-view" onClick={() => navigate('/MyProfile')}>
                  View Profile
                </button>
                <button className="btn btn-outline-danger profile-action-btn profile-btn-logout text-danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>

          <ul className="requi_sec">
            <li> <small>Transport Required</small> 
                <span className={`badge rounded-pill profile-status-badge ${profileData?.tptReqText === "Yes" ? "bg-success" : "bg-secondary"}`}>
                    {profileData?.tptReqText === "Yes" ? "YES" : "NO"}
                </span>
            </li>
            <li> <small>Nodal Point</small> {profileData?.landmark || "N/A"}</li>
          </ul>

          <ul className="icon_sec">
            <li><span><span className="circle"><span className="material-icons">question_answer</span></span> <a href="#!">FAQs</a></span></li>
            <li><span><span className="circle"><span className="material-icons">menu_book</span></span> <a href="#!">Help Documents</a></span></li>
            <li><span><span className="circle"><span className="material-icons">video_call</span></span> <a href="#!">Video Tutorials</a></span></li>
          </ul>

          <p className="need-assistance-subtitle ms-3">Need Assistance ?</p>
          <ul className="assistance_list ms-3">
            <li><a href="#!"> <span className="material-icons me-2 text-primary">help_outline</span> Have a question ? Ask away!</a></li>
            <li><a href="#!"><span className="material-icons me-2 text-primary">email</span> Send an email</a></li>
            <li><a href="#!"><span className="material-icons me-2 text-primary">privacy_tip</span>Privacy Policy</a></li>
            <li><a href="#!"><span className="material-icons me-2 text-primary">description</span> Terms and conditions</a></li>
          </ul>

          <ul className="helpline">
            <li> <span className="material-icons me-2 text-success">call</span> <span><small>Transport Desk</small> 1800 266 399</span></li>
            <li> <span className="material-icons me-2 text-danger">call</span> <span><small>Women Helpline No.</small> 1800 555 222</span></li>
          </ul>
        </div>
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
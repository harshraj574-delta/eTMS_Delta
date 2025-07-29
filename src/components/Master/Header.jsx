import React, { useState } from "react";
import PropTypes from 'prop-types';
import sessionManager from '../../utils/SessionManager';
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Header = ({ mainTitle, pageTitle, showAdhocButton = false, showNewButton = false, onNewButtonClick }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login"); // or "/"
  };
  // Get user data from SessionManager
  const userData = sessionManager.getUserSession();
  const employeeName = userData.empName || 'Guest';

  // Add sidebarToggle function
  const sidebarToggle = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);

    document.body.classList.toggle('sidebar-collapsed');
    const sidebar = document.querySelector('.sidebar');
    const middle = document.querySelector('.middle');

    if (sidebar) {
      sidebar.classList.toggle('collapsed');
    }

    if (middle) {
      middle.classList.toggle('expanded');
    }
  };


  return (
    <div className="header">
      <ul className="me-3 mt-2">
        {/* <li><a href="#!" onClick={sidebarToggle} className="text-dark">{sidebarToggle ? '<span className="material-icons">menu</span>' : '<span className="material-icons">add</span>'}</a></li> */}
        <li><a href="#!" onClick={sidebarToggle} className="text-dark">
          {isSidebarCollapsed ?
            <span className="material-icons">menu</span> :
            <span className="material-icons">close</span>}
        </a></li>
      </ul>
      <div className="logo"><img src="images/logo.svg" alt="" /></div>
      <div className="header-mid">

        {/* <div className={`sidebarBtn`} onClick={() => setIsActive(!isActive)}>+</div> */}
        <div className="breadcrumb-cnt">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item text1-body"><a href="#">Etms</a></li>
            <li className="breadcrumb-item text1-body active" aria-current="page">{mainTitle}</li>
          </ol>
          <span className="subtitle"><strong className="text-grey5">{pageTitle}</strong></span>
        </div>
        {showAdhocButton && (
          <button className="btn btn-primary ms-auto" data-bs-toggle="offcanvas" data-bs-target="#addAdhoc" aria-controls="addAdhoc">
            <span className="material-icons me-2">add_circle</span> add Adhoc</button>
        )}
        {showNewButton && (
          <button className="btn btn-primary ms-auto" onClick={onNewButtonClick} aria-controls="offcanvasRight">
            <span className="material-icons me-2">add_circle</span> New
          </button>
        )}
        <ul className="link-right">
          {/* <li><a href="#!"><span className="material-icons">grid_view</span></a></li> */}
          <li><a href="#!" className="company_logo"><img src="images/logo.svg" alt="" /></a></li>
          {/* <li><a href="#!" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight">
          <span className="notifications-value"><span className="material-icons">notifications</span></span>
        </a></li> */}
          <li className="dropdown">
            <a href="#!" data-bs-toggle="offcanvas" data-bs-target="#profileSidebar" aria-controls="profileSidebar">
              <img src="public\images\al1i.png" alt="" /> {employeeName}
            </a>

          </li>
          <li>
            <a href="/" onClick={handleLogout} className="text-dark">
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
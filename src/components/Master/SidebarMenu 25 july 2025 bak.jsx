import { Path } from "leaflet";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SidebarMenu = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine which menu should be active based on current path
  useEffect(() => {
    const path = location.pathname;
    // Check if current path matches any menu category
    if ([
      "/MySchedule",
      "/MyProfile",
      "/AdhocManagement",
      "/MyFeedback",
      // "/ViewMyRoutes",
      // "/dashboard",
      // "/ReplicateSchedule",
      // "/MyAdhocRequest",
    ].includes(path)) {
      setActiveMenu("etms");
    }else if([
      "/AdminSchedule",
    ].includes(path)) {
      setActiveMenu("Admin");
    } else if ([
      "/ManageEmployee",
      "/FacilityMaster",
      "/DriverMaster",
      "/VehicleMaster",
      "/VehicleTypeMaster",
      "/VendorMaster",
      "/GuardMaster",
      "/Location",
    ].includes(path)) {
      setActiveMenu("master");
    } else if ([
      "/ManageRoute",
      // "/CostMaster",
      // "/CostMasterPackage",
      // "/VendorWiseBilling",
      // "/SummaryPackageReport",
      // "/PenaltyMaster",
      // "/ComplianceCheck",
      // "/DetailedBillingReport",
      // "/EmployeeWiseBillingReport",
      "/VendorAllocation",

    ].includes(path)) {
      setActiveMenu("transport");
    } else if ([
      "/ShiftTimeMaster",
      "/SystemSetting",
    ].includes(path)) {
      setActiveMenu("Super Admin");
    } else if (
      ["/report1",
        "/report2", "/CostMaster",
        "/CostMasterPackage",
        "/VendorWiseBilling",
        "/SummaryPackageReport",
        "/PenaltyMaster",
        "/ComplianceCheck",
        "/DetailedBillingReport",
        "/EmployeeWiseBillingReport",].includes(path)
    ) {
      setActiveMenu("reports");
    }


  }, [location.pathname]);

  // Check if URL is external
  const isExternalUrl = (url) => {
    return url.startsWith("http://") || url.startsWith("https://");
  };

  const handleNavigation = (path) => {
    // Check if it's an external URL
    if (isExternalUrl(path)) {
      // Open external URL in new window
      window.open(path, "_blank", "noopener,noreferrer");
      return;
    }

    // Store the current active menu before navigation
    const currentActiveMenu = activeMenu;

    // Navigate to the new path
    navigate(path);

    // Ensure the menu stays open after navigation by restoring the active menu state
    setTimeout(() => {
      setActiveMenu(currentActiveMenu);
    }, 50);
  };

  // Toggle menu function
  const toggleMenu = (menuId) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  // ETMS menu items
  const etmsMenuItems = [
    // { path: "/dashboard", name: "Dashboard" },
    { path: "/MySchedule", name: "My Schedule" },
    { path: "/MyProfile", name: "My Profile" },
    { path: "/AdhocManagement", name: "Adhoc Management" },
    { path: "/MyFeedback", name: "My Feedback" },
    // { path: "/MyAdhocRequest", name: "My Adhoc Request" },
    // { path: "/ReplicateSchedule", name: "Replicate Schedule" },
    // { path: "/ViewMyRoutes", name: "View My Routes" },
  ];

const adminMenuItems = [
    { path: "/AdminSchedule", name: "Admin Schedule" },
  ];

  const superAdminMenuItems = [
    {
      path: "/ShiftTimeMaster", name: "Shift Time Master"
    },
    { path: "/SystemSetting", name: "System Setting" },

  ];
  // Master menu items
  const masterMenuItems = [
    // { path: "/ManageEmployee", name: "Employee Master" },
    { path: "/FacilityMaster", name: "Facility Master" },
    { path: "/DriverMaster", name: "Driver Master" },
    { path: "/VehicleMaster", name: "Vehicle Master" },
    { path: "/VehicleTypeMaster", name: "Vehicle Type Master" },
    { path: "/VendorMaster", name: "Vendor Master" },
    { path: "/GuardMaster", name: "Guard Master" },
    { path: "/Location", name: "Location" },
  ];
  // Transport menu items
  // const transpMenuItems = [
  //   { path: "/ManageRoute", name: "Manage Route" },
  //   { path: "/CostMaster", name: "Trip Rate Master" },
  //   { path: "/CostMasterPackage", name: "Cost Master Package" },
  //   { path: "/VendorWiseBilling", name: "Vendor Wise Billing" },
  //   { path: "/SummaryPackageReport", name: "Summary Package Report" },
  //   { path: "/PenaltyMaster", name: "Penalty Master" },
  //   { path: "/ComplianceCheck", name: "Compliance Check" },
  //   { path: "/DetailedBillingReport", name: "Detailed Billing Report" },
  //   {
  //     path: "/EmployeeWiseBillingReport",
  //     name: "Employee Wise Billing Report",
  //   },
  //   {
  //     path: "https://etmsonline.in/etmsaccen/RouteUploadExl.aspx",
  //     name: "Route Excel Upload",
  //   },
  //   { path: "/VendorAllocation", name: "Vendor Allocation" },

  // ];
  const transpMenuItems = [
    { path: "/ManageRoute", name: "Manage Route" },

    {
      path: "https://etmsonline.in/etmsaccen/RouteUploadExl.aspx",
      name: "Route Excel Upload",
    },
    { path: "/VendorAllocation", name: "Vendor Allocation" },
  ];

  const reportMenuItems = [
    { path: "/dashboard", name: "Dashboard" },
    { path: "/CostMaster", name: "Trip Rate Master" },
    { path: "/CostMasterPackage", name: "Cost Master Package" },
    { path: "/VendorWiseBilling", name: "Vendor Wise Billing" },
    { path: "/SummaryPackageReport", name: "Summary Package Report" },
    { path: "/PenaltyMaster", name: "Penalty Master" },
    { path: "/ComplianceCheck", name: "Compliance Check" },
    { path: "/DetailedBillingReport", name: "Detailed Billing Report" },
    { path: "/EmployeeWiseBillingReport", name: "Employee Wise Billing Report" },
  ];


  // Render menu section
  const renderMenuSection = (menuId, title, icon, menuItems) => (
    <div className="accordion-item border-0">
      <a
        href="#!"
        className={`accordion-button overline_textB ${activeMenu === menuId ? "" : "collapsed"
          }`}
        onClick={(e) => {
          e.preventDefault();
          toggleMenu(menuId);
        }}
      >
        <span className="material-icons">{icon}</span> {title}
      </a>
      <div
        className={`accordion-collapse collapse-smooth ${activeMenu === menuId ? "show" : ""
          }`}
      >
        <ul className="submenu">
          {menuItems.map((item, index) => (
            <li key={index}>
              <a
                href="#!"
                className={
                  !isExternalUrl(item.path) && location.pathname === item.path
                    ? "active"
                    : ""
                }
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Stop event from bubbling up
                  handleNavigation(item.path);
                }}
              >
                {item.name}
                {isExternalUrl(item.path) && (
                  <span className="material-icons ms-1" style={{ fontSize: "16px" }}>
                    open_in_new
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="sidebar">
      <div className="accordion mb-5" id="accordionExample">
        {renderMenuSection("etms", "My ETMS", "switch_account", etmsMenuItems)}
        {renderMenuSection("Admin", "Admin", "admin_panel_settings", adminMenuItems)}
        {renderMenuSection(
          "transport",
          "Transport",
          "directions_car",
          transpMenuItems
        )}
        {renderMenuSection("Super Admin", "Super Admin", "admin_panel_settings", superAdminMenuItems)}
        {renderMenuSection("master", "Master", "settings", masterMenuItems)}
        {renderMenuSection("reports", "Reports", "assignment", reportMenuItems)}

      </div>

      {/* Help Card */}
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

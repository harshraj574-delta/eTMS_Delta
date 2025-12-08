import React, { useEffect, useState } from "react";
import Sidebar from "./Master/SidebarMenu";
import Header from "./Master/Header";
import EmpAccessRightsService from "../services/compliance/EmpAccessRightsService";
import sessionManager from "../utils/SessionManager";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toastService } from "../services/toastService";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ToastContainer } from "react-toastify";
import Loader from "./common/Loader";
import {
  BsGrid,
  BsPersonGear,
  BsShieldCheck,
  BsGear,
  BsFileEarmarkText,
  BsPeople,
  BsClipboardData,
  BsBarChart,
  BsHouseDoor,
  BsTruck,
} from "react-icons/bs";
import "./empAccessRights.css";

// Animated Number Component
const AnimatedNumber = ({ value = 0, duration = 1 }) => {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(motionValue, Number(value) || 0, {
      duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  return <motion.span>{rounded}</motion.span>;
};

// Icon mapping for different menu types
const getMenuIcon = (menuName) => {
  const name = menuName?.toLowerCase() || "";
  if (name.includes("admin")) return BsPersonGear;
  if (name.includes("report")) return BsFileEarmarkText;
  if (name.includes("dashboard")) return BsBarChart;
  if (name.includes("transport")) return BsTruck;
  if (name.includes("compliance")) return BsShieldCheck;
  if (name.includes("employee") || name.includes("user")) return BsPeople;
  if (name.includes("master")) return BsClipboardData;
  if (name.includes("setting")) return BsGear;
  if (name.includes("home")) return BsHouseDoor;
  return BsGrid;
};

const AccessCard = ({ menu, index, hasAnimated, onMenuClick }) => {
  const shouldAnimate = !hasAnimated;
  const Icon = getMenuIcon(menu.Menu);

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-5px)";
    e.currentTarget.style.boxShadow = "0 1rem 3rem rgba(0,0,0,.175)";
    e.currentTarget.style.zIndex = "2";
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
    e.currentTarget.style.zIndex = "1";
  };

  return (
    <motion.div
      className="col"
      initial={shouldAnimate ? { opacity: 0, y: 20, scale: 0.98 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={
        shouldAnimate
          ? {
              duration: 0.5,
              delay: index * 0.08,
              ease: "easeOut",
            }
          : {}
      }
    >
      <div
        className="bg-white rounded-4 shadow-sm h-100 position-relative overflow-hidden p-3 access-stat-card-new"
        onClick={() => onMenuClick(menu)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Icon at top right */}
        <div
          className="position-absolute d-flex align-items-center justify-content-center"
          style={{
            top: "12px",
            right: "12px",
            width: "40px",
            height: "40px",
            backgroundColor: "#f5f5f5",
            borderRadius: "10px",
          }}
        >
          <Icon size={20} color="#1a1a1a" />
        </div>

        <div className="d-flex flex-column h-100 justify-content-between">
          <div>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h3 className="mb-0" style={{ paddingRight: "50px" }}>
                <strong className="fs-4 fw-bold">
                  <motion.span
                    initial={shouldAnimate ? { opacity: 0 } : false}
                    animate={shouldAnimate ? { opacity: 1 } : {}}
                    transition={
                      shouldAnimate
                        ? { duration: 0.5, delay: index * 0.08 + 0.3 }
                        : {}
                    }
                  >
                    <AnimatedNumber value={menu.TotalEmployee} duration={1.2} />
                  </motion.span>
                </strong>
              </h3>
            </div>
            <div
              className="small fw-bold text-uppercase text-muted mb-2"
              style={{
                letterSpacing: "0.5px",
                fontSize: "0.75rem",
                lineHeight: "1.3",
              }}
            >
              {menu.Menu}
            </div>
          </div>

          <div>
            <span className="badge bg-primary-subtle rounded-pill text-dark border border-primary-subtle">
              View Users
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Skeleton Card Component for loading state
const SkeletonCard = () => (
  <div className="col">
    <div
      className="bg-white rounded-4 shadow-sm h-100 p-3"
      style={{ minHeight: "140px" }}
    >
      <div className="placeholder-glow d-flex flex-column h-100">
        <div className="d-flex justify-content-between mb-2">
          <span
            className="placeholder col-4 rounded"
            style={{ height: "28px" }}
          />
          <span
            className="placeholder rounded"
            style={{ width: "40px", height: "40px" }}
          />
        </div>
        <span
          className="placeholder col-8 rounded mb-2"
          style={{ height: "12px" }}
        />
        <div className="mt-auto">
          <span
            className="placeholder col-5 rounded"
            style={{ height: "14px" }}
          />
        </div>
      </div>
    </div>
  </div>
);

const EmpAccessRights = () => {
  // State management
  const [menuAccessCounts, setMenuAccessCounts] = useState([]);
  const [mainMenus, setMainMenus] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [userRights, setUserRights] = useState([]);
  const [menuUsersDetails, setMenuUsersDetails] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState([]);

  const [hasAnimated, setHasAnimated] = useState(false);

  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [showMenuAccess, setShowMenuAccess] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [selectedMenuName, setSelectedMenuName] = useState("");

  useEffect(() => {
    fetchMenuAccessCounts();
  }, []);

  const fetchMenuAccessCounts = async () => {
    try {
      setLoading(true);
      const response = await EmpAccessRightsService.GetMenuAccessDetails({
        locationid: sessionManager.getUserSession().LocationId || 0,
      });

      if (Array.isArray(response)) {
        setMenuAccessCounts(response);
      } else if (response && typeof response === "string") {
        try {
          const parsed = JSON.parse(response);
          setMenuAccessCounts(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error("Error parsing response:", e);
          setMenuAccessCounts([]);
        }
      } else {
        setMenuAccessCounts([]);
      }

      if (!hasAnimated) {
        setHasAnimated(true);
      }
    } catch (error) {
      console.error("Error fetching menu access counts:", error);
      toastService.error("Error loading menu access data");
      setMenuAccessCounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      toastService.warn("Please enter Employee ID or Name");
      return;
    }

    try {
      setLoading(true);
      const response = await EmpAccessRightsService.EmpSearch({
        locationid: sessionManager.getUserSession().LocationId || 0,
        empidname: searchText.trim(),
        IsAdmin: sessionManager.getUserSession().ISadmin || "N",
      });

      let employeeList = [];
      if (Array.isArray(response)) {
        employeeList = response;
      } else if (response && typeof response === "string") {
        try {
          const parsed = JSON.parse(response);
          employeeList = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error("Error parsing employee response:", e);
        }
      }

      if (employeeList.length > 0) {
        setEmployees(employeeList);
        setShowEmployeeList(true);
      } else {
        toastService.info("No employees found");
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error searching employees:", error);
      toastService.error("Error searching employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeList(false);
    await loadUserRights(employee.id);
  };

  const loadUserRights = async (empId) => {
    try {
      setLoading(true);

      const menusResponse = await EmpAccessRightsService.SelectMainMenu({
        IsAdmin: sessionManager.getUserSession().ISadmin || "N",
      });

      let menusList = [];
      if (Array.isArray(menusResponse)) {
        menusList = menusResponse;
      } else if (menusResponse && typeof menusResponse === "string") {
        try {
          const parsed = JSON.parse(menusResponse);
          menusList = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error("Error parsing menus response:", e);
        }
      }
      setMainMenus(menusList);

      const rightsPromises = menusList.map((menu) =>
        EmpAccessRightsService.GetUserRights({
          empid: empId,
          menuid: menu.MenuID,
        })
      );

      const rightsResponses = await Promise.all(rightsPromises);

      let allRights = [];
      rightsResponses.forEach((response) => {
        if (Array.isArray(response)) {
          allRights = [...allRights, ...response];
        } else if (response && typeof response === "string") {
          try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
              allRights = [...allRights, ...parsed];
            }
          } catch (e) {
            console.error("Error parsing rights response:", e);
          }
        }
      });

      setUserRights(allRights);
      setShowMenuAccess(true);
    } catch (error) {
      console.error("Error loading user rights:", error);
      toastService.error("Error loading user access rights");
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = async (menu) => {
    try {
      setLoading(true);
      setSelectedMenuName(menu.Menu);
      const response = await EmpAccessRightsService.GetMenuUsersDetails({
        locationid: sessionManager.getUserSession().LocationId || 0,
        parentmenuid: menu.ParentID,
      });

      let usersList = [];
      if (Array.isArray(response)) {
        usersList = response;
      } else if (response && typeof response === "string") {
        try {
          const parsed = JSON.parse(response);
          usersList = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error("Error parsing users response:", e);
        }
      }

      setMenuUsersDetails(usersList);
      setShowUsersList(true);
    } catch (error) {
      console.error("Error loading menu users:", error);
      toastService.error("Error loading users list");
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleParentCheckChange = (menuId, checked) => {
    const subMenus = userRights.filter((right) => right.ParentID === menuId);
    const updatedRights = userRights.map((right) => {
      if (subMenus.some((sub) => sub.MenuID === right.MenuID)) {
        return { ...right, checked: checked ? 1 : 0 };
      }
      return right;
    });
    setUserRights(updatedRights);
  };

  const handleSubMenuCheckChange = (menuId, checked) => {
    const updatedRights = userRights.map((right) =>
      right.MenuID === menuId ? { ...right, checked: checked ? 1 : 0 } : right
    );
    setUserRights(updatedRights);
  };

  const handleSave = async () => {
    if (!selectedEmployee) {
      toastService.warn("No employee selected");
      return;
    }

    try {
      setLoading(true);

      const checkedMenus = userRights.filter((right) => right.checked === 1);
      let xmlData = "<root>";
      checkedMenus.forEach((menu) => {
        xmlData += `<subMenu><subMenuId>${menu.MenuID}</subMenuId></subMenu>`;
      });
      xmlData += "</root>";

      await EmpAccessRightsService.SetUserRights({
        empid: selectedEmployee.id,
        submenuid: xmlData,
        userid: sessionManager.getUserSession().Userid,
      });

      toastService.success("Access rights saved successfully");
      setShowMenuAccess(false);
      setSelectedEmployee(null);
      setUserRights([]);
      await fetchMenuAccessCounts();
    } catch (error) {
      console.error("Error saving user rights:", error);
      toastService.error("Error saving access rights");
    } finally {
      setLoading(false);
    }
  };

  const getOffcanvasWidth = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 576) return "95%";
      if (window.innerWidth < 768) return "85%";
      if (window.innerWidth < 1024) return "70%";
      return "50%";
    }
    return "50%";
  };

  const [offcanvasWidth, setOffcanvasWidth] = useState(getOffcanvasWidth());

  useEffect(() => {
    const handleResize = () => setOffcanvasWidth(getOffcanvasWidth());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const anyOffcanvasOpen = showEmployeeList || showMenuAccess || showUsersList;

  const closeAllOffcanvas = () => {
    setShowEmployeeList(false);
    setShowMenuAccess(false);
    setShowUsersList(false);
  };

  const isParentMenuChecked = (menuId) => {
    const subMenus = userRights.filter((right) => right.ParentID === menuId);
    return subMenus.length > 0 && subMenus.every((sub) => sub.checked === 1);
  };

  const isParentMenuIndeterminate = (menuId) => {
    const subMenus = userRights.filter((right) => right.ParentID === menuId);
    const checkedCount = subMenus.filter((sub) => sub.checked === 1).length;
    return checkedCount > 0 && checkedCount < subMenus.length;
  };

  return (
    <div className="container-fluid p-0 emp-access-rights-wrapper">
      <Header pageTitle="Manage User Access Rights" />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <Loader
        isVisible={loading && !menuAccessCounts.length}
        fullScreen={true}
      />

      <div className="middle">
        {/* Summary Cards - Fixed with proper padding for hover effect */}
        <div
          className="emp-access-stats-container"
          style={{ paddingTop: "10px", position: "relative", zIndex: 1 }}
        >
          {loading && !menuAccessCounts.length ? (
            <div
              className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-5"
              style={{ paddingTop: "8px" }}
            >
              {[...Array(10)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : Array.isArray(menuAccessCounts) && menuAccessCounts.length > 0 ? (
            <div
              className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-5"
              style={{ paddingTop: "8px" }}
            >
              {menuAccessCounts.map((menu, index) => (
                <AccessCard
                  key={menu.ParentID || index}
                  menu={menu}
                  index={index}
                  hasAnimated={hasAnimated}
                  onMenuClick={handleMenuClick}
                />
              ))}
            </div>
          ) : (
            <div className="row">
              <div className="col-12">
                <div className="alert alert-info">No data available</div>
              </div>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card_tb">
              <div className="p-3">
                <div className="row align-items-end g-3">
                  <div className="col-md-4">
                    <label className="form-label mb-2">
                      Enter Employee ID or Name
                    </label>
                  </div>
                  <div className="col-md-5">
                    <InputText
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Search by ID or Name"
                      className="w-100"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                    />
                  </div>
                  <div className="col-md-3">
                    <Button
                      label="Search"
                      icon="pi pi-search"
                      onClick={handleSearch}
                      loading={loading}
                      className="w-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List Offcanvas */}
      <div
        className={`offcanvas offcanvas-end${showEmployeeList ? " show" : ""}`}
        tabIndex="-1"
        style={{ width: offcanvasWidth, maxWidth: "100%" }}
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Select Employee</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowEmployeeList(false)}
          ></button>
        </div>
        <div className="offcanvas-body p-0">
          <DataTable
            value={employees}
            loading={loading}
            responsiveLayout="scroll"
            className="emp-access-table"
            paginator
            rows={50}
            emptyMessage="No employees found"
          >
            <Column
              field="empCode"
              header="Employee ID"
              style={{ width: "120px" }}
            />
            <Column
              field="empName"
              header="Employee Name"
              body={(rowData) => (
                <a
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEmployeeSelect(rowData);
                  }}
                  className="text-primary"
                >
                  {rowData.empName}
                </a>
              )}
            />
            <Column field="processName" header="Process" />
            <Column field="facilityName" header="Facility" />
            <Column field="email" header="Email" />
          </DataTable>
        </div>
      </div>

      {/* Menu Access Rights Offcanvas */}
      <div
        className={`offcanvas offcanvas-end${showMenuAccess ? " show" : ""}`}
        tabIndex="-1"
        style={{ width: offcanvasWidth, maxWidth: "100%" }}
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">
            Edit Access Rights for {selectedEmployee?.empName}
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowMenuAccess(false)}
          ></button>
        </div>
        <div className="offcanvas-body p-0">
          <div className="table-responsive">
            <table className="menu-access-table">
              <tbody>
                {Array.isArray(mainMenus) && mainMenus.length > 0 ? (
                  mainMenus.map((menu) => {
                    const subMenus = userRights.filter(
                      (right) => right.ParentID === menu.MenuID
                    );
                    const isExpanded = expandedMenus.includes(menu.MenuID);
                    const isChecked = isParentMenuChecked(menu.MenuID);
                    const isIndeterminate =
                      isParentMenuIndeterminate(menu.MenuID);

                    return (
                      <React.Fragment key={menu.MenuID}>
                        <tr
                          className={`menu-parent-row ${
                            isExpanded ? "expanded" : ""
                          }`}
                        >
                          <td className="icon-cell">
                            <a
                              href="#!"
                              onClick={(e) => {
                                e.preventDefault();
                                toggleMenu(menu.MenuID);
                              }}
                            >
                              <span
                                className={`material-icons menu-toggle-icon ${
                                  isExpanded ? "expanded" : ""
                                }`}
                                style={{ fontSize: "20px" }}
                              >
                                {isExpanded ? "expand_less" : "expand_more"}
                              </span>
                            </a>
                          </td>
                          <td className="checkbox-cell">
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) =>
                                handleParentCheckChange(menu.MenuID, e.checked)
                              }
                              className={
                                isIndeterminate
                                  ? "p-checkbox-indeterminate"
                                  : ""
                              }
                            />
                          </td>
                          <td>
                            <span className="menu-parent-text">
                              {menu.Text}
                            </span>
                          </td>
                        </tr>

                        {isExpanded && subMenus.length > 0 && (
                          <tr className="submenu-row show">
                            <td colSpan="3">
                              <div className="submenu-container">
                                <table className="submenu-table">
                                  <thead>
                                    <tr>
                                      <th>Select</th>
                                      <th>Menu Item</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {subMenus.map((subMenu) => (
                                      <tr key={subMenu.MenuID}>
                                        <td>
                                          <Checkbox
                                            checked={subMenu.checked === 1}
                                            onChange={(e) =>
                                              handleSubMenuCheckChange(
                                                subMenu.MenuID,
                                                e.checked
                                              )
                                            }
                                          />
                                        </td>
                                        <td>{subMenu.Text}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center p-3">
                      No menu access rights found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="offcanvas-footer">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowMenuAccess(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-success btn-sm"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Users List Offcanvas */}
      <div
        className={`offcanvas offcanvas-end${showUsersList ? " show" : ""}`}
        tabIndex="-1"
        style={{ width: offcanvasWidth, maxWidth: "100%" }}
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">
            Users with Access to {selectedMenuName}
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowUsersList(false)}
          ></button>
        </div>
        <div className="offcanvas-body p-0">
          <DataTable
            value={menuUsersDetails}
            loading={loading}
            responsiveLayout="scroll"
            className="emp-access-table"
            paginator
            rows={50}
            emptyMessage="No users found with this access"
          >
            <Column
              field="empCode"
              header="Employee ID"
              style={{ width: "120px" }}
            />
            <Column field="empName" header="Employee Name" />
            <Column field="processName" header="Process" />
            <Column field="facilityName" header="Facility" />
          </DataTable>
        </div>
      </div>

      {anyOffcanvasOpen && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={closeAllOffcanvas}
        ></div>
      )}

      <style>{`
        /* Offcanvas Footer */
        .offcanvas-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.75rem;
          height: auto;
        }

        .offcanvas-footer .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          min-width: 85px;
          height: 38px;
          padding: 0.4rem 0.75rem !important;
          font-size: 0.85rem !important;
          vertical-align: middle;
          line-height: 1;
          transition: all 0.3s ease !important;
        }

        /* Cancel Button Styling */
        .offcanvas-footer .btn-outline-secondary {
          border: 1px solid #d1d5db !important;
          color: #4b5563 !important;
          background-color: white !important;
        }

        .offcanvas-footer .btn-outline-secondary:hover {
          background-color: #1f2937 !important;
          border-color: #1f2937 !important;
          color: white !important;
        }

        /* Save Button Styling */
        .offcanvas-footer .btn-success {
          background-color: #22c55e !important;
          border-color: #22c55e !important;
          color: white !important;
        }

        .offcanvas-footer .btn-success:hover {
          background-color: #16a34a !important;
          border-color: #16a34a !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default EmpAccessRights;
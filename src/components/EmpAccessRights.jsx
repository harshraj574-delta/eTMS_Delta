import React, { useEffect, useState, useMemo, useRef } from "react";
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
import { Calendar } from "primereact/calendar";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import Loader from "./common/Loader";
import TabSwitcher from "./common/TabSwitcher";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import TableToolbar from "./common/TableToolbar";
import ReportButton from "./common/ReportButton";
import calendarIcon from "../assets/calendar.png";
import {
  BsGrid, BsPersonGear, BsShieldCheck, BsGear, BsFileEarmarkText,
  BsPeople, BsClipboardData, BsBarChart, BsHouseDoor, BsTruck,
} from "react-icons/bs";
import "./empAccessRights.css";

const TABS = [
  { label: "Manage Access", value: "manage" },
  { label: "Copy Access", value: "copy" },
  { label: "Access Log", value: "log" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultLogFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
};

// Animated Number Component
const AnimatedNumber = ({ value = 0, duration = 1 }) => {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) =>
    Math.round(latest).toLocaleString()
  );
  useEffect(() => {
    const controls = animate(motionValue, Number(value) || 0, { duration, ease: "easeOut" });
    return controls.stop;
  }, [value, duration, motionValue]);
  return <motion.span>{rounded}</motion.span>;
};

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
      transition={shouldAnimate ? { duration: 0.5, delay: index * 0.08, ease: "easeOut" } : {}}
    >
      <div
        className="bg-white rounded-4 shadow-sm h-100 position-relative overflow-hidden p-3 access-stat-card-new"
        onClick={() => onMenuClick(menu)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="position-absolute d-flex align-items-center justify-content-center"
          style={{ top: "12px", right: "12px", width: "40px", height: "40px", backgroundColor: "#f5f5f5", borderRadius: "10px" }}>
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
                    transition={shouldAnimate ? { duration: 0.5, delay: index * 0.08 + 0.3 } : {}}
                  >
                    <AnimatedNumber value={menu.TotalEmployee} duration={1.2} />
                  </motion.span>
                </strong>
              </h3>
            </div>
            <div className="small fw-bold text-uppercase text-muted mb-2"
              style={{ letterSpacing: "0.5px", fontSize: "0.75rem", lineHeight: "1.3" }}>
              {menu.Menu}
            </div>
          </div>
          <div>
            <span className="badge bg-primary-subtle rounded-pill text-dark border border-primary-subtle">View Users</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SkeletonCard = () => (
  <div className="col">
    <div className="bg-white rounded-4 shadow-sm h-100 p-3" style={{ minHeight: "140px" }}>
      <div className="placeholder-glow d-flex flex-column h-100">
        <div className="d-flex justify-content-between mb-2">
          <span className="placeholder col-4 rounded" style={{ height: "28px" }} />
          <span className="placeholder rounded" style={{ width: "40px", height: "40px" }} />
        </div>
        <span className="placeholder col-8 rounded mb-2" style={{ height: "12px" }} />
        <div className="mt-auto">
          <span className="placeholder col-5 rounded" style={{ height: "14px" }} />
        </div>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const EmpAccessRights = () => {
  // Tab
  const [activeTab, setActiveTab] = useState("manage");

  // Manage Access state
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

  // Copy Access state
  const [copyFromSearch, setCopyFromSearch] = useState("");
  const [copyToSearch, setCopyToSearch] = useState("");
  const [copyFromEmp, setCopyFromEmp] = useState(null);
  const [copyToEmp, setCopyToEmp] = useState(null);
  const [showCopyEmpList, setShowCopyEmpList] = useState(false);
  const copyEmpTargetRef = useRef("from");
  const [copyEmployees, setCopyEmployees] = useState([]);
  const [copyLoading, setCopyLoading] = useState(false);

  // Access Log state
  const [logEmpSearch, setLogEmpSearch] = useState("");
  const [logSelectedEmployee, setLogSelectedEmployee] = useState(null);
  const [logEmployees, setLogEmployees] = useState([]);
  const [showLogEmployeeList, setShowLogEmployeeList] = useState(false);
  const [logFromDate, setLogFromDate] = useState(defaultLogFrom);
  const [logToDate, setLogToDate] = useState(() => new Date());
  const logFromDateRef = useRef(logFromDate);
  const logToDateRef = useRef(logToDate);
  const [logResults, setLogResults] = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  // Log table controls
  const [logTableSearch, setLogTableSearch] = useState("");
  const [logFirst, setLogFirst] = useState(0);
  const [logRows, setLogRows] = useState(50);

  useEffect(() => { logFromDateRef.current = logFromDate; }, [logFromDate]);
  useEffect(() => { logToDateRef.current = logToDate; }, [logToDate]);

  useEffect(() => {
    fetchMenuAccessCounts();
  }, []);

  // ── Manage Access handlers ──────────────────────────────────────────────────

  const fetchMenuAccessCounts = async () => {
    try {
      setLoading(true);
      const response = await EmpAccessRightsService.GetMenuAccessDetails({
        locationid: sessionManager.getUserSession().LocationId || 0,
      });
      if (Array.isArray(response)) {
        setMenuAccessCounts(response);
      } else if (response && typeof response === "string") {
        try { setMenuAccessCounts(Array.isArray(JSON.parse(response)) ? JSON.parse(response) : []); }
        catch { setMenuAccessCounts([]); }
      } else {
        setMenuAccessCounts([]);
      }
      if (!hasAnimated) setHasAnimated(true);
    } catch {
      toastService.error("Error loading menu access data");
      setMenuAccessCounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) { toastService.warn("Please enter Employee ID or Name"); return; }
    try {
      setLoading(true);
      const response = await EmpAccessRightsService.EmpSearch({
        locationid: sessionManager.getUserSession().LocationId || 0,
        empidname: searchText.trim(),
        IsAdmin: sessionManager.getUserSession().ISadmin || "N",
      });
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (response && typeof response === "string") {
        try { const p = JSON.parse(response); list = Array.isArray(p) ? p : []; } catch {}
      }
      if (list.length > 0) { setEmployees(list); setShowEmployeeList(true); }
      else { toastService.info("No employees found"); setEmployees([]); }
    } catch { toastService.error("Error searching employees"); setEmployees([]); }
    finally { setLoading(false); }
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
      if (Array.isArray(menusResponse)) menusList = menusResponse;
      else if (menusResponse && typeof menusResponse === "string") {
        try { const p = JSON.parse(menusResponse); menusList = Array.isArray(p) ? p : []; } catch {}
      }
      setMainMenus(menusList);

      const rightsResponses = await Promise.all(
        menusList.map((menu) => EmpAccessRightsService.GetUserRights({ empid: empId, menuid: menu.MenuID }))
      );
      let allRights = [];
      rightsResponses.forEach((response) => {
        if (Array.isArray(response)) allRights = [...allRights, ...response];
        else if (response && typeof response === "string") {
          try { const p = JSON.parse(response); if (Array.isArray(p)) allRights = [...allRights, ...p]; } catch {}
        }
      });
      setUserRights(allRights);
      setShowMenuAccess(true);
    } catch { toastService.error("Error loading user access rights"); }
    finally { setLoading(false); }
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
      if (Array.isArray(response)) usersList = response;
      else if (response && typeof response === "string") {
        try { const p = JSON.parse(response); usersList = Array.isArray(p) ? p : []; } catch {}
      }
      setMenuUsersDetails(usersList);
      setShowUsersList(true);
    } catch { toastService.error("Error loading users list"); }
    finally { setLoading(false); }
  };

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleParentCheckChange = (menuId, checked) => {
    const subMenus = userRights.filter((right) => right.ParentID === menuId);
    setUserRights(userRights.map((right) =>
      subMenus.some((sub) => sub.MenuID === right.MenuID)
        ? { ...right, checked: checked ? 1 : 0 } : right
    ));
  };

  const handleSubMenuCheckChange = (menuId, checked) => {
    setUserRights(userRights.map((right) =>
      right.MenuID === menuId ? { ...right, checked: checked ? 1 : 0 } : right
    ));
  };

  const handleSave = async () => {
    if (!selectedEmployee) { toastService.warn("No employee selected"); return; }
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
        userid: sessionManager.getUserSession().ID,
      });
      toastService.success("Access rights saved successfully");
      setShowMenuAccess(false);
      setSelectedEmployee(null);
      setUserRights([]);
      await fetchMenuAccessCounts();
    } catch { toastService.error("Error saving access rights"); }
    finally { setLoading(false); }
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

  // ── Copy Access handlers ────────────────────────────────────────────────────

  const handleCopyEmpSearch = async (target) => {
    const searchVal = target === "from" ? copyFromSearch : copyToSearch;
    if (!searchVal.trim()) { toastService.warn("Please enter Employee ID or Name"); return; }
    try {
      setLoading(true);
      const response = await EmpAccessRightsService.EmpSearch({
        locationid: sessionManager.getUserSession().LocationId || 0,
        empidname: searchVal.trim(),
        IsAdmin: sessionManager.getUserSession().ISadmin || "N",
      });
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (response && typeof response === "string") {
        try { const p = JSON.parse(response); list = Array.isArray(p) ? p : []; } catch {}
      }
      if (list.length > 0) { copyEmpTargetRef.current = target; setCopyEmployees(list); setShowCopyEmpList(true); }
      else toastService.info("No employees found");
    } catch { toastService.error("Error searching employees"); }
    finally { setLoading(false); }
  };

  const handleCopyEmpSelect = (employee) => {
    if (copyEmpTargetRef.current === "from") {
      setCopyFromEmp(employee);
      setCopyFromSearch(employee.empCode);
    } else {
      setCopyToEmp(employee);
      setCopyToSearch(employee.empCode);
    }
    setShowCopyEmpList(false);
  };

  const handleCopyAccess = async () => {
    if (!copyFromEmp || !copyToEmp) { toastService.warn("Please select both source and target employees"); return; }
    try {
      setCopyLoading(true);
      const response = await EmpAccessRightsService.CopyAccess({
        FromEmpId: copyFromEmp.id,
        ToEmpId: copyToEmp.id,
      });
      let result = response;
      if (typeof response === "string") {
        try { result = JSON.parse(response); } catch { result = []; }
      }
      const first = Array.isArray(result) ? result[0] : result;
      if (first?.Status === 1) {
        toastService.success(first.Message || "Access rights copied successfully");
        setCopyFromEmp(null);
        setCopyToEmp(null);
        setCopyFromSearch("");
        setCopyToSearch("");
        await fetchMenuAccessCounts();
      } else {
        toastService.error(first?.Message || "Failed to copy access rights");
      }
    } catch { toastService.error("Error copying access rights"); }
    finally { setCopyLoading(false); }
  };

  // ── Access Log handlers ─────────────────────────────────────────────────────

  const handleLogEmpSearch = async () => {
    if (!logEmpSearch.trim()) { toastService.warn("Please enter Employee ID or Name"); return; }
    try {
      setLogLoading(true);
      const response = await EmpAccessRightsService.EmpSearch({
        locationid: 0,
        empidname: logEmpSearch.trim(),
        IsAdmin: sessionManager.getUserSession().ISadmin || "N",
      });
      let list = [];
      if (Array.isArray(response)) list = response;
      else if (response && typeof response === "string") {
        try { const p = JSON.parse(response); list = Array.isArray(p) ? p : []; } catch {}
      }
      if (list.length > 0) { setLogEmployees(list); setShowLogEmployeeList(true); }
      else toastService.info("No employees found");
    } catch { toastService.error("Error searching employees"); }
    finally { setLogLoading(false); }
  };

  const fetchLogForEmployee = async (emp, fromDate, toDate) => {
    if (!fromDate || !toDate) { toastService.warn("Please select both From and To dates"); return; }
    try {
      setLogLoading(true);
      setLogResults([]);
      setLogFirst(0);
      setLogTableSearch("");
      const fmt = (d) => d.toISOString().split("T")[0];
      const response = await EmpAccessRightsService.GetUserRightLogEmpWise({
        SDate: fmt(fromDate),
        EDate: fmt(toDate),
        FacilityId: 0,
        Empid: emp.id,
      });
      let results = [];
      if (Array.isArray(response)) results = response;
      else if (response && typeof response === "string") {
        try { const p = JSON.parse(response); results = Array.isArray(p) ? p : []; } catch {}
      }
      setLogResults(results);
      if (results.length === 0) toastService.info("No log entries found for the selected criteria");
    } catch { toastService.error("Error fetching access log"); }
    finally { setLogLoading(false); }
  };

  const handleLogEmployeeSelect = async (emp) => {
    setLogSelectedEmployee(emp);
    setLogEmpSearch(emp.empCode);
    setShowLogEmployeeList(false);
    await fetchLogForEmployee(emp, logFromDateRef.current, logToDateRef.current);
  };

  const handleLogRefresh = async () => {
    if (!logSelectedEmployee) { toastService.warn("Please select an employee first"); return; }
    await fetchLogForEmployee(logSelectedEmployee, logFromDate, logToDate);
  };

  const handleDownloadCsv = () => {
    if (!logResults.length) { toastService.warn("No data to download"); return; }
    const headers = ["ID", "Employee ID", "Employee Name", "Module", "Status", "Updated By", "Updated At"];
    const rows = logResults.map((r) =>
      [r.Id, r.EmployeeID, r.EmployeeName, r.ModuleName, r.Status, r.UpdatedBy,
        new Date(r.UpdatedAt).toLocaleString()]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access_log_${logSelectedEmployee?.empCode || "employee"}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Log table – filtered + paginated
  const filteredLogResults = useMemo(() => {
    if (!logTableSearch.trim()) return logResults;
    const q = logTableSearch.toLowerCase();
    return logResults.filter((r) =>
      [r.EmployeeID, r.EmployeeName, r.ModuleName, r.Status, r.UpdatedBy]
        .some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [logResults, logTableSearch]);

  const displayedLogResults = filteredLogResults.slice(logFirst, logFirst + logRows);

  const statusBadge = (status) => {
    const isGrant = status?.toLowerCase().includes("grant");
    return (
      <div style={{
        minWidth: "93.6px",
        width: "fit-content",
        height: "26px",
        borderRadius: "22.5px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFFFFF",
        fontWeight: "500",
        fontSize: "12px",
        textTransform: "capitalize",
        padding: "0 10px",
        margin: "0",
        whiteSpace: "nowrap",
        background: isGrant ? "#0BAA60" : "#F03D3D",
      }}>
        {status || "—"}
      </div>
    );
  };

  // ── Offcanvas helpers ───────────────────────────────────────────────────────

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

  const anyOffcanvasOpen = showEmployeeList || showMenuAccess || showUsersList || showLogEmployeeList || showCopyEmpList;

  const closeAllOffcanvas = () => {
    setShowEmployeeList(false);
    setShowMenuAccess(false);
    setShowUsersList(false);
    setShowLogEmployeeList(false);
    setShowCopyEmpList(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="container-fluid p-0 emp-access-rights-wrapper">
      <Header pageTitle="Manage User Access Rights" />
      <Sidebar />
      <Loader isVisible={(loading && !menuAccessCounts.length) || logLoading} fullScreen={true} />

      <div className="middle">

        {/* Tab switcher */}
        <div className="mb-3">
          <TabSwitcher
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(t) => {
              setActiveTab(t);
              setLogResults([]);
              setLogTableSearch("");
              setLogEmpSearch("");
              setLogSelectedEmployee(null);
              setLogEmployees([]);
              setLogFromDate(defaultLogFrom());
              setLogToDate(new Date());
              setLogFirst(0);
              setCopyFromEmp(null);
              setCopyToEmp(null);
              setCopyFromSearch("");
              setCopyToSearch("");
            }}
            size="medium"
          />
        </div>

        {/* ── Tab: Manage Access ── */}
        {activeTab === "manage" && (
          <>
            <div className="emp-access-stats-container" style={{ paddingTop: "10px", position: "relative", zIndex: 1 }}>
              {loading && !menuAccessCounts.length ? (
                <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-5" style={{ paddingTop: "8px" }}>
                  {[...Array(10)].map((_, index) => <SkeletonCard key={index} />)}
                </div>
              ) : Array.isArray(menuAccessCounts) && menuAccessCounts.length > 0 ? (
                <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-5" style={{ paddingTop: "8px" }}>
                  {menuAccessCounts.map((menu, index) => (
                    <AccessCard key={menu.ParentID || index} menu={menu} index={index} hasAnimated={hasAnimated} onMenuClick={handleMenuClick} />
                  ))}
                </div>
              ) : (
                <div className="row"><div className="col-12"><div className="alert alert-info">No data available</div></div></div>
              )}
            </div>

            <div className="row mt-4">
              <div className="col-12">
                <div className="card_tb">
                  <div className="p-3">
                    <div className="row align-items-end g-3">
                      <div className="col-md-4">
                        <label className="form-label mb-2">Enter Employee ID or Name</label>
                      </div>
                      <div className="col-md-5">
                        <InputText
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="Search by ID or Name"
                          className="w-100"
                          onKeyPress={(e) => { if (e.key === "Enter") handleSearch(); }}
                        />
                      </div>
                      <div className="col-md-3">
                        <style>{`
                          .search-btn { background-color: #1C1D20 !important; border-color: #1C1D20 !important; transition: background-color 0.3s, border-color 0.3s; }
                          .search-btn:hover { background-color: #0d6efd !important; border-color: #0d6efd !important; }
                        `}</style>
                        <Button label="Search" onClick={handleSearch} loading={loading} className="w-100 btn btn-primary search-btn" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </>
        )}

        {/* ── Tab: Copy Access ── */}
        {activeTab === "copy" && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card_tb">
                <div className="p-3">
                  <div className="row align-items-end g-3">
                    <div className="col-md-4">
                      <label className="form-label mb-1">Copy From</label>
                      <InputText
                        value={copyFromSearch}
                        onChange={(e) => { setCopyFromSearch(e.target.value); if (!e.target.value) setCopyFromEmp(null); }}
                        placeholder="Search source employee"
                        className="w-100"
                        onKeyPress={(e) => { if (e.key === "Enter") handleCopyEmpSearch("from"); }}
                      />
                    </div>
                    <div className="col-md-2">
                      <ReportButton label="Search" onClick={() => handleCopyEmpSearch("from")} disabled={loading} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label mb-1">Copy To</label>
                      <InputText
                        value={copyToSearch}
                        onChange={(e) => { setCopyToSearch(e.target.value); if (!e.target.value) setCopyToEmp(null); }}
                        placeholder="Search target employee"
                        className="w-100"
                        onKeyPress={(e) => { if (e.key === "Enter") handleCopyEmpSearch("to"); }}
                      />
                    </div>
                    <div className="col-md-2">
                      <ReportButton label="Search" onClick={() => handleCopyEmpSearch("to")} disabled={loading} />
                    </div>
                  </div>

                  {(copyFromEmp || copyToEmp) && (
                    <div className="row mt-4 align-items-center g-2">
                      <div className="col-auto d-flex align-items-center gap-3" style={{ fontSize: "0.875rem" }}>
                        <span className={`badge px-3 py-2 border rounded-3 ${copyFromEmp ? "bg-primary-subtle border-primary-subtle text-dark" : "bg-light border-secondary text-muted"}`}>
                          {copyFromEmp ? `${copyFromEmp.empName} (${copyFromEmp.empCode})` : "Source not selected"}
                        </span>
                        <span className="material-icons" style={{ fontSize: "20px", color: "#6b7280" }}>arrow_forward</span>
                        <span className={`badge px-3 py-2 border rounded-3 ${copyToEmp ? "bg-success-subtle border-success-subtle text-dark" : "bg-light border-secondary text-muted"}`}>
                          {copyToEmp ? `${copyToEmp.empName} (${copyToEmp.empCode})` : "Target not selected"}
                        </span>
                      </div>
                      <div className="col-auto ms-auto">
                        <Button
                          label={copyLoading ? "Copying..." : "Copy Access"}
                          onClick={handleCopyAccess}
                          disabled={!copyFromEmp || !copyToEmp || copyLoading}
                          className="btn btn-success"
                          style={{ backgroundColor: "#22c55e", borderColor: "#22c55e", minWidth: "140px" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Access Log ── */}
        {activeTab === "log" && (
          <>
            <style>{`
              .custom-calendar-wrapper { position: relative; width: 100%; }
              .custom-calendar-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; z-index: 2; pointer-events: none; }
              .custom-calendar-input .p-inputtext { padding-left: 35px !important; }
            `}</style>

            {/* Filter row */}
            <div className="card_tb p-3 mb-3">
              <div className="row g-3 align-items-end">

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Employee</label>
                  <div className="input-group">
                    <InputText
                      value={logEmpSearch}
                      onChange={(e) => { setLogEmpSearch(e.target.value); if (!e.target.value) setLogSelectedEmployee(null); }}
                      placeholder="Type ID or Name then click Search"
                      className="w-100"
                      onKeyPress={(e) => { if (e.key === "Enter") handleLogEmpSearch(); }}
                    />
                  </div>
                </div>

                <div className="col-12 col-md-2">
                  <label className="form-label fw-semibold">From Date</label>
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                    <Calendar
                      value={logFromDate}
                      onChange={(e) => setLogFromDate(e.value)}
                      dateFormat="mm/dd/yy"
                      className="w-100 custom-calendar-input"
                      appendTo={document.body}
                      placeholder="Select date"
                    />
                  </div>
                </div>

                <div className="col-12 col-md-2">
                  <label className="form-label fw-semibold">To Date</label>
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                    <Calendar
                      value={logToDate}
                      onChange={(e) => setLogToDate(e.value)}
                      dateFormat="mm/dd/yy"
                      className="w-100 custom-calendar-input"
                      appendTo={document.body}
                      placeholder="Select date"
                    />
                  </div>
                </div>

                <div className="col-12 col-md-2">
                  <ReportButton
                    label="Find Employee"
                    onClick={handleLogEmpSearch}
                    disabled={logLoading}
                  />
                </div>

              </div>
            </div>

            {/* Results */}
            {logResults.length > 0 ? (
              <div className="card_tb p-3">
                <TableToolbar
                  search={logTableSearch}
                  onSearch={(e) => { setLogTableSearch(e.target.value); setLogFirst(0); }}
                  onRefresh={handleLogRefresh}
                  onExport={handleDownloadCsv}
                  showFilter={false}
                  showSearch={true}
                  showRefresh={true}
                  showExport={true}
                />

                <CustomDataTable
                  value={displayedLogResults}
                  responsiveLayout="scroll"
                  emptyMessage="No entries match the search"
                >
                  <Column field="EmployeeID" header="Employee ID" style={{ width: "110px" }} sortable />
                  <Column field="EmployeeName" header="Name" sortable />
                  <Column field="ModuleName" header="Module" sortable />
                  <Column field="Status" header="Status" body={(r) => statusBadge(r.Status)} sortable />
                  <Column field="UpdatedBy" header="Updated By" sortable />
                  <Column
                    field="UpdatedAt"
                    header="Updated At"
                    body={(r) => new Date(r.UpdatedAt).toLocaleString()}
                    sortable
                  />
                </CustomDataTable>

                <CustomPaginator
                  first={logFirst}
                  rows={logRows}
                  totalRecords={filteredLogResults.length}
                  onPageChange={(e) => { setLogFirst(e.first); setLogRows(e.rows); }}
                  rowsPerPageOptions={[10, 20, 50]}
                />
              </div>
            ) : !logLoading && (
              <div className="card_tb d-flex flex-column align-items-center justify-content-center py-5" style={{ minHeight: 260 }}>
                <i className="pi pi-history text-muted mb-3" style={{ fontSize: "2.5rem" }} />
                <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                  Search for an employee and click their name to load access history.
                </p>
              </div>
            )}
          </>
        )}

      </div>

      {/* ── Employee List Offcanvas (Manage Access) ── */}
      <div className={`offcanvas offcanvas-end${showEmployeeList ? " show" : ""}`} tabIndex="-1" style={{ width: offcanvasWidth, maxWidth: "100%" }}>
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Select Employee</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowEmployeeList(false)}></button>
        </div>
        <div className="offcanvas-body p-0">
          <DataTable value={employees} loading={loading} responsiveLayout="scroll" className="emp-access-table" paginator rows={50} emptyMessage="No employees found">
            <Column field="empCode" header="Employee ID" style={{ width: "120px" }} />
            <Column field="empName" header="Employee Name" body={(rowData) => (
              <a href="#!" onClick={(e) => { e.preventDefault(); handleEmployeeSelect(rowData); }} className="text-primary">{rowData.empName}</a>
            )} />
            <Column field="processName" header="Process" />
            <Column field="facilityName" header="Facility" />
            <Column field="email" header="Email" />
          </DataTable>
        </div>
      </div>

      {/* ── Menu Access Rights Offcanvas ── */}
      <div className={`offcanvas offcanvas-end${showMenuAccess ? " show" : ""}`} tabIndex="-1" style={{ width: offcanvasWidth, maxWidth: "100%" }}>
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Edit Access Rights for {selectedEmployee?.empName}</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowMenuAccess(false)}></button>
        </div>
        <div className="offcanvas-body p-0">
          <div className="table-responsive">
            <table className="menu-access-table">
              <tbody>
                {Array.isArray(mainMenus) && mainMenus.length > 0 ? (
                  mainMenus.map((menu) => {
                    const subMenus = userRights.filter((right) => right.ParentID === menu.MenuID);
                    const isExpanded = expandedMenus.includes(menu.MenuID);
                    const isChecked = isParentMenuChecked(menu.MenuID);
                    const isIndeterminate = isParentMenuIndeterminate(menu.MenuID);
                    return (
                      <React.Fragment key={menu.MenuID}>
                        <tr className={`menu-parent-row ${isExpanded ? "expanded" : ""}`}>
                          <td className="icon-cell">
                            <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu(menu.MenuID); }}>
                              <span className={`material-icons menu-toggle-icon ${isExpanded ? "expanded" : ""}`} style={{ fontSize: "20px" }}>
                                {isExpanded ? "expand_less" : "expand_more"}
                              </span>
                            </a>
                          </td>
                          <td className="checkbox-cell">
                            <Checkbox checked={isChecked} onChange={(e) => handleParentCheckChange(menu.MenuID, e.checked)}
                              className={isIndeterminate ? "p-checkbox-indeterminate" : ""} />
                          </td>
                          <td><span className="menu-parent-text">{menu.Text}</span></td>
                        </tr>
                        {isExpanded && subMenus.length > 0 && (
                          <tr className="submenu-row show">
                            <td colSpan="3">
                              <div className="submenu-container">
                                <table className="submenu-table">
                                  <thead><tr><th>Select</th><th>Menu Item</th></tr></thead>
                                  <tbody>
                                    {subMenus.map((subMenu) => (
                                      <tr key={subMenu.MenuID}>
                                        <td><Checkbox checked={subMenu.checked === 1} onChange={(e) => handleSubMenuCheckChange(subMenu.MenuID, e.checked)} /></td>
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
                  <tr><td colSpan="3" className="text-center p-3">No menu access rights found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="offcanvas-footer">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowMenuAccess(false)}>Cancel</button>
          <button type="button" className="btn btn-success btn-sm" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* ── Users List Offcanvas ── */}
      <div className={`offcanvas offcanvas-end${showUsersList ? " show" : ""}`} tabIndex="-1" style={{ width: offcanvasWidth, maxWidth: "100%" }}>
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Users with Access to {selectedMenuName}</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowUsersList(false)}></button>
        </div>
        <div className="offcanvas-body p-0">
          <DataTable value={menuUsersDetails} loading={loading} responsiveLayout="scroll" className="emp-access-table" paginator rows={50} emptyMessage="No users found with this access">
            <Column field="empCode" header="Employee ID" style={{ width: "120px" }} />
            <Column field="empName" header="Employee Name" />
            <Column field="processName" header="Process" />
            <Column field="facilityName" header="Facility" />
          </DataTable>
        </div>
      </div>

      {/* ── Log Employee List Offcanvas ── */}
      <div className={`offcanvas offcanvas-end${showLogEmployeeList ? " show" : ""}`} tabIndex="-1" style={{ width: offcanvasWidth, maxWidth: "100%" }}>
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Select Employee for Log</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogEmployeeList(false)}></button>
        </div>
        <div className="offcanvas-body p-0">
          <DataTable value={logEmployees} loading={logLoading} responsiveLayout="scroll" className="emp-access-table" paginator rows={50} emptyMessage="No employees found">
            <Column field="empCode" header="Employee ID" style={{ width: "120px" }} />
            <Column field="empName" header="Employee Name" body={(rowData) => (
              <a href="#!" onClick={(e) => { e.preventDefault(); handleLogEmployeeSelect(rowData); }} className="text-primary">{rowData.empName}</a>
            )} />
            <Column field="processName" header="Process" />
            <Column field="facilityName" header="Facility" />
            <Column field="email" header="Email" />
          </DataTable>
        </div>
      </div>

      {/* ── Copy Access Employee Picker Offcanvas ── */}
      <div className={`offcanvas offcanvas-end${showCopyEmpList ? " show" : ""}`} tabIndex="-1" style={{ width: offcanvasWidth, maxWidth: "100%" }}>
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal">Select {copyEmpTargetRef.current === "from" ? "Source" : "Target"} Employee</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowCopyEmpList(false)}></button>
        </div>
        <div className="offcanvas-body p-0">
          <DataTable value={copyEmployees} loading={loading} responsiveLayout="scroll" className="emp-access-table" paginator rows={50} emptyMessage="No employees found">
            <Column field="empCode" header="Employee ID" style={{ width: "120px" }} />
            <Column field="empName" header="Employee Name" body={(rowData) => (
              <a href="#!" onClick={(e) => { e.preventDefault(); handleCopyEmpSelect(rowData); }} className="text-primary">{rowData.empName}</a>
            )} />
            <Column field="processName" header="Process" />
            <Column field="facilityName" header="Facility" />
            <Column field="email" header="Email" />
          </DataTable>
        </div>
      </div>

      {anyOffcanvasOpen && (
        <div className="offcanvas-backdrop fade show" onClick={closeAllOffcanvas}></div>
      )}

      <style>{`
        .offcanvas-footer {
          position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem;
          background-color: #f9fafb; border-top: 1px solid #e5e7eb;
          display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem;
        }
        .offcanvas-footer .btn {
          display: inline-flex; align-items: center; justify-content: center;
          white-space: nowrap; min-width: 85px; height: 38px;
          padding: 0.4rem 0.75rem !important; font-size: 0.85rem !important;
          vertical-align: middle; line-height: 1; transition: all 0.3s ease !important;
        }
        .offcanvas-footer .btn-outline-secondary { border: 1px solid #d1d5db !important; color: #4b5563 !important; background-color: white !important; }
        .offcanvas-footer .btn-outline-secondary:hover { background-color: #1f2937 !important; border-color: #1f2937 !important; color: white !important; }
        .offcanvas-footer .btn-success { background-color: #22c55e !important; border-color: #22c55e !important; color: white !important; }
        .offcanvas-footer .btn-success:hover { background-color: #16a34a !important; border-color: #16a34a !important; color: white !important; }
      `}</style>
    </div>
  );
};

export default EmpAccessRights;

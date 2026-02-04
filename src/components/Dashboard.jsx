import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import ReactDOM from "react-dom";
import Sidebar from "./Master/SidebarMenu";
import "bootstrap/dist/css/bootstrap.min.css";
import "../components/css/style.css";
import { TabMenu } from "primereact/tabmenu";
import { Dropdown } from "primereact/dropdown";
import Header from "./Master/Header";
import { BiExpand, BiCalendar, BiChevronDown } from "react-icons/bi";
import { Tooltip } from "primereact/tooltip";

import RiStats from "./DashboardPage/RiStats";
import RiShiftEmployeeOccupancy from "./DashboardPage/RiShiftEmployeeOccupancy";
import RiNormalAdhoc from "./DashboardPage/RiNormalAdhoc";
import RiShiftCompletionPending from "./DashboardPage/RiShiftCompletionPending";
import RiPickDrop from "./DashboardPage/RiPickDrop";
import RiDropSafeChart from "./DashboardPage/RiDropSafeChart";
import VpStats from "./DashboardPage/VpStats";
import VpVehicleDistribution from "./DashboardPage/VpVehicleDistribution";
import LeafletHeatMap from "./DashboardPage/LeafletHeatMap";

import VehicleFragmentation from "./DashboardPage/VendorPerformance/VehicleFragmentation";
import FleetEfficiency from "./DashboardPage/VendorPerformance/FleetEfficiency";
import DriverEfficiency from "./DashboardPage/VendorPerformance/DriverEfficiency";
import RouteBreakDuty from "./DashboardPage/VendorPerformance/RouteBreakDuty";
import DriverFragmentation from "./DashboardPage/VendorPerformance/DriverFragmentation";
import EnterpriseDialog from "./DashboardPage/EnterpriseDialog";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import sessionManager from "../utils/SessionManager";
import { apiService } from "../services/api";
import Loader from "./common/Loader";
import ErrorFallback from "./common/ErrorFallback";
import ErrorBoundary from "./common/ErrorBoundary";

const Dashboard = () => {
  const userId = sessionManager.getUserSession().ID;
  const locationid = sessionManager.getUserSession().LocationId;

  const [initError, setInitError] = useState(null);
  const [initRetryCount, setInitRetryCount] = useState(0);
  const maxInitRetries = 3;

  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedPeriod1, setSelectedPeriod1] = useState("last_7_days");
  const [pendingPeriod1, setPendingPeriod1] = useState("last_7_days");

  const today = new Date();
  const [pendingDateFrom, setPendingDateFrom] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
  );
  const [pendingDateTo, setPendingDateTo] = useState(today);

  const [appliedDateFrom, setAppliedDateFrom] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
  );
  const [appliedDateTo, setAppliedDateTo] = useState(today);

  const [visibleCalendar, setVisibleCalendar] = useState(false);
  const calendarRef = useRef(null);
  const filterRef = useRef(null);
  const sentinelRef = useRef(null); // Sentinel element for IntersectionObserver

  const [selectedTripType, setSelectedTripType] = useState("");
  const [type, setType] = useState(1);
  const [checked, setChecked] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSticky, setIsSticky] = useState(false); // Renamed from 'scrolled'

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  const [cities, setCities] = useState([]);
  const [selCity, setSelCity] = useState(null);
  const [selFacility, setSelFacility] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [venders, setVenders] = useState([]);
  const [selVendor, setSelVendor] = useState(null);

  const periodOptions1 = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "last_7_days" },
    { label: "Last 30 days", value: "last_30_days" },
    { label: "Last 90 days", value: "last_90_days" },
    { label: "Last 12 months", value: "last_12_months" },
    { label: "Custom", value: "custom" },
  ];

  const tripTypeOptions = [
    { label: "Both", value: "" },
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" },
  ];

  const tabItems = [
    { label: "Routing Insights" },
    { label: "Vendor Performance" },
    { label: "Facility Insights" },
  ];

  const formatDateLocal = useCallback((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const filter = useMemo(() => {
    if (isInitializing || isLoadingFilters) return null;

    let sDate = null,
      eDate = null;
    const now = new Date();

    switch (selectedPeriod1) {
      case "today":
        sDate = eDate = now;
        break;
      case "yesterday":
        sDate = eDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1
        );
        break;
      case "last_7_days":
        sDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        eDate = now;
        break;
      case "last_30_days":
        sDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        eDate = now;
        break;
      case "last_90_days":
        sDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
        eDate = now;
        break;
      case "last_12_months":
        sDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        eDate = now;
        break;
      case "custom":
        sDate = appliedDateFrom;
        eDate = appliedDateTo;
        break;
      default:
        sDate = appliedDateFrom;
        eDate = appliedDateTo;
    }

    return {
      sDate: sDate ? formatDateLocal(sDate) : null,
      eDate: eDate ? formatDateLocal(eDate) : null,
      locationid: selCity?.Id === "all" ? undefined : selCity?.Id,
      facilityid:
        selFacility === "allFacility" || selFacility?.Id === "allFacility"
          ? undefined
          : selFacility,
      vendorid: selVendor?.Id === "all" ? undefined : selVendor?.Id,
      triptype: selectedTripType,
    };
  }, [
    isInitializing,
    isLoadingFilters,
    selectedPeriod1,
    appliedDateFrom,
    appliedDateTo,
    selCity,
    selFacility,
    selVendor,
    selectedTripType,
    formatDateLocal,
  ]);

  const initializeData = useCallback(async () => {
    try {
      setIsInitializing(true);
      setInitError(null);

      const res = await apiService.sp_getAllLocation();
      const rawList = typeof res === "string" ? JSON.parse(res) : res || [];

      const formatted = rawList.map((city) => ({
        name: city.locationName || city.name || "Unknown",
        value: {
          Id: city.Id,
          locationName: city.locationName || city.name,
        },
      }));

      setCities(formatted);

      const defaultCity = formatted[0]?.value || null;
      if (defaultCity) {
        setSelCity(defaultCity);

        const facilityRes = await apiService.Getchart_Facility({
          locationid: defaultCity.Id,
        });
        const facilityData =
          typeof facilityRes === "string"
            ? JSON.parse(facilityRes)
            : facilityRes || [];

        setFacilities(facilityData);
        setFilteredFacilities(facilityData);

        const defaultFacility = facilityData[0]?.Id || null;
        if (defaultFacility) {
          setSelFacility(defaultFacility);

          const vendorRes = await apiService.sp_getVendorByFac({
            facilityid: defaultFacility,
          });
          const vendorData =
            typeof vendorRes === "string"
              ? JSON.parse(vendorRes)
              : vendorRes || [];

          const allVendorOption = { vendorName: "All Vendor", Id: "all" };
          setVenders([allVendorOption, ...vendorData]);
          setSelVendor(allVendorOption);
        }
      }

      setInitRetryCount(0);
      setInitError(null);
    } catch (err) {
      console.error("Error initializing data:", err);
      setInitError(err);

      if (initRetryCount < maxInitRetries) {
        setInitRetryCount((prev) => prev + 1);
      }

      setCities([]);
      setSelCity(null);
      setFacilities([]);
      setFilteredFacilities([]);
      setVenders([]);
      setSelVendor(null);
    } finally {
      setTimeout(() => setIsInitializing(false), 100);
    }
  }, [initRetryCount]);

  const handleRetryInit = useCallback(() => {
    setInitRetryCount(0);
    setInitError(null);
    setIsInitializing(true);
    initializeData();
  }, [initializeData]);

  const handleCityChange = useCallback(async (e) => {
    const selected = e.value;
    setIsLoadingFilters(true);

    try {
      setSelCity(selected);

      const res = await apiService.Getchart_Facility({
        locationid: selected?.Id,
      });
      const data = typeof res === "string" ? JSON.parse(res) : res || [];

      setFacilities(data);
      setFilteredFacilities(data);

      const defaultFacility = data[0]?.Id || null;
      setSelFacility(defaultFacility);

      const allVendorOption = { vendorName: "All Vendor", Id: "all" };
      if (defaultFacility) {
        const vendorRes = await apiService.sp_getVendorByFac({
          facilityid: defaultFacility,
        });
        const vendorData =
          typeof vendorRes === "string"
            ? JSON.parse(vendorRes)
            : vendorRes || [];

        setVenders([allVendorOption, ...vendorData]);
      } else {
        setVenders([allVendorOption]);
      }
      setSelVendor(allVendorOption);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      setFacilities([]);
      setFilteredFacilities([]);
      setSelFacility(null);
    } finally {
      setIsLoadingFilters(false);
    }
  }, []);

  const handleFacilityChange = useCallback(async (e) => {
    const facilityId = e.value;
    setIsLoadingFilters(true);

    try {
      setSelFacility(facilityId);

      const res = await apiService.sp_getVendorByFac({
        facilityid: facilityId,
      });
      const data = typeof res === "string" ? JSON.parse(res) : res || [];

      const allVendorOption = { vendorName: "All Vendor", Id: "all" };
      setVenders([allVendorOption, ...data]);
      setSelVendor(allVendorOption);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setVenders([]);
      setSelVendor(null);
    } finally {
      setIsLoadingFilters(false);
    }
  }, []);

  const handleChange = useCallback((e) => {
    setType(e.target.value === "2" ? 2 : 1);
  }, []);

  const handleVendorChange = useCallback((e) => {
    setSelVendor(e.value);
  }, []);

  const handleTripTypeChange = useCallback((e) => {
    setSelectedTripType(e.value);
  }, []);

  const handleCalendarApply = useCallback(() => {
    setSelectedPeriod1(pendingPeriod1);
    setAppliedDateFrom(pendingDateFrom);
    setAppliedDateTo(pendingDateTo);
    setVisibleCalendar(false);
  }, [pendingPeriod1, pendingDateFrom, pendingDateTo]);

  const handleCalendarClose = useCallback(() => {
    setVisibleCalendar(false);
  }, []);

  const handleCalendarToggle = useCallback(() => {
    setVisibleCalendar((v) => !v);
  }, []);

  const handleTabChange = useCallback((e) => {
    setActiveIndex(e.index);
  }, []);

  const handleDialogShow = useCallback(() => {
    setDialogVisible(true);
  }, []);

  const handleDialogHide = useCallback(() => {
    setDialogVisible(false);
  }, []);

  const handleDateFromChange = useCallback((date) => {
    setPendingDateFrom(date);
    setPendingPeriod1("custom");
  }, []);

  const handleDateToChange = useCallback((date) => {
    setPendingDateTo(date);
    setPendingPeriod1("custom");
  }, []);

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (initError && initRetryCount < maxInitRetries && !isInitializing) {
      const timer = setTimeout(() => {
        console.log(
          `Auto-retrying initialization... Attempt ${initRetryCount + 1}`
        );
        initializeData();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [initError, initRetryCount, isInitializing, initializeData]);

  useEffect(() => {
    setChecked(type === 2);
  }, [type]);

  // ========== IMPROVED STICKY DETECTION WITH INTERSECTION OBSERVER ==========
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is NOT intersecting (scrolled past), filter becomes sticky
        setIsSticky(!entry.isIntersecting);
      },
      {
        // Trigger when sentinel crosses the top of viewport (accounting for header)
        rootMargin: "-60px 0px 0px 0px", // Negative top margin = header height
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setVisibleCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (visibleCalendar) {
      setPendingPeriod1(selectedPeriod1);
    }
  }, [visibleCalendar, selectedPeriod1]);

  useEffect(() => {
    if (pendingPeriod1 === "custom") return;

    const now = new Date();
    let from = now,
      to = now;

    switch (pendingPeriod1) {
      case "today":
        from = to = now;
        break;
      case "yesterday":
        from = to = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1
        );
        break;
      case "last_7_days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        break;
      case "last_30_days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        break;
      case "last_90_days":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
        break;
      case "last_12_months":
        from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        break;
    }

    setPendingDateFrom(from);
    setPendingDateTo(to);
  }, [pendingPeriod1]);

  if (initError && initRetryCount >= maxInitRetries) {
    return (
      <>
        <Header pageTitle="Dashboard" />
        <Sidebar />
        <div className="middle">
          <ErrorFallback
            error={initError}
            title="Failed to Load Dashboard"
            onRetry={handleRetryInit}
            showDetails={false}
          />
        </div>
      </>
    );
  }

  if (isInitializing && initRetryCount > 0) {
    return (
      <div className="container-fluid p-0" style={{ background: "#f9f9f9" }}>
        <Header pageTitle="Dashboard" />
        <Sidebar />
        <div className="middle">
          <div
            className="d-flex flex-column justify-content-center align-items-center"
            style={{ height: "400px" }}
          >
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mb-2">
              <strong>
                Retry attempt {initRetryCount} of {maxInitRetries}...
              </strong>
            </p>
            <p className="text-muted small">Connecting to server...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="container-fluid p-0" style={{ background: "#f9f9f9" }}>
        <Header pageTitle="Dashboard" />
        <Sidebar />
        <Loader isVisible={true} fullScreen={true} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Loader isVisible={isLoadingFilters} fullScreen={true} />

      <style>{`
/* ===== ENTERPRISE DESIGN SYSTEM ===== */
:root {
  --header-height: 60px;
  --sidebar-width: 268px;
  --filter-height: 72px;
  --content-max-width: 1600px;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Card Heights */
  --card-height-sm: 320px;
  --card-height-md: 400px;
  --card-height-lg: 480px;
  --card-height-xl: 520px;
  
  /* Colors */
  --primary-50: #eef2ff;
  --primary-100: #e0e7ff;
  --primary-500: #6366f1;
  --primary-600: #4f46e5;
  --primary-700: #4338ca;
  
  --slate-50: #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-600: #475569;
  --slate-700: #334155;
  --slate-800: #1e293b;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03);
  --shadow-sticky: 0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.02);
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  
  /* Transitions - SMOOTH */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
}

/* ===== BASE LAYOUT ===== */
.dashboard-container {
  background: linear-gradient(180deg, var(--slate-50) 0%, var(--slate-100) 100%);
  min-height: 100vh;
  overflow: visible !important; /* Ensure parents don't break sticky */
}

.middle {
  padding: calc(var(--header-height) + var(--space-lg)) var(--space-lg) var(--space-xl) !important;
  overflow: visible !important; /* Ensure parents don't break sticky */
}

/* ===== SENTINEL ELEMENT FOR INTERSECTION OBSERVER ===== */
.sticky-sentinel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  pointer-events: none;
  visibility: hidden;
}

/* ===== STICKY FILTER WRAPPER ===== */
.filter-wrapper {
  position: relative;
}

/* ===== FILTER SECTION - CSS STICKY (SMOOTH & PERFORMANT) ===== */
.filter-section {
  position: sticky;
  top: var(--header-height);
  z-index: 100;
  
  /* Visual Styling */
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-lg);
  border: 1px solid rgba(226, 232, 240, 0.6);
  
  /* Default shadow */
  box-shadow: var(--shadow-sm);
  
  /* SMOOTH TRANSITIONS for all visual changes */
  transition: 
    box-shadow var(--duration-slow) var(--ease-out),
    background var(--duration-slow) var(--ease-out),
    border-radius var(--duration-slow) var(--ease-out),
    padding var(--duration-base) var(--ease-out),
    border-color var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
  
  /* GPU acceleration for smooth animations */
  will-change: box-shadow, background, border-radius;
  /* transform: translateZ(0); REMOVED to avoid sticky issues */
}

/* When sticky is active (detected by IntersectionObserver) */
.filter-section.is-sticky {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: var(--shadow-sticky);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  border-color: transparent;
  border-top: none;
  padding: var(--space-sm) var(--space-lg);
}

/* Subtle scale effect when becoming sticky */
.filter-section.is-sticky::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(99, 102, 241, 0.3) 50%, 
    transparent 100%
  );
  opacity: 1;
  transition: opacity var(--duration-base) var(--ease-out);
}

.filter-section:not(.is-sticky)::before {
  opacity: 0;
}

/* ===== FILTER LAYOUT ===== */
.filter-main-row {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  flex-wrap: nowrap; /* Reverted to nowrap */
  transition: gap var(--duration-base) var(--ease-out);
}

.filter-section.is-sticky .filter-main-row {
  gap: var(--space-md);
}

.filter-tabs-section {
  flex: 0 0 auto;
}

.filter-dropdowns-section {
  flex: 1; /* Allow shrinking */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm); /* Reduced gap */
  min-width: 0; /* Allow shrinking below content size if needed */
}

.filter-item {
  display: flex;
  flex-direction: column;
  flex: 0 1 auto; /* Allow shrinking */
  min-width: 80px; /* Reduced min-width */
  max-width: 160px;
  transition: all var(--duration-base) var(--ease-out);
}

.filter-item-date {
  display: flex;
  flex-direction: column;
  flex: 0 1 auto; /* Allow shrinking */
  min-width: 110px; /* Reduced min-width */
  position: relative;
  z-index: 101;
}

.filter-label {
  font-size: 0.65rem;
  color: var(--slate-500);
  margin-bottom: 4px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: all var(--duration-base) var(--ease-out);
  transform-origin: left center;
}

/* Compact labels when sticky */
.filter-section.is-sticky .filter-label {
  font-size: 0.6rem;
  margin-bottom: 2px;
}

/* ===== ENTERPRISE TAB MENU ===== */
.p-tabmenu {
  overflow: visible !important;
}

.p-tabmenu .p-tabmenu-nav {
  border: none !important;
  background: var(--slate-100) !important;
  display: inline-flex !important;
  gap: 2px !important;
  padding: 4px !important;
  border-radius: var(--radius-lg) !important;
  transition: all var(--duration-base) var(--ease-out) !important;
}

.filter-section.is-sticky .p-tabmenu .p-tabmenu-nav {
  padding: 3px !important;
}

.p-tabmenu .p-tabmenuitem {
  margin: 0 !important;
}

.p-tabmenu .p-tabmenuitem .p-menuitem-link {
  padding: 0.5rem 1rem !important;
  border: none !important;
  background: transparent !important;
  color: var(--slate-600) !important;
  font-weight: 600 !important;
  font-size: 0.8125rem !important;
  border-radius: var(--radius-md) !important;
  transition: all var(--duration-fast) var(--ease-out) !important;
  white-space: nowrap !important;
}

.filter-section.is-sticky .p-tabmenu .p-tabmenuitem .p-menuitem-link {
  padding: 0.375rem 0.875rem !important;
  font-size: 0.75rem !important;
}

.p-tabmenu .p-tabmenuitem .p-menuitem-link:hover {
  background: rgba(255,255,255,0.6) !important;
  color: var(--slate-800) !important;
}

.p-tabmenu .p-tabmenuitem.p-highlight .p-menuitem-link {
  background: white !important;
  color: var(--primary-600) !important;
  box-shadow: var(--shadow-sm) !important;
}

/* ===== ENTERPRISE DROPDOWNS ===== */
.p-dropdown {
  width: 100% !important;
  height: 36px !important;
  border-radius: var(--radius-md) !important;
  border: 1px solid var(--slate-200) !important;
  background: white !important;
  transition: all var(--duration-fast) var(--ease-out) !important;
}

.filter-section.is-sticky .p-dropdown {
  height: 32px !important;
}

.p-dropdown:hover {
  border-color: var(--slate-300) !important;
}

.p-dropdown.p-focus {
  border-color: var(--primary-500) !important;
  box-shadow: 0 0 0 3px var(--primary-100) !important;
}

.p-dropdown .p-dropdown-label {
  padding: 0.5rem 0.75rem !important;
  font-size: 0.8125rem !important;
  font-weight: 500 !important;
  color: var(--slate-700) !important;
  transition: all var(--duration-fast) !important;
}

.filter-section.is-sticky .p-dropdown .p-dropdown-label {
  padding: 0.375rem 0.625rem !important;
  font-size: 0.75rem !important;
}

.p-dropdown .p-dropdown-trigger {
  width: 2rem !important;
  color: var(--slate-400) !important;
}

.p-dropdown-panel {
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-xl) !important;
  border: 1px solid var(--slate-200) !important;
  margin-top: 4px !important;
  animation: dropdownFadeIn 0.2s var(--ease-out) !important;
}

@keyframes dropdownFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item {
  padding: 0.625rem 1rem !important;
  font-size: 0.8125rem !important;
  transition: background var(--duration-fast) !important;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover {
  background: var(--slate-50) !important;
}

.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {
  background: var(--primary-50) !important;
  color: var(--primary-700) !important;
}

/* ===== DATE SELECTOR ===== */
.custom-select {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--slate-700);
  height: 36px;
  transition: all var(--duration-fast) var(--ease-out);
}

.filter-section.is-sticky .custom-select {
  height: 32px;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.custom-select:hover {
  border-color: var(--slate-300);
  background: var(--slate-50);
}

.custom-select:active {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.custom-select svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--primary-500);
  transition: all var(--duration-fast);
}

.filter-section.is-sticky .custom-select svg {
  width: 14px;
  height: 14px;
}

.custom-select-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select .chevron {
  width: 14px;
  height: 14px;
  color: var(--slate-400);
  transition: transform var(--duration-fast);
}

.custom-select:hover .chevron {
  color: var(--slate-600);
}

/* ===== CALENDAR DROPDOWN ===== */
.custom-calender {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  z-index: 10000;
  margin-top: 8px;
  padding: var(--space-lg);
  min-width: 620px;
  border: 1px solid var(--slate-200);
  animation: calendarFadeIn 0.25s var(--ease-out);
}

.custom-calender-portal {
  position: fixed !important;
  top: calc(var(--header-height) + var(--filter-height) + 8px) !important;
  right: 24px !important;
  left: auto !important;
  margin-top: 0 !important;
  z-index: 99999 !important;
}

@keyframes calendarFadeIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.time-filter-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.time-filter-item {
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-out);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--slate-600);
  margin-bottom: 2px;
}

.time-filter-item:hover {
  background: var(--slate-100);
  color: var(--slate-800);
}

.time-filter-item.active {
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Calendar Buttons */
.custom-calender .btn-secondary {
  background: var(--slate-100);
  border: 1px solid var(--slate-200);
  color: var(--slate-700);
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast);
}

.custom-calender .btn-secondary:hover {
  background: var(--slate-200);
}

.custom-calender .btn-primary {
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  border: none;
  color: white;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  transition: all var(--duration-fast);
}

.custom-calender .btn-primary:hover {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

/* React Calendar Styling */
.react-calendar {
  border: none !important;
  font-family: inherit !important;
  width: 100% !important;
  background: transparent !important;
}

.react-calendar__tile {
  border-radius: var(--radius-sm) !important;
  transition: all var(--duration-fast) !important;
}

.react-calendar__tile:hover {
  background: var(--slate-100) !important;
}

.react-calendar__tile--active {
  background: var(--primary-500) !important;
  color: white !important;
}

.react-calendar__tile--now {
  background: var(--primary-50) !important;
}

.react-calendar__navigation button {
  font-weight: 600 !important;
  color: var(--slate-700) !important;
}

/* ===== ENTERPRISE CARD SYSTEM ===== */
.cardx {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--slate-200);
  transition: all var(--duration-base) var(--ease-out);
  overflow: hidden;
  padding: var(--space-lg);
}

.cardx:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--slate-300);
}

.cardx-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding-bottom: var(--space-md);
  margin-bottom: var(--space-md);
  border-bottom: 1px solid var(--slate-100);
  flex-shrink: 0;
}

.cardx-header h6,
.cardx h6 {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--slate-800);
  letter-spacing: -0.01em;
  line-height: 1.4;
}

.cardx hr {
  border: none;
  height: 1px;
  background: var(--slate-100);
  margin: 0 0 var(--space-md) 0;
}

.cardx-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.chart-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Icon Button */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--slate-200);
  color: var(--slate-500);
  background: white;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.icon-btn:hover {
  background: var(--slate-50);
  border-color: var(--slate-300);
  color: var(--primary-600);
}

.icon-btn:active {
  transform: scale(0.96);
}

/* Form Select */
.form-select-map {
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-md);
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  background: white;
  color: var(--slate-700);
  transition: all var(--duration-fast);
  cursor: pointer;
  height: 34px;
}

.form-select-map:hover {
  border-color: var(--slate-300);
}

.form-select-map:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
  outline: none;
}

/* ===== GRID SYSTEM ===== */
.chart-grid {
  display: grid;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.chart-grid:last-child {
  margin-bottom: 0;
}

.grid-2-cols { grid-template-columns: repeat(2, 1fr); }
.grid-3-cols { grid-template-columns: repeat(3, 1fr); }
.grid-55-45 { grid-template-columns: 55fr 45fr; }
.grid-65-35 { grid-template-columns: 65fr 35fr; }
.grid-35-65 { grid-template-columns: 35fr 65fr; }
.grid-full { grid-template-columns: 1fr; }

.card-sm { min-height: var(--card-height-sm); }
.card-md { min-height: var(--card-height-md); }
.card-lg { min-height: var(--card-height-lg); }
.card-xl { min-height: var(--card-height-xl); }

.stats-section { margin-bottom: var(--space-lg); }

.map-card { position: relative; }
.map-card .chart-container {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1399px) {
  .grid-55-45, .grid-65-35, .grid-35-65 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1199px) {
  .grid-3-cols { grid-template-columns: repeat(2, 1fr); }
  
  .filter-main-row {
    flex-wrap: wrap;
    gap: var(--space-md);
  }
  
  .filter-tabs-section {
    flex: 0 0 100%;
    margin-bottom: var(--space-sm);
  }
  
  .filter-dropdowns-section {
    flex: 0 0 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .filter-item, .filter-item-date {
    flex: 1 1 calc(20% - var(--space-md));
    max-width: none;
  }
}

@media (max-width: 991px) {
  .grid-2-cols, .grid-55-45, .grid-65-35, .grid-35-65 {
    grid-template-columns: 1fr;
  }
  
  .filter-item, .filter-item-date {
    flex: 1 1 calc(33.333% - var(--space-md));
  }
  
  .card-xl, .card-lg { min-height: var(--card-height-md); }
}

@media (max-width: 767px) {
  :root { --header-height: 56px; }
  
  .middle {
    padding: calc(var(--header-height) + var(--space-md)) var(--space-md) var(--space-lg) !important;
  }
  
  .filter-section {
    padding: var(--space-md);
    border-radius: var(--radius-lg);
  }
  
  .filter-section.is-sticky {
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    padding: var(--space-sm) var(--space-md);
  }
  
  .filter-item, .filter-item-date {
    flex: 1 1 calc(50% - var(--space-md));
  }
  
  .cardx {
    padding: var(--space-md);
    border-radius: var(--radius-lg);
  }
  
  .chart-grid { gap: var(--space-md); }
  .grid-3-cols { grid-template-columns: 1fr; }
  
  .custom-calender {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    right: auto;
    width: 94%;
    max-width: 600px;
    min-width: auto;
    max-height: 90vh;
    overflow-y: auto;
    margin: 0;
  }
  
  .custom-calender-portal {
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    transform: translate(-50%, -50%);
  }
}

@media (max-width: 575px) {
  .filter-item, .filter-item-date { flex: 0 0 100%; }
  
  .p-tabmenu .p-tabmenu-nav { width: 100%; }
  .p-tabmenu .p-tabmenuitem { flex: 1; }
  .p-tabmenu .p-tabmenuitem .p-menuitem-link {
    justify-content: center;
    padding: 0.5rem 0.5rem !important;
    font-size: 0.75rem !important;
  }
}

/* ===== ANIMATIONS ===== */
.cardx {
  animation: cardEnter 0.5s var(--ease-out) backwards;
}

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.chart-grid:nth-child(1) .cardx { animation-delay: 0.05s; }
.chart-grid:nth-child(2) .cardx { animation-delay: 0.1s; }
.chart-grid:nth-child(3) .cardx { animation-delay: 0.15s; }
.chart-grid:nth-child(4) .cardx { animation-delay: 0.2s; }

.chart-grid .cardx:nth-child(1) { animation-delay: 0.05s; }
.chart-grid .cardx:nth-child(2) { animation-delay: 0.1s; }
.chart-grid .cardx:nth-child(3) { animation-delay: 0.15s; }

/* Focus for accessibility */
*:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--slate-100); border-radius: 4px; }
::-webkit-scrollbar-thumb { background: var(--slate-300); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--slate-400); }
`}</style>

      <div className="container-fluid p-0 dashboard-container">
        <Header pageTitle="Dashboard" />
        <Sidebar />
        <div className="middle">
          {/* Filter Wrapper with Sentinel */}
{/* Filter Wrapper removed to fix sticky behavior */}
          {/* Sentinel element - triggers IntersectionObserver when scrolled past */}
          <div ref={sentinelRef} className="sticky-sentinel" />

            {/* Filter Section - Pure CSS sticky with conditional class */}
            <div
              ref={filterRef}
              className={`filter-section ${isSticky ? "is-sticky" : ""}`}
            >
              <div className="filter-main-row">
                <div className="filter-tabs-section">
                  <TabMenu
                    model={tabItems}
                    activeIndex={activeIndex}
                    onTabChange={handleTabChange}
                  />
                </div>

                <div className="filter-dropdowns-section">
                  <div className="filter-item-date">
                    <label className="filter-label">Date Range</label>
                    <div
                      className="custom-select"
                      onClick={handleCalendarToggle}
                    >
                      <BiCalendar />
                      <span className="custom-select-text">
                        {periodOptions1.find(
                          (opt) => opt.value === selectedPeriod1
                        )?.label || "Custom"}
                      </span>
                      <BiChevronDown className="chevron" />
                    </div>
                    {visibleCalendar &&
                      ReactDOM.createPortal(
                        <div
                          className="custom-calender custom-calender-portal"
                          ref={calendarRef}
                        >
                          <div className="row">
                            <div className="col-12 col-lg-3">
                              <ul className="time-filter-list">
                                {periodOptions1.map(({ label, value }) => (
                                  <li
                                    key={value}
                                    className={`time-filter-item ${
                                      pendingPeriod1 === value ? "active" : ""
                                    }`}
                                    onClick={() => setPendingPeriod1(value)}
                                  >
                                    {label}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="col-12 col-lg">
                              <label className="filter-label mb-2">From</label>
                              <input
                                type="text"
                                className="form-control mb-3 form-control-sm"
                                value={
                                  pendingDateFrom?.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  }) || ""
                                }
                                readOnly
                              />
                              <Calendar
                                onChange={handleDateFromChange}
                                value={pendingDateFrom}
                              />
                            </div>
                            <div className="col-12 col-lg">
                              <label className="filter-label mb-2">To</label>
                              <input
                                type="text"
                                className="form-control mb-3 form-control-sm"
                                value={
                                  pendingDateTo?.toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  }) || ""
                                }
                                readOnly
                              />
                              <Calendar
                                onChange={handleDateToChange}
                                value={pendingDateTo}
                              />
                            </div>
                            <div className="col-12 mt-3 text-end">
                              <button
                                className="btn btn-secondary btn-sm me-2 d-inline-flex align-items-center justify-content-center"
                                onClick={handleCalendarClose}
                              >
                                Cancel
                              </button>
                              <button
                                className="btn btn-primary btn-sm d-inline-flex align-items-center justify-content-center"
                                onClick={handleCalendarApply}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>,
                        document.body
                      )}
                  </div>

                  <div className="filter-item">
                    <label className="filter-label">City</label>
                    <Dropdown
                      value={selCity}
                      optionLabel="name"
                      optionValue="value"
                      onChange={handleCityChange}
                      options={cities}
                      placeholder="Select City"
                      showClear={false}
                    />
                  </div>

                  <div className="filter-item">
                    <label className="filter-label">Facility</label>
                    <Dropdown
                      value={selFacility}
                      optionLabel="facilityName"
                      optionValue="Id"
                      onChange={handleFacilityChange}
                      options={filteredFacilities}
                      placeholder="Select Facility"
                    />
                  </div>

                  <div className="filter-item">
                    <label className="filter-label">Trip Type</label>
                    <Dropdown
                      value={selectedTripType}
                      options={tripTypeOptions}
                      onChange={handleTripTypeChange}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Type"
                    />
                  </div>

                  <div className="filter-item">
                    <label className="filter-label">Vendor</label>
                    <Dropdown
                      value={selVendor}
                      onChange={handleVendorChange}
                      options={venders}
                      optionLabel="vendorName"
                      placeholder="Select Vendor"
                      filter
                    />
                  </div>
                  </div>
                </div>
              </div>

          {/* Main Content */}
          <div className="content-area">
            {(() => {
              if (!filter) return null;

              switch (activeIndex) {
                case 0:
                  return (
                    <>
                      <div className="stats-section">
                        <RiStats filter={filter} />
                      </div>

                      <div className="chart-grid grid-55-45">
                        <div className="cardx map-card card-xl">
                          <div className="cardx-header">
                            <h6>{checked ? "Routes" : "Employees"} Density</h6>
                            <div className="cardx-controls">
                              <select
                                className="form-select form-select-map"
                                value={type}
                                onChange={handleChange}
                              >
                                <option value="1">Employees</option>
                                <option value="2">Routes</option>
                              </select>
                              <Tooltip
                                target="#expand-heatmap"
                                content="Expand Map"
                                position="top"
                              />
                              <span
                                id="expand-heatmap"
                                className="icon-btn"
                                onClick={handleDialogShow}
                              >
                                <BiExpand />
                              </span>
                            </div>
                          </div>
                          <div className="chart-container">
                            <LeafletHeatMap filter={filter} type={type} />
                          </div>
                        </div>
                        <div className="cardx card-xl">
                          <RiShiftEmployeeOccupancy filter={filter} />
                        </div>
                      </div>

                      <div className="chart-grid grid-65-35">
                        <div className="cardx card-md">
                          <RiPickDrop filter={filter} />
                        </div>
                        <div className="cardx card-md">
                          <RiShiftCompletionPending filter={filter} />
                        </div>
                      </div>

                      <div className="chart-grid grid-2-cols">
                        <div className="cardx card-md">
                          <RiNormalAdhoc filter={filter} />
                        </div>
                        <div className="cardx card-md">
                          <RiDropSafeChart filter={filter} />
                        </div>
                      </div>
                    </>
                  );

                case 1:
                  return (
                    <>
                      <div className="stats-section">
                        <VpStats filter={filter} />
                      </div>

                      <div className="chart-grid grid-35-65">
                        <div className="cardx card-md">
                          <VpVehicleDistribution filter={filter} />
                        </div>
                        <div className="cardx card-md">
                          <RouteBreakDuty filter={filter} />
                        </div>
                      </div>

                      <div className="chart-grid grid-3-cols">
                        <div className="cardx card-md">
                          <FleetEfficiency filter={filter} />
                        </div>
                        <div className="cardx card-md">
                          <DriverEfficiency filter={filter} />
                        </div>
                        <div className="cardx card-md">
                          <VehicleFragmentation filter={filter} />
                        </div>
                      </div>

                      <div className="chart-grid grid-3-cols">
                        <div className="cardx card-md">
                          <DriverFragmentation filter={filter} />
                        </div>
                      </div>
                    </>
                  );

                case 2:
                  return (
                    <div className="chart-grid grid-full">
                      <div className="cardx card-lg">
                        <div className="cardx-header">
                          <h6>Facility Location</h6>
                        </div>
                        <div className="chart-container">
                          <iframe
                            title="Google Map"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28069.195720471515!2d77.01584120702411!3d28.42983216765682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d190d4d1ab7f9%3A0x9edd43ec9fba1ce9!2sAccenture%20DDC7x!5e0!3m2!1sen!2sin!4v1748521289659!5m2!1sen!2sin"
                            width="100%"
                            height="100%"
                            style={{
                              border: 0,
                              borderRadius: "var(--radius-lg)",
                              minHeight: "400px",
                            }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })()}
          </div>
        </div>
      </div>

      <EnterpriseDialog
        visible={dialogVisible}
        onHide={handleDialogHide}
        title={`${checked ? "Routes" : "Employees"} Density Map`}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <LeafletHeatMap filter={filter} type={type} />
        </div>
      </EnterpriseDialog>
    </ErrorBoundary>
  );
};

export default Dashboard;
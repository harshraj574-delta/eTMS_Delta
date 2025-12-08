import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Sidebar from "./Master/SidebarMenu";
import "bootstrap/dist/css/bootstrap.min.css";
import "../components/css/style.css";
import { TabMenu } from "primereact/tabmenu";
import { Dropdown } from "primereact/dropdown";
import Header from "./Master/Header";
import { BiExpand, BiCalendar } from "react-icons/bi";
import { Dialog } from "primereact/dialog";
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

import DriverFragmentation from "./DashboardPage/VendorPerformance/DriverFragmentation";
import VehicleFragmentation from "./DashboardPage/VendorPerformance/VehicleFragmentation";
import FleetEfficiency from "./DashboardPage/VendorPerformance/FleetEfficiency";
import DriverEfficiency from "./DashboardPage/VendorPerformance/DriverEfficiency";
import RouteBreakDuty from "./DashboardPage/VendorPerformance/RouteBreakDuty";

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

  const [selectedTripType, setSelectedTripType] = useState("");
  const [type, setType] = useState(1);
  const [checked, setChecked] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [filterHeight, setFilterHeight] = useState(0);

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

  // Filter object WITHOUT type - this prevents re-renders of other components
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

  useEffect(() => {
    const measureFilterHeight = () => {
      if (filterRef.current) {
        setFilterHeight(filterRef.current.offsetHeight);
      }
    };

    const onScroll = () => setScrolled(window.scrollY > 200);

    measureFilterHeight();
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", measureFilterHeight);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureFilterHeight);
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
  :root {
    --header-height: 60px;
    --row1-height: clamp(320px, 50vh, 520px);
  }

  .dashboard-container {
    background: #f9f9f9;
  }

  .middle {
    padding-top: calc(var(--header-height) + 1rem) !important;
  }

  /* Filter Section */
  .filter-section {
    background: white;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-top: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .filterFix {
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    z-index: 99;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 0.75rem 1rem;
    margin: 0;
    border-radius: 0;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* Main filter row - always horizontal */
  .filter-main-row {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    flex-wrap: nowrap;
  }

  /* Tabs section - pushes filters to the right */
  .filter-tabs-section {
    flex: 0 0 auto;
    margin-right: auto;
  }

  /* Filters section - compact, stays on right */
  .filter-dropdowns-section {
    flex: 0 1 auto;
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    min-width: 0;
  }

  /* Individual filter */
  .filter-item {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    width: 110px;
    min-width: 90px;
  }

  .filter-item-date {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    width: 120px;
    min-width: 100px;
    position: relative;
  }

  .filter-label {
    font-size: 0.7rem;
    color: #6c757d;
    margin-bottom: 2px;
    font-weight: 500;
    white-space: nowrap;
  }

  /* Custom date select - compact */
  .custom-select {
    display: flex;
    align-items: center;
    padding: 0.35rem 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.8rem;
    white-space: nowrap;
    height: 34px;
  }

  .custom-select:hover {
    border-color: #adb5bd;
  }

  .custom-select svg {
    flex-shrink: 0;
    margin-right: 4px;
    width: 14px;
    height: 14px;
  }

  .custom-select-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Calendar dropdown */
  .custom-calender {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    margin-top: 0.5rem;
    padding: 1rem;
    min-width: 580px;
  }

  .time-filter-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .time-filter-item {
    padding: 0.4rem 0.6rem;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s;
    font-size: 0.8rem;
  }

  .time-filter-item:hover {
    background-color: #f0f0f0;
  }

  .time-filter-item.active {
    background-color: #007bff;
    color: white;
  }

  /* TabMenu - Compact */
  .p-tabmenu {
    overflow: visible !important;
  }

  .p-tabmenu .p-tabmenu-nav {
    border: none !important;
    background: transparent !important;
    display: flex !important;
    flex-wrap: nowrap !important;
    overflow: visible !important;
    gap: 0 !important;
    padding: 0 !important;
  }

  .p-tabmenu .p-tabmenuitem {
    margin: 0 !important;
  }

  .p-tabmenu .p-tabmenuitem .p-menuitem-link {
    padding: 0.5rem 0.75rem !important;
    border: none !important;
    background: transparent !important;
    color: #6c757d !important;
    font-weight: 500 !important;
    white-space: nowrap !important;
    border-bottom: 2px solid transparent !important;
    font-size: 0.875rem !important;
  }

  .p-tabmenu .p-tabmenuitem.p-highlight .p-menuitem-link {
    color: #ff5722 !important;
    border-bottom-color: #ff5722 !important;
  }

  .p-tabmenu .p-tabmenuitem .p-menuitem-link:hover {
    background: transparent !important;
    color: #ff5722 !important;
  }

  /* Dropdown - Compact */
  .p-dropdown {
    width: 100% !important;
    height: 34px !important;
  }

  .p-dropdown .p-dropdown-label {
    padding: 0.35rem 0.5rem !important;
    font-size: 0.8rem !important;
  }

  .p-dropdown .p-dropdown-trigger {
    width: 2rem !important;
  }

  /* Responsive - Stack only on smaller screens */
  @media (max-width: 1100px) {
    .filter-main-row {
      flex-wrap: wrap;
    }

    .filter-tabs-section {
      flex: 0 0 100%;
      margin-right: 0;
      margin-bottom: 0.5rem;
    }

    .filter-dropdowns-section {
      flex: 0 0 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
    }

    .filter-item,
    .filter-item-date {
      flex: 1 1 calc(20% - 0.5rem);
      width: auto;
      min-width: 100px;
    }
  }

  @media (max-width: 768px) {
    .filter-item,
    .filter-item-date {
      flex: 1 1 calc(33.333% - 0.5rem);
    }

    .custom-calender {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      right: auto;
      width: 90%;
      max-width: 600px;
      min-width: auto;
      max-height: 90vh;
      overflow-y: auto;
    }
  }

  @media (max-width: 576px) {
    .filter-item,
    .filter-item-date {
      flex: 1 1 calc(50% - 0.5rem);
    }

    .p-tabmenu .p-tabmenuitem .p-menuitem-link {
      padding: 0.4rem 0.5rem !important;
      font-size: 0.8rem !important;
    }
  }

  /* Card styles */
  .cardx {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .cardx .chart-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .row-first .cardx {
    height: var(--row1-height);
  }

  .cardx-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .cardx-header h6 {
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cardx-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    color: #555;
    background: #fff;
    cursor: pointer;
    transition: background 0.15s;
  }

  .icon-btn:hover {
    background: #f6f7fb;
  }

  .form-select-map {
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  .chart-row {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .chart-row > [class*="col-"] {
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 992px) {
    .chart-row {
      align-items: stretch;
    }
    .chart-row:not(.row-first) > [class*="col-"] {
      min-height: 360px;
    }
  }

  @media (max-width: 991px) {
    .chart-row > [class*="col-"] {
      min-height: auto;
    }
  }

  @media (max-width: 767px) {
    :root {
      --header-height: 56px;
    }
    .middle {
      padding: calc(var(--header-height) + 0.5rem) 0.5rem 0.5rem !important;
    }
    .cardx {
      padding: 0.75rem !important;
    }
    .cardx h6 {
      font-size: 0.875rem;
    }
  }

  @media (max-width: 575px) {
    :root {
      --header-height: 54px;
    }
  }

  .chart-container {
    position: relative;
    width: 100%;
    overflow-x: auto;
  }

  .content-with-sticky-filter {
    transition: all 0.3s ease-out;
  }
`}</style>

      <div className="container-fluid p-0 dashboard-container">
        <Header pageTitle="Dashboard" />
        <Sidebar />
        <div className="middle">
          <div className="row mb-2 mb-md-3">
            <div className="col-12">
              <div
                ref={filterRef}
                className={`filter-section border-0 ${
                  scrolled ? "filterFix shadow" : ""
                }`}
              >
                <div className="filter-main-row">
                  {/* Tabs */}
                  <div className="filter-tabs-section">
                    <TabMenu
                      model={tabItems}
                      activeIndex={activeIndex}
                      onTabChange={handleTabChange}
                    />
                  </div>

                  {/* All Filters in one row */}
                  <div className="filter-dropdowns-section">
                    {/* Date */}
                    <div className="filter-item-date">
                      <label className="filter-label">Date</label>
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
                      </div>
                      {visibleCalendar && (
                        <div className="custom-calender" ref={calendarRef}>
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
                                className="btn btn-secondary btn-sm me-2"
                                onClick={handleCalendarClose}
                              >
                                Close
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={handleCalendarApply}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* City */}
                    <div className="filter-item">
                      <label className="filter-label">City</label>
                      <Dropdown
                        value={selCity}
                        optionLabel="name"
                        optionValue="value"
                        onChange={handleCityChange}
                        options={cities}
                        placeholder="City"
                        showClear={false}
                      />
                    </div>

                    {/* Facility */}
                    <div className="filter-item">
                      <label className="filter-label">Facility</label>
                      <Dropdown
                        value={selFacility}
                        optionLabel="facilityName"
                        optionValue="Id"
                        onChange={handleFacilityChange}
                        options={filteredFacilities}
                        placeholder="Facility"
                      />
                    </div>

                    {/* Trip Type */}
                    <div className="filter-item">
                      <label className="filter-label">Trip Type</label>
                      <Dropdown
                        value={selectedTripType}
                        options={tripTypeOptions}
                        onChange={handleTripTypeChange}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Type"
                      />
                    </div>

                    {/* Vendor */}
                    <div className="filter-item">
                      <label className="filter-label">Vendor</label>
                      <Dropdown
                        value={selVendor}
                        onChange={handleVendorChange}
                        options={venders}
                        optionLabel="vendorName"
                        placeholder="Vendor"
                        filter
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="row">
            <div className="col-12">
              {scrolled && (
                <div
                  style={{
                    height: `${filterHeight + 20}px`,
                    marginBottom: "1rem",
                  }}
                />
              )}

              <div className="content-with-sticky-filter">
                {(() => {
                  if (!filter) return null;

                  switch (activeIndex) {
                    case 0:
                      return (
                        <>
                          <div className="mb-3">
                            <RiStats filter={filter} />
                          </div>

                          <div className="row chart-row row-first">
                            <div className="col-12 col-lg-6 mb-3 mb-lg-0">
                              <div className="cardx border-0 p-2 p-md-3 h-100 d-flex flex-column">
                                <div className="cardx-header">
                                  <h6 className="mb-0">
                                    {checked ? "Routes" : "Employees"} Density
                                  </h6>
                                  <div className="cardx-controls">
                                    <select
                                      className="form-select form-select-map pointer"
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
                                <div className="chart-container flex-grow-1">
                                  <LeafletHeatMap
                                    filter={filter}
                                    type={type}
                                    height="100%"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="col-12 col-lg-6">
                              <RiShiftEmployeeOccupancy filter={filter} />
                            </div>
                          </div>

                          <div className="row chart-row">
                            <div className="col-12 col-lg-8 mb-3 mb-lg-0">
                              <RiPickDrop filter={filter} />
                            </div>
                            <div className="col-12 col-lg-4">
                              <RiShiftCompletionPending filter={filter} />
                            </div>
                          </div>

                          <div className="row chart-row">
                            <div className="col-12 col-lg-6 mb-3 mb-lg-0">
                              <RiNormalAdhoc filter={filter} />
                            </div>
                            <div className="col-12 col-lg-6">
                              <RiDropSafeChart filter={filter} />
                            </div>
                          </div>
                        </>
                      );
                    case 1:
                      return (
                        <>
                          <VpStats filter={filter} />
                          <div className="row chart-row">
                            <div className="col-12 col-lg-4 mb-3 mb-lg-0">
                              <VpVehicleDistribution filter={filter} />
                            </div>
                            <div className="col-12 col-lg-8">
                              <RouteBreakDuty filter={filter} />
                            </div>
                          </div>
                          <div className="row chart-row align-items-stretch">
                            <div className="col-12 col-md-6 col-lg-4 mb-3">
                              <FleetEfficiency filter={filter} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-4 mb-3">
                              <DriverEfficiency filter={filter} />
                            </div>
                            <div className="col-12 col-md-6 col-lg-4 mb-3">
                              <VehicleFragmentation filter={filter} />
                            </div>
                          </div>
                          <div className="row chart-row">
                            <div className="col-12 col-md-6 col-lg-4 mb-3">
                              <DriverFragmentation filter={filter} />
                            </div>
                          </div>
                        </>
                      );
                    case 2:
                      return (
                        <>
                          <div className="row chart-row">
                            <div className="col-12">
                              <div className="cardx border-0 p-2 p-md-3">
                                <iframe
                                  title="Google Map"
                                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28069.195720471515!2d77.01584120702411!3d28.42983216765682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d190d4d1ab7f9%3A0x9edd43ec9fba1ce9!2sAccenture%20DDC7x!5e0!3m2!1sen!2sin!4v1748521289659!5m2!1sen!2sin"
                                  width="100%"
                                  height="300"
                                  style={{ border: 0 }}
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  className="d-md-none"
                                />
                                <iframe
                                  title="Google Map Desktop"
                                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28069.195720471515!2d77.01584120702411!3d28.42983216765682!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d190d4d1ab7f9%3A0x9edd43ec9fba1ce9!2sAccenture%20DDC7x!5e0!3m2!1sen!2sin!4v1748521289659!5m2!1sen!2sin"
                                  width="100%"
                                  height="450"
                                  style={{ border: 0 }}
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  className="d-none d-md-block"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    default:
                      return null;
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        header={`${checked ? "Routes" : "Employees"} Density`}
        visible={dialogVisible}
        style={{
          width: window.innerWidth < 768 ? "95vw" : "90vw",
          minHeight: window.innerWidth < 768 ? "80vh" : "90vh",
        }}
        onHide={handleDialogHide}
        breakpoints={{ "960px": "95vw", "640px": "100vw" }}
      >
        <div style={{ height: window.innerWidth < 768 ? "70vh" : "80vh" }}>
          <LeafletHeatMap filter={filter} type={type} height="100%" />
        </div>
      </Dialog>
    </ErrorBoundary>
  );
};

export default Dashboard;
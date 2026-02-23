import React, { useEffect, useState, useMemo, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import RepScheduleSummeryService from "../services/compliance/RepScheduleSummeryService";
import sessionManager from "../utils/SessionManager";
import { CustomDataTable } from "./common/CustomDataTable";
import "./common/CustomDataTable.css";
import { Column } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";
import TableToolbar from "./common/TableToolbar";

const RepScheduleSummery = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const userId = sessionManager.getUserSession().ID;
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());

  const reportTypeOptions = useMemo(
    () => [
      { label: "Vendor Wise Billing Report", value: "VENDOR" },
      { label: "Detailed Billing Report", value: "DETAILED" },
    ],
    []
  );

  const [selectedReportType, setSelectedReportType] = useState(null);
  const [appliedReportType, setAppliedReportType] = useState(null);

  const [facilities, setFacilities] = useState([]);
  const [selFacility, setSelFacility] = useState(null);
  const [showTable, setShowTable] = useState(false);

  // Expansion state using index array (like OTAReport)
  const [expandedRows, setExpandedRows] = useState([]);
  // Cache child data keyed by vendorId
  const [vendorChildData, setVendorChildData] = useState({});

  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({
    ShiftDate: null,
    PlanVendorName: null,
    RouteId: null,
    RouteZone: null,
    BillingVehicleType: null,
  });

  const op = useRef(null);
  const filterButtonRef = useRef(null);
  const dt = useRef(null);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply advanced filters
    if (appliedReportType === "DETAILED") {
      Object.keys(filters).forEach((key) => {
        const val = filters[key];
        if (Array.isArray(val) && val.length > 0) {
          filtered = filtered.filter((item) => val.includes(item[key]));
        }
      });
    }

    // Apply global search optimally
    if (globalFilter && globalFilter.trim() !== "") {
      const searchLower = globalFilter.toLowerCase();
      filtered = filtered.filter((item) => {
        // Fast path for relevant fields instead of parsing entire object
        const valuesToSearch = [
          item.ActVendorName, item.VendorName, item.PlanVendorName, item.vendorName,
          item.vid, item.VendorID, item.RouteId, item.VehicleNo, item.Location, item.BillingVehicleType, item.VehicleType, item.TripType
        ];
        return valuesToSearch.some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
        );
      });
    }
    return filtered;
  }, [data, globalFilter, filters, appliedReportType]);

  const getUniqueValues = (field) => {
    const values = data.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const clearAdvancedFilters = () => {
    setFilters({
      ShiftDate: null,
      PlanVendorName: null,
      RouteId: null,
      RouteZone: null,
      BillingVehicleType: null,
    });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await RepScheduleSummeryService.SelectFacility({
        Userid: userId,
      });
      const parsed =
        typeof response === "string" ? JSON.parse(response) : response;
      const formatted = Array.isArray(parsed)
        ? parsed.map((f) => ({
          label: f.facility || f.facilityName,
          value: f.Id,
        }))
        : [];
      setFacilities(formatted);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      toastService.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Extract VendorID / VID from any parent row
  const extractVendorId = (row) => {
    if (!row) return null;
    return (
      row?.VID ??
      row?.vid ??
      row?.vendorId ??
      row?.VendorId ??
      row?.VendorID ??
      row?.vendor ??
      row?.id ??
      row?.ID ??
      null
    );
  };

  const detailedColumns = [
    { field: "ShiftDate", header: "Date" },
    { field: "TripType", header: "Trip Type" },
    { field: "LogInOut", header: "Log In Out" },
    { field: "ActLogInOut", header: "Act Log In Out" },
    { field: "RouteId", header: "Route Id" },
    { field: "VehicleType", header: "Vehicle Type" },
    { field: "BillingVehicleType", header: "Seat Capacity" },
    { field: "ActVendorName", header: "Vendor Name" },
    { field: "VehicleNo", header: "Vehicle No" },
    { field: "Location", header: "Location" },
    { field: "RouteZone", header: "Planned Zone" },
    { field: "BillingZone", header: "Billing Zone" },
    { field: "PlannedEmployeeCount", header: "Planned Employee Count" },
    { field: "FuleType", header: "Fuel Type" },
    { field: "Ac/nonac", header: "AC/NONAC" },
    { field: "Cost", header: "Cost" },
    { field: "GuardCost", header: "Guard Cost" },
    { field: "TollCost", header: "Toll Cost" },
    { field: "PenaltyCost", header: "penalty" },
    { field: "TotalCost", header: "Total Cost" },

    // { field: "PlanVendorName", header: "Plan Vendor Name" },
    // { field: "RouteNo", header: "Route No" },
    // { field: "TotCapacity", header: "Tot Capacity" },
    // { field: "SchedulePax", header: "Schedule Pax" },
    // { field: "ActPax", header: "Act Pax" },
    // { field: "NoShowPax", header: "No Show Pax" },
    // { field: "FuleRate", header: "Fuel Rate" },
    // { field: "TollName", header: "Toll Name" },
    // { field: "TripSheetUpdated", header: "Trip Sheet" },
  ];

  // Render columns for detailed report
  const renderDetailedColumns = () => {
    if (!data || data.length === 0) return null;
    const first = data[0];
    const hasField = (f) => Object.prototype.hasOwnProperty.call(first, f);

    const anyPreferredPresent = detailedColumns.some((c) => hasField(c.field));
    if (!anyPreferredPresent) {
      const keys = Object.keys(first);
      return keys.map((k) => <Column key={k} field={k} header={k} />);
    }
    return detailedColumns.map((c) => (
      <Column key={c.field} field={c.field} header={c.header} sortable />
    ));
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            const stringValue = String(value);
            if (
              stringValue.includes(",") ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const fileName = `schedule_summery_${appliedReportType}_${new Date()
      .toISOString()
      .slice(0, 10)}`;

    if (appliedReportType === "DETAILED") {
      if (dt.current) {
        dt.current.exportCSV({ fileName });
      } else if (filteredData.length > 0) {
        exportToCSV(filteredData, fileName);
      }
      return;
    }

    if (appliedReportType === "VENDOR") {
      if (filteredData.length === 0) {
        toastService.warn("No data to export");
        return;
      }
      exportToCSV(filteredData, fileName);
      return;
    }
  };

  const renderToolbar = () => {
    const activeFilterCount = Object.values(filters).filter(
      (f) => Array.isArray(f) && f.length > 0
    ).length;

    return (
      <TableToolbar
        search={globalFilter}
        onSearch={(e) => setGlobalFilter(e.target.value)}
        onRefresh={() => handleRunReport()}
        onExport={exportExcel}
        activeFilterCount={activeFilterCount}
        filters={filters}
        setFilters={setFilters}
        overlayRef={op}
        filterButtonRef={filterButtonRef}
        showFilter={true}
      >
        {appliedReportType === "DETAILED" ? (
          <>
            <div className="ota-filter-header">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="ota-filter-icon">
                    <i className="pi pi-filter" />
                  </span>
                  <div>
                    <div className="ota-filter-title">Advanced filters</div>
                    <div className="ota-filter-subtitle">
                      Refine detailed report
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="ota-filter-body">
              <div className="ota-filter-field">
                <label className="ota-filter-label">Shift Date</label>
                <MultiSelect
                  value={filters.ShiftDate}
                  options={getUniqueValues("ShiftDate")}
                  onChange={(e) =>
                    setFilters({ ...filters, ShiftDate: e.value })
                  }
                  placeholder="Select dates"
                  maxSelectedLabels={2}
                  className="w-100 p-inputtext-sm"
                  display="chip"
                  showClear
                />
              </div>

              <div className="ota-filter-field">
                <label className="ota-filter-label">Plan Vendor Name</label>
                <MultiSelect
                  value={filters.PlanVendorName}
                  options={getUniqueValues("PlanVendorName")}
                  onChange={(e) =>
                    setFilters({ ...filters, PlanVendorName: e.value })
                  }
                  placeholder="Select vendors"
                  maxSelectedLabels={2}
                  className="w-100 p-inputtext-sm"
                  display="chip"
                  showClear
                />
              </div>

              <div className="ota-filter-field">
                <label className="ota-filter-label">Route Id</label>
                <MultiSelect
                  value={filters.RouteId}
                  options={getUniqueValues("RouteId")}
                  onChange={(e) =>
                    setFilters({ ...filters, RouteId: e.value })
                  }
                  placeholder="Select route IDs"
                  maxSelectedLabels={2}
                  className="w-100 p-inputtext-sm"
                  display="chip"
                  filter
                  showClear
                />
              </div>

              <div className="ota-filter-field">
                <label className="ota-filter-label">Route Zone</label>
                <MultiSelect
                  value={filters.RouteZone}
                  options={getUniqueValues("RouteZone")}
                  onChange={(e) =>
                    setFilters({ ...filters, RouteZone: e.value })
                  }
                  placeholder="Select zones"
                  maxSelectedLabels={2}
                  className="w-100 p-inputtext-sm"
                  display="chip"
                  showClear
                />
              </div>

              <div className="ota-filter-field">
                <label className="ota-filter-label">Vehicle Type</label>
                <MultiSelect
                  value={filters.BillingVehicleType}
                  options={getUniqueValues("BillingVehicleType")}
                  onChange={(e) =>
                    setFilters({ ...filters, BillingVehicleType: e.value })
                  }
                  placeholder="Select vehicle types"
                  maxSelectedLabels={2}
                  className="w-100 p-inputtext-sm"
                  display="chip"
                  showClear
                />
              </div>
            </div>

            <div className="ota-filter-footer">
              <Button
                label="Clear all filters"
                icon="pi pi-filter-slash"
                className="p-button-outlined p-button-secondary w-100"
                onClick={clearAdvancedFilters}
                size="small"
              />
            </div>
          </>
        ) : (
          <div className="p-4 text-center">
            <i
              className="pi pi-info-circle text-muted mb-3 d-block"
              style={{ fontSize: "2rem" }}
            />
            <p className="m-0 text-muted" style={{ fontSize: "0.875rem" }}>
              Advanced filters are only available for Detailed Billing Report.
            </p>
          </div>
        )}
      </TableToolbar>
    );
  };

  const handleRunReport = async () => {
    if (!selectedReportType) {
      toastService.warn("Please select report type");
      return;
    }
    if (!selFacility) {
      toastService.warn("Please select facility");
      return;
    }

    setAppliedReportType(selectedReportType);
    setShowTable(true);
    setExpandedRows([]);
    setVendorChildData({});
    setGlobalFilter(""); // Reset search on new run
    setFilters({
      ShiftDate: null,
      PlanVendorName: null,
      RouteId: null,
      RouteZone: null,
      BillingVehicleType: null,
    });

    const params = {
      sDate: formatDate(fromDate),
      eDate: formatDate(toDate),
      facilityid: selFacility,
    };

    try {
      setLoading(true);
      let response;
      if (selectedReportType === "VENDOR") {
        response = await RepScheduleSummeryService.RepVendorWiseBill_parent(
          params
        );
      } else {
        response = await RepScheduleSummeryService.RepScheduleMISSummery(
          params
        );
      }

      const parsed =
        typeof response === "string" ? JSON.parse(response) : response;
      const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
      setData(arr);
      if (!arr.length) toastService.error("No records found");
    } catch (err) {
      console.error("Error running schedule summary:", err);
      toastService.error("Failed to fetch report data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle row expansion (like OTAReport)
  const toggleRowExpansion = async (index, rowData) => {
    const newExpandedRows = [...expandedRows];
    const rowIndex = newExpandedRows.indexOf(index);

    if (rowIndex > -1) {
      // Collapse
      newExpandedRows.splice(rowIndex, 1);
      setExpandedRows(newExpandedRows);
      return;
    }

    // Expand
    const vid = extractVendorId(rowData);

    // Fetch child data if not cached
    if (vid && !vendorChildData[vid]) {
      try {
        setLoading(true);
        const params = {
          sDate: formatDate(fromDate),
          eDate: formatDate(toDate),
          facilityid: selFacility,
          vendorid: vid,
        };
        const resp = await RepScheduleSummeryService.RepVendorWiseBill_child(
          params
        );
        const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
        const childArr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
        setVendorChildData((prev) => ({ ...prev, [vid]: childArr }));
      } catch (err) {
        console.error("Error fetching vendor child data:", err);
        toastService.error("Failed to load vendor child data");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    newExpandedRows.push(index);
    setExpandedRows(newExpandedRows);
  };

  return (
    <div>
      <Loader isVisible={loading} fullScreen={true} />
      <Header pageTitle={"Detailed & Vendor Billing Report"} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <style>
        {`
          .run-report-btn {
            background-color: #1C1D20 !important;
            border-color: #1C1D20 !important;
            transition: background-color 0.3s, border-color 0.3s;
          }
          .run-report-btn:hover {
            background-color: #0d6efd !important;
            border-color: #0d6efd !important;
          }
          .custom-calendar-wrapper {
            position: relative;
            width: 100%;
          }
          .custom-calendar-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 22px;
            height: 22px;
            z-index: 2;
            pointer-events: none;
          }
          .custom-calendar-input .p-inputtext {
            padding-left: 35px !important;
          }
          .ota-row-odd > * {
            background-color: #fafafa !important;
          }
          .ota-row-hover:hover > * {
            background-color: #e9ecef !important;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .vendor-table thead th {
            background-color: #f9f9fb !important;
            font-weight: 800;
            color: var(--grey-4);
            border: 1px solid #dee2e6;
            padding: 16px 10px;
            font-size: 13px;
            text-align: left;
            vertical-align: middle;
          }
          .vendor-table tbody td {
            padding: 0.5rem;
            border: 1px solid #dee2e6;
            font-size: 0.875rem;
            text-align: left;
            vertical-align: middle;
          }
          .vendor-table .table-light th {
            background-color: #f9f9fb !important;
          }
          .nested-vendor-table thead th {
            background-color: #f9f9fb !important;
            font-weight: 800;
            color: var(--grey-4);
            border: 1px solid #dee2e6;
            padding: 16px 10px;
            font-size: 13px;
            text-align: left;
          }
          .nested-vendor-table tbody td {
            padding: 0.5rem;
            border: 1px solid #dee2e6;
            font-size: 0.8125rem;
            text-align: left;
          }
          .expansion-icon {
            color: #0d6efd;
            font-size: 20px;
            vertical-align: middle;
            cursor: pointer;
          }
          .expansion-icon:hover {
            color: #0a58ca;
          }
        `}
      </style>

      <div className="middle">
        <div className="card_tb p-3">
          <div className="row g-2">
            <div className="col-12 col-sm-6 col-md-2 col-lg-2">
              <label className="form-label">
                From Date <span>*</span>
              </label>
              <div className="custom-calendar-wrapper">
                <img
                  src={calendarIcon}
                  alt="calendar"
                  className="custom-calendar-icon"
                />
                <Calendar
                  value={fromDate}
                  onChange={(e) => setFromDate(e.value)}
                  dateFormat="mm/dd/yy"
                  className="w-100 custom-calendar-input"
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-2 col-lg-2">
              <label className="form-label">
                To Date <span>*</span>
              </label>
              <div className="custom-calendar-wrapper">
                <img
                  src={calendarIcon}
                  alt="calendar"
                  className="custom-calendar-icon"
                />
                <Calendar
                  value={toDate}
                  onChange={(e) => setToDate(e.value)}
                  dateFormat="mm/dd/yy"
                  className="w-100 custom-calendar-input"
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-3">
              <label className="form-label">
                Report Type <span>*</span>
              </label>
              <Dropdown
                options={reportTypeOptions}
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.value)}
                optionLabel="label"
                placeholder="Select Report Type"
                className="w-100"
                filter
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-3">
              <label className="form-label">
                Facility Name <span>*</span>
              </label>
              <Dropdown
                options={facilities}
                value={selFacility}
                onChange={(e) => setSelFacility(e.target ? e.target.value : e.value)}
                optionLabel="label"
                placeholder="Select Facility"
                className="w-100"
                filter
              />
            </div>
            <div className="col-12 col-sm-6 col-md-2 col-lg-2 d-flex align-items-end">
              <Button
                label="Run Report"
                className="btn btn-primary w-100 run-report-btn"
                onClick={handleRunReport}
              />
            </div>
          </div>
        </div>

        {!showTable && (
          <div className="row">
            <div className="col-12">
              <div className="card_tb">
                <div
                  className="d-flex flex-column align-items-center justify-content-center p-5"
                  style={{ minHeight: "70vh" }}
                >
                  <img
                    src={noReportImage}
                    alt="No Report Selected"
                    style={{
                      maxWidth: "100px",
                      opacity: 0.5,
                      marginBottom: "1rem",
                    }}
                  />
                  <p
                    className="text-muted mb-0"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Please select above parameters to show report data
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showTable && (
          <div className="row">
            <div className="col-12">
              <div className="card_tb">
                <div className="p-3">
                  {renderToolbar()}
                  {appliedReportType === "VENDOR" ? (
                    <div className="table-responsive">
                      <table className="table table-sm mb-0 vendor-table custom-html-table">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "40px" }}></th>
                            <th>Vendor Name</th>
                            <th>Vendor ID</th>
                            <th>Trip Count</th>
                            <th>Trip Amount</th>
                            <th>Guard Count</th>
                            <th>Guard Amount</th>
                            {/* <th>UnSchedule</th> */}
                            <th>Toll Cost</th>
                            <th>Grand Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center p-4">
                                {error ? `Error: ${error}` : "No records found"}
                              </td>
                            </tr>
                          ) : (
                            filteredData.map((row, index) => {
                              const vid = extractVendorId(row);
                              const isExpanded = expandedRows.includes(index);
                              const childData = vendorChildData[vid] || [];

                              return (
                                <React.Fragment key={index}>
                                  <tr
                                    className={`${index % 2 !== 0 ? "ota-row-odd" : ""
                                      } ota-row-hover`}
                                  >
                                    <td>
                                      <a
                                        href="#!"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          toggleRowExpansion(index, row);
                                        }}
                                      >
                                        {isExpanded ? (
                                          <span className="material-icons expansion-icon">
                                            remove_circle
                                          </span>
                                        ) : (
                                          <span className="material-icons expansion-icon">
                                            add_circle
                                          </span>
                                        )}
                                      </a>
                                    </td>
                                    <td style={{ textAlign: "left" }}>
                                      {row.vendorName}
                                    </td>
                                    <td style={{ textAlign: "left" }}>{row.vid}</td>
                                    <td>{row.ScRoute}</td>
                                    <td>{row.Cost}</td>
                                    <td>{row.GuardCount}</td>
                                    <td>{row.RouteGuardCost}</td>
                                    {/* <td>{row.UnSchedule}</td> */}
                                    <td>{row.TollCost}</td>
                                    <td>{row.GrandTotal}</td>
                                  </tr>

                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={8} className="leftStrip p-2">
                                        <div className="expanded-content">
                                          {childData.length === 0 ? (
                                            <p className="text-center text-muted m-3">
                                              No details found
                                            </p>
                                          ) : (
                                            <div className="table-responsive">
                                              <table className="table table-sm table-bordered mb-0 nested-vendor-table custom-html-table">
                                                <thead>
                                                  <tr>
                                                    {/* <th>Vendor Name</th> */}
                                                    <th>Date</th>
                                                    <th>Vehicle Type</th>
                                                    <th>Trip Count</th>
                                                    <th>TripRate</th>
                                                    <th>Trip Amount</th>
                                                    <th>Guard Count</th>
                                                    <th>Guard Amount</th>
                                                    {/* <th>UnSchedule</th> */}
                                                    {/* <th>Unschedule Amount</th> */}
                                                    <th>Toll Cost</th>
                                                    <th>Grand Total</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {childData.map(
                                                    (childRow, cIdx) => (
                                                      <tr
                                                        key={cIdx}
                                                        className={`${cIdx % 2 !== 0
                                                          ? "ota-row-odd"
                                                          : ""
                                                          } ota-row-hover`}
                                                      >
                                                        {/* <td
                                                          style={{
                                                            textAlign: "left",
                                                          }}
                                                        >
                                                          {childRow.vendorName}
                                                        </td> */}
                                                        <td>
                                                          {childRow.Date}
                                                        </td>
                                                        <td>
                                                          {childRow.VehicleType}
                                                        </td>
                                                        <td>
                                                          {childRow.ScRoute}
                                                        </td>
                                                        <td>{childRow.Cost}</td>
                                                        <td>
                                                          {
                                                            childRow.ScheduleAmt
                                                          }
                                                        </td>
                                                        <td>
                                                          {childRow.GuardCount}
                                                        </td>
                                                        <td>
                                                          {
                                                            childRow.RouteGuardCost
                                                          }
                                                        </td>
                                                        {/* <td>
                                                          {childRow.UnSchedule}
                                                        </td>
                                                        <td>
                                                          {
                                                            childRow.UnscheduleAmount
                                                          }
                                                        </td> */}
                                                        <td>
                                                          {childRow.TollCost}
                                                        </td>
                                                        <td>
                                                          {childRow.GrandTotal}
                                                        </td>
                                                      </tr>
                                                    )
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <CustomDataTable
                      value={filteredData}
                      ref={dt}
                      paginator
                      rows={100}
                      tableStyle={{ minWidth: "50rem" }}
                      size="small"
                      loading={loading}
                      emptyMessage={
                        error ? `Error: ${error}` : "No records found"
                      }
                      stripedRows
                      className="p-datatable process-datatable"
                      rowsPerPageOptions={[50, 100, 200, 300]}
                    >
                      {renderDetailedColumns()}
                    </CustomDataTable>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepScheduleSummery;
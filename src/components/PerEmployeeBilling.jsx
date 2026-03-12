import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import PerEmployeeBillingService from "../services/compliance/PerEmployeeBillingService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import TableToolbar from "./common/TableToolbar";
import { MultiSelect } from "primereact/multiselect";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";
import "./common/CustomDataTable.css";

const PerEmployeeBilling = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentReportType, setCurrentReportType] = useState(null);

  const UserID = sessionStorage.getItem("ID");
  const dt = useRef(null);
  const op = useRef(null);
  const filterButtonRef = useRef(null);

  const [globalFilter, setGlobalFilter] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    ProcessName: null,
    VendorName: null,
    ShiftDate: null,
    TripType: null,
  });

  const [nestedReportData, setNestedReportData] = useState([]);
  const [expandedProcesses, setExpandedProcesses] = useState([]);
  const [expandedTripTypes, setExpandedTripTypes] = useState({});
  const [expandedDates, setExpandedDates] = useState({});

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);

  const onPageChange = (event) => {
      setFirst(event.first);
      setRows(event.rows);
  };

  const reportTypes = [
    { label: "Detailed", value: "detailed" },
    { label: "Process Wise", value: "processwise" },
  ];

  useEffect(() => {
    fetchFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredData = React.useMemo(() => {
    if (rawData.length === 0) return [];

    let filtered = [...rawData];

    // Apply Advanced Filters
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (Array.isArray(val) && val.length > 0) {
        filtered = filtered.filter((item) => val.includes(item[key]));
      }
    });

    // Apply Global Search optimally
    if (globalFilter && globalFilter.trim() !== "") {
      const searchLower = globalFilter.toLowerCase();
      filtered = filtered.filter((item) => {
        const valuesToSearch = [
          item.ProcessName, item.VendorName, item.ShiftDate, item.TripType,
          item.RouteId, item.EmployeeId, item.EmployeeName, item.FacilityName, item.Gender, item.ManagerName
        ];
        return valuesToSearch.some(
          (val) =>
            val !== null &&
            val !== undefined &&
            String(val).toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [rawData, filters, globalFilter]);



  const groupProcessData = (data) => {
    const processes = {};

    data.forEach((item) => {
      const process = item.ProcessName || "Unknown";
      if (!processes[process]) {
        processes[process] = {
          ProcessName: process,
          Cost: 0,
          GuardCost: 0,
          TotalCost: 0,
          Employees: 0,
          tripTypes: {},
        };
      }

      const empCount =
        item.TotalCost && item.PerEmpTotalCost
          ? Math.round(item.TotalCost / item.PerEmpTotalCost)
          : 0;

      processes[process].Cost += item.Cost || 0;
      processes[process].GuardCost += item.GuardCost || 0;
      processes[process].TotalCost += item.TotalCost || 0;
      processes[process].Employees += empCount;

      const tripType = item.TripType || "Unknown";
      if (!processes[process].tripTypes[tripType]) {
        processes[process].tripTypes[tripType] = {
          TripType: tripType,
          Cost: 0,
          GuardCost: 0,
          TotalCost: 0,
          Employees: 0,
          dates: {},
        };
      }

      processes[process].tripTypes[tripType].Cost += item.Cost || 0;
      processes[process].tripTypes[tripType].GuardCost += item.GuardCost || 0;
      processes[process].tripTypes[tripType].TotalCost += item.TotalCost || 0;
      processes[process].tripTypes[tripType].Employees += empCount;

      const date = item.ShiftDate || "Unknown";
      if (!processes[process].tripTypes[tripType].dates[date]) {
        processes[process].tripTypes[tripType].dates[date] = {
          ShiftDate: date,
          Cost: 0,
          GuardCost: 0,
          TotalCost: 0,
          Employees: 0,
          rows: [],
        };
      }

      processes[process].tripTypes[tripType].dates[date].Cost += item.Cost || 0;
      processes[process].tripTypes[tripType].dates[date].GuardCost +=
        item.GuardCost || 0;
      processes[process].tripTypes[tripType].dates[date].TotalCost +=
        item.TotalCost || 0;
      processes[process].tripTypes[tripType].dates[date].Employees += empCount;
      processes[process].tripTypes[tripType].dates[date].rows.push(item);
    });

    return Object.values(processes).map((p) => ({
      ...p,
      tripTypes: Object.values(p.tripTypes).map((t) => ({
        ...t,
        dates: Object.values(t.dates),
      })),
    }));
  };
  const memoizedNestedReportData = React.useMemo(() => {
    if (currentReportType === "processwise" && filteredData.length > 0) {
      return groupProcessData(filteredData);
    }
    return [];
  }, [filteredData, currentReportType]);

  useEffect(() => {
    setNestedReportData(memoizedNestedReportData);
  }, [memoizedNestedReportData]);

  const fetchFacilities = async () => {
    try {
      const response = await PerEmployeeBillingService.SelectFacility({
        Userid: UserID,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.facility || item.facilityName,
            value: item.Id,
          }))
        : [];
      setFacilities(formattedData);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      toastService.error("Error fetching facilities");
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleSearch = async () => {
    if (!selectedReportType) {
      toastService.error("Please select a report type");
      return;
    }

    if (!selectedFacility) {
      toastService.error("Please select a facility");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);

    try {
      const params = {
        sDate: formatDate(startDate),
        eDate: formatDate(endDate),
        facilityId: selectedFacility,
      };

      let response;

      if (selectedReportType === "detailed") {
        response = await PerEmployeeBillingService.SPR_PerEmployeeCost(params);
      } else {
        response = await PerEmployeeBillingService.SPR_ProcessWiseCost(params);
      }

      let parsedData = [];
      if (typeof response === "string") {
        parsedData = JSON.parse(response);
      } else if (response && response.data) {
        parsedData =
          typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;
      } else {
        parsedData = response;
      }

      const validatedData = Array.isArray(parsedData)
        ? parsedData
        : [parsedData];

      setRawData(validatedData);
      setReportData(validatedData);
      setCurrentReportType(selectedReportType);

      // Reset expansions
      setExpandedProcesses([]);
      setExpandedTripTypes({});
      setExpandedDates({});

      // Reset Pagination
      setFirst(0);

      setLoading(false);
      setIsSubmitting(false);
      setHasSearched(true);

      setTimeout(() => {
        if (validatedData.length > 0) {
          toastService.success(`Report data fetched successfully.`);
        } else {
          toastService.warn("No records found");
        }
      }, 100);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setRawData([]);
      setReportData([]);
      setError(err.message);
      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        toastService.error("Error fetching report data: " + err.message);
      }, 100);
    }
  };

  const clearAdvancedFilters = () => {
    setFilters({
      ProcessName: null,
      VendorName: null,
      ShiftDate: null,
      TripType: null,
    });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  const getUniqueValues = (field) => {
    const values = rawData.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const toggleProcessExpansion = (processIndex) => {
    const newExpanded = [...expandedProcesses];
    const idx = newExpanded.indexOf(processIndex);

    if (idx > -1) {
      newExpanded.splice(idx, 1);

      // Clear child expansions
      const newTripTypes = { ...expandedTripTypes };
      delete newTripTypes[processIndex];
      setExpandedTripTypes(newTripTypes);

      const newDates = { ...expandedDates };
      Object.keys(newDates).forEach((key) => {
        if (key.startsWith(`${processIndex}-`)) {
          delete newDates[key];
        }
      });
      setExpandedDates(newDates);
    } else {
      newExpanded.push(processIndex);
    }

    setExpandedProcesses(newExpanded);
  };

  const toggleTripTypeExpansion = (processIndex, tripIndex) => {
    const newExpanded = { ...expandedTripTypes };

    if (!newExpanded[processIndex]) {
      newExpanded[processIndex] = [];
    }

    const idx = newExpanded[processIndex].indexOf(tripIndex);
    if (idx > -1) {
      newExpanded[processIndex].splice(idx, 1);

      // Clear child expansions
      const newDates = { ...expandedDates };
      delete newDates[`${processIndex}-${tripIndex}`];
      setExpandedDates(newDates);
    } else {
      newExpanded[processIndex].push(tripIndex);
    }

    setExpandedTripTypes(newExpanded);
  };

  const toggleDateExpansion = (processIndex, tripIndex, dateIndex) => {
    const key = `${processIndex}-${tripIndex}`;
    const newExpanded = { ...expandedDates };

    if (!newExpanded[key]) {
      newExpanded[key] = [];
    }

    const idx = newExpanded[key].indexOf(dateIndex);
    if (idx > -1) {
      newExpanded[key].splice(idx, 1);
    } else {
      newExpanded[key].push(dateIndex);
    }

    setExpandedDates(newExpanded);
  };

  const exportExcel = () => {
    if (currentReportType === "detailed") {
      if (filteredData.length > 0) {
        exportToCSV(
          filteredData,
          `employee_billing_${currentReportType}_${new Date()
            .toISOString()
            .slice(0, 10)}`
        );
      } else {
        toastService.error("No data to export");
      }
      return;
    }

    if (rawData.length > 0) {
      exportToCSV(
        rawData,
        `employee_billing_processwise_${new Date().toISOString().slice(0, 10)}`
      );
      return;
    }

    toastService.error("No data to export");
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

  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header pageTitle="Cost Allocation Report" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Cost Allocation Report</h6>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="startDate" className="form-label">
                    From Date <span>*</span>
                  </label>
                  <div className="custom-calendar-wrapper">
                    <img
                      src={calendarIcon}
                      alt="calendar"
                      className="custom-calendar-icon"
                    />
                    <Calendar
                      id="startDate"
                      className="w-100 custom-calendar-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.value)}
                      dateFormat="mm/dd/yy"
                    />
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="endDate" className="form-label">
                    To Date <span>*</span>
                  </label>
                  <div className="custom-calendar-wrapper">
                    <img
                      src={calendarIcon}
                      alt="calendar"
                      className="custom-calendar-icon"
                    />
                    <Calendar
                      id="endDate"
                      className="w-100 custom-calendar-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.value)}
                      dateFormat="mm/dd/yy"
                    />
                  </div>
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="reportType" className="form-label">
                    Report Type <span>*</span>
                  </label>
                  <Dropdown
                    id="reportType"
                    placeholder="Select Report Type"
                    value={selectedReportType}
                    options={reportTypes}
                    onChange={(e) => setSelectedReportType(e.value)}
                    className="w-100"
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="facility" className="form-label">
                    Facility <span>*</span>
                  </label>
                  <Dropdown
                    id="facility"
                    placeholder="Select Facility"
                    value={selectedFacility}
                    options={facilities}
                    onChange={(e) => setSelectedFacility(e.value)}
                    className="w-100"
                    filter
                  />
                </div>

                <div className="col-12 col-sm-6 col-md-4 col-lg-2 d-flex align-items-end">
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
                      
                      /* ---- Match RepVehUsgVen drill layout ---- */
                      .custom-html-table {
                        width: 100%;
                        border-collapse: collapse;
                      }
                      .custom-html-table th {
                        background-color: #f8f9fa;
                        border-bottom: 2px solid #dee2e6;
                        padding: 0.75rem;
                        font-weight: 600;
                        font-size: 0.875rem;
                      }
                      .custom-html-table td {
                        padding: 0.75rem;
                        border-bottom: 1px solid #dee2e6;
                        font-size: 0.875rem;
                      }

                      .ota-row-hover:hover > td {
                        background-color: #e9ecef !important;
                        cursor: pointer;
                        transition: background-color 0.2s;
                      }

                      /* SINGLE left strip only at the first expanded level */
                      .leftStrip {
                        // border-left: 4px solid #0d6efd !important;
                        // background-color: #f8f9fa !important;
                        padding: 0 !important; /* remove extra padding */
                      }

                      /* inner expanded cell: no additional left strip + no padding */
                      .innerCell {
                        // background-color: #f8f9fa !important;
                        padding: 0 !important;
                      }

                      /* remove the extra padding that was creating gaps */
                      .expanded-content {
                        background-color: #f8f9fa;
                        padding: 0 !important;
                        margin: 0 !important;
                      }

                      .nested-table {
                        width: 100%;
                        border-collapse: collapse;
                        background-color: #fff;
                        margin: 0 !important;
                      }
                      .nested-table th {
                        background-color: #f1f3f4;
                        border: 1px solid #dee2e6;
                        padding: 0.5rem 0.75rem;
                        font-weight: 600;
                        font-size: 0.8125rem;
                      }
                      .nested-table td {
                        border: 1px solid #dee2e6;
                        padding: 0.5rem 0.75rem;
                        font-size: 0.8125rem;
                      }
                      .nested-table .ota-row-hover:hover > td {
                        background-color: #e9ecef !important;
                      }

                      .expand-icon {
                        color: #0d6efd;
                        cursor: pointer;
                        font-size: 20px !important;
                        vertical-align: middle;
                      }
                      .expand-icon:hover {
                        color: #0a58ca;
                      }
                    `}
                  </style>

                  <Button
                    label="Run Report"
                    className="btn btn-primary w-100 run-report-btn"
                    onClick={handleSearch}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card_tb">
              {!hasSearched && (
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
                  <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                    Please select above parameters to show report data
                  </p>
                </div>
              )}

              {hasSearched && (
                <div className="p-3">
                  <TableToolbar
                    search={globalFilter}
                    onSearch={(e) => setGlobalFilter(e.target.value)}
                    onRefresh={handleSearch}
                    onExport={exportExcel}
                    showFilter={true}
                    overlayRef={op}
                    filterButtonRef={filterButtonRef}
                    filters={filters}
                    setFilters={setFilters}
                    activeFilterCount={
                      Object.values(filters).filter(
                        (f) => Array.isArray(f) && f.length > 0
                      ).length
                    }
                  >
                    <div className="p-3">
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="fw-bold mb-1">Process Name</label>
                          <MultiSelect
                            value={filters.ProcessName}
                            options={getUniqueValues("ProcessName")}
                            onChange={(e) =>
                              setFilters({ ...filters, ProcessName: e.value })
                            }
                            placeholder="Select Process"
                            className="w-100"
                            display="chip"
                          />
                        </div>

                        <div className="col-12">
                          <label className="fw-bold mb-1">Vendor Name</label>
                          <MultiSelect
                            value={filters.VendorName}
                            options={getUniqueValues("VendorName")}
                            onChange={(e) =>
                              setFilters({ ...filters, VendorName: e.value })
                            }
                            placeholder="Select Vendor"
                            className="w-100"
                            display="chip"
                          />
                        </div>

                        <div className="col-12">
                          <label className="fw-bold mb-1">Shift Date</label>
                          <MultiSelect
                            value={filters.ShiftDate}
                            options={getUniqueValues("ShiftDate")}
                            onChange={(e) =>
                              setFilters({ ...filters, ShiftDate: e.value })
                            }
                            placeholder="Select Date"
                            className="w-100"
                            display="chip"
                          />
                        </div>

                        <div className="col-12">
                          <label className="fw-bold mb-1">Trip Type</label>
                          <MultiSelect
                            value={filters.TripType}
                            options={getUniqueValues("TripType")}
                            onChange={(e) =>
                              setFilters({ ...filters, TripType: e.value })
                            }
                            placeholder="Select Type"
                            className="w-100"
                            display="chip"
                          />
                        </div>

                        <div className="col-12 d-flex justify-content-end mt-3">
                          <Button
                            label="Clear all filters"
                            icon="pi pi-filter-slash"
                            className="p-button-outlined p-button-secondary w-100"
                            onClick={clearAdvancedFilters}
                            size="small"
                          />
                        </div>
                      </div>
                    </div>
                  </TableToolbar>

                  {currentReportType === "detailed" && (
                    <div className="table-responsive">
                      <CustomDataTable
                        value={filteredData.slice(first, first + rows)}
                        ref={dt}
                        tableStyle={{ minWidth: "50rem" }}
                        size="small"
                        loading={loading}
                        emptyMessage={error ? `Error: ${error}` : "No records found"}
                        stripedRows
                        globalFilter={globalFilter}
                      >
                        <Column field="FacilityName" header="Facility" sortable />
                        <Column field="ShiftDate" header="Shift Date" sortable />
                        <Column field="TripType" header="Trip Type" sortable />
                        <Column field="ShiftTime" header="Shift Time" sortable />
                        <Column field="VendorName" header="Vendor Name" sortable />
                        <Column field="VehicleType" header="Vehicle Type" sortable />
                        <Column field="RouteId" header="Route ID" sortable />
                        <Column field="EmployeeId" header="Employee ID" sortable />
                        <Column field="EmployeeName" header="Employee Name" sortable />
                        <Column field="ManagerName" header="Manager Name" sortable />
                        <Column field="ManagerId" header="Manager ID" sortable />
                        <Column field="Gender" header="Gender" sortable />
                        <Column field="ProcessName" header="Process Name" sortable />
                        <Column field="TravelStatus" header="Travel Status" sortable />
                        <Column
                          field="Cost"
                          header="Cost"
                          sortable
                          body={(rowData) => rowData.Cost?.toFixed(2)}
                        />
                        <Column
                          field="PerEmpCost"
                          header="Per Emp Cost"
                          sortable
                          body={(rowData) => rowData.PerEmpCost?.toFixed(2)}
                        />
                        <Column
                          field="GuardCost"
                          header="Guard Cost"
                          sortable
                          body={(rowData) => rowData.GuardCost?.toFixed(2)}
                        />
                        <Column
                          field="PerEmpGuardCost"
                          header="Per Emp Guard Cost"
                          sortable
                          body={(rowData) => rowData.PerEmpGuardCost?.toFixed(2)}
                        />
                        <Column field="ActPax" header="Act Pax" sortable />
                        <Column field="NoShowPax" header="No Show Pax" sortable />
                        <Column
                          field="TotalCost"
                          header="Total Cost"
                          sortable
                          body={(rowData) => rowData.TotalCost?.toFixed(2)}
                        />
                        <Column
                          field="PerEmpTotalCost"
                          header="Per Emp Total Cost"
                          sortable
                          body={(rowData) => rowData.PerEmpTotalCost?.toFixed(2)}
                        />
                        <Column field="SchPax" header="Sch Pax" sortable />
                      </CustomDataTable>
                      <CustomPaginator
                          first={first}
                          rows={rows}
                          totalRecords={filteredData.length}
                          onPageChange={onPageChange}
                          rowsPerPageOptions={[50, 100, 200, 300]}
                      />
                    </div>
                  )}

                  {currentReportType === "processwise" && (
                    <>
                      {loading ? (
                        <div className="p-4 text-center">Loading...</div>
                      ) : nestedReportData.length > 0 ? (
                        <div className="table-responsive">
                          <table className="custom-html-table">
                            <thead>
                              <tr>
                                <th style={{ width: "50px" }}></th>
                                <th>Process</th>
                                <th>Total Transport Cost</th>
                                <th>Guard Cost</th>
                                <th>Total Cost</th>
                                <th>No. of Employees</th>
                                <th>Cost Per Employee</th>
                              </tr>
                            </thead>

                            <tbody>
                              {nestedReportData.map((process, pIdx) => {
                                const isPExpanded = expandedProcesses.includes(pIdx);
                                const perEmpCost =
                                  process.Employees > 0
                                    ? process.TotalCost / process.Employees
                                    : 0;

                                return (
                                  <React.Fragment key={pIdx}>
                                    {/* Process Level Row */}
                                    <tr className={`${pIdx % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                      <td>
                                        <span
                                          className="material-icons expand-icon"
                                          onClick={() => toggleProcessExpansion(pIdx)}
                                        >
                                          {isPExpanded ? "remove_circle" : "add_circle"}
                                        </span>
                                      </td>
                                      <td className="fw-bold">{process.ProcessName}</td>
                                      <td className="fw-bold">
                                        {process.Cost?.toFixed(2)}
                                      </td>
                                      <td className="fw-bold">
                                        {process.GuardCost?.toFixed(2)}
                                      </td>
                                      <td className="fw-bold">
                                        {process.TotalCost?.toFixed(2)}
                                      </td>
                                      <td className="fw-bold">
                                        {process.Employees}
                                      </td>
                                      <td className="fw-bold">
                                        {perEmpCost?.toFixed(2)}
                                      </td>
                                    </tr>

                                    {/* Trip Type Level - Expanded (ONLY ONE left strip here) */}
                                    {isPExpanded && (
                                      <tr>
                                        <td colSpan="7" className="leftStrip">
                                          <div className="expanded-content">
                                            <table className="nested-table">
                                              <thead>
                                                <tr>
                                                  <th style={{ width: "50px" }}></th>
                                                  <th>Trip Type</th>
                                                  <th>Transport Cost</th>
                                                  <th>Guard Cost</th>
                                                  <th>Total Cost</th>
                                                  <th>No. of Employees</th>
                                                </tr>
                                              </thead>

                                              <tbody>
                                                {process.tripTypes.map((trip, tIdx) => {
                                                  const isTExpanded =
                                                    expandedTripTypes[pIdx]?.includes(tIdx);

                                                  return (
                                                    <React.Fragment key={tIdx}>
                                                      <tr className={`${tIdx % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                                        <td>
                                                          <span
                                                            className="material-icons expand-icon"
                                                            onClick={() =>
                                                              toggleTripTypeExpansion(pIdx, tIdx)
                                                            }
                                                          >
                                                            {isTExpanded
                                                              ? "remove_circle"
                                                              : "add_circle"}
                                                          </span>
                                                        </td>
                                                        <td className="fw-bold">{trip.TripType}</td>
                                                        <td className="fw-bold">
                                                          {trip.Cost?.toFixed(2)}
                                                        </td>
                                                        <td className="fw-bold">
                                                          {trip.GuardCost?.toFixed(2)}
                                                        </td>
                                                        <td className="fw-bold">
                                                          {trip.TotalCost?.toFixed(2)}
                                                        </td>
                                                        <td className="fw-bold">
                                                          {trip.Employees}
                                                        </td>
                                                      </tr>

                                                      {/* Date Level - Expanded (NO leftStrip here) */}
                                                      {isTExpanded && (
                                                        <tr>
                                                          <td colSpan="6" className="innerCell">
                                                            <div className="expanded-content">
                                                              <table className="nested-table">
                                                                <thead>
                                                                  <tr>
                                                                    <th
                                                                      style={{ width: "50px" }}
                                                                    ></th>
                                                                    <th>Date</th>
                                                                    <th>
                                                                      Total Cost
                                                                    </th>
                                                                    <th>
                                                                      No. of Employees
                                                                    </th>
                                                                  </tr>
                                                                </thead>

                                                                <tbody>
                                                                  {trip.dates.map((date, dIdx) => {
                                                                    const isDExpanded =
                                                                      expandedDates[`${pIdx}-${tIdx}`]?.includes(
                                                                        dIdx
                                                                      );

                                                                    return (
                                                                      <React.Fragment key={dIdx}>
                                                                        <tr className={`${dIdx % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                                                          <td>
                                                                            <span
                                                                              className="material-icons expand-icon"
                                                                              onClick={() =>
                                                                                toggleDateExpansion(
                                                                                  pIdx,
                                                                                  tIdx,
                                                                                  dIdx
                                                                                )
                                                                              }
                                                                            >
                                                                              {isDExpanded
                                                                                ? "remove_circle"
                                                                                : "add_circle"}
                                                                            </span>
                                                                          </td>
                                                                          <td className="fw-bold">
                                                                            {date.ShiftDate}
                                                                          </td>
                                                                          <td className="fw-bold">
                                                                            {date.TotalCost?.toFixed(2)}
                                                                          </td>
                                                                          <td className="fw-bold">
                                                                            {date.Employees}
                                                                          </td>
                                                                        </tr>

                                                                        {/* Detail Rows - Expanded (NO leftStrip here) */}
                                                                        {isDExpanded && (
                                                                          <tr>
                                                                            <td colSpan="4" className="innerCell">
                                                                              <div className="expanded-content">
                                                                                <table className="nested-table">
                                                                                  <thead>
                                                                                    <tr>
                                                                                      <th>Shift Time</th>
                                                                                      <th>Vendor</th>
                                                                                      <th>Vehicle</th>
                                                                                      <th>
                                                                                        Cost
                                                                                      </th>
                                                                                      <th>
                                                                                        Per Emp Cost
                                                                                      </th>
                                                                                    </tr>
                                                                                  </thead>

                                                                                  <tbody>
                                                                                    {date.rows.map(
                                                                                      (row, rIdx) => (
                                                                                        <tr
                                                                                          key={rIdx}
                                                                                          className={`${rIdx % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}
                                                                                        >
                                                                                          <td>{row.ShiftTime}</td>
                                                                                          <td>{row.VendorName}</td>
                                                                                          <td>{row.VehicleType}</td>
                                                                                          <td>
                                                                                            {row.TotalCost?.toFixed(2)}
                                                                                          </td>
                                                                                          <td>
                                                                                            {row.PerEmpTotalCost?.toFixed(2)}
                                                                                          </td>
                                                                                        </tr>
                                                                                      )
                                                                                    )}
                                                                                  </tbody>
                                                                                </table>
                                                                              </div>
                                                                            </td>
                                                                          </tr>
                                                                        )}
                                                                      </React.Fragment>
                                                                    );
                                                                  })}
                                                                </tbody>
                                                              </table>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      )}
                                                    </React.Fragment>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted">
                          {error ? `Error: ${error}` : "No records found"}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PerEmployeeBilling;
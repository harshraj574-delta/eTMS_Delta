import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { CustomDataTable } from "./common/CustomDataTable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { OverlayPanel } from "primereact/overlaypanel";
import OTAReportService from "../services/compliance/OTAReportService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";
import TableToolbar from "./common/TableToolbar";

const OTAReport = () => {
  const [facilities, setFacilities] = useState([]);
  const [vendors, setVendors] = useState([
    { label: "-All Vendors-", value: 0 },
  ]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(0);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [currentReportType, setCurrentReportType] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [detailedData, setDetailedData] = useState([]);
  const [rawShiftData, setRawShiftData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({
    Unit: null,
    TripDate: null,
    Shift: null,
    RouteID: null,
    Vendor: null,
    OTA_Category: null,
  });

  const UserID = sessionStorage.getItem("ID");
  const dt = useRef(null);
  const op = useRef(null);
  const filterButtonRef = useRef(null);

  const reportTypes = [
    { label: "Detailed", value: "detailed" },
    { label: "Date Wise", value: "shiftwise" },
    { label: "Vendor Wise", value: "vendorwise" },
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchVendors();
    }
  }, [selectedFacility]);

  // Debouncing is now handled by TableToolbar onSearch so we don't need setTimeout here.

  const fetchFacilities = async () => {
    try {
      const response = await OTAReportService.SelectFacility({
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

  const fetchVendors = async () => {
    try {
      const response = await OTAReportService.GetVendorByFacility({
        facilityId: selectedFacility,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.vendor || item.vendorName,
            value: item.Id,
          }))
        : [];
      setVendors([{ label: "-All Vendors-", value: 0 }, ...formattedData]);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      toastService.error("Error fetching vendors");
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

  const groupShiftDataByDate = (shiftData) => {
    const grouped = {};

    shiftData.forEach((shift) => {
      const date = shift.shiftDate;
      if (!grouped[date]) {
        grouped[date] = {
          shiftDate: date,
          shifts: [],
          TotalCabs: 0,
          Arrived: 0,
          OnTime: 0,
          Delayed: 0,
        };
      }
      grouped[date].shifts.push(shift);
      grouped[date].TotalCabs += shift.TotalCabs || 0;
      grouped[date].Arrived += shift.Arrived || 0;
      grouped[date].OnTime += shift.OnTime || 0;
      grouped[date].Delayed += shift.Delayed || 0;
    });

    return Object.values(grouped).map((group) => {
      const onTimePer =
        group.TotalCabs > 0
          ? ((group.OnTime / group.TotalCabs) * 100).toFixed(1)
          : 0;
      const delayedPer =
        group.TotalCabs > 0
          ? ((group.Delayed / group.TotalCabs) * 100).toFixed(1)
          : 0;

      return {
        ...group,
        OnTimePer: parseFloat(onTimePer),
        DelayedPer: parseFloat(delayedPer),
      };
    });
  };

  const groupVendorDataByVendor = (vendorData) => {
    const grouped = {};

    vendorData.forEach((item) => {
      // Group by Vendor Name (or ID if available, but using name as per previous logic)
      const vendorName = item.Vendor || item.vendorName || "Unknown Vendor";
      
      if (!grouped[vendorName]) {
        grouped[vendorName] = {
          vendorName: vendorName,
          dailyData: [],
          TotalCabs: 0,
          Arrived: 0,
          OnTime: 0,
          Delayed: 0,
        };
      }
      
      // Add standard fields that might be useful for the parent row
      // We are aggregating totals
      grouped[vendorName].TotalCabs += item.TotalCabs || 0;
      grouped[vendorName].Arrived += item.Arrived || 0;
      grouped[vendorName].OnTime += item.OnTime || 0;
      grouped[vendorName].Delayed += item.Delayed || 0;
      
      // Push the daily item (which represents a shift/date for that vendor)
      grouped[vendorName].dailyData.push(item);
    });

    return Object.values(grouped).map((group) => {
      const onTimePer =
        group.TotalCabs > 0
          ? ((group.OnTime / group.TotalCabs) * 100).toFixed(1)
          : 0;
      const delayedPer =
        group.TotalCabs > 0
          ? ((group.Delayed / group.TotalCabs) * 100).toFixed(1)
          : 0;

      return {
        ...group,
        OnTimePer: parseFloat(onTimePer),
        DelayedPer: parseFloat(delayedPer),
      };
    });
  };

  const filteredData = React.useMemo(() => {
    let filtered = [...reportData];

    if (currentReportType === "detailed") {
      Object.keys(filters).forEach((key) => {
        const val = filters[key];
        if (Array.isArray(val) && val.length > 0) {
          filtered = filtered.filter((item) => val.includes(item[key]));
        }
      });
    }

    if (globalFilter && globalFilter.trim() !== "") {
      const searchLower = globalFilter.toLowerCase();
      filtered = filtered.filter((item) => {
        if (currentReportType === "detailed") {
          const valuesToSearch = [
            item.Unit, item.TripDate, item.Shift, item.RouteID, item.Vendor, item.OTA_Category,
            item.vendorName, item.driverName, item.vehicleNo, item.tripType
          ];
          return valuesToSearch.some((val) =>
            val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
          );
        } else {
          // For aggregated date / vendor views
          const mainRowMatch = [item.shiftDate, item.vendorName, item.TotalCabs, item.Arrived].some((val) =>
            val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
          );
          
          if (mainRowMatch) return true;

          const nestedMatch =
            (item.shifts &&
              item.shifts.some((shift) =>
                [shift.shiftTime, shift.TotalCabs, shift.Arrived].some((val) =>
                  val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
                )
              )) ||
            (item.dailyData &&
              item.dailyData.some((day) =>
                [day.shiftDate, day.TotalCabs, day.Arrived].some((val) =>
                  val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
                )
              ));
          return nestedMatch;
        }
      });
    }

    return filtered;
  }, [reportData, filters, globalFilter, currentReportType]);

  const handleSearch = async () => {
    if (!selectedReportType) {
      toastService.error("Please select a report type");
      return;
    }

    if (!selectedFacility) {
      toastService.error("Please select a facility");
      return;
    }

    if (selectedReportType === "detailed" && selectedVendor === null) {
      toastService.error("Please select a vendor");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setExpandedRows([]);
    setGlobalFilter("");
    setFilters({
      Unit: null,
      TripDate: null,
      Shift: null,
      RouteID: null,
      Vendor: null,
      OTA_Category: null,
    });

    try {
      const params = {
        sDate: formatDate(startDate),
        eDate: formatDate(endDate),
        facilityId: selectedFacility,
      };

      let response;

      switch (selectedReportType) {
        case "detailed":
          response = await OTAReportService.RepOTAdetail({
            ...params,
            vendorId: selectedVendor,
          });
          break;
        case "shiftwise":
          response = await OTAReportService.RptArrivalShiftWise(params);
          break;
        case "vendorwise":
          response = await OTAReportService.RptArrivalVendorWise(params);
          break;
        default:
          throw new Error("Invalid report type");
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

      if (selectedReportType === "shiftwise") {
        setRawShiftData(validatedData);
        const groupedData = groupShiftDataByDate(validatedData);
        setReportData(groupedData);
      } else if (selectedReportType === "vendorwise") {
        const groupedVendorData = groupVendorDataByVendor(validatedData);
        setReportData(groupedVendorData);
        setDetailedData(validatedData);
      } else {
        setReportData(validatedData);
      }

      if (selectedReportType === "shiftwise") {
        const detailResponse = await OTAReportService.RepOTAdetail({
          ...params,
          vendorId: 0,
        });

        let detailParsedData = [];
        if (typeof detailResponse === "string") {
          detailParsedData = JSON.parse(detailResponse);
        } else if (detailResponse && detailResponse.data) {
          detailParsedData =
            typeof detailResponse.data === "string"
              ? JSON.parse(detailResponse.data)
              : detailResponse.data;
        } else {
          detailParsedData = detailResponse;
        }

        const detailValidatedData = Array.isArray(detailParsedData)
          ? detailParsedData
          : [detailParsedData];

        setDetailedData(detailValidatedData);
      }

      setCurrentReportType(selectedReportType);
      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        if (validatedData.length > 0) {
          toastService.success("Report data fetched successfully.");
        } else {
          toastService.warn("No records found");
        }
      }, 100);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setReportData([]);
      setDetailedData([]);
      setError(err.message);

      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        toastService.error("Error fetching report data: " + err.message);
      }, 100);
    }
  };

  const exportExcel = () => {
    const fileName = `ota_report_${currentReportType}_${new Date()
      .toISOString()
      .slice(0, 10)}`;

    if (currentReportType === "detailed") {
      if (dt.current) {
        dt.current.exportCSV({ fileName });
      }
      return;
    }

    if (currentReportType === "shiftwise") {
      if (rawShiftData.length === 0) {
        toastService.error("No data to export");
        return;
      }
      exportToCSV(rawShiftData, fileName);
      return;
    }

    if (currentReportType === "vendorwise") {
      if (detailedData.length === 0) {
        toastService.error("No data to export");
        return;
      }
      exportToCSV(detailedData, fileName);
      return;
    }
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

  const formatArrivalTime = (rowData) => {
    if (!rowData.ArrivalTime) return "-";
    const date = new Date(rowData.ArrivalTime);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleRowExpansion = (index) => {
    const newExpandedRows = [...expandedRows];
    const rowIndex = newExpandedRows.indexOf(index);
    if (rowIndex > -1) {
      newExpandedRows.splice(rowIndex, 1);
    } else {
      newExpandedRows.push(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const getUniqueValues = (field) => {
    const values = reportData.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const clearAdvancedFilters = () => {
    setFilters({
      Unit: null,
      TripDate: null,
      Shift: null,
      RouteID: null,
      Vendor: null,
      OTA_Category: null,
    });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  const renderToolbar = () => {
    const activeFilterCount = Object.values(filters).filter(
      (f) => Array.isArray(f) && f.length > 0
    ).length;

    return (
      <TableToolbar
        search={globalFilter}
        onSearch={(e) => setGlobalFilter(e.target.value)}
        onRefresh={() => handleSearch()}
        onExport={exportExcel}
        filters={filters}
        setFilters={setFilters}
        overlayRef={op}
        filterButtonRef={filterButtonRef}
      >
        {currentReportType === "detailed" ? (
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
                      Refine detailed OTA report
                    </div>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <span
                    className="badge bg-primary"
                    style={{ fontSize: "0.7rem", borderRadius: "999px" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </div>
            </div>

            <div className="ota-filter-body">
              <div className="ota-filter-field">
                <label className="ota-filter-label">Facility</label>
                <MultiSelect
                  value={filters.Unit}
                  options={getUniqueValues("Unit")}
                  onChange={(e) =>
                    setFilters({ ...filters, Unit: e.value })
                  }
                  placeholder="Select facilities"
                  maxSelectedLabels={2}
                  className="w-100 p-inputtext-sm"
                  display="chip"
                  showClear
                />
              </div>

              <div className="ota-filter-field">
                <label className="ota-filter-label">Trip Date</label>
                <MultiSelect
                  value={filters.TripDate}
                  options={getUniqueValues("TripDate")}
                  onChange={(e) =>
                    setFilters({ ...filters, TripDate: e.value })
                  }
                  placeholder="Select dates"
                  maxSelectedLabels={2}
                  className="w-100 p-inputtext-sm"
                  display="chip"
                  showClear
                />
              </div>

              <div className="ota-filter-field">
                <label className="ota-filter-label">Shift</label>
                <MultiSelect
                  value={filters.Shift}
                  options={getUniqueValues("Shift")}
                  onChange={(e) =>
                    setFilters({ ...filters, Shift: e.value })
                  }
                  placeholder="Select shifts"
                  maxSelectedLabels={2}
                  className="w-100 p-inputtext-sm"
                  display="chip"
                  showClear
                />
              </div>

              <div className="ota-filter-field">
                <label className="ota-filter-label">Route ID</label>
                <MultiSelect
                  value={filters.RouteID}
                  options={getUniqueValues("RouteID")}
                  onChange={(e) =>
                    setFilters({ ...filters, RouteID: e.value })
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
                <label className="ota-filter-label">Vendor</label>
                <MultiSelect
                  value={filters.Vendor}
                  options={getUniqueValues("Vendor")}
                  onChange={(e) =>
                    setFilters({ ...filters, Vendor: e.value })
                  }
                  placeholder="Select vendors"
                  maxSelectedLabels={2}
                  className="w-100 p-inputtext-sm"
                  display="chip"
                  showClear
                />
              </div>

              <div className="ota-filter-field">
                <label className="ota-filter-label">OTA Category</label>
                <MultiSelect
                  value={filters.OTA_Category}
                  options={getUniqueValues("OTA_Category")}
                  onChange={(e) =>
                    setFilters({ ...filters, OTA_Category: e.value })
                  }
                  placeholder="Select categories"
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
              Advanced filters are only available for Detailed reports.
            </p>
          </div>
        )}
      </TableToolbar>
    );
  };

  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header pageTitle="OTA Reports" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">On Time Arrival Reports</h6>
          </div>
        </div>

        {/* Top filters */}
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="startDate" className="form-label">
                    From Date <span>*</span>
                  </label>
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
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
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
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
                    onChange={(e) => {
                      setSelectedReportType(e.value);
                      if (e.value !== "detailed") {
                        setSelectedVendor(0);
                      }
                    }}
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
                    onChange={(e) => {
                      setSelectedFacility(e.value);
                      setSelectedVendor(null);
                    }}
                    className="w-100"
                    filter
                  />
                </div>
                {selectedReportType === "detailed" && (
                  <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                    <label htmlFor="vendor" className="form-label">
                      Vendor <span>*</span>
                    </label>
                    <Dropdown
                      id="vendor"
                      value={selectedVendor}
                      options={vendors}
                      placeholder="Select Vendor"
                      onChange={(e) => setSelectedVendor(e.value)}
                      className="w-100"
                      filter
                    />
                  </div>
                )}
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
                      .ota-row-odd > * {
                        background-color: #fafafa !important;
                      }
                      .ota-row-hover:hover > * {
                        background-color: #e9ecef !important;
                        cursor: pointer;
                        transition: background-color 0.2s;
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

        {/* Main report card */}
        <div className="row">
          <div className="col-12">
            <div className="card_tb">
              {!currentReportType && (
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
              )}

              {currentReportType && (
                <div className="p-3">
                  {renderToolbar()}

                  {currentReportType === "detailed" && (
                    <div className="table-responsive">
                      <CustomDataTable
                        value={filteredData}
                        ref={dt}
                        paginator
                        rows={50}
                        tableStyle={{ minWidth: "50rem" }}
                        size="small"
                        loading={loading}
                        emptyMessage={
                          error ? `Error: ${error}` : "No records found"
                        }
                        stripedRows
                        rowsPerPageOptions={[50, 100, 200, 300]}
                      >
                        <Column field="Unit" header="Facility" sortable />
                        <Column field="TripDate" header="Trip Date" sortable />
                        <Column field="Shift" header="Shift" sortable />
                        <Column
                          field="ActShift"
                          header="Reporting Time"
                          sortable
                        />
                        <Column field="RouteID" header="Route ID" sortable />
                        <Column
                          field="PlanVendor"
                          header="Plan Vendor"
                          sortable
                        />
                        <Column field="Vendor" header="Vendor" sortable />
                        <Column field="DAY" header="Day" sortable />
                        <Column field="ZONE" header="Zone" sortable />
                        <Column field="Area" header="Area" sortable />
                        <Column
                          field="DriverCode"
                          header="Driver Code"
                          sortable
                        />
                        <Column
                          field="ActualCabNo"
                          header="Actual Cab No"
                          sortable
                        />
                        <Column
                          field="ArrivalTime"
                          header="Arr/Dep Time"
                          sortable
                          body={formatArrivalTime}
                        />
                        <Column field="TIME" header="Time" sortable />
                        <Column field="Remark" header="Trip Remark" sortable />
                        <Column field="NoOfPax" header="No Of Pax" sortable />
                        <Column
                          field="OTA_Category"
                          header="OTA/OTD Category"
                          sortable
                        />
                      </CustomDataTable>
                    </div>
                  )}

                  {currentReportType === "shiftwise" && (
                    <div className="table-responsive">
                      <table className="table table-sm mb-0 custom-html-table">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "40px" }} />
                            <th className="text-center">Shift Date</th>
                            <th className="text-center d-none d-md-table-cell">
                              Total Cabs
                            </th>
                            <th className="text-center d-none d-md-table-cell">
                              Arrived
                            </th>
                            <th className="text-center">On Time</th>
                            <th className="text-center d-none d-lg-table-cell">
                              On Time %
                            </th>
                            <th className="text-center">Delayed</th>
                            <th className="text-center d-none d-lg-table-cell">
                              Delayed %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((row, index) => (
                            <React.Fragment key={index}>
                              <tr className={`${index % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                <td>
                                  <a
                                    href="#!"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleRowExpansion(index);
                                    }}
                                  >
                                    {expandedRows.includes(index) ? (
                                      <span
                                        className="material-icons"
                                        style={{ fontSize: "20px" }}
                                      >
                                        remove_circle
                                      </span>
                                    ) : (
                                      <span
                                        className="material-icons"
                                        style={{ fontSize: "20px" }}
                                      >
                                        add_circle
                                      </span>
                                    )}
                                  </a>
                                </td>
                                <td className="text-center">{row.shiftDate}</td>
                                <td className="text-center d-none d-md-table-cell">
                                  {row.TotalCabs}
                                </td>
                                <td className="text-center d-none d-md-table-cell">
                                  {row.Arrived}
                                </td>
                                <td className="text-center">{row.OnTime}</td>
                                <td className="text-center d-none d-lg-table-cell">
                                  {row.OnTimePer}
                                </td>
                                <td className="text-center">{row.Delayed}</td>
                                <td className="text-center d-none d-lg-table-cell">
                                  {row.DelayedPer}
                                </td>
                              </tr>

                              {expandedRows.includes(index) && (
                                <tr>
                                  <td colSpan={8} className="leftStrip p-2">
                                    <div className="expanded-content">
                                      <div className="table-responsive">
                                        <table className="table table-sm table-bordered mb-0">
                                          <thead>
                                            <tr>
                                              <th>Shift</th>
                                              <th>Total Cabs</th>
                                              <th>Arrived</th>
                                              <th>On Time</th>
                                              <th className="d-none d-md-table-cell">
                                                On Time %
                                              </th>
                                              <th>Delayed</th>
                                              <th className="d-none d-md-table-cell">
                                                Delayed %
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {row.shifts &&
                                              row.shifts.map((shift, sIdx) => (
                                                <tr key={sIdx} className={`${sIdx % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                                  <td>{shift.shiftTime}</td>
                                                  <td>{shift.TotalCabs}</td>
                                                  <td>{shift.Arrived}</td>
                                                  <td>{shift.OnTime}</td>
                                                  <td className="d-none d-md-table-cell">
                                                    {shift.OnTimePer}
                                                  </td>
                                                  <td>{shift.Delayed}</td>
                                                  <td className="d-none d-md-table-cell">
                                                    {shift.DelayedPer}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {currentReportType === "vendorwise" && (
                    <div className="table-responsive">
                      <table className="table table-sm mb-0 custom-html-table">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "40px" }} />
                            <th className="text-center">Vendor Name</th>
                            <th className="text-center d-none d-md-table-cell">
                              Total Cabs
                            </th>
                            <th className="text-center d-none d-md-table-cell">
                              Arrived
                            </th>
                            <th className="text-center">On Time</th>
                            <th className="text-center d-none d-lg-table-cell">
                              On Time %
                            </th>
                            <th className="text-center">Delayed</th>
                            <th className="text-center d-none d-lg-table-cell">
                              Delayed %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((row, index) => (
                            <React.Fragment key={index}>
                              <tr className={`${index % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                <td>
                                  <a
                                    href="#!"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleRowExpansion(index);
                                    }}
                                  >
                                    {expandedRows.includes(index) ? (
                                      <span
                                        className="material-icons"
                                        style={{ fontSize: "20px" }}
                                      >
                                        remove_circle
                                      </span>
                                    ) : (
                                      <span
                                        className="material-icons"
                                        style={{ fontSize: "20px" }}
                                      >
                                        add_circle
                                      </span>
                                    )}
                                  </a>
                                </td>
                                <td className="text-center">{row.vendorName}</td>
                                <td className="text-center d-none d-md-table-cell">
                                  {row.TotalCabs}
                                </td>
                                <td className="text-center d-none d-md-table-cell">
                                  {row.Arrived}
                                </td>
                                <td className="text-center">{row.OnTime}</td>
                                <td className="text-center d-none d-lg-table-cell">
                                  {row.OnTimePer}
                                </td>
                                <td className="text-center">{row.Delayed}</td>
                                <td className="text-center d-none d-lg-table-cell">
                                  {row.DelayedPer}
                                </td>
                              </tr>

                              {expandedRows.includes(index) && (
                                <tr>
                                  <td colSpan={8} className="leftStrip p-2">
                                    <div className="expanded-content">
                                      {row.dailyData && row.dailyData.length === 0 ? (
                                        <p>No daily records found</p>
                                      ) : (
                                        <div className="table-responsive">
                                          <table className="table table-sm table-bordered mb-0">
                                            <thead>
                                              <tr>
                                                <th>Date</th>
                                                <th>Total Cabs</th>
                                                <th>Arrived</th>
                                                <th>On Time</th>
                                                <th className="d-none d-md-table-cell">
                                                  On Time %
                                                </th>
                                                <th>Delayed</th>
                                                <th className="d-none d-md-table-cell">
                                                  Delayed %
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {row.dailyData &&
                                                row.dailyData.map(
                                                  (dayData, vIdx) => (
                                                    <tr key={vIdx} className={`${vIdx % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                                      <td>
                                                        {dayData.shiftDate}
                                                      </td>
                                                      <td>{dayData.TotalCabs}</td>
                                                      <td>{dayData.Arrived}</td>
                                                      <td>{dayData.OnTime}</td>
                                                      <td className="d-none d-md-table-cell">
                                                        {dayData.OnTimePer}
                                                      </td>
                                                      <td>{dayData.Delayed}</td>
                                                      <td className="d-none d-md-table-cell">
                                                        {dayData.DelayedPer}
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
                          ))}
                        </tbody>
                      </table>
                    </div>
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

export default OTAReport;
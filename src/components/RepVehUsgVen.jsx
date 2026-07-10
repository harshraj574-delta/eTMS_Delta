import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import RepVehUsgVenService from "../services/compliance/RepVehUsgVenService";
import { toastService } from "../services/toastService";
import TableToolbar from "./common/TableToolbar";
import "./common/CustomDataTable.css";
import { MultiSelect } from "primereact/multiselect";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";
import ReportButton from "./common/ReportButton";

const VehicleUtilizationReport = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedTripType, setSelectedTripType] = useState("P");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedDates, setExpandedDates] = useState([]);
  const [expandedShifts, setExpandedShifts] = useState({});
  const [expandedVendorRows, setExpandedVendorRows] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({
    Vendor: null
  });
  const [hasSearched, setHasSearched] = useState(false);

  const UserID = sessionStorage.getItem("ID");
  const op = useRef(null);
  const filterButtonRef = useRef(null);

  const reportData = React.useMemo(() => {
    if (rawData.length === 0) {
      return [];
    }

    let filtered = [...rawData];

    // Apply Advanced Filters
    if (filters.Vendor && filters.Vendor.length > 0) {
      filtered = filtered.filter(item => filters.Vendor.includes(item.Vendor));
    }

    // Apply Global Search optimally
    if (globalFilter && globalFilter.trim() !== "") {
      const searchLower = globalFilter.toLowerCase();
      filtered = filtered.filter(item => {
        const valuesToSearch = [
            item.shiftDate, item.shiftTime, item.Vendor, item.TotalRoutes, item.TotalCapacity
        ];
        return valuesToSearch.some(val =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
        );
      });
    }

    return groupDataByDateVendorVehicle(filtered);
  }, [rawData, filters, globalFilter]);

  const getUniqueValues = (field) => {
    const values = rawData.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const clearAdvancedFilters = () => {
    setFilters({ Vendor: null });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  const tripTypes = [
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" },
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await RepVehUsgVenService.SelectFacility({
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
    } catch (error) {
      console.error("Error fetching facilities:", error);
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

  function groupDataByDateVendorVehicle(data) {
    const groupedByDate = {};

    data.forEach((item) => {
      const date = item.shiftDate;
      const shiftTime = item.shiftTime;

      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          shiftDate: date,
          shifts: {},
          TotalRoutes: 0,
          TotalCapacity: 0,
          TotalEmps: 0,
          ActTotalEmps: 0,
        };
      }

      const dateGroup = groupedByDate[date];

      if (!dateGroup.shifts[shiftTime]) {
        dateGroup.shifts[shiftTime] = {
          shiftTime: shiftTime,
          vendors: {},
          TotalRoutes: 0,
          TotalCapacity: 0,
          TotalEmps: 0,
          ActTotalEmps: 0,
        };
      }

      const shiftGroup = dateGroup.shifts[shiftTime];
      const vendor = item.Vendor;

      if (!shiftGroup.vendors[vendor]) {
        shiftGroup.vendors[vendor] = {
          Vendor: vendor,
          vehicles: [],
          TotalRoutes: 0,
          TotalCapacity: 0,
          TotalEmps: 0,
          ActTotalEmps: 0,
        };
      }

      shiftGroup.vendors[vendor].vehicles.push(item);
      shiftGroup.vendors[vendor].TotalRoutes += item.TotalRoutes || 0;
      shiftGroup.vendors[vendor].TotalCapacity += item.TotalCapacity || 0;
      shiftGroup.vendors[vendor].TotalEmps += item.TotalEmps || 0;
      shiftGroup.vendors[vendor].ActTotalEmps += item.ActTotalEmps || 0;

      shiftGroup.TotalRoutes += item.TotalRoutes || 0;
      shiftGroup.TotalCapacity += item.TotalCapacity || 0;
      shiftGroup.TotalEmps += item.TotalEmps || 0;
      shiftGroup.ActTotalEmps += item.ActTotalEmps || 0;

      dateGroup.TotalRoutes += item.TotalRoutes || 0;
      dateGroup.TotalCapacity += item.TotalCapacity || 0;
      dateGroup.TotalEmps += item.TotalEmps || 0;
      dateGroup.ActTotalEmps += item.ActTotalEmps || 0;
    });

    return Object.values(groupedByDate).map((dateGroup) => {
      const planUtilPer =
        dateGroup.TotalCapacity > 0
          ? ((dateGroup.TotalEmps / dateGroup.TotalCapacity) * 100).toFixed(2)
          : 0;
      const actOccPer =
        dateGroup.TotalCapacity > 0
          ? ((dateGroup.ActTotalEmps / dateGroup.TotalCapacity) * 100).toFixed(
            2
          )
          : 0;

      const shifts = Object.values(dateGroup.shifts).map((shiftGroup) => {
        const sPlanUtilPer =
          shiftGroup.TotalCapacity > 0
            ? (
              (shiftGroup.TotalEmps / shiftGroup.TotalCapacity) *
              100
            ).toFixed(2)
            : 0;
        const sActOccPer =
          shiftGroup.TotalCapacity > 0
            ? (
              (shiftGroup.ActTotalEmps / shiftGroup.TotalCapacity) *
              100
            ).toFixed(2)
            : 0;

        const vendors = Object.values(shiftGroup.vendors).map((vendorGroup) => {
          const vPlanUtilPer =
            vendorGroup.TotalCapacity > 0
              ? (
                (vendorGroup.TotalEmps / vendorGroup.TotalCapacity) *
                100
              ).toFixed(2)
              : 0;
          const vActOccPer =
            vendorGroup.TotalCapacity > 0
              ? (
                (vendorGroup.ActTotalEmps / vendorGroup.TotalCapacity) *
                100
              ).toFixed(2)
              : 0;

          return {
            ...vendorGroup,
            PlanOccPer: parseFloat(vPlanUtilPer),
            ActOccPer: parseFloat(vActOccPer),
          };
        });

        return {
          ...shiftGroup,
          vendors,
          PlanOccPer: parseFloat(sPlanUtilPer),
          ActOccPer: parseFloat(sActOccPer),
        };
      });

      return {
        ...dateGroup,
        shifts,
        PlanOccPer: parseFloat(planUtilPer),
        ActOccPer: parseFloat(actOccPer),
      };
    });
  };

  const handleSearch = async () => {
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
        tripType: selectedTripType,
      };

      const response = await RepVehUsgVenService.RptVehUsgVen(params);

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
      // reportData will be updated by useEffect

      setLoading(false);
      setIsSubmitting(false);
      setHasSearched(true);

      setTimeout(() => {
        if (validatedData.length > 0) {
          toastService.success(
            `Report data fetched successfully. ${validatedData.length} records found.`
          );
        } else {
          toastService.warn("No records found");
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
      setRawData([]);
      setError(error.message);

      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        toastService.error("Error fetching report data: " + error.message);
      }, 100);
    }
  };

  const exportExcel = () => {
    if (rawData.length === 0) {
      toastService.error("No data to export");
      return;
    }
    const fileName = `vehicle_utilization_report_${new Date()
      .toISOString()
      .slice(0, 10)}`;
    exportToCSV(rawData, fileName);
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

  const toggleDateExpansion = (index) => {
    const newExpandedDates = [...expandedDates];
    const dateIndex = newExpandedDates.indexOf(index);
    if (dateIndex > -1) {
      newExpandedDates.splice(dateIndex, 1);
      // Clear shift and vendor expansions for this date
      const newExpandedShifts = { ...expandedShifts };
      const newExpandedVendors = { ...expandedVendorRows };
      delete newExpandedShifts[index];
      delete newExpandedVendors[index];
      setExpandedShifts(newExpandedShifts);
      setExpandedVendorRows(newExpandedVendors);
    } else {
      newExpandedDates.push(index);
    }
    setExpandedDates(newExpandedDates);
  };

  const toggleShiftExpansion = (dateIndex, shiftIndex) => {
    const newExpandedShifts = { ...expandedShifts };

    if (!newExpandedShifts[dateIndex]) {
      newExpandedShifts[dateIndex] = [];
    }

    const shiftIndexPos = newExpandedShifts[dateIndex].indexOf(shiftIndex);
    if (shiftIndexPos > -1) {
      newExpandedShifts[dateIndex].splice(shiftIndexPos, 1);
      // Clear vendor expansions for this shift
      const newExpandedVendors = { ...expandedVendorRows };
      delete newExpandedVendors[`${dateIndex}-${shiftIndex}`];
      setExpandedVendorRows(newExpandedVendors);
    } else {
      newExpandedShifts[dateIndex].push(shiftIndex);
    }

    setExpandedShifts(newExpandedShifts);
  };

  const toggleVendorExpansion = (dateIndex, shiftIndex, vendorIndex) => {
    const key = `${dateIndex}-${shiftIndex}`;
    const newExpandedVendors = { ...expandedVendorRows };

    if (!newExpandedVendors[key]) {
      newExpandedVendors[key] = [];
    }

    const vendorIndexPos = newExpandedVendors[key].indexOf(vendorIndex);
    if (vendorIndexPos > -1) {
      newExpandedVendors[key].splice(vendorIndexPos, 1);
    } else {
      newExpandedVendors[key].push(vendorIndex);
    }

    setExpandedVendorRows(newExpandedVendors);
  };



  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header pageTitle="Vehicle Utilization" showNewButton={false} />
      <Sidebar />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Display Vehicle Utilization</h6>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-3 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-3 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-3 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                  <label htmlFor="tripType" className="form-label">
                    Trip Type <span>*</span>
                  </label>
                  <Dropdown
                    id="tripType"
                    value={selectedTripType}
                    options={tripTypes}
                    onChange={(e) => setSelectedTripType(e.value)}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-flex align-items-end">
                  <style>
                    {`
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
                    `}
                  </style>
                  <ReportButton
                    label="Run Report"
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
                  <p
                    className="text-muted mb-0"
                    style={{ fontSize: "0.9rem" }}
                  >
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
                          <label className="fw-bold mb-1">Vendor</label>
                          <MultiSelect
                            value={filters.Vendor}
                            options={getUniqueValues("Vendor")}
                            onChange={(e) =>
                              setFilters({ ...filters, Vendor: e.value })
                            }
                            placeholder="Select Vendor"
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

                  {loading ? (
                    <div className="p-4 text-center">Loading...</div>
                  ) : reportData.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-sm mb-0 custom-html-table">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "40px" }}></th>
                            <th className="text-center"> Date</th>
                            {/* <th className="text-center">Vendor</th> */}
                            {/* <th className="text-center d-none d-md-table-cell">
                              Vehicle Type
                            </th> */}
                            <th className="text-center">Total Trips</th>
                            <th className="text-center d-none d-lg-table-cell">
                              Total Capacity
                            </th>
                            <th className="text-center d-none d-md-table-cell">
                              Employees Scheduled
                            </th>
                            <th className="text-center d-none d-lg-table-cell">
                              Actual Employees Boarded
                            </th>
                            <th className="text-center d-none d-xl-table-cell">
                              Utilization%
                            </th>
                            <th className="text-center"> Occupancy %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((dateRow, dateIndex) => (
                            <React.Fragment key={dateIndex}>
                              {/* Date Level Row */}
                              <tr className={`${dateIndex % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                <td>
                                  <a
                                    href="#!"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleDateExpansion(dateIndex);
                                    }}
                                  >
                                    {expandedDates.includes(dateIndex) ? (
                                      <span
                                        className="material-icons"
                                        style={{ fontSize: "20px", color: "#0d6efd" }}
                                      >
                                        remove_circle
                                      </span>
                                    ) : (
                                      <span
                                        className="material-icons"
                                        style={{ fontSize: "20px", color: "#0d6efd" }}
                                      >
                                        add_circle
                                      </span>
                                    )}
                                  </a>
                                </td>
                                <td className="text-center fw-bold">
                                  {dateRow.shiftDate}
                                </td>
                                <td className="text-center fw-bold">
                                  {dateRow.TotalRoutes}
                                </td>
                                <td className="text-center fw-bold d-none d-lg-table-cell">
                                  {dateRow.TotalCapacity}
                                </td>
                                <td className="text-center fw-bold d-none d-md-table-cell">
                                  {dateRow.TotalEmps}
                                </td>
                                <td className="text-center fw-bold d-none d-lg-table-cell">
                                  {dateRow.ActTotalEmps}
                                </td>
                                <td className="text-center fw-bold d-none d-xl-table-cell">
                                  {dateRow.PlanOccPer}
                                </td>
                                <td className="text-center fw-bold">
                                  {dateRow.ActOccPer}
                                </td>
                              </tr>

                              {/* Shift Level Rows - Expanded Section */}
                              {expandedDates.includes(dateIndex) && (
                                <tr>
                                  <td colSpan="8" className="leftStrip p-2">
                                    <div className="expanded-content">
                                      <div className="table-responsive">
                                        <table className="table table-sm table-bordered mb-0">
                                          <thead>
                                            <tr>
                                              <th style={{ width: "40px" }}></th>
                                              <th>Shift Time</th>
                                              <th>Total Trips</th>
                                              <th className="d-none d-lg-table-cell">
                                                Total Capacity
                                              </th>
                                              <th className="d-none d-md-table-cell">
                                                Employees Scheduled
                                              </th>
                                              <th className="d-none d-lg-table-cell">
                                                Actual Employees Boarded
                                              </th>
                                              <th className="d-none d-xl-table-cell">
                                                Utilization%
                                              </th>
                                              <th>Occupancy %</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {dateRow.shifts.map(
                                              (shiftRow, shiftIndex) => (
                                                <React.Fragment
                                                  key={`${dateIndex}-${shiftIndex}`}
                                                >
                                                  <tr className={`${shiftIndex % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                                    <td>
                                                      <a
                                                        href="#!"
                                                        onClick={(e) => {
                                                          e.preventDefault();
                                                          toggleShiftExpansion(
                                                            dateIndex,
                                                            shiftIndex
                                                          );
                                                        }}
                                                      >
                                                        {expandedShifts[dateIndex]?.includes(
                                                          shiftIndex
                                                        ) ? (
                                                          <span
                                                            className="material-icons"
                                                            style={{
                                                              fontSize: "20px",
                                                              color: "#0d6efd"
                                                            }}
                                                          >
                                                            remove_circle
                                                          </span>
                                                        ) : (
                                                          <span
                                                            className="material-icons"
                                                            style={{
                                                              fontSize: "20px",
                                                              color: "#0d6efd"
                                                            }}
                                                          >
                                                            add_circle
                                                          </span>
                                                        )}
                                                      </a>
                                                    </td>
                                                    <td className="fw-bold">
                                                      {shiftRow.shiftTime}
                                                    </td>
                                                    <td className="fw-bold">
                                                      {shiftRow.TotalRoutes}
                                                    </td>
                                                    <td className="fw-bold d-none d-lg-table-cell">
                                                      {shiftRow.TotalCapacity}
                                                    </td>
                                                    <td className="fw-bold d-none d-md-table-cell">
                                                      {shiftRow.TotalEmps}
                                                    </td>
                                                    <td className="fw-bold d-none d-lg-table-cell">
                                                      {shiftRow.ActTotalEmps}
                                                    </td>
                                                    <td className="fw-bold d-none d-xl-table-cell">
                                                      {shiftRow.PlanOccPer}
                                                    </td>
                                                    <td className="fw-bold">
                                                      {shiftRow.ActOccPer}
                                                    </td>
                                                  </tr>

                                                  {/* Vendor Level Rows - Expanded Section */}
                                                  {expandedShifts[dateIndex]?.includes(
                                                    shiftIndex
                                                  ) && (
                                                      <tr>
                                                        <td colSpan="8" className="leftStrip p-2">
                                                          <div className="expanded-content">
                                                            <div className="table-responsive">
                                                              <table className="table table-sm table-bordered mb-0">
                                                                <thead>
                                                                  <tr>
                                                                    <th style={{ width: "40px" }}></th>
                                                                    <th>Vendor</th>
                                                                    <th>Total Trips</th>
                                                                    <th className="d-none d-lg-table-cell">
                                                                      Total Capacity
                                                                    </th>
                                                                    <th className="d-none d-md-table-cell">
                                                                      Employees Scheduled
                                                                    </th>
                                                                    <th className="d-none d-lg-table-cell">
                                                                      Actual Employees Boarded
                                                                    </th>
                                                                    <th className="d-none d-xl-table-cell">
                                                                      Utilization%
                                                                    </th>
                                                                    <th>Occupancy %</th>
                                                                  </tr>
                                                                </thead>
                                                                <tbody>
                                                                  {shiftRow.vendors.map(
                                                                    (vendorRow, vendorIndex) => (
                                                                      <React.Fragment
                                                                        key={`${dateIndex}-${shiftIndex}-${vendorIndex}`}
                                                                      >
                                                                        <tr className={`${vendorIndex % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}>
                                                                          <td>
                                                                            <a
                                                                              href="#!"
                                                                              onClick={(e) => {
                                                                                e.preventDefault();
                                                                                toggleVendorExpansion(
                                                                                  dateIndex,
                                                                                  shiftIndex,
                                                                                  vendorIndex
                                                                                );
                                                                              }}
                                                                            >
                                                                              {expandedVendorRows[
                                                                                `${dateIndex}-${shiftIndex}`
                                                                              ]?.includes(
                                                                                vendorIndex
                                                                              ) ? (
                                                                                <span
                                                                                  className="material-icons"
                                                                                  style={{
                                                                                    fontSize: "20px",
                                                                                    color: "#0d6efd"
                                                                                  }}
                                                                                >
                                                                                  remove_circle
                                                                                </span>
                                                                              ) : (
                                                                                <span
                                                                                  className="material-icons"
                                                                                  style={{
                                                                                    fontSize: "20px",
                                                                                    color: "#0d6efd"
                                                                                  }}
                                                                                >
                                                                                  add_circle
                                                                                </span>
                                                                              )}
                                                                            </a>
                                                                          </td>
                                                                          <td className="fw-bold">
                                                                            {vendorRow.Vendor}
                                                                          </td>
                                                                          <td className="fw-bold">
                                                                            {vendorRow.TotalRoutes}
                                                                          </td>
                                                                          <td className="fw-bold d-none d-lg-table-cell">
                                                                            {vendorRow.TotalCapacity}
                                                                          </td>
                                                                          <td className="fw-bold d-none d-md-table-cell">
                                                                            {vendorRow.TotalEmps}
                                                                          </td>
                                                                          <td className="fw-bold d-none d-lg-table-cell">
                                                                            {vendorRow.ActTotalEmps}
                                                                          </td>
                                                                          <td className="fw-bold d-none d-xl-table-cell">
                                                                            {vendorRow.PlanOccPer}
                                                                          </td>
                                                                          <td className="fw-bold">
                                                                            {vendorRow.ActOccPer}
                                                                          </td>
                                                                        </tr>

                                                                        {/* Vehicle Type Level Rows - Expanded Section */}
                                                                        {expandedVendorRows[
                                                                          `${dateIndex}-${shiftIndex}`
                                                                        ]?.includes(vendorIndex) && (
                                                                            <tr>
                                                                              <td
                                                                                colSpan="8"
                                                                                className="leftStrip p-2"
                                                                              >
                                                                                <div className="expanded-content">
                                                                                  <div className="table-responsive">
                                                                                    <table className="table table-sm table-bordered mb-0">
                                                                                      <thead>
                                                                                        <tr>
                                                                                          <th>Vehicle Type</th>
                                                                                          <th>Total Trips</th>
                                                                                          <th className="d-none d-lg-table-cell">
                                                                                            Total Capacity
                                                                                          </th>
                                                                                          <th className="d-none d-md-table-cell">
                                                                                            Employees Scheduled
                                                                                          </th>
                                                                                          <th className="d-none d-lg-table-cell">
                                                                                            Actual Employees Boarded
                                                                                          </th>
                                                                                          <th className="d-none d-xl-table-cell">
                                                                                            Utilization%
                                                                                          </th>
                                                                                          <th>Occupancy %</th>
                                                                                        </tr>
                                                                                      </thead>
                                                                                      <tbody>
                                                                                        {vendorRow.vehicles.map(
                                                                                          (
                                                                                            vehicleRow,
                                                                                            vehicleIndex
                                                                                          ) => (
                                                                                            <tr
                                                                                              key={vehicleIndex}
                                                                                              className={`${vehicleIndex % 2 !== 0 ? "ota-row-odd" : ""} ota-row-hover`}
                                                                                            >
                                                                                              <td>
                                                                                                {vehicleRow.vehicleType}
                                                                                              </td>
                                                                                              <td>
                                                                                                {vehicleRow.TotalRoutes}
                                                                                              </td>
                                                                                              <td className="d-none d-lg-table-cell">
                                                                                                {vehicleRow.TotalCapacity}
                                                                                              </td>
                                                                                              <td className="d-none d-md-table-cell">
                                                                                                {vehicleRow.TotalEmps}
                                                                                              </td>
                                                                                              <td className="d-none d-lg-table-cell">
                                                                                                {vehicleRow.ActTotalEmps}
                                                                                              </td>
                                                                                              <td className="d-none d-xl-table-cell">
                                                                                                {vehicleRow.PlanOccPer?.toFixed(2)}
                                                                                              </td>
                                                                                              <td>
                                                                                                {vehicleRow.ActOccPer?.toFixed(2)}
                                                                                              </td>
                                                                                            </tr>
                                                                                          )
                                                                                        )}
                                                                                      </tbody>
                                                                                    </table>
                                                                                  </div>
                                                                                </div>
                                                                              </td>
                                                                            </tr>
                                                                          )}
                                                                      </React.Fragment>
                                                                    )
                                                                  )}
                                                                </tbody>
                                                              </table>
                                                            </div>
                                                          </div>
                                                        </td>
                                                      </tr>
                                                    )}
                                                </React.Fragment>
                                              )
                                            )}
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
                  ) : (
                    <div className="p-4 text-center text-muted">
                      {error ? `Error: ${error}` : "No records found"}
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

export default VehicleUtilizationReport;

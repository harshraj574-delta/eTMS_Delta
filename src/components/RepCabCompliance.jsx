import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { CustomDataTable } from "./common/CustomDataTable";
import { Column } from "primereact/column";
import RepCabComplianceService from "../services/compliance/RepCabComplianceService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";
import TableToolbar from "./common/TableToolbar";
import { MultiSelect } from "primereact/multiselect";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";

const RepCabCompliance = () => {
  const [facilities, setFacilities] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [penaltyType, setPenaltyType] = useState("1");
  const [reportData, setReportData] = useState([]);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const UserID = sessionStorage.getItem("ID");
  const dt = useRef(null);
  const op = useRef(null);
  const filterButtonRef = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({
    complianceType: null,
    vendorName: null
  });

  const penaltyTypeOptions = [
    { label: "Operations", value: "1" },
    { label: "Compliance", value: "2" },
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchVendors();
    }
  }, [selectedFacility]);

  const fetchFacilities = async () => {
    try {
      const response = await RepCabComplianceService.SelectFacility({
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

  const fetchVendors = async () => {
    try {
      const response = await RepCabComplianceService.GetVendorByFacility({
        facilityId: selectedFacility,
      });

      let parsedResponse = response;

      if (typeof response === "string") {
        parsedResponse = JSON.parse(response);
      }

      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.vendorName,
            value: item.Id,
          }))
        : [];

      setVendors(formattedData);
      setSelectedVendor(null);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toastService.error("Error fetching vendors");
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

  // Parse nested JSON response
  const parseNestedJsonResponse = (response) => {
    try {
      let parsedData = response;

      // First level parsing
      if (typeof parsedData === "string") {
        parsedData = JSON.parse(parsedData);
      }

      // Handle JsonResult wrapper
      if (Array.isArray(parsedData) && parsedData[0]?.JsonResult) {
        parsedData = JSON.parse(parsedData[0].JsonResult);
      }

      // Handle data property
      if (parsedData?.data) {
        parsedData =
          typeof parsedData.data === "string"
            ? JSON.parse(parsedData.data)
            : parsedData.data;
      }

      return Array.isArray(parsedData)
        ? parsedData
        : parsedData
          ? [parsedData]
          : [];
    } catch (error) {
      console.error("Error parsing response:", error);
      return [];
    }
  };

  // Extract dynamic columns from data
  const extractColumns = (data) => {
    if (!data || data.length === 0) return [];

    const allKeys = new Set();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => allKeys.add(key));
    });

    return Array.from(allKeys).map((key) => ({
      field: key,
      header: formatColumnHeader(key),
    }));
  };

  // Format column header for display
  const formatColumnHeader = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  };

  const handleSearch = async () => {
    if (!selectedFacility) {
      toastService.error("Please select a facility");
      return;
    }

    if (!selectedVendor) {
      toastService.error("Please select a vendor");
      return;
    }

    if (!penaltyType || penaltyType === "0") {
      toastService.error("Please select penalty type");
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
        tripType: "",
        vendorIDs: selectedVendor.toString(),
      };

      let response;
      if (penaltyType === "2") {
        response = await RepCabComplianceService.RptCabCompliance(params);
      } else {
        response = await RepCabComplianceService.RptOperationsPenalty(
          params
        );
      }

      const validatedData = parseNestedJsonResponse(response);
      const columns = extractColumns(validatedData);

      setReportData(validatedData);
      setDynamicColumns(columns);
      setLoading(false);
      setIsSubmitting(false);
      setHasSearched(true);
      setFilteredData(validatedData);

      setTimeout(() => {
        if (validatedData.length > 0) {
          toastService.success(
            `Report generated successfully. ${validatedData.length} records found.`
          );
        } else {
          toastService.warn("No records found");
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
      setDynamicColumns([]);
      setError(error.message);
      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        toastService.error("Error fetching report data: " + error.message);
      }, 100);
    }

  };

  const clearAdvancedFilters = () => {
    setFilters({
      complianceType: null,
      vendorName: null
    });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  const getUniqueValues = (field) => {
    const values = reportData.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...reportData];

    // Apply advanced filters
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (Array.isArray(val) && val.length > 0) {
        filtered = filtered.filter((item) => val.includes(item[key]));
      }
    });

    // Apply global search
    if (globalFilter && globalFilter.trim() !== "") {
      const searchLower = globalFilter.toLowerCase();
      filtered = filtered.filter((item) => {
        return Object.values(item).some(
          (val) =>
            val !== null &&
            val !== undefined &&
            String(val).toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredData(filtered);
  };

  useEffect(() => {
    if (hasSearched) {
      applyFiltersAndSearch();
    }
  }, [filters, globalFilter, hasSearched, reportData]);

  const exportExcel = () => {
    if (reportData.length === 0) {
      toastService.error("No data to export");
      return;
    }

    try {
      const reportType =
        penaltyType === "2" ? "Cab_Compliance" : "Operations_Penalty";
      const facilityName =
        facilities.find((f) => f.value === selectedFacility)?.label ||
        "Report";
      const vendorName =
        vendors.find((v) => v.value === selectedVendor)?.label || "All";

      const fileName = `${reportType}_${facilityName}_${vendorName}_${new Date().toISOString().slice(0, 10)}`;

      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report Data");

      const wscols = dynamicColumns.map(() => ({ wch: 20 }));
      ws["!cols"] = wscols;

      XLSX.writeFile(wb, `${fileName}.xlsx`);
      toastService.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toastService.error("Error exporting report");
    }
  };



  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header pageTitle="Cab Penalty Report" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Cab Penalty Report</h6>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
                  <label htmlFor="vendor" className="form-label">
                    Vendor <span>*</span>
                  </label>
                  <Dropdown
                    id="vendor"
                    placeholder="Select Vendor"
                    value={selectedVendor}
                    options={vendors}
                    onChange={(e) => setSelectedVendor(e.value)}
                    className="w-100"
                    filter
                    disabled={!selectedFacility}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
                  <label htmlFor="penaltyType" className="form-label">
                    Penalty Type <span>*</span>
                  </label>
                  <Dropdown
                    id="penaltyType"
                    placeholder="Select Type"
                    value={penaltyType}
                    options={penaltyTypeOptions}
                    onChange={(e) => setPenaltyType(e.value)}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-2 col-lg-2 d-flex align-items-end">
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
                          <label className="fw-bold mb-1">Compliance Type</label>
                          <MultiSelect
                            value={filters.complianceType}
                            options={getUniqueValues("complianceType")}
                            onChange={(e) =>
                              setFilters({ ...filters, complianceType: e.value })
                            }
                            placeholder="Select Type"
                            className="w-100"
                            display="chip"
                          />
                        </div>
                        <div className="col-12">
                          <label className="fw-bold mb-1">Vendor Name</label>
                          <MultiSelect
                            value={filters.vendorName}
                            options={getUniqueValues("vendorName")}
                            onChange={(e) =>
                              setFilters({ ...filters, vendorName: e.value })
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
                      globalFilter={globalFilter}
                      rowsPerPageOptions={[50, 100, 200, 300]}
                    >
                      {dynamicColumns.map((col) => (
                        <Column
                          key={col.field}
                          field={col.field}
                          header={col.header}
                          sortable
                          style={{ minWidth: "150px" }}
                        />
                      ))}
                    </CustomDataTable>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RepCabCompliance;
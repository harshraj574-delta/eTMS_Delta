import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { CustomDataTable } from "./common/CustomDataTable";
import { Column } from "primereact/column";
import RepNoShowService from "../services/compliance/RepNoShowService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import TableToolbar from "./common/TableToolbar";
import { MultiSelect } from "primereact/multiselect";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";

const RepNoShow = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");


  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    processName: null,
    Manager: null
  });

  const UserID = sessionStorage.getItem("ID");
  const dt = useRef(null);
  const op = useRef(null);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await RepNoShowService.SelectFacility({
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

  const handleSearch = async () => {
    if (!selectedFacility) {
      toastService.error("Please select a facility");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setGlobalFilter("");
    setHasSearched(true);

    try {
      const params = {
        sDate: formatDate(startDate),
        eDate: formatDate(endDate),
        facilityId: selectedFacility,
        tripType: "P",
      };

      const response = await RepNoShowService.RptNoshow(params);

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

      setReportData(validatedData);
      setLoading(false);
      setIsSubmitting(false);

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
      setError(error.message);

      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        toastService.error("Error fetching report data: " + error.message);
      }, 100);
    }
  };

  const exportExcel = () => {
    if (reportData.length === 0) {
      toastService.error("No data to export");
      return;
    }

    if (dt.current) {
      const fileName = `no_show_report_${new Date()
        .toISOString()
        .slice(0, 10)}`;
      dt.current.exportCSV({ fileName });
    }
  };

  const getUniqueValues = (field) => {
    const values = reportData.map((item) => item[field]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const clearAdvancedFilters = () => {
    setFilters({
      processName: null,
      Manager: null
    });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  const filteredData = React.useMemo(() => {
    if (!hasSearched) return [];
    
    let filtered = [...reportData];

    // Apply advanced filters
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (Array.isArray(val) && val.length > 0) {
        filtered = filtered.filter((item) => val.includes(item[key]));
      }
    });

    // Apply global search optimally
    if (globalFilter && globalFilter.trim() !== "") {
      const searchLower = globalFilter.toLowerCase();
      filtered = filtered.filter((item) => {
        const valuesToSearch = [
          item.facilityName, item.empCode, item.empName, item.processName, item.Manager
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
  }, [reportData, filters, globalFilter, hasSearched]);

  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header pageTitle="No-Show Reports" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Detailed No-Show Report</h6>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-3 col-lg-3">
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
                <div className="col-12 col-sm-6 col-md-3 col-lg-3">
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
                <div className="col-12 col-sm-6 col-md-3 col-lg-3">
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
                <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-flex align-items-end">
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
                          <label className="fw-bold mb-1">Project</label>
                          <MultiSelect
                            value={filters.processName}
                            options={getUniqueValues("processName")}
                            onChange={(e) =>
                              setFilters({ ...filters, processName: e.value })
                            }
                            placeholder="Select Project"
                            className="w-100"
                            display="chip"
                          />
                        </div>
                        <div className="col-12">
                          <label className="fw-bold mb-1">Manager</label>
                          <MultiSelect
                            value={filters.Manager}
                            options={getUniqueValues("Manager")}
                            onChange={(e) =>
                              setFilters({ ...filters, Manager: e.value })
                            }
                            placeholder="Select Manager"
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
                      rowsPerPageOptions={[50, 100, 200, 300]}
                      globalFilter={globalFilter}
                    >
                      <Column field="facilityName" header="Facility" sortable />
                      <Column field="empCode" header="Emp ID" sortable />
                      <Column field="empName" header="Emp Name" sortable />
                      <Column field="processName" header="Project" sortable />
                      <Column field="Manager" header="Manager" sortable />
                      <Column
                        field="RoutedInstances"
                        header="Routes Instances"
                        sortable
                      />
                      <Column
                        field="NoShowInstances"
                        header="No Show Instances"
                        sortable
                      />
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

export default RepNoShow;

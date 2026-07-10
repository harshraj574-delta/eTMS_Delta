import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import MasterSidebar from "./Master/MasterSidebar";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import ReportButton from "./common/ReportButton";
import Loader from "./common/Loader";
import TableToolbar from "./common/TableToolbar";
import calendarIcon from "../assets/calendar.png";
import noReportImage from "../assets/no_report.png";
import sessionManager from "../utils/SessionManager";
import { toastService } from "../services/toastService";
import useIsMobile from "./common/useIsMobile";
import * as XLSX from "xlsx";
import AnimatedCounter from "./common/AnimatedCounter";
import {
  useFacilityQuery,
  useShiftsQuery,
  useFemaleDataQuery,
  useUpdateFemaleTrackMutation,
} from "../hooks/compliance/useFemaleTrackQueries";

const trackingOptions = [
  { label: "-Select-", value: "0" },
  { label: "Pickup Confirmed", value: "B" },
  { label: "No-Show", value: "N" },
  { label: "No Confirmation", value: "X" },
];

const dropTrackingOptions = [
  { label: "-Select-", value: "0" },
  { label: "Drop Confirmed", value: "B" },
  { label: "No-Show", value: "N" },
  { label: "No Confirmation", value: "X" },
];

const remarkDropdownOptions = [
  { label: "-Select-", value: null },
  { label: "Tracked", value: "Tracked" },
  { label: "Not Tracked", value: "Not Tracked" },
];

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.replace(/\s+/, " | ");
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).replace(", ", " | ");
};

const formatDateOnly = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const getTrackingStatusInfo = (status) => {
  switch (status) {
    case "B": return { text: "Boarded", color: "#22c55e" };
    case "N": return { text: "NoShow", color: "#ef4444" };
    case "C": return { text: "Cancelled", color: "#eab308" };
    case "X": return { text: "No Confirmation", color: "#f97316" };
    default: return { text: "", color: "#6b7280" };
  }
};

const FemaleTrack = () => {
  const isMobile = useIsMobile();
  const userId = sessionManager.getUserSession()?.ID;

  // Filter state
  const [shiftDate, setShiftDate] = useState(new Date());
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedTripType, setSelectedTripType] = useState("P");
  const [selectedShifts, setSelectedShifts] = useState(null);
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Submitted (committed) params — only updated on Submit click
  const [submittedParams, setSubmittedParams] = useState(null);

  // Table state
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);
  const [globalFilter, setGlobalFilter] = useState("");

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [sidebarAction, setSidebarAction] = useState("0");
  const [sidebarRemark, setSidebarRemark] = useState("");
  const [sidebarRemark1, setSidebarRemark1] = useState(null);
  const [sidebarRemark2, setSidebarRemark2] = useState(null);
  const [sidebarRemark3, setSidebarRemark3] = useState(null);

  // Queries
  const { data: facilities = [] } = useFacilityQuery(userId);
  const { data: shifts = [] } = useShiftsQuery(
    selectedFacility?.Id || selectedFacility?.id,
    selectedTripType
  );

  const tripTypes = [
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" },
  ];

  const shiftOptions = useMemo(() => {
    if (!Array.isArray(shifts)) return [];
    return shifts.map((s) => ({ label: s.shiftTime, value: s.shiftTime }));
  }, [shifts]);

  const { data: femaleData = [], isLoading, isFetching } = useFemaleDataQuery(submittedParams, !!submittedParams);
  const updateMutation = useUpdateFemaleTrackMutation();

  // Set default facility
  useEffect(() => {
    if (facilities.length > 0 && !selectedFacility) {
      const userFacId = sessionManager.getUserSession()?.FacilityID;
      const match = facilities.find((f) => String(f.Id || f.id) === String(userFacId));
      setSelectedFacility(match || facilities[0]);
    }
  }, [facilities, selectedFacility]);

  // Reset shifts when facility/tripType changes
  useEffect(() => { setSelectedShifts(null); }, [selectedFacility, selectedTripType]);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!globalFilter) return femaleData;
    const lower = globalFilter.toLowerCase();
    return femaleData.filter((row) =>
      (row.employeeid || "").toLowerCase().includes(lower) ||
      (row.empName || "").toLowerCase().includes(lower) ||
      (row.Routeid || "").toLowerCase().includes(lower) ||
      (row.processName || "").toLowerCase().includes(lower) ||
      (row.mobile || "").toLowerCase().includes(lower)
    );
  }, [femaleData, globalFilter]);

  const handleSubmit = useCallback(() => {
    if (!shiftDate) { toastService.warn("Please select Shift Date"); return; }
    if (!selectedFacility) { toastService.warn("Please select Facility"); return; }
    if (!selectedShifts) { toastService.warn("Please select Shift"); return; }
    const dateStr = `${(shiftDate.getMonth() + 1).toString().padStart(2, "0")}/${shiftDate.getDate().toString().padStart(2, "0")}/${shiftDate.getFullYear()}`;
    setFirst(0);
    setGlobalFilter("");
    setSearchTriggered(true);
    setSubmittedParams({
      sDate: dateStr,
      eDate: dateStr,
      FacilityID: selectedFacility.Id || selectedFacility.id,
      Shifttimes: selectedShifts,
      TripType: selectedTripType,
      DutyManager: 0,
    });
  }, [shiftDate, selectedFacility, selectedShifts, selectedTripType]);

  const openEditSidebar = useCallback((rowData) => {
    setSelectedRow(rowData);
    setSidebarAction(rowData.action || "0");
    setSidebarRemark(rowData.Remark || "");
    setSidebarRemark1(rowData.Remark1);
    setSidebarRemark2(rowData.Remark2);
    setSidebarRemark3(rowData.Remark3);
    setSidebarOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedRow) return;
    if (sidebarAction === "0") {
      toastService.warn("Please select a tracking option");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        Routeid: selectedRow.Routeid,
        EmpID: selectedRow.id,
        Tracked: 1,
        Remark: sidebarRemark,
        UpdatedBy: sessionManager.getUserSession()?.ID,
        action: sidebarAction,
        Remark1: sidebarRemark1 || "",
        Remark2: sidebarRemark2 || "",
        Remark3: sidebarRemark3 || "",
      });
      toastService.success("Record updated successfully");
      setSidebarOpen(false);
    } catch (err) {
      console.error("Update error:", err);
      toastService.error("Error updating record");
    }
  }, [selectedRow, sidebarAction, sidebarRemark, sidebarRemark1, sidebarRemark2, sidebarRemark3, updateMutation]);

  const isRowLocked = selectedRow?.Tracked === 1;

  const onPageChange = (e) => { setFirst(e.first); setRows(e.rows); };

  // Export handler
  const exportToExcel = useCallback(() => {
    if (filteredData.length === 0) {
      toastService.warn("No data to export");
      return;
    }
    const exportData = filteredData.map((row, i) => ({
      "Employee ID": row.employeeid,
      "Employee Name": row.empName,
      "Mobile": row.mobile,
      "Email": row.email,
      "Route ID": row.Routeid,
      "Shift": row.shiftTime,
      "Driver": row.driver,
      "Vehicle": row.vehicleid,
      "Stop No": row.stopNo,
      "ETA": row.eta,
      "Process": row.processName,
      "Location": row.Location,
      "Tracked": row.Tracked_Excel,
      "Status": row.TrackingStatus,
      "Remark": row.Remark,
      "Updated By": row.UpdatedBy,
      "Updated On": row.UpdatedOn,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FemaleTrack");
    XLSX.writeFile(wb, `FemaleTrack_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [filteredData]);

  // Column templates

  const empDetailsBody = useCallback((rowData) => (
    <div
      style={{ cursor: "pointer" }}
      onClick={() => openEditSidebar(rowData)}
    >
      <strong style={{ color: "#0d6efd" }}>{rowData.empName || ""}</strong>
      <div style={{ fontSize: "11px", color: "#555" }}>ID: {rowData.employeeid || ""}</div>
      <div style={{ fontSize: "11px", color: "#555" }}>M#: {rowData.mobile || ""}</div>
    </div>
  ), [openEditSidebar]);

  const secondEmpTsBody = useCallback((rowData) => (
    <span style={{ fontSize: "12px" }}>{rowData.SecondEmpTimeStamp || ""}</span>
  ), []);

  const routeDetailsBody = useCallback((rowData) => (
    <div>
      <div style={{ fontSize: "12px", fontWeight: 600 }}>{rowData.Routeid || ""}</div>
      <div style={{ fontSize: "11px", color: "#555" }}>Shift: {rowData.shiftTime || ""}</div>
      <div style={{ fontSize: "11px", color: "#555" }}>Drvr#: {rowData.driver?.trim() || "NA"}</div>
    </div>
  ), []);

  const callTrackerBody = useCallback((rowData) => {
    const dates = [rowData.FirstChkDate, rowData.SecondChkDate, rowData.ThirdChkDate];
    return (
      <div className="d-flex flex-column w-100">
        {dates.map((d, i) => (
          <div key={i} className="d-flex align-items-center" style={{ fontSize: "11px", color: d ? "#333" : "#aaa", height: "30px", borderBottom: i < 2 ? "1px solid #dee2e6" : "none" }}>
            {i + 1}. {d ? formatDateTime(d) : "—"}
          </div>
        ))}
      </div>
    );
  }, []);

  const callRemarksBody = useCallback((rowData) => {
    const remarks = [rowData.Remark1, rowData.Remark2, rowData.Remark3];
    return (
      <div className="d-flex flex-column w-100">
        {remarks.map((r, i) => (
          <div key={i} className="d-flex align-items-center" style={{ height: "30px", width: "100%", borderBottom: i < 2 ? "1px solid #dee2e6" : "none" }}>
            <select
              className="form-select form-select-sm"
              disabled
              style={{ fontSize: "11px", padding: "2px 20px 2px 8px", height: "24px", minHeight: "24px", color: r ? "#333" : "#aaa", backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
            >
              <option>{r || "—"}</option>
            </select>
          </div>
        ))}
      </div>
    );
  }, []);

  const trackedExcelBody = useCallback((rowData) => {
    const isOverdue = rowData.Tracked_Excel === "Not Tracked - Overdue";
    return (
      <span style={{
        color: rowData.Tracked === 1 ? "#22c55e" : isOverdue ? "#ef4444" : "#f59e0b",
        fontWeight: 600, fontSize: "12px",
      }}>
        {rowData.Tracked_Excel || "Not Tracked"}
      </span>
    );
  }, []);

  const statusBody = useCallback((rowData) => {
    const info = getTrackingStatusInfo(rowData.TrackingStatus);
    if (!info.text) return <span style={{ color: "#aaa", fontSize: "12px" }}>—</span>;
    return <span style={{ color: info.color, fontWeight: 700, fontSize: "12px" }}>{info.text}</span>;
  }, []);



  const rowClassName = useCallback((data) => {
    if (data.Tracked_Excel === "Not Tracked - Overdue") return "row-overdue";
    if (data.isNewAdded) return "row-new-added";
    return "";
  }, []);

  return (
    <>
      <style>{`
        .female-track-page .row-overdue { background-color: #fee2e2 !important; }
        .female-track-page .row-new-added { background-color: #dcfce7 !important; border-left: 3px solid #22c55e; }
        .female-track-page .p-datatable .p-datatable-tbody > tr > td { padding: 8px 10px; font-size: 12px; vertical-align: top; }
        .female-track-page .p-datatable .p-datatable-thead > tr > th { font-size: 12px; padding: 8px 10px; white-space: nowrap; }
        @media (max-width: 768px) {
          .female-track-page .filter-row { flex-direction: column; }
          .female-track-page .filter-row > div { width: 100% !important; }
        }
        .custom-calendar-wrapper { position: relative; width: 100%; }
        .custom-calendar-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; z-index: 1; pointer-events: none; }
        .custom-calendar-input .p-inputtext { padding-left: 35px !important; }
      `}</style>
      <Loader isVisible={isLoading || isFetching || updateMutation.isPending} fullScreen={true} />
      <Header pageTitle="Female Track" />
      <Sidebar />
      <div className="middle female-track-page">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Track Female Employees</h6>
          </div>

          {/* Filter Card */}
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row filter-row">
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                  <label className="form-label">Shift Date <span className="text-danger">*</span></label>
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                    <Calendar
                      value={shiftDate}
                      onChange={(e) => setShiftDate(e.value)}
                      dateFormat="dd/mm/yy"
                      className="w-100 custom-calendar-input"
                      placeholder="Select Date"
                    />
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                  <label className="form-label">Facility <span className="text-danger">*</span></label>
                  <Dropdown
                    value={selectedFacility}
                    onChange={(e) => setSelectedFacility(e.value)}
                    options={facilities}
                    optionLabel="facilityName"
                    placeholder="Select Facility"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                  <label className="form-label">Trip Type</label>
                  <Dropdown
                    value={selectedTripType}
                    onChange={(e) => setSelectedTripType(e.value)}
                    options={tripTypes}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                  <label className="form-label">Shift <span className="text-danger">*</span></label>
                  <Dropdown
                    value={selectedShifts}
                    onChange={(e) => setSelectedShifts(e.value)}
                    options={shiftOptions}
                    placeholder="Select Shift"
                    className="w-100"
                    disabled={shiftOptions.length === 0}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3 d-flex align-items-end">
                  <ReportButton label="Submit" onClick={handleSubmit} />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Section */}
          {searchTriggered && (
            <div className="col-12 mb-3 mt-3">
              <div className="row g-3">
                <div className="col-12 col-sm-4">
                  <div className="cardNew p-4 bg-white h-100">
                    <h3 className="text-success">
                      <AnimatedCounter value={120} />
                    </h3>
                    <span>Tracked</span>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="cardNew p-4 bg-white h-100">
                    <h3 className="text-warning">
                      <AnimatedCounter value={45} />
                    </h3>
                    <span>In-Transit</span>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="cardNew p-4 bg-white h-100">
                    <h3 className="text-primary">
                      <AnimatedCounter value={75} />
                    </h3>
                    <span>Not-Tracked</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="col-12">
            <div className="card_tb">
              {!searchTriggered && (
                <div
                  className="d-flex flex-column align-items-center justify-content-center p-5"
                  style={{ minHeight: "60vh" }}
                >
                  <img
                    src={noReportImage}
                    alt="No data"
                    style={{ maxWidth: "100px", opacity: 0.5, marginBottom: "1rem" }}
                  />
                  <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                    Please select above parameters to Generate Routes
                  </p>
                </div>
              )}

              {searchTriggered && (
                <div className="p-3">
                  <TableToolbar
                    search={globalFilter}
                    onSearch={(e) => { setGlobalFilter(e.target.value); setFirst(0); }}
                    onRefresh={handleSubmit}
                    onExport={exportToExcel}
                    showFilter={false}
                    showSearch={true}
                    showRefresh={true}
                    showExport={true}
                  />

                  <CustomDataTable
                    value={filteredData.slice(first, first + rows)}
                    emptyMessage="No records found"
                    rowClassName={rowClassName}
                    size="small"
                  >
                    <Column header="Employee Details" body={empDetailsBody} style={{ minWidth: "160px" }} sortable sortField="empName" />
                    <Column header="2ndOTPTimeStamp" body={secondEmpTsBody} style={{ minWidth: "100px" }} />
                    <Column field="email" header="Email" style={{ minWidth: "120px" }} sortable />
                    <Column field="travelKm" header="Dist" style={{ width: "50px", textAlign: "center" }} sortable />
                    <Column header="Route Details" body={routeDetailsBody} style={{ minWidth: "140px" }} sortable sortField="Routeid" />
                    <Column header="Call Tracker" body={callTrackerBody} style={{ minWidth: "180px" }} />
                    <Column header="Call Remarks" body={callRemarksBody} style={{ minWidth: "130px" }} />
                    <Column header="Tracker Remarks" field="Remark" style={{ minWidth: "120px" }} />
                    <Column header="Status" body={statusBody} style={{ width: "90px", textAlign: "center" }} />
                    <Column header="Tracked" body={trackedExcelBody} style={{ width: "100px", textAlign: "center" }} />
                  </CustomDataTable>

                  <CustomPaginator
                    first={first}
                    rows={rows}
                    totalRecords={filteredData.length}
                    onPageChange={onPageChange}
                    rowsPerPageOptions={[50, 100, 150, 200]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit / View Sidebar */}
      <MasterSidebar
        show={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title={
          <div className="w-100 d-flex justify-content-between align-items-center pe-4">
            <span>{isRowLocked ? "View" : "Update"} Tracking</span>
            {isRowLocked && <span className="badge bg-success" style={{ fontSize: "11px" }}>Tracked</span>}
          </div>
        }
        width="40%"
        footerButtons={
          isRowLocked
            ? [{ label: "Close", className: "btn btn-outline-secondary", onClick: () => setSidebarOpen(false) }]
            : [
                { label: "Cancel", className: "btn btn-outline-secondary", onClick: () => setSidebarOpen(false) },
                { label: "Save", className: "btn btn-success", onClick: handleSave, disabled: updateMutation.isPending },
              ]
        }
      >
        {selectedRow && (
          <div className="sidebarBody p-3">
            {/* Employee Info Section */}
            <div className="col-12 mb-3">
              <div className="d-flex flex-row justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "#eaeaff" }}>
                <h6 className="text-primary m-0 ps-2 fs-6 fw-semibold">Employee Info</h6>
              </div>
            </div>
            <div className="row">
              <div className="field col-6 mb-3">
                <label>Employee ID</label>
                <InputText className="form-control" value={selectedRow.employeeid || ""} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Employee Name</label>
                <InputText className="form-control" value={selectedRow.empName || ""} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Mobile</label>
                <InputText className="form-control" value={selectedRow.mobile || ""} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Email</label>
                <InputText className="form-control" value={selectedRow.email || "—"} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Process</label>
                <InputText className="form-control" value={selectedRow.processName || ""} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Location</label>
                <InputText className="form-control" value={selectedRow.Location || "—"} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Emergency Contact</label>
                <InputText className="form-control" value="9876543210" disabled />
              </div>
            </div>

            {/* Route Info Section */}
            <div className="col-12 mb-3">
              <div className="d-flex flex-row justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "#eaeaff" }}>
                <h6 className="text-primary m-0 ps-2 fs-6 fw-semibold">Route Info</h6>
              </div>
            </div>
            <div className="row">
              <div className="field col-6 mb-3">
                <label>Route ID</label>
                <InputText className="form-control" value={selectedRow.Routeid || ""} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Vehicle</label>
                <InputText className="form-control" value={selectedRow.vehicleid || "—"} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Stop No</label>
                <InputText className="form-control" value={selectedRow.stopNo || ""} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>ETA</label>
                <InputText className="form-control" value={formatDateTime(selectedRow.eta) || "—"} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Shift</label>
                <InputText className="form-control" value={selectedRow.shiftTime || ""} disabled />
              </div>
              <div className="field col-6 mb-3">
                <label>Driver</label>
                <InputText className="form-control" value={selectedRow.driver?.trim() || "—"} disabled />
              </div>
            </div>

            {/* Call Tracker Section */}
            <div className="col-12 mb-3">
              <div className="d-flex flex-row justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "#eaeaff" }}>
                <h6 className="text-primary m-0 ps-2 fs-6 fw-semibold">Call Tracker</h6>
              </div>
            </div>
            <div className="row">
              <div className="field col-4 mb-3">
                <label>1st Check</label>
                <InputText className="form-control" value={selectedRow.FirstChkDate ? formatDateTime(selectedRow.FirstChkDate) : "—"} disabled />
              </div>
              <div className="field col-4 mb-3">
                <label>2nd Check</label>
                <InputText className="form-control" value={selectedRow.SecondChkDate ? formatDateTime(selectedRow.SecondChkDate) : "—"} disabled />
              </div>
              <div className="field col-4 mb-3">
                <label>3rd Check</label>
                <InputText className="form-control" value={selectedRow.ThirdChkDate ? formatDateTime(selectedRow.ThirdChkDate) : "—"} disabled />
              </div>
              <div className="field col-12 mb-3">
                <label>2nd OTP Timestamp</label>
                <InputText className="form-control" value={selectedRow.SecondEmpTimeStamp || "—"} disabled />
              </div>
            </div>

            {/* Tracking Section */}
            <div className="col-12 mb-3">
              <div className="d-flex flex-row justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "#eaeaff" }}>
                <h6 className="text-primary m-0 ps-2 fs-6 fw-semibold">Tracking</h6>
              </div>
            </div>
            <div className="row">
              <div className="field col-12 mb-3">
                <label>Tracking Action <span className="text-danger">*</span></label>
                <Dropdown
                  value={sidebarAction}
                  onChange={(e) => setSidebarAction(e.value)}
                  options={selectedTripType === "P" ? trackingOptions : dropTrackingOptions}
                  className="w-100"
                  disabled={isRowLocked}
                />
              </div>
              <div className="field col-12 mb-3">
                <label>Remark</label>
                <InputTextarea
                  value={sidebarRemark}
                  onChange={(e) => setSidebarRemark(e.target.value)}
                  rows={3}
                  className="w-100"
                  placeholder="Enter remark..."
                  disabled={isRowLocked}
                  maxLength={500}
                />
              </div>
            </div>

            {/* Call Remarks */}
            <div className="col-12 mb-3">
              <div className="d-flex flex-row justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "#eaeaff" }}>
                <h6 className="text-primary m-0 ps-2 fs-6 fw-semibold">Call Remarks</h6>
              </div>
            </div>
            <div className="row">
              {[
                { label: "Remark 1", val: sidebarRemark1, setter: setSidebarRemark1 },
                { label: "Remark 2", val: sidebarRemark2, setter: setSidebarRemark2 },
                { label: "Remark 3", val: sidebarRemark3, setter: setSidebarRemark3 },
              ].map((r, i) => (
                <div className="field col-12 col-md-4 mb-3" key={i}>
                  <label>{r.label}</label>
                  <Dropdown
                    value={r.val}
                    onChange={(e) => r.setter(e.value)}
                    options={remarkDropdownOptions}
                    className="w-100"
                    disabled={isRowLocked}
                    placeholder="-Select-"
                  />
                </div>
              ))}
            </div>

            {/* Updated Info */}
            {(selectedRow.UpdatedBy || selectedRow.UpdatedOn) && (
              <>
                <div className="col-12 mb-3">
                  <div className="d-flex flex-row justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "#eaeaff" }}>
                    <h6 className="text-primary m-0 ps-2 fs-6 fw-semibold">Update Info</h6>
                  </div>
                </div>
                <div className="row">
                  <div className="field col-6 mb-3">
                    <label>Updated By</label>
                    <InputText className="form-control" value={selectedRow.UpdatedBy || "—"} disabled />
                  </div>
                  <div className="field col-6 mb-3">
                    <label>Updated On</label>
                    <InputText className="form-control" value={selectedRow.UpdatedOn ? formatDateTime(selectedRow.UpdatedOn) : "—"} disabled />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </MasterSidebar>
    </>
  );
};

export default FemaleTrack;
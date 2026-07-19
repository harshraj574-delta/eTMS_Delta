import { MultiSelect } from "primereact/multiselect";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Header from "../Master/Header";
import Sidebar from "../Master/SidebarMenu";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import calendarIcon from "../../assets/calendar.png";
import { Dropdown } from "primereact/dropdown";
import MasterSidebar from "../Master/MasterSidebar";
import { Col } from "react-bootstrap";
import { SelectButton } from "primereact/selectbutton";
import { apiService } from "../../services/api";
import {
  useAdhocRequestsQuery,
  useManagersQuery,
  useAdhocFacilitiesQuery,
  useAdhocEmployeesQuery,
  useAdhocShiftsQuery,
  useAdhocReasonsQuery,
  useAddAdhocRequestMutation,
  useDeleteAdhocRequestMutation,
} from "./hooks/useAdhocManagementQueries";
import { toastService } from "../../services/toastService";
import AppConfirmDialog from "../common/AppConfirmDialog";
import Loader from "../common/Loader";
import TableToolbar from "../common/TableToolbar";
import { CustomDataTable } from "../common/CustomDataTable";
import ResponsiveDataTable from "../common/ResponsiveDataTable";
import CustomPaginator from "../common/CustomPaginator";
import TripTypeBadge from "../common/TripTypeBadge";
import StatusBadge from "../common/StatusBadge";
import TabSwitcher from "../common/TabSwitcher";
import trashIcon from "../../assets/trash-can-outline.png";
import AnimatedCounter from "../common/AnimatedCounter";
const AdhocManagement = () => {
  const empId = sessionStorage.getItem("ID");
  const locationId = sessionStorage.getItem("locationId");

  const [selectedManager, setSelectedManager] = useState(null);
  // Whose employees the sidebar list shows — defaults to the logged-in user,
  // changes only when a manager is explicitly picked
  const [employeesManagerId, setEmployeesManagerId] = useState(empId);
  const [visibleLeft, setVisibleLeft] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [adhocFilter, setAdhocFilter] = useState("pending"); // NEW: filter state
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const options = ["Pick Up", "Drop"];
  const [value, setValue] = useState(options[0]);
  const [selectedShift, setSelectedShift] = useState(null);
  // Add state for request type
  const [requestTypes] = useState([
    { value: "Adhoc", name: "Ad-hoc" },
    { value: "Emergency", name: "Emergency" },
  ]);
  const [selectedRequestType, setSelectedRequestType] = useState(null);

  // ── Server state (TanStack Query) ──────────────────────────────────────────
  const {
    data: adhocData = [],
    isLoading: loading,
    refetch: refetchAdhoc,
  } = useAdhocRequestsQuery(empId);
  const { data: managerData = [] } = useManagersQuery(empId);
  const { data: facilityData = [] } = useAdhocFacilitiesQuery(empId);
  const { data: employeeData = [] } = useAdhocEmployeesQuery(locationId, employeesManagerId);
  const { data: shiftData = [] } = useAdhocShiftsQuery({
    facilityId: selectedFacility,
    date: selectedDate,
    tripTypeLabel: value,
  });
  const { data: reasonData = [] } = useAdhocReasonsQuery(selectedFacility, selectedRequestType);
  const addAdhocMutation = useAddAdhocRequestMutation();
  const deleteAdhocMutation = useDeleteAdhocRequestMutation();

  // Counts derived from the list itself so cards/tabs/table always agree
  const counts = useMemo(() => {
    const by = (s) =>
      adhocData.filter((i) => i.Status && i.Status.toLowerCase() === s).length;
    return {
      total: adhocData.length,
      myRequests: by("myrequest"),
      pending: by("pending"),
      approved: by("approved"),
      rejected: by("rejected"),
      cancelled: by("cancelled"),
    };
  }, [adhocData]);
  const totalAdhocs = counts.total;
  const myRequests = counts.myRequests;
  const pending = counts.pending;
  const approved = counts.approved;
  const rejected = counts.rejected;
  const cancelled = counts.cancelled;

  // Default facility (Id 1, else first) once facilities load
  useEffect(() => {
    if (selectedFacility == null && facilityData.length > 0) {
      const def = facilityData.find((facility) => facility.Id === 1);
      setSelectedFacility(def ? def.Id : facilityData[0].Id);
    }
  }, [facilityData, selectedFacility]);

  // Default manager (first) once managers load
  useEffect(() => {
    if (selectedManager == null && managerData.length > 0) {
      setSelectedManager(managerData[0].MgrId);
    }
  }, [managerData, selectedManager]);
  // Sidebar employee table pagination state
  const [sidebarFirst, setSidebarFirst] = useState(0);
  const [sidebarRows, setSidebarRows] = useState(10);
  const [sidebarEmployeeSearch, setSidebarEmployeeSearch] = useState("");
  const [selectedReason, setSelectedReason] = useState(null);

  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState(null);
  const [adhocCostConfirmVisible, setAdhocCostConfirmVisible] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const [filters, setFilters] = useState({
    facilityName: null,
    AdhocDate: null,
    ShiftTime: null,
    TripType: null,
    Status: null,
    adhocreason: null,
  });

  // Pagination state
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);

  const onPageChange = (event) => {
      setFirst(event.first);
      setRows(event.rows);
  };

  const op = useRef(null);
  const filterButtonRef = useRef(null);

  const activeFilterCount = Object.values(filters).filter(
    (val) => val && val.length > 0
  ).length;

  const getUniqueValues = (key) => {
    if (!adhocData) return [];
    const unique = [
      ...new Set(
        adhocData
          .map((item) => item[key])
          .filter((val) => val !== null && val !== undefined && val !== "")
      ),
    ];
    return unique.sort().map((val) => ({ label: val, value: val }));
  };

  const clearAdvancedFilters = () => {
    setFilters({
      facilityName: null,
      AdhocDate: null,
      ShiftTime: null,
      TripType: null,
      Status: null,
      adhocreason: null,
    });
  };

  const tabs = [
    { label: "Pending Adhoc Requests", value: "pending" },
    { label: "Approved Adhoc Requests", value: "approved" },
    { label: "Adhoc History", value: "total" },
  ];

  // Update the reason dropdown component
  // const handleRequestTypeChange = (e) => {
  //   setSelectedRequestType(e.value);
  //   // Add any additional logic you need when request type changes
  //   console.log("Selected Request Type:", e.value);
  // };

  //   const deleteBtn = (rowData) => {
  //     return (
  //       <div className="action_btn">
  //         <Button label="Delete" icon="pi pi-trash" className="p-button-danger" />
  //       </div>
  //     );
  //   };
  // Reasons load via useAdhocReasonsQuery keyed on (facility, request type)
  const handleRequestTypeChange = (e) => {
    setSelectedRequestType(e.value);
  };

  const handleSidebarClose = () => {
    // Reset all form values to default
    setValue(options[0]); // Reset to "Pick Up"
    setSelectedDate(new Date().toISOString().split("T")[0]); // Reset to current date
    setSelectedShift(null);
    setSelectedRequestType(null);
    setSelectedReason(null);
    setSelectedEmployees([]);
    setSidebarEmployeeSearch("");
    setSidebarFirst(0);
    setEmployeesManagerId(empId);
    setVisibleLeft(false);
  };
  const handleSaveChanges = () => {
    if (!shiftData || shiftData.length === 0) {
      toastService.warn("No shifts available for selected date and trip type");
      return;
    }
    if (!selectedShift || selectedShift.length === 0) {
      setSelectedShift(null);
      toastService.warn("Please Select Shift Time *");
      return;
    }
    if (!selectedReason) {
      toastService.warn("Please Select Reason *");
      return;
    }
    if (!selectedEmployees || selectedEmployees.length === 0) {
      toastService.warn("Please Select Employee *");
      return;
    }
    // Validation passed — show cost warning before proceeding
    setAdhocCostConfirmVisible(true);
  };

  const executeAdhocSave = async () => {
    setAdhocCostConfirmVisible(false);
    try {
      // Get employee IDs from selected employees
      const employeeIds = selectedEmployees
        .map((emp) => emp.employeeid)
        .join(",");
      // Get current user ID from session storage for Raisedby
      const currentUserId = sessionStorage.getItem("ID");
      // Prepare parameters for API call
      const params = {
        Empids: employeeIds,
        FacilityID: selectedFacility,
        shift: selectedShift,
        tripType: value === "Pick Up" ? "P" : "D",
        Raisedby: currentUserId,
        adhocdate: selectedDate,
        adflag: 1,
        reasonid: selectedReason,
        AdhocType: selectedRequestType,
      };
      //console.log("Save change params ", params);
      // Call the AddAdhocRequest API (invalidates the requests list on success)
      const response = await addAdhocMutation.mutateAsync(params);
      // Handle success
      if (response) {
        toastService.success("Adhoc request saved successfully");
        handleSidebarClose();
        setVisibleLeft(false);

        // Send notification email
        try {
          let emailId = "";
          try {
            const persisted = JSON.parse(sessionStorage.getItem("session-storage") || "{}");
            emailId = persisted?.state?.user?.EmailID || "";
          } catch (_) {}

          if (emailId) {
            const employeeNames = selectedEmployees.map((e) => e.empName || e.employeeid).join(", ");
            const facilityLabel = facilityData.find((f) => f.Id === selectedFacility)?.facilityName || selectedFacility;
            const tripLabel = value === "Pick Up" ? "Pick Up" : "Drop";

            await apiService.SendEmail({
              ToEmail: emailId,
              CcEmail: "",
              Subject: "Adhoc Request Raised Successfully",
              Body: `<font face="Calibri">Dear Transport User,<br><br>Your Adhoc request has been raised successfully with the following details:<br><br><b>Date:</b> ${selectedDate}<br><b>Trip Type:</b> ${tripLabel}<br><b>Shift:</b> ${selectedShift}<br><b>Facility:</b> ${facilityLabel}<br><b>Request Type:</b> ${selectedRequestType || "N/A"}<br><b>Employee(s):</b> ${employeeNames}<br><br>Please log in to your eTMS to check the status of your request.<br><br>Thanks.<br><br><br>****This is a system generated mail. Please do not reply to this mail, as the mail box is not monitored****</font>`,
            });
          }
        } catch (mailErr) {
          console.error("Failed to send adhoc notification email:", mailErr);
        }
      }
    } catch (error) {
      console.error("Error saving adhoc request:", error);
      toastService.error("Failed to save adhoc request");
    }
  };
  // Open sidebar with employee data
  const openEditSidebar = () => {
    setVisibleLeft(true); // Open sidebar
  };
  // Function to check if cancel button should be enabled
  const isCancelEnabled = (rowData) => {
    return rowData.Enableds === 1 && !rowData.adhocreason.includes("Emergency");
  };
  const handleDeleteRequest = async (rowData) => {
    try {
      const params = {
        id: rowData.id, // Get the adhocid from the row data
        userid: parseInt(sessionStorage.getItem("ID")),
      };

      const response = await deleteAdhocMutation.mutateAsync(params);
      if (response) {
        // List refreshes via the mutation's cache invalidation
        toastService.success("Adhoc request deleted successfully");
        setConfirmDialogVisible(false);
      }
    } catch (error) {
      console.error("Error deleting adhoc request:", error);
      toastService.error("Failed to delete adhoc request");
    }
  };
  const showDeleteConfirm = (rowData) => {
    setSelectedItemToDelete(rowData);
    setConfirmDialogVisible(true);
  };
  // Delete button template
  const deleteBtn = (rowData) => {
    if (isCancelEnabled(rowData)) {
      return (
        <div className="action_btn">
          <img
            src={trashIcon}
            alt="Delete"
            className="action-icon delete"
            title="Delete"
            style={{ width: '22px', height: '22px', cursor: 'pointer' }}
            onClick={() => showDeleteConfirm(rowData)}
          />
        </div>
      );
    } else {
      return <span>Expired</span>;
    }
  };
  // Refresh function with toast
  const handleRefreshAdhoc = async () => {
    toastService.info("Refreshing data...");
    try {
      await refetchAdhoc();
      toastService.success("Data refreshed successfully!");
    } catch (error) {
      toastService.error("Failed to refresh data");
      console.error("Refresh error:", error);
    }
  };
  // Tab selection handler - useDeferredValue for responsive UI
  const deferredAdhocFilter = React.useDeferredValue(adhocFilter);
  const isStale = adhocFilter !== deferredAdhocFilter;

  const filteredAdhocData = useMemo(() => {
    let filtered = adhocData;

    // 1. Apply Status/Card Filters - Use DEFERRED value
    if (deferredAdhocFilter !== "total") {
      filtered = filtered.filter((item) => {
        if (deferredAdhocFilter === "myRequests") {
          return item.Status && item.Status.toLowerCase() === "myrequest";
        }
        return item.Status && item.Status.toLowerCase() === deferredAdhocFilter;
      });
    }

    // 2. Apply Advanced Filters
    Object.keys(filters).forEach((key) => {
      const val = filters[key];
      if (Array.isArray(val) && val.length > 0) {
        filtered = filtered.filter((item) => val.includes(item[key]));
      }
    });

    // 3. Apply Global Search
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

    return filtered;
  }, [adhocData, globalFilter, deferredAdhocFilter, filters]);

  const filteredSidebarEmployees = useMemo(() => {
    if (!employeeData) return [];
    if (!sidebarEmployeeSearch.trim()) return employeeData;
    const q = sidebarEmployeeSearch.toLowerCase();
    return employeeData.filter((e) =>
      Object.values(e).some(
        (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      )
    );
  }, [employeeData, sidebarEmployeeSearch]);

  useEffect(() => {
    setSidebarFirst(0);
  }, [sidebarEmployeeSearch]);

  const handleTabChange = (newTab) => {
    setAdhocFilter(newTab);
  };
  return (
    <>
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
          /* Responsive SelectButton styles */
          .p-selectbutton {
            display: flex;
            flex-wrap: wrap;
          }
          .p-selectbutton .p-button {
            flex: 1 1 auto;
            min-width: 60px;
            font-size: 14px;
            padding: 0.5rem 0.75rem;
          }
          @media (max-width: 768px) {
            .p-selectbutton .p-button {
              font-size: 12px;
              padding: 0.4rem 0.5rem;
              min-width: 50px;
            }
          }
        `}
      </style>
      <Loader isVisible={loading} fullScreen={true} />
      <Header
        pageTitle="Adhoc Management"
        showNewButton={true}
        onNewButtonClick={() => setVisibleLeft(true)}
      />
      <Sidebar />
      <div className="container-fluid p-0">
        <AppConfirmDialog
          visible={confirmDialogVisible}
          onHide={() => setConfirmDialogVisible(false)}
          title="Confirm Delete"
          variant="delete"
          message="Are you sure you want to delete this adhoc request?"
          onConfirm={() => {
            if (selectedItemToDelete) handleDeleteRequest(selectedItemToDelete);
            setConfirmDialogVisible(false);
          }}
        />
        <AppConfirmDialog
          visible={adhocCostConfirmVisible}
          onHide={() => setAdhocCostConfirmVisible(false)}
          title="Additional Cost Warning"
          variant="warning"
          message="Raising an adhoc request will incur additional transport cost."
          detail="Are you sure you want to proceed with this request?"
          confirmLabel="Yes, Raise Request"
          cancelLabel="Go Back"
          onConfirm={executeAdhocSave}
        />
      </div>
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6
              className="pageTitle"
              onClick={() => {
                setVisibleLeft(true);
              }}
            ></h6>
          </div>
        </div>
        {/* KPI Cards */}
        <div className="row g-3 h-100">
          <div className="col-6 col-md-4 col-xl">
            <div className="cardNew p-4 bg-white h-100">
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '31px', lineHeight: '40px', letterSpacing: '-0.03em' }} className="text-dark"><AnimatedCounter value={totalAdhocs} /></h3>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', lineHeight: '28px', letterSpacing: '-0.02em', verticalAlign: 'middle', color: '#545557' }}>Total Adhoc</span>
            </div>
          </div>
          <div className="col-6 col-md-4 col-xl">
            <div className="cardNew p-4 bg-white h-100">
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '31px', lineHeight: '40px', letterSpacing: '-0.03em' }} className="text-warning"><AnimatedCounter value={myRequests} /></h3>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', lineHeight: '28px', letterSpacing: '-0.02em', verticalAlign: 'middle', color: '#545557' }}>My Requests</span>
            </div>
          </div>
          <div className="col-6 col-md-4 col-xl">
            <div className="cardNew p-4 bg-white h-100">
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '31px', lineHeight: '40px', letterSpacing: '-0.03em' }} className="text-secondary"><AnimatedCounter value={approved} /></h3>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', lineHeight: '28px', letterSpacing: '-0.02em', verticalAlign: 'middle', color: '#545557' }}>Approved</span>
            </div>
          </div>
          <div className="col-6 col-md-4 col-xl">
            <div className="cardNew p-4 bg-white h-100">
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '31px', lineHeight: '40px', letterSpacing: '-0.03em' }} className="text-success"><AnimatedCounter value={rejected} /></h3>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', lineHeight: '28px', letterSpacing: '-0.02em', verticalAlign: 'middle', color: '#545557' }}>Rejected</span>
            </div>
          </div>
          <div className="col-6 col-md-4 col-xl">
            <div className="cardNew p-4 bg-white h-100">
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '31px', lineHeight: '40px', letterSpacing: '-0.03em' }} className="text-danger"><AnimatedCounter value={cancelled} /></h3>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', lineHeight: '28px', letterSpacing: '-0.02em', verticalAlign: 'middle', color: '#545557' }}>Cancelled</span>
            </div>
          </div>
        </div>

        <div className="row mt-4">
            <div className="col-12">
                <TabSwitcher
                    tabs={tabs}
                    activeTab={adhocFilter}
                    onTabChange={handleTabChange}
                />
            </div>
        </div>

        <div className="row">
          {/* Table Start */}
          <div className="col-12">
            <div 
              className="card_tb p-3 mt-3"
              style={{ 
                opacity: isStale ? 0.5 : 1, 
                transition: 'opacity 0.2s ease' 
              }}
            >
              <TableToolbar
                search={globalFilter}
                onSearch={(e) => setGlobalFilter(e.target.value)}
                onRefresh={() => handleRefreshAdhoc()}
                showExport={false}
                filters={filters}
                setFilters={setFilters}
                overlayRef={op}
                filterButtonRef={filterButtonRef}
                style={{ height: '100%' }}
              >
                <div className="ota-filter-header">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <span className="ota-filter-icon">
                        <i className="pi pi-filter" />
                      </span>
                      <div>
                        <div className="ota-filter-title">Advanced filters</div>
                        <div className="ota-filter-subtitle">
                          Refine Adhoc requests
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
                      value={filters.facilityName}
                      options={getUniqueValues("facilityName")}
                      onChange={(e) =>
                        setFilters({ ...filters, facilityName: e.value })
                      }
                      placeholder="Select facilities"
                      maxSelectedLabels={2}
                      className="w-100 p-inputtext-sm"
                      display="chip"
                      showClear
                      filter
                    />
                  </div>

                  <div className="ota-filter-field">
                    <label className="ota-filter-label">Shift Date</label>
                    <MultiSelect
                      value={filters.AdhocDate}
                      options={getUniqueValues("AdhocDate")}
                      onChange={(e) =>
                        setFilters({ ...filters, AdhocDate: e.value })
                      }
                      placeholder="Select dates"
                      maxSelectedLabels={2}
                      className="w-100 p-inputtext-sm"
                      display="chip"
                      showClear
                      filter
                    />
                  </div>

                  <div className="ota-filter-field">
                    <label className="ota-filter-label">Shift</label>
                    <MultiSelect
                      value={filters.ShiftTime}
                      options={getUniqueValues("ShiftTime")}
                      onChange={(e) =>
                        setFilters({ ...filters, ShiftTime: e.value })
                      }
                      placeholder="Select shifts"
                      maxSelectedLabels={2}
                      className="w-100 p-inputtext-sm"
                      display="chip"
                      showClear
                      filter
                    />
                  </div>

                  <div className="ota-filter-field">
                    <label className="ota-filter-label">Trip Type</label>
                    <MultiSelect
                      value={filters.TripType}
                      options={getUniqueValues("TripType")}
                      onChange={(e) =>
                        setFilters({ ...filters, TripType: e.value })
                      }
                      placeholder="Select trip types"
                      maxSelectedLabels={2}
                      className="w-100 p-inputtext-sm"
                      display="chip"
                      showClear
                      filter
                    />
                  </div>

                  <div className="ota-filter-field">
                    <label className="ota-filter-label">Status</label>
                    <MultiSelect
                      value={filters.Status}
                      options={getUniqueValues("Status")}
                      onChange={(e) =>
                        setFilters({ ...filters, Status: e.value })
                      }
                      placeholder="Select status"
                      maxSelectedLabels={2}
                      className="w-100 p-inputtext-sm"
                      display="chip"
                      showClear
                      filter
                    />
                  </div>

                  <div className="ota-filter-field">
                    <label className="ota-filter-label">Reason</label>
                    <MultiSelect
                      value={filters.adhocreason}
                      options={getUniqueValues("adhocreason")}
                      onChange={(e) =>
                        setFilters({ ...filters, adhocreason: e.value })
                      }
                      placeholder="Select reason"
                      maxSelectedLabels={2}
                      className="w-100 p-inputtext-sm"
                      display="chip"
                      showClear
                      filter
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
              </TableToolbar>
              <ResponsiveDataTable
                value={filteredAdhocData.slice(first, first + rows)}
                loading={loading}
                emptyMessage="No adhoc records found"
                dataKey="adhocid"
                className="p-datatable-sm"
                rowClassName={(data, props) => props.rowIndex % 2 !== 0 ? "ota-row-odd" : ""}
              >
                <Column sortable field="adhocid" header="Adhoc ID"   mobile={{ hidden: true }} />
                <Column
                  header="Employee"
                  mobile={{ primary: true }}
                  body={(r) => {
                    const g = r.gender?.toString().trim().toUpperCase();
                    const isMale = g === "M" || g === "MALE";
                    const isFemale = g === "F" || g === "FEMALE";
                    return (
                      <div className="d-flex align-items-center gap-2">
                        <span>{r.empCode ? `${r.empCode} - ${r.empName}` : r.empName}</span>
                        {isMale && <span className="badge bg-primary-subtle rounded-pill text-dark">M</span>}
                        {isFemale && <span className="badge bg-danger-subtle rounded-pill text-dark">F</span>}
                      </div>
                    );
                  }}
                />
                <Column field="AdhocDate"    header="Shift Date"     body={(r) => new Date(r.AdhocDate).toLocaleDateString()} />
                <Column field="ShiftTime"    header="Shift" />
                <Column field="TripType"     header="Trip"           body={(r) => <TripTypeBadge type={r.TripType} />} />
                <Column field="facilityName" header="Facility" />
                <Column field="Status"       header="Status"         align="center" body={(r) => <StatusBadge status={r.Status} />} mobile={{ badge: true }} />
                <Column field="RaisedBy"     header="Raised By"      mobile={{ hidden: true }} />
                <Column field="adhocreason"  header="Reason" />
                <Column field="AprovedBy"    header="Approved"       mobile={{ hidden: true }} />
                <Column field=""             header="Action"         body={deleteBtn} mobile={{ action: true }} />
              </ResponsiveDataTable>
              {filteredAdhocData.length > 0 && (
                <CustomPaginator
                  first={first}
                  rows={rows}
                  totalRecords={filteredAdhocData.length}
                  onPageChange={onPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              )}
            </div>
          </div>
        </div>

        <MasterSidebar
            show={visibleLeft}
            onClose={handleSidebarClose}
            title="Raise Adhoc"
            width="80%"
            footerButtons={[
              {
                label: "Cancel",
                className: "btn btn-outline-secondary",
                onClick: handleSidebarClose,
              },
              {
                label: "Raise Adhoc",
                className: "btn btn-success",
                onClick: handleSaveChanges,
              },
            ]}
          >
            <div className="px-3 py-2">
              <div className="row align-items-end">
                <div className="field col-6 col-md-4 col-lg-2 mb-2">
                  <SelectButton
                    severity="success"
                    value={value}
                    onChange={(e) => setValue(e.value)}
                    options={options}
                    className="no-label"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="field col-6 col-md-4 col-lg-2 mb-2">
                  <label>Select Date</label>
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                    <Calendar
                      className="w-100 custom-calendar-input"
                      value={selectedDate ? new Date(selectedDate) : null}
                      onChange={(e) => {
                        const date = e.value;
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          setSelectedDate(`${year}-${month}-${day}`);
                        }
                      }}
                      dateFormat="dd-mm-yy"
                      placeholder="Select Date"
                    />
                  </div>
                </div>
                <div className="field col-6 col-md-4 col-lg-2 mb-2">
                  <label>Facility</label>
                  <Dropdown
                    value={selectedFacility}
                    options={facilityData}
                    optionLabel="facilityName"
                    optionValue="Id"
                    placeholder="Select Facility"
                    className="w-100"
                    onChange={(e) => {
                      console.log("Selected Facility:", e.value);
                      setSelectedFacility(e.value);
                    }}
                    disabled={loading}
                  />
                </div>
                <div className="field col-6 col-md-4 col-lg-2 mb-2">
                  <label>
                    Shift <span className="text-danger">*</span>
                  </label>
                  <Dropdown
                    value={selectedShift}
                    options={shiftData}
                    optionLabel="shiftTime"
                    optionValue="shiftTime"
                    placeholder="Select Shift"
                    className="w-100"
                    onChange={(e) => setSelectedShift(e.value)}
                  />
                </div>
                <div className="field col-6 col-md-4 col-lg-2 mb-2">
                  <label>Request Type</label>
                  <Dropdown
                    value={selectedRequestType}
                    options={requestTypes}
                    optionLabel="name"
                    optionValue="value"
                    placeholder="Select Request Type"
                    className="w-100"
                    onChange={handleRequestTypeChange}
                  />
                </div>

                <div className="field col-6 col-md-4 col-lg-2 mb-2">
                  <label>
                    Reason <span className="text-danger">*</span>
                  </label>
                  <Dropdown
                    value={selectedReason}
                    options={reasonData}
                    optionLabel="AdhocReason"
                    optionValue="ID"
                    placeholder="Select Reason"
                    className="w-100"
                    onChange={(e) => setSelectedReason(e.value)}
                  />
                </div>
              </div>
              <hr className="my-2" />
              <div className="row">
                <div className="field col-12 col-md-4 col-lg-3 mb-2">
                  <label>Select Manager</label>
                  <Dropdown
                    value={selectedManager}
                    options={managerData}
                    optionLabel="ManagerName"
                    optionValue="MgrId"
                    placeholder="Select Manager"
                    className="w-100"
                    onChange={(e) => {
                      setSelectedManager(e.value);
                      // Employee list re-queries via its (location, manager) key
                      setEmployeesManagerId(e.value);
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <div className="card_tb">
                    <div className="d-flex justify-content-end align-items-center px-3 py-2" style={{ borderBottom: "1px solid #e9ecef" }}>
                      <div style={{ position: "relative" }}>
                        <InputText
                          placeholder="Search employees"
                          className="p-inputtext-sm"
                          style={{ paddingRight: "2.5rem", width: "250px" }}
                          value={sidebarEmployeeSearch}
                          onChange={(e) => setSidebarEmployeeSearch(e.target.value)}
                        />
                        <i
                          className="pi pi-search"
                          style={{
                            position: "absolute",
                            right: "0.75rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#6c757d",
                          }}
                        />
                      </div>
                    </div>
                    <CustomDataTable
                      value={filteredSidebarEmployees.slice(sidebarFirst, sidebarFirst + sidebarRows)}
                      selectionMode="multiple"
                      selection={selectedEmployees}
                      onSelectionChange={(e) =>
                        setSelectedEmployees(e.value)
                      }
                    >
                      <Column
                        selectionMode="multiple"
                        headerStyle={{ width: "3rem" }}
                      ></Column>
                      <Column
                        field="status"
                        header=""
                        body={(rowData) => (
                          <div className="d-flex align-items-center">
                            <span
                              className={`material-icons md-18 ${rowData.tptreq === "Y" ? "text-success" : "text-danger"}`}
                              title={
                                rowData.tptreq === "Y"
                                  ? "Transport"
                                  : "NoTransport"
                              }
                            >
                              {rowData.tptreq === "Y"
                                ? "directions_bus"
                                : "no_transfer"}
                            </span>
                            <span
                              className={`material-icons md-18 mx-2 ${rowData.geoCode === "Y" ? "text-success" : "text-danger"}`}
                              title={
                                rowData.geoCode === "Y"
                                  ? "Geocoded"
                                  : "NoGeocoded"
                              }
                            >
                              {rowData.geoCode === "Y"
                                ? "location_on"
                                : "location_off"}
                            </span>
                          </div>
                        )}
                      ></Column>
                      <Column
                        header="Employee"
                        body={(rowData) => {
                          const g = rowData.gender?.toString().trim().toUpperCase();
                          const isMale = g === "M" || g === "MALE";
                          const isFemale = g === "F" || g === "FEMALE";
                          return (
                            <div className="d-flex align-items-center gap-2">
                              <span>{rowData.empName}</span>
                              {isMale && <span className="badge bg-primary-subtle rounded-pill text-dark">M</span>}
                              {isFemale && <span className="badge bg-danger-subtle rounded-pill text-dark">F</span>}
                            </div>
                          );
                        }}
                      ></Column>
                      <Column field="processName" header="Project"></Column>
                      <Column
                        field="facilityName"
                        header="Facility"
                      ></Column>
                    </CustomDataTable>
                    <CustomPaginator
                      first={sidebarFirst}
                      rows={sidebarRows}
                      totalRecords={filteredSidebarEmployees.length}
                      rowsPerPageOptions={[10, 25, 50, 100]}
                      onPageChange={(e) => {
                        setSidebarFirst(e.first);
                        setSidebarRows(e.rows);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </MasterSidebar>
      </div>
    </>
  );
};

export default AdhocManagement;

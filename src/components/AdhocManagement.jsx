import { MultiSelect } from "primereact/multiselect";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import calendarIcon from "../assets/calendar.png";
import { Dropdown } from "primereact/dropdown";
import MasterSidebar from "./Master/MasterSidebar";
import { Col } from "react-bootstrap";
import { SelectButton } from "primereact/selectbutton";
import AdhocmanagementService from "../services/compliance/AdhocmanagementService";
import { toastService } from "../services/toastService";
import { ConfirmDialog } from "primereact/confirmdialog"; // Add this import
import Loader from "./common/Loader";
import TableToolbar from "./common/TableToolbar";
import { ToastContainer } from "react-toastify";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import TripTypeBadge from "./common/TripTypeBadge";
import StatusBadge from "./common/StatusBadge";
import TabSwitcher from "./common/TabSwitcher";
import trashIcon from "../assets/trash-can-outline.png";
import AnimatedCounter from "./common/AnimatedCounter";
const AdhocManagement = () => {
  const [adhocData, setAdhocData] = useState([]);
  const [managerData, setManagerData] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleLeft, setVisibleLeft] = useState(false);
  const [facilityData, setFacilityData] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [employeeData, setEmployeeData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [totalAdhocs, setTotalAdhocs] = useState(0); // Initialize totalAdhocs to 0
  const [myRequests, setMyRequests] = useState(0);
  const [approved, setApproved] = useState(0);
  const [pending, setPending] = useState(0);
  const [rejected, setRejected] = useState(0);
  const [cancelled, setCancelled] = useState(0); // Initialize cancelled to 0
  const [adhocFilter, setAdhocFilter] = useState("pending"); // NEW: filter state
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const options = ["Pick Up", "Drop"];
  const [value, setValue] = useState(options[0]);
  const [shiftData, setShiftData] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  // Add state for request type
  const [requestTypes] = useState([
    { value: "Adhoc", name: "Ad-hoc" },
    { value: "Emergency", name: "Emergency" },
  ]);
  const [selectedRequestType, setSelectedRequestType] = useState(null);
  const [reasonData, setReasonData] = useState([]);
  // Sidebar employee table pagination state
  const [sidebarFirst, setSidebarFirst] = useState(0);
  const [sidebarRows, setSidebarRows] = useState(10);
  const [selectedReason, setSelectedReason] = useState(null);

  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [selectedItemToDelete, setSelectedItemToDelete] = useState(null);
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
  useEffect(() => {
    fetchTotalAdhocCount();
    fetchAdhocRequestCount();
  }, []);
  useEffect(() => {
    fetchAdhocData();
    fetchManagerData();
    fetchFacilityDropdown();
    fetchEmployeeData();
    if (selectedFacility && selectedDate && value) {
      fetchShiftData();
    }
  }, [selectedFacility, selectedDate, value]);
  const fetchAdhocRequestCount = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 3);

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const empId = sessionStorage.getItem("ID");

      let response = await AdhocmanagementService.getAdhocRequestCount({
        empid: empId,
        sdate: formattedStartDate,
        edate: formattedEndDate,
      });
      //console.log("Adhoc Request Count Response:", response);
      if (typeof response === "string") {
        response = JSON.parse(response);
      }

      if (Array.isArray(response) && response.length > 0) {
        setMyRequests(response[0].MyRequest || 0);
        setApproved(response[0].Approved || 0);
        setPending(response[0].Pending || 0);
        setRejected(response[0].Rejected || 0);
        setCancelled(response[0].Cancelled || 0);
      } else {
        setMyRequests(0);
        setApproved(0);
        setPending(0);
        setRejected(0);
        setCancelled(0);
      }
    } catch (error) {
      setMyRequests(0);
      setApproved(0);
      setPending(0);
      setRejected(0);
      setCancelled(0);
      console.error("Error fetching adhoc request count:", error);
    }
  };
  const fetchTotalAdhocCount = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 3);

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const empId = sessionStorage.getItem("ID");

      // Call your API function (make sure it's imported from your service)
      let response = await AdhocmanagementService.getTotalAdhocCount({
        empid: empId,
        sdate: formattedStartDate,
        edate: formattedEndDate,
      });
      //console.log("Total Adhoc Count Response:", response);
      // If response is a string, parse it
      if (typeof response === "string") {
        response = JSON.parse(response);
      }

      // Set the count in state
      if (Array.isArray(response) && response.length > 0) {
        setTotalAdhocs(response[0].TotalAdhocRequest || 0);
      } else {
        setTotalAdhocs(0);
      }
    } catch (error) {
      setTotalAdhocs(0);
      console.error("Error fetching total adhoc count:", error);
    }
  };
  // Add handler for request type change
  const handleRequestTypeChange = async (e) => {
    setSelectedRequestType(e.value);
    // Fetch reason data when request type changes
    if (selectedFacility && e.value) {
      try {
        const response = await AdhocmanagementService.GetAdhocReason({
          facilityid: selectedFacility,
          triptype: e.value,
        });
        // console.log("GetAdhocReason Response:", response);
        const data =
          typeof response === "string" ? JSON.parse(response) : response;
        setReasonData(data || []);
      } catch (error) {
        console.error("Error fetching reason data:", error);
        setReasonData([]);
      }
    }
  };
  const fetchShiftData = async () => {
    try {
      const params = {
        facilityid: selectedFacility,
        sDate: selectedDate,
        type: value === "Pick Up" ? "P" : "D",
        processid: 0, // Default processid as 0
      };
      //console.log("Fetching shift data with params:", params);
      let response;
      if (value === "Pick Up") {
        response = await AdhocmanagementService.getpickshiftAdhoc(params);
      } else {
        response = await AdhocmanagementService.getdropshiftadhoc(params);
      }
      //console.log("Shift Data Response Adhoc:", response);
      const data =
        typeof response === "string" ? JSON.parse(response) : response;
      setShiftData(data || []);
    } catch (error) {
      console.error("Error fetching shift data:", error);
      setShiftData([]);
    }
  };
  const fetchAdhocData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);

      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const empId = sessionStorage.getItem("ID");

      const params = {
        EmpId: parseInt(empId),
        sDate: formattedStartDate,
        eDate: formattedEndDate,
        status: "emp",
      };

      //console.log("Sending params Adhoc Data:", params);

      const response = await AdhocmanagementService.SelectEmpAdhocRequest(
        params
      );
      // console.log("API Response:", response);
      const respData = JSON.parse(response);

      //console.log("AdhocManagement Details", respData);
      setAdhocData(respData);
      // Set counts for all cards
      setTotalAdhocs(respData.length);
      setMyRequests(
        respData.filter(
          (item) => item.Status && item.Status.toLowerCase() === "myrequest"
        ).length
      );
      setPending(
        respData.filter(
          (item) => item.Status && item.Status.toLowerCase() === "pending"
        ).length
      );
      setApproved(
        respData.filter(
          (item) => item.Status && item.Status.toLowerCase() === "approved"
        ).length
      );
      setRejected(
        respData.filter(
          (item) => item.Status && item.Status.toLowerCase() === "rejected"
        ).length
      );
      setCancelled(
        respData.filter(
          (item) => item.Status && item.Status.toLowerCase() === "cancelled"
        ).length
      );
    } catch (error) {
      console.log("Error", error);
      setAdhocData([]);
      setTotalAdhocs(0);
      setMyRequests(0);
      setPending(0);
      setApproved(0);
      setRejected(0);
      setCancelled(0);
    } finally {
      setLoading(false);
    }
  };
  const fetchEmployeeData = async () => {
    try {
      const empidname = "-1";
      const locationid = sessionStorage.getItem("locationId");
      const managerID = sessionStorage.getItem("ID");
      const params = {
        empidname: empidname,
        locationid: locationid,
        managerID: managerID,
      };
      //console.log("Employee Params", params);
      const response = await AdhocmanagementService.EmpSearchManager(params);
      const data = JSON.parse(response);
      //console.log("fetchEmployeeData list:", data);
      setEmployeeData(data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilityDropdown = async () => {
    try {
      setLoading(true);
      const empId = sessionStorage.getItem("ID");

      const params = {
        EmpId: parseInt(empId),
      };

      const response = await AdhocmanagementService.SelectFacilityByGroup(
        params
      );
      //console.log("Facility API Response:", response);

      // Ensure we have an array of data
      let facilities = [];
      if (Array.isArray(response)) {
        facilities = response;
      } else if (response && typeof response === "object") {
        // If response is an object, convert it to array
        facilities = [response];
      }

      //console.log("Processed Facilities:", facilities);
      setFacilityData(facilities);

      // Set default facility if available
      const defaultFacility = facilities.find((facility) => facility.Id === 1);
      if (defaultFacility) {
        setSelectedFacility(defaultFacility.Id);
      } else if (facilities.length > 0) {
        // Fallback to first facility if Id 1 not found
        setSelectedFacility(facilities[0].Id);
      }
    } catch (error) {
      console.error("Error fetching facility data:", error);
      setFacilityData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const params = {
        backupmgrid: sessionStorage.getItem("ID"),
      };
      const response = await AdhocmanagementService.GetBackupMgrId(params);
      // Remove JSON.parse since response is already an object
      //console.log("Manager Data:", response);
      setManagerData(response);

      // Set default manager if available
      if (response && response.length > 0) {
        setSelectedManager(response[0].MgrId);
        // Fetch employee data for the default manager
        fetchEmployeeData();
      }
    } catch (error) {
      console.error("Error fetching manager data:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSidebarClose = () => {
    // Reset all form values to default
    setValue(options[0]); // Reset to "Pick Up"
    setSelectedDate(new Date().toISOString().split("T")[0]); // Reset to current date
    setSelectedShift(null);
    setSelectedRequestType(null);
    setSelectedReason(null);
    setSelectedEmployees([]);
    fetchEmployeeData();
    setVisibleLeft(false);
  };
  const handleSaveChanges = async () => {
    try {
      if (!shiftData || shiftData.length === 0) {
        toastService.warn(
          "No shifts available for selected date and trip type"
        );
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
      // Call the AddAdhocRequest API
      const response = await AdhocmanagementService.AddAdhocRequest(params);
      // Handle success
      if (response) {
        // Show success message
        toastService.success("Adhoc request saved successfully");
        handleSidebarClose();
        // Close the sidebar
        setVisibleLeft(false);
        // Refresh the adhoc data
        fetchAdhocData();
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

      const response = await AdhocmanagementService.DeleteAdhoc(params);
      if (response) {
        // Remove the deleted row from the local state
        const updatedData = adhocData.filter(
          (item) => item.adhocid !== rowData.adhocid
        );
        setAdhocData(updatedData);

        toastService.success("Adhoc request deleted successfully");
        fetchAdhocData();
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
    setLoading(true);

    try {
      await fetchAdhocData();
      // await fetchTotalAdhocCount();
      //await fetchAdhocRequestCount();
      toastService.success("Data refreshed successfully!");
    } catch (error) {
      toastService.error("Failed to refresh data");
      console.error("Refresh error:", error);
    } finally {
      setLoading(false);
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
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container-fluid p-0">
        <ConfirmDialog
          visible={confirmDialogVisible}
          onHide={() => setConfirmDialogVisible(false)}
          message="Are you sure you want to delete this adhoc request?"
          header="Confirmation"
          icon="pi pi-exclamation-triangle"
          accept={() => {
            if (selectedItemToDelete) {
              handleDeleteRequest(selectedItemToDelete);
            }
            setConfirmDialogVisible(false);
          }}
          reject={() => setConfirmDialogVisible(false)}
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
              {loading ? (
                <div>Loading...</div>
              ) : filteredAdhocData.length > 0 ? (
                <>
                  <CustomDataTable
                    value={filteredAdhocData.slice(first, first + rows)}
                    loading={loading}
                    emptyMessage="No Record Found"
                    className="p-datatable-sm"
                    rowClassName={(data, props) => props.rowIndex % 2 !== 0 ? "ota-row-odd" : ""}
                  >
                    <Column sortable field="adhocid" header="Adhoc ID"></Column>
                    <Column field="empCode" header="EmployeeID"></Column>
                    <Column field="empName" header="Employee Name"></Column>
                    <Column field="AdhocDate" header="Shift Date" body={(rowData) => new Date(rowData.AdhocDate).toLocaleDateString()}></Column>
                    <Column field="ShiftTime" header="Shift"></Column>
                    <Column field="TripType" header="Trip Type" body={(rowData) => <TripTypeBadge type={rowData.TripType} />}></Column>
                    <Column field="facilityName" header="Facility"></Column>
                    <Column field="Status" header="Status" align="center" body={(rowData) => <StatusBadge status={rowData.Status} />}></Column>
                    <Column field="RaisedBy" header="Raised By"></Column>
                    <Column field="adhocreason" header="Reason"></Column>
                    <Column field="AprovedBy" header="Approved"></Column>
                    <Column field="" header="Action" body={deleteBtn}></Column>

                  </CustomDataTable>
                  <CustomPaginator
                      first={first}
                      rows={rows}
                      totalRecords={filteredAdhocData.length}
                      onPageChange={onPageChange}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </>
              ) : (
                <div>No Record Found</div>
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
                label: "Save Changes",
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
                      console.log("Selected Manager:", e.value);
                      setSelectedManager(e.value);
                      const originalID = sessionStorage.getItem("ID");
                      sessionStorage.setItem("ID", e.value);
                      fetchEmployeeData();
                      fetchAdhocData();
                      sessionStorage.setItem("ID", originalID);
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <div className="card_tb">
                    <CustomDataTable
                      value={employeeData ? employeeData.slice(sidebarFirst, sidebarFirst + sidebarRows) : []}
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
                              className="material-icons md-18 text-danger"
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
                              className="material-icons md-18 text-danger mx-2"
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
                      <Column field="empName" header="Employee"></Column>
                      <Column field="processName" header="Project"></Column>
                      <Column
                        field="facilityName"
                        header="Facility"
                      ></Column>
                    </CustomDataTable>
                    <CustomPaginator
                      first={sidebarFirst}
                      rows={sidebarRows}
                      totalRecords={employeeData ? employeeData.length : 0}
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

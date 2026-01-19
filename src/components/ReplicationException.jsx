import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import { CustomDataTable } from "./common/CustomDataTable";
import { Column } from "primereact/column";
import CustomPaginator from "./common/CustomPaginator";
import TabSwitcher from "./common/TabSwitcher";
import TableToolbar from "./common/TableToolbar";
import ReportButton from "./common/ReportButton";
import ReplicationExceptionService from "../services/compliance/ReplicationExceptionService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";
import "./common/CustomDataTable.css";

const ReplicationException = () => {
  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [tripType, setTripType] = useState("P");
  const [shifts, setShifts] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);

  // Data state
  const [deleteExceptionData, setDeleteExceptionData] = useState([]);
  const [addExceptionData, setAddExceptionData] = useState([]);
  const [activeTab, setActiveTab] = useState("delete");

  // Selection state
  const [selectedDeleteRows, setSelectedDeleteRows] = useState([]);
  const [selectedAddRows, setSelectedAddRows] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRouteFinalized, setIsRouteFinalized] = useState(false);
  const [routeFinalizedMessage, setRouteFinalizedMessage] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  // Pagination state for delete table
  const [deleteFirst, setDeleteFirst] = useState(0);
  const [deleteRows, setDeleteRows] = useState(20);

  // Pagination state for add table
  const [addFirst, setAddFirst] = useState(0);
  const [addRows, setAddRows] = useState(20);

  const deleteTableRef = useRef(null);
  const addTableRef = useRef(null);

  const UserID = sessionStorage.getItem("ID");

  const tripTypes = [
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" },
  ];

  const tabs = [
    {
      label: "Delete Exception",
      value: "delete",
      count: deleteExceptionData.length,
    },
    { label: "Add Exception", value: "add", count: addExceptionData.length },
  ];

  // Fetch facilities on mount
  useEffect(() => {
    fetchFacilities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch shifts when facility or trip type changes
  useEffect(() => {
    if (selectedFacility) {
      fetchShifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacility, tripType]);

  const fetchFacilities = async () => {
    try {
      const response = await ReplicationExceptionService.SelectFacility({
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

  const fetchShifts = async () => {
    try {
      const response = await ReplicationExceptionService.GetShiftByFacilityType(
        {
          facid: selectedFacility,
          type: tripType,
        }
      );
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.shiftTime,
            value: item.shiftTime,
          }))
        : [];
      setShifts(formattedData);
      setSelectedShifts([]);
    } catch (err) {
      console.error("Error fetching shifts:", err);
      toastService.error("Error fetching shifts");
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

  const getShiftString = () => {
    return selectedShifts.join(",");
  };

  const handleSubmit = async () => {
    if (!selectedFacility) {
      toastService.error("Please select a facility");
      return;
    }

    if (selectedShifts.length === 0) {
      toastService.error("Please select at least one shift");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setSelectedDeleteRows([]);
    setSelectedAddRows([]);

    try {
      const formattedDate = formatDate(selectedDate);
      const shiftString = getShiftString();

      // Check if route is finalized
      const finalizedResponse =
        await ReplicationExceptionService.GetIsRouteFinalized({
          sDate: formattedDate,
          FacilityID: selectedFacility,
          TripType: tripType,
          Shifts: shiftString,
          UserID: UserID,
        });

      const finalizedResult =
        typeof finalizedResponse === "string"
          ? JSON.parse(finalizedResponse)
          : finalizedResponse;

      if (
        finalizedResult &&
        finalizedResult[0] &&
        finalizedResult[0].result === true
      ) {
        setIsRouteFinalized(true);
        setRouteFinalizedMessage(
          `Route has been finalized for ${shiftString} shift.`
        );
      } else {
        setIsRouteFinalized(false);
        setRouteFinalizedMessage("");
      }

      // Fetch delete exception data
      const deleteResponse =
        await ReplicationExceptionService.GetDeleteException({
          sDate: formattedDate,
          eDate: formattedDate,
          FacilityID: selectedFacility,
          TripType: tripType,
          Shifttimes: shiftString,
        });

      const deleteData =
        typeof deleteResponse === "string"
          ? JSON.parse(deleteResponse)
          : deleteResponse;
      setDeleteExceptionData(Array.isArray(deleteData) ? deleteData : []);

      // Fetch add exception data
      const addResponse = await ReplicationExceptionService.GetAddException({
        sDate: formattedDate,
        eDate: formattedDate,
        FacilityID: selectedFacility,
        TripType: tripType,
        Shifttimes: shiftString,
      });

      const addData =
        typeof addResponse === "string" ? JSON.parse(addResponse) : addResponse;
      setAddExceptionData(Array.isArray(addData) ? addData : []);

      setLoading(false);

      if (
        (Array.isArray(deleteData) && deleteData.length > 0) ||
        (Array.isArray(addData) && addData.length > 0)
      ) {
        toastService.success("Exception data fetched successfully");
      } else {
        toastService.warn("No exception data found");
      }
    } catch (err) {
      console.error("Error fetching exception data:", err);
      setLoading(false);
      toastService.error("Error fetching exception data");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDeleteRows.length === 0) {
      toastService.error("Select at least one employee for deletion");
      return;
    }

    const empIdList = selectedDeleteRows.map((row) => row.EmpId).join(",");

    try {
      setLoading(true);
      await ReplicationExceptionService.SprDeleteExceptionEmp({
        sDate: formatDate(selectedDate),
        FacilityID: selectedFacility,
        TripType: tripType,
        Shifttimes: getShiftString(),
        empid: empIdList,
        userid: UserID,
      });

      toastService.success("Selected employees deleted successfully!");
      setSelectedDeleteRows([]);
      handleSubmit(); // Refresh data
    } catch (err) {
      console.error("Error deleting employees:", err);
      setLoading(false);
      toastService.error("Error deleting employees");
    }
  };

  const handleAutoAllocation = async () => {
    try {
      setLoading(true);
      const response = await ReplicationExceptionService.AutoAdhocAllocation({
        sDate: formatDate(selectedDate),
        FacilityID: selectedFacility,
        Shifttimes: getShiftString(),
        TripType: tripType,
        statustype: "Route",
      });

      const result =
        typeof response === "string" ? JSON.parse(response) : response;
      const message =
        result && result[0] && result[0].RESULT
          ? result[0].RESULT
          : "Auto allocation completed";

      toastService.success(message);
      handleSubmit(); // Refresh data
    } catch (err) {
      console.error("Error in auto allocation:", err);
      setLoading(false);
      toastService.error("Error in auto allocation");
    }
  };

  const handleMakeNewRoute = async () => {
    if (selectedAddRows.length === 0) {
      toastService.error("Select at least one employee to make a new route");
      return;
    }

    const empIdList = selectedAddRows.map((row) => row.id).join(",");
    const shiftList = selectedAddRows.map((row) => row.shift).join(",");

    try {
      setLoading(true);
      const response =
        await ReplicationExceptionService.MakeRouteReplicateException({
          sDate: formatDate(selectedDate),
          FacilityID: selectedFacility,
          TripType: tripType,
          Shifttimes: shiftList,
          userid: UserID,
          empid: empIdList,
        });

      const result =
        typeof response === "string" ? JSON.parse(response) : response;
      const newRouteId =
        result && result[0] && result[0].NewRouteID
          ? result[0].NewRouteID
          : "generated";

      toastService.success(`New route ${newRouteId} created successfully!`);
      setSelectedAddRows([]);
      handleSubmit(); // Refresh data
    } catch (err) {
      console.error("Error creating new route:", err);
      setLoading(false);
      toastService.error("Error creating new route");
    }
  };

  const exportDeleteToExcel = () => {
    if (deleteExceptionData.length === 0) {
      toastService.error("No data to export");
      return;
    }
    exportToCSV(
      deleteExceptionData,
      `Delete_Exception_${formatDate(selectedDate)}`
    );
  };

  const exportAddToExcel = () => {
    if (addExceptionData.length === 0) {
      toastService.error("No data to export");
      return;
    }
    exportToCSV(addExceptionData, `Add_Exception_${formatDate(selectedDate)}`);
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

  // Delete table checkbox body template
  const deleteCheckboxBodyTemplate = (rowData) => {
    const isChecked = selectedDeleteRows.some((row) => row.EmpId === rowData.EmpId);
    return (
      <Checkbox
        checked={isChecked}
        onChange={() => {
          setSelectedDeleteRows((prev) => {
            const exists = prev.some((row) => row.EmpId === rowData.EmpId);
            if (exists) {
              return prev.filter((row) => row.EmpId !== rowData.EmpId);
            } else {
              return [...prev, rowData];
            }
          });
        }}
      />
    );
  };

  // Delete table checkbox header template
  const deleteCheckboxHeaderTemplate = () => {
    const allSelected =
      deleteExceptionData.length > 0 &&
      selectedDeleteRows.length === deleteExceptionData.length;
    return (
      <Checkbox
        checked={allSelected}
        onChange={() => {
          setSelectedDeleteRows((prev) => {
            if (prev.length === deleteExceptionData.length) {
              return [];
            } else {
              return [...deleteExceptionData];
            }
          });
        }}
      />
    );
  };

  // Add table checkbox body template
  const addCheckboxBodyTemplate = (rowData) => {
    const isChecked = selectedAddRows.some((row) => row.empCode === rowData.empCode);
    return (
      <Checkbox
        checked={isChecked}
        onChange={() => {
          setSelectedAddRows((prev) => {
            const exists = prev.some((row) => row.empCode === rowData.empCode);
            if (exists) {
              return prev.filter((row) => row.empCode !== rowData.empCode);
            } else {
              return [...prev, rowData];
            }
          });
        }}
      />
    );
  };

  // Add table checkbox header template
  const addCheckboxHeaderTemplate = () => {
    const allSelected =
      addExceptionData.length > 0 &&
      selectedAddRows.length === addExceptionData.length;
    return (
      <Checkbox
        checked={allSelected}
        onChange={() => {
          setSelectedAddRows((prev) => {
            if (prev.length === addExceptionData.length) {
              return [];
            } else {
              return [...addExceptionData];
            }
          });
        }}
      />
    );
  };

  // Pagination handlers
  const onDeletePageChange = (event) => {
    setDeleteFirst(event.first);
    setDeleteRows(event.rows);
  };

  const onAddPageChange = (event) => {
    setAddFirst(event.first);
    setAddRows(event.rows);
  };

  // Get filtered data based on global search
  const getFilteredDeleteData = () => {
    if (!globalFilter || globalFilter.trim() === "") {
      return deleteExceptionData;
    }
    const searchLower = globalFilter.toLowerCase();
    return deleteExceptionData.filter((item) => {
      return Object.values(item).some(
        (val) =>
          val !== null &&
          val !== undefined &&
          String(val).toLowerCase().includes(searchLower)
      );
    });
  };

  const getFilteredAddData = () => {
    if (!globalFilter || globalFilter.trim() === "") {
      return addExceptionData;
    }
    const searchLower = globalFilter.toLowerCase();
    return addExceptionData.filter((item) => {
      return Object.values(item).some(
        (val) =>
          val !== null &&
          val !== undefined &&
          String(val).toLowerCase().includes(searchLower)
      );
    });
  };

  // Get paginated data
  const getPaginatedDeleteData = () => {
    const filtered = getFilteredDeleteData();
    return filtered.slice(deleteFirst, deleteFirst + deleteRows);
  };

  const getPaginatedAddData = () => {
    const filtered = getFilteredAddData();
    return filtered.slice(addFirst, addFirst + addRows);
  };

  // Refresh data handler
  const handleRefresh = () => {
    if (hasSearched) {
      handleSubmit();
    }
  };

  return (
    <>
      <Loader isVisible={loading} fullScreen={true} />
      <Header pageTitle="Replication Exception" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Replication Exception</h6>
          </div>
        </div>


        {/* Form Section */}
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                {/* Date */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="shiftDate" className="form-label">
                    Date <span className="text-danger">*</span>
                  </label>
                  <div className="custom-calendar-wrapper">
                    <img
                      src={calendarIcon}
                      alt="calendar"
                      className="custom-calendar-icon"
                    />
                    <Calendar
                      id="shiftDate"
                      className="w-100 custom-calendar-input"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.value)}
                      dateFormat="mm/dd/yy"
                    />
                  </div>
                </div>

                {/* Facility */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="facility" className="form-label">
                    Facility Name <span className="text-danger">*</span>
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

                {/* Trip Type */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="tripType" className="form-label">
                    Trip Type <span className="text-danger">*</span>
                  </label>
                  <Dropdown
                    id="tripType"
                    value={tripType}
                    options={tripTypes}
                    onChange={(e) => setTripType(e.value)}
                    className="w-100"
                  />
                </div>

                {/* Shift */}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="shift" className="form-label">
                    Shift <span className="text-danger">*</span>
                  </label>
                  <MultiSelect
                    id="shift"
                    placeholder="Select Shift"
                    value={selectedShifts}
                    options={shifts}
                    onChange={(e) => setSelectedShifts(e.value)}
                    className="w-100"
                    display="chip"
                    disabled={!selectedFacility}
                  />
                </div>

                {/* Submit Button */}
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
                      /* Fix MultiSelect styling */
                      .p-multiselect {
                        display: flex;
                        align-items: center;
                      }
                      .p-multiselect .p-multiselect-label {
                        display: flex;
                        align-items: center;
                        padding: 0.5rem 0.75rem;
                        min-height: 38px;
                      }
                      .p-multiselect .p-multiselect-label.p-placeholder {
                        color: #6c757d;
                      }
                      .p-multiselect-token {
                        display: inline-flex;
                        align-items: center;
                        padding: 0.25rem 0.5rem;
                        margin-right: 0.25rem;
                        background-color: #e9ecef;
                        border-radius: 4px;
                        font-size: 0.875rem;
                      }
                      /* Responsive TabSwitcher */
                      .replication-tab-container {
                        width: 100%;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                      }
                      .replication-tab-container::-webkit-scrollbar {
                        display: none;
                      }
                      @media (max-width: 576px) {
                        .replication-tab-container .tab-switcher-container {
                          width: 100%;
                          margin-top: 0.5rem;
                        }
                        .replication-tab-container .tab-switcher {
                          width: 100%;
                          display: flex;
                          flex-wrap: nowrap;
                        }
                        .replication-tab-container .tab-item {
                          flex: 1;
                          min-width: auto;
                          width: auto;
                          padding: 6px 12px;
                          font-size: 0.75rem;
                        }
                      }
                    `}
                  </style>
                  <Button
                    label="Submit"
                    className="btn btn-primary w-100 run-report-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Route Finalized Warning */}
        {isRouteFinalized && (
          <div className="row mt-3">
            <div className="col-12">
              <div className="alert alert-warning mb-0">
                {routeFinalizedMessage}
              </div>
            </div>
          </div>
        )}

        {/* No Data Placeholder */}
        {!hasSearched && (
          <div className="row mt-3">
            <div className="col-12">
              <div className="card_tb">
                <div
                  className="d-flex flex-column align-items-center justify-content-center p-5"
                  style={{ minHeight: "50vh" }}
                >
                  <img
                    src={noReportImage}
                    alt="No Data"
                    style={{
                      maxWidth: "100px",
                      opacity: 0.5,
                      marginBottom: "1rem",
                    }}
                  />
                  <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                    Please select above parameters and click Submit to view
                    exception data
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher with Action Buttons - Same Row */}
        {hasSearched && (
          <div className="row mt-4">
            <div className="col-12">
              <style>
                {`
                  .tab-button-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                  }
                  .tab-button-row .action-buttons .report-button {
                    padding: 0.5rem 1rem !important;
                    font-size: 0.875rem !important;
                    height: auto !important;
                    white-space: nowrap !important;
                  }
                  @media (max-width: 768px) {
                    .tab-button-row {
                      flex-direction: column;
                      align-items: flex-start;
                      gap: 0.75rem;
                    }
                    .tab-button-row .action-buttons {
                      width: 100%;
                      justify-content: flex-start;
                    }
                  }
                `}
              </style>
              <div className="tab-button-row">
                {/* TabSwitcher on the left */}
                <div className="replication-tab-container">
                  <TabSwitcher
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>
                
                {/* Action Buttons on the right */}
                <div className="d-flex gap-2 align-items-center action-buttons">
                  {activeTab === "delete" && (
                    <ReportButton
                      label="Delete Selected"
                      icon="pi pi-trash"
                      onClick={handleDeleteSelected}
                      disabled={selectedDeleteRows.length === 0 || loading}
                      fullWidth={false}
                    />
                  )}
                  {activeTab === "add" && (
                    <>
                      <ReportButton
                        label="Auto Allocation"
                        icon="pi pi-sync"
                        onClick={handleAutoAllocation}
                        disabled={addExceptionData.length === 0 || loading}
                        fullWidth={false}
                      />
                      <ReportButton
                        label="New Route"
                        icon="pi pi-plus"
                        onClick={handleMakeNewRoute}
                        disabled={selectedAddRows.length === 0 || loading}
                        fullWidth={false}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        {hasSearched && (
          <div className="row">
            <div className="col-12">
              <div className="card_tb p-3 mt-3">
                {/* Delete Exception Tab */}
                {activeTab === "delete" && (
                  <div>
                    <TableToolbar
                      search={globalFilter}
                      onSearch={(e) => setGlobalFilter(e.target.value)}
                      onRefresh={handleRefresh}
                      onExport={exportDeleteToExcel}
                      showFilter={false}
                      showSearch={true}
                      showRefresh={true}
                      showExport={true}
                    />

                    <div className="table-responsive">
                      <CustomDataTable
                        key={`delete-${selectedDeleteRows.map(r => r.EmpId).join(',')}`}
                        ref={deleteTableRef}
                        value={getPaginatedDeleteData()}
                        size="small"
                        loading={loading}
                        emptyMessage="No Record Found!"
                        stripedRows
                        tableStyle={{ minWidth: "50rem" }}
                      >
                        <Column
                          header={deleteCheckboxHeaderTemplate}
                          body={deleteCheckboxBodyTemplate}
                          style={{ width: "3rem" }}
                        />
                        <Column
                          field="RouteId"
                          header="Route ID"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="shifttime"
                          header="Shift"
                          sortable
                          style={{ width: "8%" }}
                        />
                        <Column
                          field="empCode"
                          header="Employee ID"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="empName"
                          header="Employee Name"
                          sortable
                          style={{ width: "12%" }}
                        />
                        <Column
                          field="processName"
                          header="Process"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="mobile"
                          header="Mobile"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="stopNo"
                          header="Stop No"
                          sortable
                          style={{ width: "5%" }}
                        />
                        <Column
                          field="address"
                          header="Location"
                          sortable
                          style={{ width: "22%" }}
                        />
                        <Column
                          field="Reason"
                          header="Reason"
                          sortable
                          style={{ width: "10%" }}
                        />
                      </CustomDataTable>
                    </div>

                    <CustomPaginator
                      first={deleteFirst}
                      rows={deleteRows}
                      totalRecords={getFilteredDeleteData().length}
                      onPageChange={onDeletePageChange}
                      rowsPerPageOptions={[10, 20, 50]}
                    />
                  </div>
                )}

                {/* Add Exception Tab */}
                {activeTab === "add" && (
                  <div>
                    <TableToolbar
                      search={globalFilter}
                      onSearch={(e) => setGlobalFilter(e.target.value)}
                      onRefresh={handleRefresh}
                      onExport={exportAddToExcel}
                      showFilter={false}
                      showSearch={true}
                      showRefresh={true}
                      showExport={true}
                    />

                    <div className="table-responsive">
                      <CustomDataTable
                        key={`add-${selectedAddRows.map(r => r.empCode).join(',')}`}
                        ref={addTableRef}
                        value={getPaginatedAddData()}
                        size="small"
                        loading={loading}
                        emptyMessage="No Record Found!"
                        stripedRows
                        tableStyle={{ minWidth: "50rem" }}
                      >
                        <Column
                          header={addCheckboxHeaderTemplate}
                          body={addCheckboxBodyTemplate}
                          style={{ width: "3rem" }}
                        />
                        <Column
                          field="adhocid"
                          header="Request ID"
                          sortable
                          style={{ width: "8%" }}
                        />
                        <Column
                          field="empCode"
                          header="Employee ID"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="empName"
                          header="Employee Name"
                          sortable
                          style={{ width: "15%" }}
                        />
                        <Column
                          field="processName"
                          header="Process"
                          sortable
                          style={{ width: "12%" }}
                        />
                        <Column
                          field="mobile"
                          header="Mobile"
                          sortable
                          style={{ width: "10%" }}
                        />
                        <Column
                          field="Location"
                          header="Location"
                          sortable
                          style={{ width: "22%" }}
                        />
                        <Column
                          field="shift"
                          header="Shift"
                          sortable
                          style={{ width: "8%" }}
                        />
                        <Column
                          field="stype"
                          header="Type"
                          sortable
                          style={{ width: "8%" }}
                        />
                      </CustomDataTable>
                    </div>

                    <CustomPaginator
                      first={addFirst}
                      rows={addRows}
                      totalRecords={getFilteredAddData().length}
                      onPageChange={onAddPageChange}
                      rowsPerPageOptions={[10, 20, 50]}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReplicationException;

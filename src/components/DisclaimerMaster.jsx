import React, { useState, useEffect } from "react";
import Sidebar from "../components/Master/SidebarMenu";
import Header from "../components/Master/Header";
import MasterSidebar from "../components/Master/MasterSidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import DisclaimerMasterService from "../services/compliance/DisclaimerMasterService";
import sessionManager from "../utils/SessionManager";
import calendarIcon from "../assets/calendar.png";
import { Calendar } from "primereact/calendar";

const DisclaimerMaster = () => {
  const [disclaimers, setDisclaimers] = useState([]);
  const [loading, setLoading] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [mainFromDate, setMainFromDate] = useState(todayStr);
  const [mainToDate, setMainToDate] = useState(todayStr);

  const UserID = sessionStorage.getItem("ID");

  useEffect(() => {
    fetchFacilities();
    fetchDisclaimers();
  }, []);

  const fetchDisclaimers = async () => {
    try {
      setLoading(true);
      const response = await DisclaimerMasterService.GetDisclaimerList();

      let data = response;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Error parsing messages:", e);
        }
      }

      setDisclaimers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await DisclaimerMasterService.SelectFacility({
        Userid: UserID,
      });
      const parsed =
        typeof response === "string" ? JSON.parse(response) : response;
      const formatted = Array.isArray(parsed)
        ? parsed.map((item) => ({
            label: item.facility || item.facilityName,
            value: item.Id,
          }))
        : [];
      formatted.unshift({ label: "All Facility", value: 0 });
      setFacilities(formatted);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      toast.error("Error fetching facilities");
    }
  };

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const displayedDisclaimers = disclaimers.slice(first, first + rows);

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    setToDate(addMonth(newFromDate, 1));
  };

  const onchangedFromDate = (newDate) => {
    setMainFromDate(newDate);
    // fetchMgrSchedule removed - auto updates via query
    const days = generateWeekDays(newDate);
    setWeekDays(days);
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
  };

  const handleEdit = (rowData) => {
    setEditMode(true);
    setSelectedMessageId(rowData.id || rowData.MessageId);
    setSelectedFacility(rowData.FacilityId ?? rowData.facilityId ?? null);
    setNewMessageText(rowData.description || rowData.description || "");
    setMainFromDate(rowData.fromdate || rowData.fromdate || "");
    setMainToDate(rowData.todate || rowData.todate || "");
    setSidebarVisible(true);
  };

  const toggleStatus = async (rowData) => {
    try {
      const params = {
        Id: rowData.id || rowData.MessageId,
        Type: rowData.Status === "Activated" ? "Deactivated" : "Activated",
        userId: sessionManager.getUserSession()?.ID || 0,
      };
      await DisclaimerMasterService.ActivateDeactivateMessage(params);
      toast.success("Status updated successfully");
      fetchMessages();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleSave = async () => {
    if (!newMessageText.trim()) {
      toast.warn("Please enter a message");
      return;
    }
    try {
      const params = {
        Description: newMessageText,
        FromDate: mainFromDate,
        ToDate: mainToDate,
        UpdatedBy: sessionManager.getUserSession()?.ID || 0,
      };
      if (editMode) {
        params.id = selectedMessageId;
        await DisclaimerMasterService.UpdateDisclaimer(params);
        toast.success("Disclaimer updated successfully");
      } else {
        await DisclaimerMasterService.InsertDisclaimer(params);
        toast.success("Disclaimer inserted successfully");
      }
      setSidebarVisible(false);
      resetForm();
      fetchMessages();
    } catch (error) {
      console.error("Error saving disclaimer:", error);
      toast.error("Failed to save disclaimer");
    }
  };

  const resetForm = () => {
    setNewMessageText("");
    setSelectedFacility(null);
    setEditMode(false);
    setSelectedMessageId(null);
  };

  const handleCancel = () => {
    setSidebarVisible(false);
    resetForm();
  };

  const openAddForm = (e) => {
    e.preventDefault();
    resetForm();
    setSidebarVisible(true);
  };

  const actionBodyTemplate = (rowData) => (
    <span
      className="text-decoration-underline"
      style={{ color: "#4a36ec", cursor: "pointer", fontSize: "13px" }}
      onClick={() => toggleStatus(rowData)}
    >
      {rowData.Status === "Activated" ? "Deactivate" : "Activate"}
    </span>
  );

  const selectBodyTemplate = (rowData) => (
    <span
      className="text-decoration-underline"
      style={{ color: "#4a36ec", cursor: "pointer", fontSize: "13px" }}
      onClick={() => handleEdit(rowData)}
    >
      Select
    </span>
  );

  const statusBodyTemplate = (rowData) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        backgroundColor: rowData.Status === "Activated" ? "#d4edda" : "#f8d7da",
        color: rowData.Status === "Activated" ? "#155724" : "#721c24",
      }}
    >
      {rowData.Status}
    </span>
  );

  return (
    <div className="container-fluid p-0">
      <Header pageTitle={"Disclaimer Master"} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div
        className="middle"
        style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}
      >
        <div style={{ padding: "20px" }}>
          <div className="row mb-3">
            <div className="col-12">
              <h6
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#1c1d20" }}
              >
                Disclaimer Master
              </h6>
              <p
                className="mb-0"
                style={{ fontSize: "13px", color: "#999d9e" }}
              >
                View, Activate/Deactivate and manage Disclaimers
              </p>
            </div>
          </div>

          <div className="card_tb">
            <CustomDataTable
              value={displayedDisclaimers}
              emptyMessage="No messages found."
              loading={loading}
            >
              <Column
                body={selectBodyTemplate}
                header="Select"
                style={{ width: "70px", textAlign: "center" }}
              />
              <Column
                field="facility"
                header="Facility"
                style={{ width: "110px" }}
              />
              <Column field="description" header="Disclaimer" />
              <Column field="fromdate" header="From Date" />
              <Column field="todate" header="To Date" />
              <Column field="UpdatedBy" header="Updated By" />
              <Column field="updatedat" header="Updated At" />
            </CustomDataTable>

            <CustomPaginator
              first={first}
              rows={rows}
              totalRecords={disclaimers.length}
              onPageChange={onPageChange}
            />

            <div className="text-center py-3">
              <a
                href="#!"
                className="text-decoration-underline"
                style={{
                  color: "#4a36ec",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
                onClick={openAddForm}
              >
                + Add New Disclaimer
              </a>
            </div>
          </div>
        </div>
      </div>

      <MasterSidebar
        show={sidebarVisible}
        onClose={handleCancel}
        title={editMode ? "Edit Disclaimer" : "Add New Disclaimer"}
        width="380px"
        headerBgColor="bg-secondary"
        headerTextColor="text-white"
        footer={
          <div className="offcanvas-footer">
            <button
              className="btn btn-outline-secondary"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button className="btn btn-success" onClick={handleSave}>
              {editMode ? "Update" : "Save"}
            </button>
          </div>
        }
      >
        <div className="p-3">
          <div className="mb-3 filter-item date-select">
            <label className="form-label fw-semibold">From Date</label>
            <div className="custom-calendar-wrapper">
              <img
                src={calendarIcon}
                alt="calendar"
                className="custom-calendar-icon"
              />
              <Calendar
                id="fromDate"
                className="w-100 custom-calendar-input"
                value={mainFromDate ? new Date(mainFromDate) : null}
                onChange={(e) => {
                  const val = e.value
                    ? e.value.toISOString().split("T")[0]
                    : "";
                  onchangedFromDate(val);
                }}
                dateFormat="mm/dd/yy"
              />
            </div>
          </div>

          <div className="mb-3 filter-item date-select">
            <label className="form-label fw-semibold">To Date</label>
            <div className="custom-calendar-wrapper">
              <img
                src={calendarIcon}
                alt="calendar"
                className="custom-calendar-icon"
              />
              <Calendar
                id="toDate"
                className="w-100 custom-calendar-input"
                value={mainToDate ? new Date(mainToDate) : null}
                onChange={(e) => {
                  const val = e.value
                    ? e.value.toISOString().split("T")[0]
                    : "";
                  onchangedToDate(val);
                }}
                dateFormat="mm/dd/yy"
              />
            </div>
          </div>

          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "13px", color: "#545557" }}
            >
              Facility Name
            </label>
            <select
              className="form-select form-select-sm"
              value={selectedFacility ?? ""}
              onChange={(e) => setSelectedFacility(e.target.value)}
            >
              <option value="">-- Select Facility --</option>
              {facilities.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "13px", color: "#545557" }}
            >
              Disclaimer
            </label>
            <textarea
              className="form-control form-control-sm"
              rows="5"
              style={{ resize: "vertical" }}
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Enter message text..."
            />
          </div>
        </div>
      </MasterSidebar>
    </div>
  );
};

export default DisclaimerMaster;

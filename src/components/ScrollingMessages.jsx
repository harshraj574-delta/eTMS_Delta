import React, { useState, useEffect } from "react";
import Sidebar from "../components/Master/SidebarMenu";
import Header from "../components/Master/Header";
import MasterSidebar from "../components/Master/MasterSidebar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import ScrollingMessagesService from "../services/compliance/ScrollingMessagesService";
import sessionManager from "../utils/SessionManager";
import calendarIcon from "../assets/calendar.png";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const ScrollingMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [newAlignment, setNewAlignment] = useState("Right to Left");
  const [newColor, setNewColor] = useState("#ffffff");
  const [newMovement, setNewMovement] = useState("Scroll");
  const [newStartDate, setNewStartDate] = useState(todayStr());
  const [newEndDate, setNewEndDate] = useState(todayStr());

  const UserID = sessionStorage.getItem("ID");

  useEffect(() => {
    fetchFacilities();
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = { empid: sessionManager.getUserSession()?.ID || 0 };
      const response = await ScrollingMessagesService.GetAllMessages(params);

      let data = response;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Error parsing messages:", e);
        }
      }

      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await ScrollingMessagesService.SelectFacility({
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

  const displayedMessages = messages.slice(first, first + rows);

  const handleEdit = (rowData) => {
    setEditMode(true);
    setSelectedMessageId(rowData.id || rowData.MessageId);

    // Try every known casing for the facility ID field
    const facilityId =
      rowData.FacilityId ?? rowData.facilityId ?? rowData.FacilityID ??
      rowData.facilityID ?? rowData.facilityid ?? undefined;

    if (facilityId != null) {
      setSelectedFacility(facilityId);
    } else {
      // Fall back: match by facility name (case-insensitive) against the loaded dropdown list
      const name = (rowData.facility || rowData.facilityName || "").trim().toLowerCase();
      const matched = facilities.find((f) => f.label?.trim().toLowerCase() === name);
      setSelectedFacility(matched ? matched.value : null);
    }

    setNewMessageText(rowData.Message || rowData.MessageText || "");
    setNewAlignment(rowData.Alignment || "Right to Left");
    setNewColor(rowData.color || rowData.Color || "#ffffff");
    setNewMovement(rowData.movement || rowData.Movement || "Scroll");
    setNewStartDate(normalizeDate(rowData.startdate));
    setNewEndDate(normalizeDate(rowData.enddate));
    setSidebarVisible(true);
  };

  const toggleStatus = async (rowData) => {
    try {
      console.log("rowData", rowData);
      const params = {
        Id: rowData.id || rowData.MessageId,
        Type: rowData.Status === "Activated" ? 0 : 1,
        userId: sessionManager.getUserSession()?.ID || 0,
      };
      await ScrollingMessagesService.ActivateDeactivateMessage(params);
      toast.success("Status updated successfully");
      fetchMessages();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleSave = async () => {
    if (!selectedFacility && selectedFacility !== 0) {
      toast.warn("Please select a facility");
      return;
    }
    if (!newMessageText.trim()) {
      toast.warn("Please enter a message");
      return;
    }
    try {
      const params = {
        FacilityId: selectedFacility,
        Message: newMessageText,
        Alignment: newAlignment,
        color: newColor,
        movement: newMovement,
        startdate: newStartDate || null,
        enddate: newEndDate || null,
        UserId: parseInt(sessionManager.getUserSession()?.ID) || 0,
      };
      if (editMode) {
        params.Id = selectedMessageId;
        const updateResp = await ScrollingMessagesService.UpdateMessage(params);
        const updateData = typeof updateResp === "string" ? JSON.parse(updateResp) : updateResp;
        const result = Array.isArray(updateData) ? updateData[0]?.Result : updateData?.Result;
        if (result === 1) {
          toast.success("Message updated successfully");
        } else {
          toast.warn("No changes were saved. The message content and facility are unchanged. Update the message text or facility to save.");
          return;
        }
      } else {
        await ScrollingMessagesService.InsertNewMessage(params);
        toast.success("Message inserted successfully");
      }
      setSidebarVisible(false);
      resetForm();
      fetchMessages();
    } catch (error) {
      console.error("Error saving message:", error);
      toast.error("Failed to save message");
    }
  };

  const resetForm = () => {
    setNewMessageText("");
    setSelectedFacility(null);
    setNewAlignment("Right to Left");
    setNewColor("#ffffff");
    setNewMovement("Scroll");
    setNewStartDate(todayStr());
    setNewEndDate(todayStr());
    setEditMode(false);
    setSelectedMessageId(null);
  };

  const handleCancel = () => {
    setSidebarVisible(false);
    resetForm();
  };

  const openAddForm = (e) => {
    e?.preventDefault();
    resetForm();
    setSidebarVisible(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      let y, m, d;
      if (dateStr.includes("/")) {
        [m, d, y] = dateStr.split("/"); // MM/DD/YYYY from API
      } else {
        [y, m, d] = dateStr.split("-"); // YYYY-MM-DD from calendar picker
      }
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  // Normalize API date (MM/DD/YYYY) to YYYY-MM-DD for the calendar value
  const normalizeDate = (dateStr) => {
    if (!dateStr) return todayStr();
    if (dateStr.includes("/")) {
      const [m, d, y] = dateStr.split("/");
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return dateStr;
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

  const colorBodyTemplate = (rowData) => {
    const c = rowData.color || rowData.Color || "#ffffff";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: c, border: "1px solid #ccc" }} />
        <span>{c}</span>
      </div>
    );
  };

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
      <Header
        pageTitle={"Message Master"}
        showNewButton={true}
        onNewButtonClick={openAddForm}
      />
      <Sidebar />

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
                Message Master
              </h6>
              <p
                className="mb-0"
                style={{ fontSize: "13px", color: "#999d9e" }}
              >
                View, Activate/Deactivate and manage scrolling messages
              </p>
            </div>
          </div>

          <div className="card_tb">
            <CustomDataTable
              value={displayedMessages}
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
              <Column
                field="Message"
                header="Message"
                style={{
                  maxWidth: "400px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              />
              <Column
                field="Alignment"
                header="Alignment"
                style={{ width: "130px" }}
              />
              <Column
                body={colorBodyTemplate}
                header="Color"
                style={{ width: "110px" }}
              />
              <Column
                header="Movement"
                style={{ width: "100px" }}
                body={(rowData) => rowData.movement || rowData.Movement || "—"}
              />
              <Column
                header="Start Date"
                style={{ width: "110px" }}
                body={(rowData) => formatDate(rowData.startdate)}
              />
              <Column
                header="End Date"
                style={{ width: "110px" }}
                body={(rowData) => formatDate(rowData.enddate)}
              />
              <Column
                body={statusBodyTemplate}
                header="Status"
                style={{ width: "110px" }}
              />
              <Column
                body={actionBodyTemplate}
                header="Action"
                style={{ width: "100px", textAlign: "center" }}
              />
            </CustomDataTable>

            <CustomPaginator
              first={first}
              rows={rows}
              totalRecords={messages.length}
              onPageChange={onPageChange}
            />

          </div>
        </div>
      </div>

      <MasterSidebar
        show={sidebarVisible}
        onClose={handleCancel}
        title={editMode ? "Edit Message" : "Add New Message"}
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
              Alignment
            </label>
            <select
              className="form-select form-select-sm"
              value={newAlignment}
              onChange={(e) => setNewAlignment(e.target.value)}
            >
              <option value="Right to Left">Right to Left</option>
              <option value="Left to Right">Left to Right</option>
              <option value="Top to Bottom">Top to Bottom</option>
              <option value="Bottom to Top">Bottom to Top</option>
            </select>
          </div>

          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "13px", color: "#545557" }}
            >
              Text Color
            </label>
            <div className="d-flex align-items-center gap-2">
              <input
                type="color"
                className="form-control form-control-color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                style={{ width: "50px", padding: "0.2rem" }}
              />
              <span style={{ fontSize: "13px" }}>{newColor}</span>
            </div>
          </div>

          <div className="mb-3">
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "13px", color: "#545557" }}
            >
              Movement Type
            </label>
            <select
              className="form-select form-select-sm"
              value={newMovement}
              onChange={(e) => setNewMovement(e.target.value)}
            >
              <option value="Scroll">Scroll</option>
              <option value="Blink">Blink</option>
            </select>
          </div>

          <div className="mb-3 filter-item date-select">
            <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#545557" }}>
              Start Date
            </label>
            <div className="custom-calendar-wrapper">
              <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
              <Calendar
                id="startDate"
                className="w-100 custom-calendar-input"
                value={newStartDate ? new Date(newStartDate) : null}
                onChange={(e) => {
                  if (e.value) {
                    const d = e.value;
                    setNewStartDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
                  } else {
                    setNewStartDate("");
                  }
                }}
                dateFormat="mm/dd/yy"
              />
            </div>
          </div>

          <div className="mb-3 filter-item date-select">
            <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#545557" }}>
              End Date
            </label>
            <div className="custom-calendar-wrapper">
              <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
              <Calendar
                id="endDate"
                className="w-100 custom-calendar-input"
                value={newEndDate ? new Date(newEndDate) : null}
                onChange={(e) => {
                  if (e.value) {
                    const d = e.value;
                    setNewEndDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
                  } else {
                    setNewEndDate("");
                  }
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
              Message
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

export default ScrollingMessages;

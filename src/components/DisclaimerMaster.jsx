import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Master/SidebarMenu";
import Header from "../components/Master/Header";
import MasterSidebar from "../components/Master/MasterSidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import DisclaimerMasterService from "../services/compliance/DisclaimerMasterService";
import HelpDocumentService from "../services/compliance/HelpDocumentService";
import sessionManager from "../utils/SessionManager";
import calendarIcon from "../assets/calendar.png";
import { Calendar } from "primereact/calendar";

// ── static data ────────────────────────────────────────────────────────────────

const FAQ_DATA = [
  {
    id: 1,
    question: "What is an Employee Transport Management System (ETMS)?",
    answer:
      "An ETMS is a platform that automates and optimizes the scheduling, routing, and tracking of employee commute services provided by an organization.",
  },
  {
    id: 2,
    question: "How do employees request a cab or bus pass?",
    answer:
      "Employees can log in to the employee portal, navigate to the transport request section, select their preferred pick-up/drop-off points, and submit their schedule for approval.",
  },
  {
    id: 3,
    question: "Can I track my assigned vehicle in real-time?",
    answer:
      "Yes, the system provides live GPS tracking through the mobile app, allowing employees to see their vehicle's current location and estimated time of arrival.",
  },
  {
    id: 4,
    question: "How are rosters and routes generated?",
    answer:
      "The system uses intelligent algorithms to cluster employee locations and automatically generate optimized routes to minimize travel time and operational costs.",
  },
  {
    id: 5,
    question: "What should I do if I miss my scheduled cab?",
    answer:
      "If you miss your assigned vehicle, you can use the 'Ad-hoc Request' feature in the application to book an immediate, unscheduled ride, subject to availability.",
  },
  {
    id: 6,
    question: "How does the system handle billing and vendor payments?",
    answer:
      "The ETMS automatically calculates distances traveled and trips completed, generating automated billing reports for transport vendors based on pre-configured rate cards.",
  },
  {
    id: 7,
    question: "Who do I contact in case of an emergency during my commute?",
    answer:
      "The application features an SOS button that immediately alerts the central transport helpdesk and triggers automated notifications to predefined emergency contacts.",
  },
];

const HELP_DOCS = [
  { id: 1, name: "User Manual", category: "General", uploaded: true },
  { id: 2, name: "Quick Start Guide", category: "General", uploaded: false },
  { id: 3, name: "Compliance Reference Manual", category: "Compliance", uploaded: true },
  { id: 4, name: "Disclaimer Configuration Guide", category: "Compliance", uploaded: true },
  { id: 5, name: "FAQ Document", category: "Support", uploaded: false },
  { id: 6, name: "System Administrator Handbook", category: "IT", uploaded: true },
  { id: 7, name: "Data Privacy & Security Guide", category: "IT", uploaded: false },
  { id: 8, name: "Onboarding Training Slides", category: "Training", uploaded: true },
  { id: 9, name: "Release Notes — Latest Version", category: "Release", uploaded: false },
  { id: 10, name: "Emergency Procedures Guide", category: "Operations", uploaded: true },
];

// ── icon SVGs ──────────────────────────────────────────────────────────────────

const IconDisclaimer = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="12" y1="9" x2="12.01" y2="9" />
  </svg>
);

const IconFaq = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconHelp = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconTerms = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

// ── section config ─────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "disclaimer",
    label: "Disclaimer Master",
    subtitle: "Manage system disclaimers",
    Icon: IconDisclaimer,
    color: "#4a36ec",
    bg: "#f0eeff",
  },
  {
    id: "faq",
    label: "FAQ's",
    subtitle: "Frequently asked questions",
    Icon: IconFaq,
    color: "#0d6efd",
    bg: "#e8f0ff",
  },
  {
    id: "help",
    label: "Help Documents",
    subtitle: "Guides & reference material",
    Icon: IconHelp,
    color: "#198754",
    bg: "#e8f5ee",
  },
  {
    id: "terms",
    label: "Terms & Conditions",
    subtitle: "Legal & compliance policy",
    Icon: IconTerms,
    color: "#fd7e14",
    bg: "#fff3e8",
  },
];

// ── sub-section components ─────────────────────────────────────────────────────

const FaqSection = () => {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <div className="mb-3">
        <h6 className="fw-bold mb-1" style={{ fontSize: "15px", color: "#1c1d20" }}>
          Frequently Asked Questions
        </h6>
        <p className="mb-0" style={{ fontSize: "13px", color: "#999d9e" }}>
          Find answers to common questions about using this system
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {FAQ_DATA.map((faq) => {
          const open = expanded === faq.id;
          return (
            <div
              key={faq.id}
              style={{
                border: "1px solid",
                borderColor: open ? "#4a36ec" : "#e4e6ea",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#fff",
                transition: "border-color 0.15s",
              }}
            >
              <button
                onClick={() => setExpanded(open ? null : faq.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "13px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#1c1d20" }}>
                  {faq.question}
                </span>
                <span
                  style={{
                    fontSize: "18px",
                    color: "#4a36ec",
                    lineHeight: 1,
                    transform: open ? "rotate(45deg)" : "none",
                    transition: "transform 0.15s",
                    flexShrink: 0,
                    marginLeft: "12px",
                  }}
                >
                  +
                </span>
              </button>
              {open && (
                <div
                  style={{
                    padding: "0 16px 14px",
                    fontSize: "13px",
                    color: "#545557",
                    lineHeight: "1.6",
                    borderTop: "1px solid #f0eeff",
                    background: "#faf9ff",
                  }}
                >
                  <p className="mb-0" style={{ paddingTop: "10px" }}>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt";
const MAX_FILE_MB = 25;

const HelpDocumentsSection = () => {
  const [docs, setDocs] = useState(HELP_DOCS.map((d) => ({ ...d })));
  const [uploadStates, setUploadStates] = useState({});
  const fileInputRef = useRef(null);
  const pendingDocRef = useRef(null);

  const patchUpload = (id, patch) =>
    setUploadStates((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

  const triggerFileInput = (doc) => {
    pendingDocRef.current = doc;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    const doc = pendingDocRef.current;
    if (!file || !doc) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_MB} MB`);
      return;
    }

    patchUpload(doc.id, { uploading: true, progress: 0, error: false, fileName: file.name });

    try {
      await HelpDocumentService.upload(
        doc.id,
        file,
        (pct) => patchUpload(doc.id, { progress: pct }),
        sessionManager.getUserSession()?.ID || 0
      );
      patchUpload(doc.id, { uploading: false, progress: 100, error: false });
      setDocs((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, uploaded: true } : d))
      );
      toast.success(`"${doc.name}" uploaded successfully`);
    } catch {
      patchUpload(doc.id, { uploading: false, progress: 0, error: true });
      toast.error(`Failed to upload "${doc.name}"`);
    }
  };

  const uploadedCount = docs.filter((d) => d.uploaded).length;
  const categories = [...new Set(docs.map((d) => d.category))];

  return (
    <div>
      {/* hidden file input shared across all rows */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
        <div>
          <h6 className="fw-bold mb-1" style={{ fontSize: "15px", color: "#1c1d20" }}>
            Help Documents
          </h6>
          <p className="mb-0" style={{ fontSize: "13px", color: "#999d9e" }}>
            Reference guides, manuals and training material. Max {MAX_FILE_MB} MB per file
            &nbsp;({ACCEPTED_TYPES.replace(/\./g, "").toUpperCase().replace(/,/g, " ")}).
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              background: "#d4edda",
              color: "#155724",
            }}
          >
            {uploadedCount} Uploaded
          </span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              background: "#f8d7da",
              color: "#721c24",
            }}
          >
            {docs.length - uploadedCount} Pending
          </span>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mb-4">
          <p
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "#999d9e",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: "8px",
            }}
          >
            {cat}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {docs.filter((d) => d.category === cat).map((doc) => {
              const us = uploadStates[doc.id] || {};
              const isUploading = !!us.uploading;
              const hasError = !!us.error;

              return (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 16px",
                    background: "#fff",
                    border: `1px solid ${hasError ? "#f5c2c7" : "#e4e6ea"}`,
                    borderRadius: "8px",
                    gap: "12px",
                  }}
                >
                  {/* left: icon + name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={doc.uploaded ? "#198754" : hasError ? "#dc3545" : "#adb5bd"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: "13px", color: "#1c1d20", display: "block" }}>
                        {doc.name}
                      </span>
                      {us.fileName && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#999d9e",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {us.fileName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* right: progress or status + button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexShrink: 0,
                    }}
                  >
                    {isUploading ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "120px",
                            height: "6px",
                            background: "#e9ecef",
                            borderRadius: "3px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${us.progress || 0}%`,
                              background: "#4a36ec",
                              borderRadius: "3px",
                              transition: "width 0.2s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "11px", color: "#4a36ec", fontWeight: "600", minWidth: "32px" }}>
                          {us.progress || 0}%
                        </span>
                      </div>
                    ) : (
                      <>
                        {hasError && (
                          <span style={{ fontSize: "11px", color: "#dc3545", fontWeight: "600" }}>
                            Upload failed
                          </span>
                        )}
                        <span
                          style={{
                            padding: "2px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            background: doc.uploaded ? "#d4edda" : "#fff3cd",
                            color: doc.uploaded ? "#155724" : "#856404",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {doc.uploaded ? "Uploaded" : "Not Uploaded"}
                        </span>
                      </>
                    )}

                    <button
                      onClick={() => triggerFileInput(doc)}
                      disabled={isUploading}
                      style={{
                        padding: "4px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        border: `1px solid ${doc.uploaded ? "#198754" : "#4a36ec"}`,
                        borderRadius: "6px",
                        background: "transparent",
                        color: doc.uploaded ? "#198754" : "#4a36ec",
                        cursor: isUploading ? "not-allowed" : "pointer",
                        opacity: isUploading ? 0.5 : 1,
                        whiteSpace: "nowrap",
                        transition: "all 0.15s",
                      }}
                    >
                      {isUploading
                        ? "Uploading…"
                        : doc.uploaded
                          ? "Re-upload"
                          : "Upload"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const TermsSection = () => (
  <div>
    <div className="mb-3">
      <h6 className="fw-bold mb-1" style={{ fontSize: "15px", color: "#1c1d20" }}>
        Terms &amp; Conditions
      </h6>
      <p className="mb-0" style={{ fontSize: "13px", color: "#999d9e" }}>
        Please read the following terms carefully before using this system
      </p>
    </div>

    {[
      {
        title: "1. Acceptance of Terms",
        body: "By accessing or using the eTMS system, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please discontinue use immediately and contact your system administrator.",
      },
      {
        title: "2. Authorized Use",
        body: "This system is intended solely for authorized personnel. You must not share your credentials with any third party or use another user's credentials to access the system. Unauthorized access or misuse may result in disciplinary action and legal consequences.",
      },
      {
        title: "3. Data Confidentiality",
        body: "All data accessed through this system is confidential and proprietary. You agree not to copy, distribute, or disclose any information obtained through the system without prior written authorization from management.",
      },
      {
        title: "4. Accuracy of Information",
        body: "You are responsible for ensuring that all information you enter into the system is accurate and complete. Knowingly entering false or misleading information is a violation of these terms and applicable policies.",
      },
      {
        title: "5. System Availability",
        body: "While every effort is made to ensure uninterrupted access, the organization does not guarantee that the system will be available at all times. Scheduled maintenance windows will be communicated in advance where possible.",
      },
      {
        title: "6. Modifications to Terms",
        body: "These terms may be updated periodically. Continued use of the system following any changes constitutes your acceptance of the revised terms. It is your responsibility to review these terms regularly.",
      },
      {
        title: "7. Compliance",
        body: "You agree to comply with all applicable laws, regulations, and internal policies while using this system, including but not limited to data protection legislation and healthcare compliance standards.",
      },
    ].map((section) => (
      <div
        key={section.title}
        className="mb-3"
        style={{
          background: "#fff",
          border: "1px solid #e4e6ea",
          borderRadius: "8px",
          padding: "14px 16px",
        }}
      >
        <p style={{ fontSize: "13px", fontWeight: "700", color: "#1c1d20", marginBottom: "6px" }}>
          {section.title}
        </p>
        <p style={{ fontSize: "13px", color: "#545557", lineHeight: "1.65", marginBottom: 0 }}>
          {section.body}
        </p>
      </div>
    ))}
  </div>
);

// ── main component ─────────────────────────────────────────────────────────────

const DisclaimerMaster = () => {
  const [activeSection, setActiveSection] = useState("disclaimer");

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
        try { data = JSON.parse(data); } catch (e) { console.error("Error parsing messages:", e); }
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
      const response = await DisclaimerMasterService.SelectFacility({ Userid: UserID });
      const parsed = typeof response === "string" ? JSON.parse(response) : response;
      const formatted = Array.isArray(parsed)
        ? parsed.map((item) => ({ label: item.facility || item.facilityName, value: item.Id }))
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

  const onchangedFromDate = (newDate) => setMainFromDate(newDate);
  const onchangedToDate = (newDate) => setMainToDate(newDate);

  const handleEdit = (rowData) => {
    setEditMode(true);
    setSelectedMessageId(rowData.id || rowData.MessageId);
    setSelectedFacility(rowData.FacilityId ?? rowData.facilityId ?? null);
    setNewMessageText(rowData.description || "");
    setMainFromDate(rowData.fromdate || "");
    setMainToDate(rowData.todate || "");
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
      fetchDisclaimers();
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
      fetchDisclaimers();
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

  const selectBodyTemplate = (rowData) => (
    <span
      className="text-decoration-underline"
      style={{ color: "#4a36ec", cursor: "pointer", fontSize: "13px" }}
      onClick={() => handleEdit(rowData)}
    >
      Select
    </span>
  );

  const actionBodyTemplate = (rowData) => (
    <span
      className="text-decoration-underline"
      style={{ color: "#4a36ec", cursor: "pointer", fontSize: "13px" }}
      onClick={() => toggleStatus(rowData)}
    >
      {rowData.Status === "Activated" ? "Deactivate" : "Activate"}
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
      <Header pageTitle={"Compliance Center"} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="middle" style={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
        <div style={{ padding: "20px" }}>

          {/* ── page heading ── */}
          <div className="row mb-3">
            <div className="col-12">
              <h6 className="fw-bold mb-0" style={{ fontSize: "16px", color: "#1c1d20" }}>
                Compliance Center
              </h6>
              <p className="mb-0" style={{ fontSize: "13px", color: "#999d9e" }}>
                Manage disclaimers, FAQs, help documents and terms &amp; conditions
              </p>
            </div>
          </div>

          {/* ── section cards ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "14px",
              marginBottom: "22px",
            }}
          >
            {SECTIONS.map((sec) => {
              const active = activeSection === sec.id;
              return (
                <div
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    background: active ? sec.bg : "#fff",
                    border: `1.5px solid ${active ? sec.color : "#e4e6ea"}`,
                    borderRadius: "10px",
                    padding: "16px 18px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: active ? `0 2px 10px ${sec.color}22` : "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: active ? `${sec.color}18` : "#f4f5f7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <sec.Icon color={active ? sec.color : "#adb5bd"} />
                  </div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: active ? sec.color : "#1c1d20",
                      marginBottom: "2px",
                    }}
                  >
                    {sec.label}
                  </p>
                  <p style={{ fontSize: "11px", color: "#999d9e", marginBottom: 0 }}>
                    {sec.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── section content ── */}
          <div className="card_tb">

            {/* Disclaimer Master */}
            {activeSection === "disclaimer" && (
              <>
                <CustomDataTable
                  value={displayedDisclaimers}
                  emptyMessage="No disclaimers found."
                  loading={loading}
                >
                  <Column
                    body={selectBodyTemplate}
                    header="Select"
                    style={{ width: "70px", textAlign: "center" }}
                  />
                  {/* <Column field="facility" header="Facility" style={{ width: "110px" }} /> */}
                  <Column field="description" header="Disclaimer" style={{ maxWidth: "400px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} />
                  <Column field="fromdate" header="From Date" />
                  <Column field="todate" header="To Date" />
                  <Column body={statusBodyTemplate} header="Status" />
                  <Column body={actionBodyTemplate} header="Action" style={{ width: "100px" }} />
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
                    style={{ color: "#4a36ec", fontSize: "13px", fontWeight: "500" }}
                    onClick={openAddForm}
                  >
                    + Add New Disclaimer
                  </a>
                </div>
              </>
            )}

            {/* FAQ's */}
            {activeSection === "faq" && (
              <div style={{ padding: "20px" }}>
                <FaqSection />
              </div>
            )}

            {/* Help Documents */}
            {activeSection === "help" && (
              <div style={{ padding: "20px" }}>
                <HelpDocumentsSection />
              </div>
            )}

            {/* Terms & Conditions */}
            {activeSection === "terms" && (
              <div style={{ padding: "20px" }}>
                <TermsSection />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── add / edit sidebar ── */}
      <MasterSidebar
        show={sidebarVisible}
        onClose={handleCancel}
        title={editMode ? "Edit Disclaimer" : "Add New Disclaimer"}
        width="380px"
        headerBgColor="bg-secondary"
        headerTextColor="text-white"
        footer={
          <div className="offcanvas-footer">
            <button className="btn btn-outline-secondary" onClick={handleCancel}>
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
              <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
              <Calendar
                id="fromDate"
                className="w-100 custom-calendar-input"
                value={mainFromDate ? new Date(mainFromDate) : null}
                onChange={(e) => {
                  onchangedFromDate(e.value ? e.value.toISOString().split("T")[0] : "");
                }}
                dateFormat="mm/dd/yy"
              />
            </div>
          </div>

          <div className="mb-3 filter-item date-select">
            <label className="form-label fw-semibold">To Date</label>
            <div className="custom-calendar-wrapper">
              <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
              <Calendar
                id="toDate"
                className="w-100 custom-calendar-input"
                value={mainToDate ? new Date(mainToDate) : null}
                onChange={(e) => {
                  onchangedToDate(e.value ? e.value.toISOString().split("T")[0] : "");
                }}
                dateFormat="mm/dd/yy"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#545557" }}>
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
            <label className="form-label fw-semibold" style={{ fontSize: "13px", color: "#545557" }}>
              Disclaimer
            </label>
            <textarea
              className="form-control form-control-sm"
              rows="5"
              style={{ resize: "vertical" }}
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Enter disclaimer text..."
            />
          </div>
        </div>
      </MasterSidebar>
    </div>
  );
};

export default DisclaimerMaster;

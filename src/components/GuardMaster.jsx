import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Column } from "primereact/column";
import { CustomDataTable } from "./common/CustomDataTable";
import TableToolbar from "./common/TableToolbar";
import { InputTextarea } from "primereact/inputtextarea";
import MasterSidebar from "./Master/MasterSidebar";
import sessionManager from "../utils/SessionManager";
import GuardMasterService from "../services/compliance/GuardMasterService";
import { apiService } from "../services/api";
// import { Calendar } from "lucide-react";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { InputNumber } from "primereact/inputnumber";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import CustomPaginator from "./common/CustomPaginator";
import Loader from "./common/Loader";

const GUARD_DOCS_STORAGE_KEY = "guard_docs";
const GUARD_STATUS_KEY = "guard_status_data";
const GUARD_BADGE_KEY = "guard_badge_data";
const GUARD_DUTY_TYPE_KEY = "guard_duty_type_data";
const GUARD_STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Bench", value: "Bench" },
  { label: "Terminated", value: "Terminated" },
];
const DUTY_TYPE_OPTIONS = [
  { label: "All Duty", value: "all-duty" },
  { label: "No Duty", value: "no-duty" },
  { label: "Day Duty", value: "day-duty" },
];
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dnzzrvbdz/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "hqudzekg";
const GUARD_PIC_STORAGE_KEY = "guard_picture_";

const GuardMaster = () => {
  const [addGuardMaster, setAddGuardMaster] = useState(false);
  const [visibleLeft, setVisibleLeft] = useState(false);
  const [selectedActive, setSelectedActive] = useState(null);
  // Add the missing selectedGuard state
  const [selectedGuard, setSelectedGuard] = useState(null);
  const userId = sessionManager.getUserSession().ID;
  const [GuardDetails, setGuardDetails] = useState([]);
  // Lookup states
  const [facilities, setFacilities] = useState([]);
  // Selectted Values
  const [selFacility, setSelFacility] = useState(null);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentDetails, setDocumentDetails] = useState([]);
  const [guardDocs, setGuardDocs] = useState({});
  const [uploadingDocIds, setUploadingDocIds] = useState({});
  const [uploadProgressByDoc, setUploadProgressByDoc] = useState({});
  const [activeSidebarTab, setActiveSidebarTab] = useState("details");
  const [guardStatus, setGuardStatus] = useState(null);
  const [guardDutyType, setGuardDutyType] = useState(null);
  const [guardPicUrl, setGuardPicUrl] = useState(null);
  const [picUploading, setPicUploading] = useState(false);
  const [picUploadProgress, setPicUploadProgress] = useState(0);
  const [guardPicMap, setGuardPicMap] = useState({});

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filteredGuardData, setFilteredGuardData] = useState([]);
  const op = useRef(null);
  const filterButtonRef = useRef(null);
  const guardPicInputRef = useRef(null);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  useEffect(() => {
    if (!globalFilter) { setFilteredGuardData(GuardDetails); return; }
    const lower = globalFilter.toLowerCase();
    setFilteredGuardData(GuardDetails.filter((d) =>
      Object.values(d).some((v) => v && String(v).toLowerCase().includes(lower))
    ));
  }, [GuardDetails, globalFilter]);

  useEffect(() => {
    if (!GuardDetails.length) return;
    const map = {};
    GuardDetails.forEach((g) => {
      if (g.GuardID) {
        const pic = localStorage.getItem(GUARD_PIC_STORAGE_KEY + g.GuardID);
        if (pic) map[g.GuardID] = pic;
      }
    });
    setGuardPicMap(map);
  }, [GuardDetails]);

  // Open sidebar with employee data
  const openEditSidebar = (guardData) => {
    const badge = loadGuardBadge(guardData.GuardID);
    setSelectedGuard({ ...guardData, BadgeNo: badge.BadgeNo, BadgeExpDate: badge.BadgeExpDate });
    setVisibleLeft(true);
    loadGuardDocs(guardData);
    setGuardStatus(loadGuardStatus(guardData.GuardID));
    setGuardDutyType(loadGuardDutyType(guardData.GuardID));
    setGuardPicUrl(loadGuardPic(guardData.GuardID));
    setActiveSidebarTab("details");
  };
const exportToExcel = () => {
  const ws = XLSX.utils.json_to_sheet(filteredGuardData.length ? filteredGuardData : GuardDetails);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Guards");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(data, "GuardMaster.xlsx");
};
  useEffect(() => {
    fetchFacilities();
    fetchDocumentDetails();
  }, []);

  useEffect(() => {
    if (facilities.length > 0) {
      const userFacilityId = sessionManager.getUserSession().FacilityID;
      const defaultFacility = facilities.find(f => f.Id === userFacilityId) || facilities[0];
      setSelFacility(defaultFacility);

      // Hamesha data fetch karo, chahe user ki facility mile ya na mile
      if (defaultFacility) {
        fetchGuardDetails(defaultFacility.Id);
      }
    }
  }, [facilities]);
  const fetchFacilities = () => {
    GuardMasterService.getFacilitiesByUserId(userId)
      .then((res) => {
        const data = JSON.parse(res.data) || [];

        setFacilities(data);
      })
      .catch((err) => {
        console.log("Error", err);
      });
  };

  // Fetch Guard details from API
  const fetchGuardDetails = async (facilityid, showSuccessToast = false) => {
    //console.log('FacID',facilityid);

    const params = {
      FacilityID: facilityid,
      SearchValue: search || "",
    };

    try {
      const response = await GuardMasterService.getGuardMasterDetails(params);

      // Safely parse JSON with error handling
      try {
        const respData = JSON.parse(response.data);
        // console.log('respData',respData);

        setGuardDetails(Array.isArray(respData) ? respData : []);
        setFirst(0); // Reset pagination on data fetch
        if (showSuccessToast) toastService.success("Data refreshed successfully.");
      } catch (parseError) {
        console.error("Error parsing guard details:", parseError);
        setGuardDetails([]);
      }
    } catch (error) {
      console.error("Error fetching guard details:", error?.message || error);
      setGuardDetails([]);
      toastService.error("Failed to fetch guard details.");
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedGuard((prev) => ({ ...prev, [name]: value }));
  };

  //Save Guard Details
  const SaveGuard = async () => {
    setIsSubmitting(true);
    try {
      if (!selectedGuard) {
        toastService.warn("Please fill guard details.");
        setIsSubmitting(false);
        return;
      } else if (!selectedGuard.Name) {
        toastService.warn("Please enter Guard Name");
        setIsSubmitting(false);
        return;
      } else if (!selectedGuard.GuardID) {
        toastService.warn("Please enter Guard ID");
        setIsSubmitting(false);
        return;
      } else if (!selectedGuard.GuardComID) {
        toastService.warn("Please Enter Guard Agency ID");
        setIsSubmitting(false);
        return;
      } else if (!selectedGuard.Designation) {
        toastService.warn("Please enter Designation");
        setIsSubmitting(false);
        return;
      } else if (!selectedGuard.ContactNo) {
        toastService.warn("Please Enter valid contact No.");
        setIsSubmitting(false);
        return;
      } else if (!selectedGuard.AadharNo) {
        toastService.warn("Please Enter valid Aadhar No.");
        setIsSubmitting(false);
        return;
      }

      const params = {
        Guardname: selectedGuard.Name,
        remarks: selectedGuard.Remarks || "",
        GuardID: selectedGuard.GuardID,
        BarCodeIssueDate: selectedGuard.BarCodeIssueDate,
        BarcodeExpiryDate: "",
        status: selectedGuard.status || "Y",
        releaseedate: selectedGuard.ReleaseDate,
        vendorcode: selectedGuard.VendorCode,
        ContactNo: selectedGuard.ContactNo,
        GuardComID: selectedGuard.GuardComID,
        Designation: selectedGuard.Designation,
        AadharNo: selectedGuard.AadharNo,
        BadgeNo: selectedGuard.BadgeNo || "",
        BadgeExpDate: selectedGuard.BadgeExpDate || "",
        PVCStatus: selectedGuard.PVCStatus === "No" ? 0 : 1,
        VaccineName: "",
        FirstDoseDate: "",
        SecondDoseDate: "",
        facid: selFacility
          ? selFacility.Id
          : sessionManager.getUserSession().FacilityID,
        userid: sessionManager.getUserSession().ID,
      };

      const response = await GuardMasterService.SaveGuard(params);
      toastService.success("Guard saved successfully.");
      if (selectedGuard?.GuardID) {
        saveGuardStatus(selectedGuard.GuardID, guardStatus);
        saveGuardDutyType(selectedGuard.GuardID, guardDutyType);
        saveGuardBadge(selectedGuard.GuardID, selectedGuard.BadgeNo, selectedGuard.BadgeExpDate);
      }
      setGuardStatus(null);
      setGuardDutyType(null);
      setAddGuardMaster(false);
      setSelectedGuard(null);
      resetGuardDocsState();

      // Refresh the guard list
      if (selFacility) {
        fetchGuardDetails(selFacility.Id);
      } else {
        fetchGuardDetails(sessionManager.getUserSession().FacilityID);
      }
    } catch (error) {
      console.error("Error saving guard details:", error);
      toastService.error("Error saving guard details. Please try again.");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // Also add state initialization for the Add Guard form inputs
  const handleAddGuardClick = async () => {
    const params = {
      location: sessionManager.getUserSession().LocationName,
      facid: selFacility
        ? selFacility.Id
        : sessionManager.getUserSession().FacilityID,
      Type: "S",
    };

    const response = await GuardMasterService.GetNewGuardID(params);
    let NewGuardID = "";
    try {
      const respData = JSON.parse(response.data);
      //console.log('respData',respData);
      NewGuardID = respData[0].TempID;
    } catch (parseError) {
      console.error("Error parsing guard details:", parseError);
    }

    setSelectedGuard({
      GuardID: NewGuardID,
      GuardComID: "",
      Name: "",
      Designation: "",
      ContactNo: "",
      VendorCode: "",
      BarCodeIssueDate: null,
      ReleaseDate: null,
      AadharNo: "",
      BadgeNo: "",
      BadgeExpDate: null,
      PVCStatus: "No",
      status: "Y",
      Remarks: "",
    });
    resetGuardDocsState();
    setGuardStatus(null);
    setGuardDutyType(null);
    setAddGuardMaster(true);
  };

  // Update Guard details
  const UpdateGuard = async () => {
    setIsSubmitting(true);
    try {
      if (!selectedGuard) {
        toastService.warn("Please select Guard to update.");
        setIsSubmitting(false);
        return;
      } else if (selectedGuard.GuardID == "") {
        toastService.warn("Please enter Guard ID");
        setIsSubmitting(false);
        return;
      } else if (selectedGuard.Name == "") {
        toastService.warn("Please enter Guard Name");
        setIsSubmitting(false);
        return;
      } else if (selectedGuard.GuardComID == "") {
        toastService.warn("Please Enter Guard Agency ID");
        setIsSubmitting(false);
        return;
      } else if (selectedGuard.Designation == "") {
        toastService.warn("Please enter Designation");
        setIsSubmitting(false);
        return;
      } else if (selectedGuard.ContactNo == "") {
        toastService.warn("Please Enter valid contact No.");
        setIsSubmitting(false);
        return;
      } else if (selectedGuard.AadharNo == "") {
        toastService.warn("Please Enter valid Aadhar No.");
        setIsSubmitting(false);
        return;
      }

      const params = {
        id: selectedGuard.ID,
        Guardname: selectedGuard.Name,
        remarks: selectedGuard.Remarks,
        GuardID: selectedGuard.GuardID,
        BarCodeIssueDate: selectedGuard.BarCodeIssueDate,
        BarcodeExpiryDate: "",
        status: selectedGuard.status,
        releaseedate: selectedGuard.ReleaseDate,
        vendorcode: selectedGuard.VendorCode,
        ContactNo: selectedGuard.ContactNo,
        GuardComID: selectedGuard.GuardComID,
        Designation: selectedGuard.Designation,
        AadharNo: selectedGuard.AadharNo,
        BadgeNo: selectedGuard.BadgeNo || "",
        BadgeExpDate: selectedGuard.BadgeExpDate || "",
        PVCStatus: selectedGuard.PVCStatus == "No" ? 0 : 1,
        VaccineName: "",
        FirstDoseDate: "",
        //SecondDoseDate: '',
      };

      const response = await GuardMasterService.UpdateGuard(params);
      toastService.success("Guard updated successfully.");
      if (selectedGuard?.GuardID) {
        saveGuardStatus(selectedGuard.GuardID, guardStatus);
        saveGuardDutyType(selectedGuard.GuardID, guardDutyType);
        saveGuardBadge(selectedGuard.GuardID, selectedGuard.BadgeNo, selectedGuard.BadgeExpDate);
      }
      setGuardStatus(null);
      setGuardDutyType(null);
      setVisibleLeft(false);
      resetGuardDocsState();

      if (selFacility == null) {
        fetchGuardDetails(sessionManager.getUserSession().FacilityID);
      } else {
        fetchGuardDetails(selFacility.Id);
      }
    } catch (error) {
      console.error("Error saving guard details:", error);
      toastService.error("Error saving guard details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  // ========== DOCUMENT UPLOAD HELPERS ==========
  const fetchDocumentDetails = async () => {
    try {
      const response = await GuardMasterService.SPR_DocumentDetails({ type: "G" });
      const parsed = JSON.parse(response.data);
      const formatted = parsed.map((item) => ({ name: item.DocumentType, value: item.Id }));
      setDocumentDetails(formatted);
    } catch (error) {
      console.error("Error fetching guard document details:", error);
    }
  };

  const getGuardDocKeys = (guardData) =>
    [guardData.GuardID, guardData.ID, guardData.Id].filter(Boolean).map(String);

  const loadGuardDocs = (guardData) => {
    try {
      const stored = JSON.parse(localStorage.getItem(GUARD_DOCS_STORAGE_KEY) || "{}");
      const keys = getGuardDocKeys(guardData);
      for (const key of keys) {
        if (stored[key]) { setGuardDocs(stored[key]); return; }
      }
      setGuardDocs({});
    } catch { setGuardDocs({}); }
  };

  const saveGuardDocs = (guardData, docs) => {
    try {
      const stored = JSON.parse(localStorage.getItem(GUARD_DOCS_STORAGE_KEY) || "{}");
      const keys = getGuardDocKeys(guardData);
      keys.forEach((key) => { stored[key] = docs; });
      localStorage.setItem(GUARD_DOCS_STORAGE_KEY, JSON.stringify(stored));
    } catch (err) { console.error("Failed to save guard docs:", err); }
  };

  const uploadToCloudinary = (file, guardKey, docTypeId, onProgress) =>
    new Promise((resolve, reject) => {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      uploadFormData.append("asset_folder", `guards/${guardKey}/${docTypeId}`);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", CLOUDINARY_UPLOAD_URL);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) { resolve(data.secure_url); return; }
          reject(new Error(data.error?.message || "Upload failed"));
        } catch (error) { reject(error); }
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(uploadFormData);
    });

  const handleGuardDocUpload = async (file, docTypeId, guardData) => {
    if (!file) return;
    const guardKeys = getGuardDocKeys(guardData);
    const guardKey = guardKeys[0];
    if (!guardKey) { toastService.warn("Please fill in the Guard ID before uploading documents."); return; }
    try {
      setUploadingDocIds((prev) => ({ ...prev, [docTypeId]: true }));
      setUploadProgressByDoc((prev) => ({ ...prev, [docTypeId]: 0 }));
      const url = await uploadToCloudinary(file, guardKey, docTypeId, (progress) => {
        setUploadProgressByDoc((prev) => ({ ...prev, [docTypeId]: progress }));
      });
      const updated = { ...guardDocs, [docTypeId]: url };
      setGuardDocs(updated);
      saveGuardDocs(guardData, updated);
      toastService.success("Document uploaded successfully.");
    } catch (error) {
      console.error("Error uploading guard document:", error);
      toastService.error("Failed to upload the document.");
    } finally {
      setUploadingDocIds((prev) => ({ ...prev, [docTypeId]: false }));
      setUploadProgressByDoc((prev) => ({ ...prev, [docTypeId]: 0 }));
    }
  };

  const loadGuardStatus = (guardId) => {
    try {
      const data = JSON.parse(localStorage.getItem(GUARD_STATUS_KEY) || "{}");
      return data[String(guardId)] || null;
    } catch { return null; }
  };

  const saveGuardStatus = (guardId, status) => {
    try {
      const data = JSON.parse(localStorage.getItem(GUARD_STATUS_KEY) || "{}");
      data[String(guardId)] = status;
      localStorage.setItem(GUARD_STATUS_KEY, JSON.stringify(data));
    } catch (err) { console.error("Failed to save guard status:", err); }
  };

  const loadGuardBadge = (guardId) => {
    try {
      const data = JSON.parse(localStorage.getItem(GUARD_BADGE_KEY) || "{}");
      return data[String(guardId)] || { BadgeNo: "", BadgeExpDate: null };
    } catch { return { BadgeNo: "", BadgeExpDate: null }; }
  };

  const saveGuardBadge = (guardId, badgeNo, badgeExpDate) => {
    try {
      const data = JSON.parse(localStorage.getItem(GUARD_BADGE_KEY) || "{}");
      data[String(guardId)] = { BadgeNo: badgeNo || "", BadgeExpDate: badgeExpDate || null };
      localStorage.setItem(GUARD_BADGE_KEY, JSON.stringify(data));
    } catch (err) { console.error("Failed to save guard badge:", err); }
  };

  const loadGuardDutyType = (guardId) => {
    try {
      const data = JSON.parse(localStorage.getItem(GUARD_DUTY_TYPE_KEY) || "{}");
      return data[String(guardId)] || null;
    } catch { return null; }
  };

  const saveGuardDutyType = (guardId, dutyType) => {
    try {
      const data = JSON.parse(localStorage.getItem(GUARD_DUTY_TYPE_KEY) || "{}");
      data[String(guardId)] = dutyType;
      localStorage.setItem(GUARD_DUTY_TYPE_KEY, JSON.stringify(data));
    } catch (err) { console.error("Failed to save guard duty type:", err); }
  };

  const loadGuardPic = (guardId) => {
    try { return localStorage.getItem(GUARD_PIC_STORAGE_KEY + guardId) || null; } catch { return null; }
  };

  const saveGuardPic = (guardId, url) => {
    try {
      if (url) localStorage.setItem(GUARD_PIC_STORAGE_KEY + guardId, url);
      else localStorage.removeItem(GUARD_PIC_STORAGE_KEY + guardId);
    } catch (err) { console.error("Failed to save guard picture:", err); }
  };

  const handleGuardPicUpload = async (file) => {
    if (!file) return;
    const guardId = selectedGuard?.GuardID?.trim();
    if (!guardId) { toastService.warn("Please fill in the Guard ID before uploading a picture."); return; }
    try {
      setPicUploading(true);
      setPicUploadProgress(0);
      const url = await uploadToCloudinary(file, guardId, "profile", (progress) => setPicUploadProgress(progress));
      setGuardPicUrl(url);
      saveGuardPic(guardId, url);
      setGuardPicMap((prev) => ({ ...prev, [guardId]: url }));
      toastService.success("Profile picture uploaded successfully.");
    } catch (error) {
      console.error("Error uploading guard picture:", error);
      toastService.error("Failed to upload profile picture.");
    } finally {
      setPicUploading(false);
      setPicUploadProgress(0);
    }
  };

  const resetGuardDocsState = () => {
    setGuardDocs({}); setUploadingDocIds({}); setUploadProgressByDoc({}); setGuardPicUrl(null); setActiveSidebarTab("details");
  };

  const getExpiryBadge = (dateVal) => {
    if (!dateVal) return null;
    const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(date) || date.getFullYear() <= 1900) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { label: "Expired", color: "#B91C1C", dot: "#EF4444" };
    if (diffDays <= 7) return { label: `${diffDays}d left`, color: "#92400E", dot: "#F59E0B" };
    if (diffDays <= 15) return { label: `${diffDays}d left`, color: "#1E40AF", dot: "#3B82F6" };
    return null;
  };

  const uploadedDocCount = documentDetails.filter((d) => guardDocs[d.value]).length;

  const renderSidebarTabs = () => (
    <div className="doc-tabs-bar">
      <button type="button" className={`doc-tab-btn ${activeSidebarTab === "details" ? "active" : ""}`} onClick={() => setActiveSidebarTab("details")}>
        <i className="pi pi-user" style={{ fontSize: "13px" }} /> Details
      </button>
      <button type="button" className={`doc-tab-btn ${activeSidebarTab === "documents" ? "active" : ""}`} onClick={() => setActiveSidebarTab("documents")}>
        <i className="pi pi-file" style={{ fontSize: "13px" }} /> Documents
        <span className="doc-tab-count">{uploadedDocCount}/{documentDetails.length}</span>
      </button>
    </div>
  );

  const renderGuardDocumentCards = (guardData) => (
    <div className="doc-tab-panel">
      <div className="doc-tab-summary mb-3">
        <span className="fw-semibold">Uploaded:</span>{" "}
        <span style={{ color: "#6366f1", fontWeight: 700 }}>{uploadedDocCount}</span>
        <span className="text-muted"> / {documentDetails.length} documents</span>
      </div>
      <div className="row g-3">
        {documentDetails.map((doc) => {
          const url = guardDocs[doc.value];
          const isUploading = Boolean(uploadingDocIds[doc.value]);
          const progress = uploadProgressByDoc[doc.value] || 0;
          return (
            <div className="col-12 col-md-6" key={`guard-doc-${doc.value}`}>
              <div className="doc-upload-card">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <div className="fw-semibold" style={{ fontSize: "14px" }}>{doc.name}</div>
                  <span className={`doc-status-badge ${isUploading ? "uploading" : url ? "uploaded" : "pending"}`}>
                    {isUploading ? "Uploading..." : url ? "Uploaded" : "Pending"}
                  </span>
                </div>
                <div className="small text-muted mb-2">PDF only</div>
                <input type="file" accept="application/pdf" className="form-control form-control-sm mb-2" disabled={isUploading}
                  onChange={(e) => { handleGuardDocUpload(e.target.files?.[0], doc.value, guardData); e.target.value = ""; }} />
                {isUploading && (
                  <div className="mb-2">
                    <div className="doc-progress-track"><div className="doc-progress-fill" style={{ width: `${progress}%` }} /></div>
                    <div className="small mt-1" style={{ color: "#6366f1", fontWeight: 600, fontSize: "12px" }}>Uploading {progress}%</div>
                  </div>
                )}
                <div className="d-flex gap-2 flex-wrap">
                  {url ? (
                    <>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm rounded-pill px-3">Preview</a>
                      <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={() => { window.open(url.replace('/upload/', '/upload/fl_attachment/'), '_blank'); }}>Download</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn-outline-primary btn-sm rounded-pill px-3" disabled>Preview</button>
                      <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3" disabled>Download</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header
        pageTitle="Escort Master"
        showNewButton={true}
        onNewButtonClick={handleAddGuardClick}
      />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Guard Master</h6>
          </div>
          {/* Search Box */}
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row">
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                  <label htmlFor="" className="form-label">
                    Facility <span className="text-danger">*</span>
                  </label>
                  <Dropdown
                    value={selFacility}
                    onChange={async (e) => {
                      setIsSubmitting(true);
                      setSelFacility(e.value);
                      await fetchGuardDetails(e.value.Id);
                      setIsSubmitting(false);
                    }}
                    options={facilities}
                    optionLabel="facilityName"
                    placeholder="Select Facility"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="col-12 col-md-12 col-lg-10 mb-3">
                </div>
                {/* <div className="col-2">
                                    <Button label="Submit" disabled={!selFacility} className="btn btn-dark no-label-prime" onClick={fetchGuardDetails} />
                                </div> */}
              </div>
            </div>
          </div>

          {/* Table Start */}
          <div className="col-12">
            <div className="card_tb p-3">
              <TableToolbar
                showFilter={false}
                search={globalFilter}
                onSearch={(e) => { setGlobalFilter(e.target.value); setFirst(0); }}
                onRefresh={() => { setGlobalFilter(""); fetchGuardDetails(selFacility?.Id || sessionManager.getUserSession().FacilityID, true); }}
                onExport={exportToExcel}
                filterButtonRef={filterButtonRef}
                overlayRef={op}
              />
              <CustomDataTable
                value={filteredGuardData.slice(first, first + rows).map((row) => ({ ...row, _picUrl: guardPicMap[row.GuardID] || null }))}
                emptyMessage="No guard data available"
              >
                <Column
                  header="Photo"
                  style={{ width: "60px" }}
                  body={(rowData) => {
                    const pic = rowData._picUrl || null;
                    return pic ? (
                      <img src={pic} alt={rowData.Name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #e5e7eb" }}>
                        <i className="pi pi-user" style={{ fontSize: 14, color: "#9ca3af" }} />
                      </div>
                    );
                  }}
                />
                <Column
                  sortable
                  field="GuardID"
                  header="Guard ID"
                  body={(rowData) => (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        openEditSidebar(rowData);
                      }}
                    >
                      {rowData.GuardID}
                    </a>
                  )}
                />
                <Column sortable field="GuardComID" header="Guard Agency ID" />
                <Column sortable field="Name" header="Guard Name" />
                <Column sortable field="Designation" header="Designation" />
                <Column sortable field="ContactNo" header="Contact No" />
                <Column sortable field="VendorCode" header="Vendor" />
                <Column sortable field="BarCodeIssueDate" header="Induction Date" />
                <Column sortable field="ReleaseDate" header="Release Date" />
                <Column
                  sortable
                  field="status"
                  header="Active"
                  body={(rowData) => (rowData.status === "N" ? "No" : "Yes")}
                />
                <Column sortable field="Remarks" header="Remarks" />
                <Column sortable field="facilityName" header="Facility" />
                <Column sortable field="AadharNo" header="Aadhar No." />
                <Column sortable field="PVCStatus" header="PVC Status" />
              </CustomDataTable>
              <CustomPaginator
                first={first}
                rows={rows}
                totalRecords={filteredGuardData.length}
                onPageChange={onPageChange}
                rowsPerPageOptions={[50, 100, 150, 200, 250]}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Guard Sidebar */}
      <MasterSidebar
            show={addGuardMaster}
            onClose={() => { setAddGuardMaster(false); setGuardPicUrl(null); }}
            title={
              <div className="w-100 d-flex justify-content-between align-items-center pe-4">
                <span>Add Guard</span>
                {selectedGuard?.status === "Y" && <span className="text-warning fs-6">Attrited</span>}
              </div>
            }
            width="40%"
            footerButtons={[
              {
                label: "Cancel",
                className: "btn btn-outline-secondary",
                onClick: () => { setAddGuardMaster(false); setGuardPicUrl(null); }
              },
              {
                label: "Save",
                className: "btn btn-success",
                onClick: SaveGuard
              }
            ]}
          >
            <div className="p-3 bg-white">
              {renderSidebarTabs()}
              {activeSidebarTab === "details" && (
              <div className="row">
                <div className="col-12 mb-4 d-flex flex-column align-items-center">
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <div
                      style={{ width: 90, height: 90, borderRadius: "50%", border: "2px solid #e5e7eb", overflow: "hidden", cursor: "pointer", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
                      onClick={() => !picUploading && guardPicInputRef.current?.click()}
                    >
                      {guardPicUrl ? (
                        <img src={guardPicUrl} alt="Guard" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <i className="pi pi-user" style={{ fontSize: "2.2rem", color: "#9ca3af" }} />
                      )}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 28, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {picUploading ? <i className="pi pi-spin pi-spinner" style={{ color: "white", fontSize: 13 }} /> : <i className="pi pi-camera" style={{ color: "white", fontSize: 13 }} />}
                      </div>
                    </div>
                    {guardPicUrl && !picUploading && (
                      <button type="button"
                        style={{ position: "absolute", top: -5, right: -5, width: 22, height: 22, borderRadius: "50%", border: "none", background: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                        onClick={() => { const gid = selectedGuard?.GuardID; setGuardPicUrl(null); if (gid) { saveGuardPic(gid, null); setGuardPicMap((prev) => { const n = { ...prev }; delete n[gid]; return n; }); } }}
                      >
                        <i className="pi pi-times" style={{ fontSize: 10 }} />
                      </button>
                    )}
                    <input ref={guardPicInputRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => { handleGuardPicUpload(e.target.files?.[0]); e.target.value = ""; }} />
                  </div>
                  {picUploading && <small style={{ color: "#6366f1", fontWeight: 600, marginTop: 6 }}>Uploading {picUploadProgress}%</small>}
                  {!picUploading && <small style={{ color: "#9ca3af", marginTop: 6 }}>Click to {guardPicUrl ? "change" : "upload"} photo</small>}
                </div>
                <div className="col-12 mb-3">
                  <div className="d-flex flex-row justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "#eaeaff" }}>
                    <h6 className="text-primary m-0 ps-2 fs-6 fw-semibold">Basic Details</h6>
                    <div className="d-flex align-items-center gap-2 pe-2">
                      <label className="m-0 fs-6 fw-semibold">Attrited</label>
                      <Checkbox
                        checked={selectedGuard?.status === "Y"}
                        onChange={(e) => {
                          setSelectedGuard((prev) => ({
                            ...prev,
                            status: e.checked ? "Y" : "N",
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="field col-6 mb-3">
                  <label>Guard ID</label>
                  <InputText
                    className="form-control"
                    name="GuardID"
                    value={selectedGuard?.GuardID || ""}
                    onChange={handleInputChange}
                    placeholder="Guard ID"
                    disabled
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>
                    Guard Agency ID <span>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    name="GuardComID"
                    value={selectedGuard?.GuardComID || ""}
                    onChange={handleInputChange}
                    placeholder="Guard Agency ID"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>
                    Guard Name <span>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    name="Name"
                    value={selectedGuard?.Name || ""}
                    onChange={handleInputChange}
                    placeholder="Guard Name"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>
                    Designation <span>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    name="Designation"
                    value={selectedGuard?.Designation || ""}
                    onChange={handleInputChange}
                    placeholder="Designation"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>
                    Contact No <span>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    name="ContactNo"
                    value={selectedGuard?.ContactNo || ""}
                    onChange={handleInputChange}
                    placeholder="Contact No"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Vendor</label>
                  <InputText
                    className="form-control"
                    name="VendorCode"
                    value={selectedGuard?.VendorCode || ""}
                    onChange={handleInputChange}
                    placeholder="Vendor"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Induction Date</label>
                  <Calendar
                    className="w-100"
                    name="BarCodeIssueDate"
                    value={
                      selectedGuard?.BarCodeIssueDate
                        ? new Date(selectedGuard.BarCodeIssueDate)
                        : null
                    }
                    onChange={(e) => {
                      setSelectedGuard((prev) => ({
                        ...prev,
                        BarCodeIssueDate: e.value
                          ? e.value.toISOString().split("T")[0]
                          : null,
                      }));
                    }}
                    dateFormat="dd/mm/yy"
                    placeholder="Induction Date"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Release Date</label>
                  <Calendar
                    className="w-100"
                    name="ReleaseDate"
                    value={
                      selectedGuard?.ReleaseDate
                        ? new Date(selectedGuard.ReleaseDate)
                        : null
                    }
                    onChange={(e) => {
                      setSelectedGuard((prev) => ({
                        ...prev,
                        ReleaseDate: e.value
                          ? e.value.toISOString().split("T")[0]
                          : null,
                      }));
                    }}
                    dateFormat="dd/mm/yy"
                    placeholder="Release Date"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>
                    Aadhar No. <span>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    name="AadharNo"
                    value={selectedGuard?.AadharNo || ""}
                    onChange={handleInputChange}
                    placeholder="Aadhar No."
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Badge Number</label>
                  <InputText
                    className="form-control"
                    name="BadgeNo"
                    value={selectedGuard?.BadgeNo || ""}
                    onChange={handleInputChange}
                    placeholder="Badge Number"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label style={getExpiryBadge(selectedGuard?.BadgeExpDate) ? { color: getExpiryBadge(selectedGuard.BadgeExpDate).color, fontWeight: 600 } : {}}>
                    Badge Expiry Date
                  </label>
                  <div style={getExpiryBadge(selectedGuard?.BadgeExpDate) ? { border: `1.5px solid ${getExpiryBadge(selectedGuard.BadgeExpDate).dot}`, borderRadius: "6px", overflow: "hidden" } : {}}>
                    <Calendar
                      className="w-100"
                      name="BadgeExpDate"
                      value={selectedGuard?.BadgeExpDate ? new Date(selectedGuard.BadgeExpDate) : null}
                      onChange={(e) => setSelectedGuard((prev) => ({ ...prev, BadgeExpDate: e.value ? e.value.toISOString().split("T")[0] : null }))}
                      dateFormat="dd/mm/yy"
                      placeholder="Badge Expiry Date"
                    />
                  </div>
                  {getExpiryBadge(selectedGuard?.BadgeExpDate) && (
                    <small style={{ color: getExpiryBadge(selectedGuard.BadgeExpDate).color, fontWeight: 600, fontSize: "11px", marginTop: "3px", display: "block" }}>
                      ● {getExpiryBadge(selectedGuard.BadgeExpDate).label}
                    </small>
                  )}
                </div>
                <div className="field col-6 mb-3">
                  <label>PVC Status</label>
                  <Checkbox
                    checked={selectedGuard?.PVCStatus === "Y"}
                    onChange={(e) => {
                      setSelectedGuard((prev) => ({
                        ...prev,
                        PVCStatus: e.checked ? "Y" : "N",
                      }));
                    }}
                    className="w-100"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Status</label>
                  <Dropdown
                    value={guardStatus}
                    onChange={(e) => setGuardStatus(e.value)}
                    options={GUARD_STATUS_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Status"
                    className="w-100"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Duty Type</label>
                  <Dropdown
                    value={guardDutyType}
                    onChange={(e) => setGuardDutyType(e.value)}
                    options={DUTY_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Duty Type"
                    className="w-100"
                  />
                </div>
                <div className="field col-12 mb-3">
                  <label>Remarks</label>
                  <InputTextarea
                    name="Remarks"
                    value={selectedGuard?.Remarks || ""}
                    onChange={handleInputChange}
                    rows={5}
                    cols={30}
                    className="w-100"
                    placeholder="Remarks"
                  />
                </div>
              </div>
              )}
              {activeSidebarTab === "documents" && renderGuardDocumentCards(selectedGuard || {})}
            </div>
          </MasterSidebar>

          {/* Edit Guard Sidebar */}
          <MasterSidebar
            show={visibleLeft}
            onClose={() => { setVisibleLeft(false); setGuardPicUrl(null); }}
            title={
              <div className="w-100 d-flex justify-content-between align-items-center pe-4">
                <span>{selectedGuard?.Name || "Guard Details"} - {selectedGuard?.GuardID || ""}</span>
                {selectedGuard?.status === "Y" && <span className="text-warning fs-6">Attrited</span>}
              </div>
            }
            width="40%"
            footerButtons={[
              {
                label: "Cancel",
                className: "btn btn-outline-secondary",
                onClick: () => { setVisibleLeft(false); setGuardPicUrl(null); }
              },
              {
                label: "Update",
                className: "btn btn-success",
                onClick: UpdateGuard
              }
            ]}
          >
            <div className="p-3 bg-white">
              {renderSidebarTabs()}
              {activeSidebarTab === "details" && (
              <div className="row">
                <div className="col-12 mb-4 d-flex flex-column align-items-center">
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <div
                      style={{ width: 90, height: 90, borderRadius: "50%", border: "2px solid #e5e7eb", overflow: "hidden", cursor: "pointer", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
                      onClick={() => !picUploading && guardPicInputRef.current?.click()}
                    >
                      {guardPicUrl ? (
                        <img src={guardPicUrl} alt="Guard" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <i className="pi pi-user" style={{ fontSize: "2.2rem", color: "#9ca3af" }} />
                      )}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 28, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {picUploading ? <i className="pi pi-spin pi-spinner" style={{ color: "white", fontSize: 13 }} /> : <i className="pi pi-camera" style={{ color: "white", fontSize: 13 }} />}
                      </div>
                    </div>
                    {guardPicUrl && !picUploading && (
                      <button type="button"
                        style={{ position: "absolute", top: -5, right: -5, width: 22, height: 22, borderRadius: "50%", border: "none", background: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                        onClick={() => { const gid = selectedGuard?.GuardID; setGuardPicUrl(null); if (gid) { saveGuardPic(gid, null); setGuardPicMap((prev) => { const n = { ...prev }; delete n[gid]; return n; }); } }}
                      >
                        <i className="pi pi-times" style={{ fontSize: 10 }} />
                      </button>
                    )}
                    <input ref={guardPicInputRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => { handleGuardPicUpload(e.target.files?.[0]); e.target.value = ""; }} />
                  </div>
                  {picUploading && <small style={{ color: "#6366f1", fontWeight: 600, marginTop: 6 }}>Uploading {picUploadProgress}%</small>}
                  {!picUploading && <small style={{ color: "#9ca3af", marginTop: 6 }}>Click to {guardPicUrl ? "change" : "upload"} photo</small>}
                </div>
                <div className="col-12 mb-3">
                  <div className="d-flex flex-row justify-content-between align-items-center p-2 rounded" style={{ backgroundColor: "#eaeaff" }}>
                    <h6 className="text-primary m-0 ps-2 fs-6 fw-semibold">Guard Details</h6>
                    <div className="d-flex align-items-center gap-2 pe-2">
                      <label className="m-0 fs-6 fw-semibold">Attrited</label>
                      <Checkbox
                        checked={selectedGuard?.status === "Y"}
                        onChange={(e) => {
                          setSelectedGuard((prev) => ({
                            ...prev,
                            status: e.checked ? "Y" : "N",
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="field col-6 mb-3">
                  <label>Guard ID</label>
                  <InputText
                    className="form-control"
                    name="GuardID"
                    value={selectedGuard?.GuardID || ""}
                    onChange={handleInputChange}
                    placeholder="Guard ID"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Guard Agency ID <span>*</span></label>
                  <InputText
                    className="form-control"
                    name="GuardComID"
                    value={selectedGuard?.GuardComID || ""}
                    onChange={handleInputChange}
                    placeholder="Guard Agency ID"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Guard Name <span>*</span></label>
                  <InputText
                    className="form-control"
                    name="Name"
                    value={selectedGuard?.Name || ""}
                    onChange={handleInputChange}
                    placeholder="Guard Name"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Designation <span>*</span></label>
                  <InputText
                    className="form-control"
                    name="Designation"
                    value={selectedGuard?.Designation || ""}
                    onChange={handleInputChange}
                    placeholder="Designation"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Contact No. <span>*</span></label>
                  <InputText
                    className="w-100"
                    name="ContactNo"
                    value={selectedGuard?.ContactNo || ""}
                    onChange={handleInputChange}
                    placeholder="Contact No"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Vendor</label>

                  <InputText
                    name="VendorCode"
                    value={selectedGuard?.VendorCode || ""}
                    onChange={handleInputChange}
                    className="form-control"
                  ></InputText>
                </div>
                <div className="field col-6 mb-3">
                  <label>Induction Date</label>
                  <Calendar
                    className="w-100"
                    name="BarCodeIssueDate"
                    value={
                      selectedGuard?.BarCodeIssueDate
                        ? new Date(selectedGuard.BarCodeIssueDate)
                        : null
                    }
                    onChange={(e) => {
                      setSelectedGuard((prev) => ({
                        ...prev,
                        BarCodeIssueDate: e.value
                          ? e.value.toISOString().split("T")[0]
                          : null,
                      }));
                    }}
                    dateFormat="dd/mm/yy"
                    placeholder="Induction Date"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Release Date</label>
                  <Calendar
                    className="w-100"
                    name="ReleaseDate"
                    value={
                      selectedGuard?.ReleaseDate
                        ? new Date(selectedGuard.ReleaseDate)
                        : null
                    }
                    onChange={(e) => {
                      setSelectedGuard((prev) => ({
                        ...prev,
                        ReleaseDate: e.value
                          ? e.value.toISOString().split("T")[0]
                          : null,
                      }));
                    }}
                    dateFormat="dd/mm/yy"
                    placeholder="Release Date"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>
                    Aadhar No. <span>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    name="AadharNo"
                    value={selectedGuard?.AadharNo || ""}
                    onChange={handleInputChange}
                    placeholder="Aadhar No."
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Badge Number</label>
                  <InputText
                    className="form-control"
                    name="BadgeNo"
                    value={selectedGuard?.BadgeNo || ""}
                    onChange={handleInputChange}
                    placeholder="Badge Number"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label style={getExpiryBadge(selectedGuard?.BadgeExpDate) ? { color: getExpiryBadge(selectedGuard.BadgeExpDate).color, fontWeight: 600 } : {}}>
                    Badge Expiry Date
                  </label>
                  <div style={getExpiryBadge(selectedGuard?.BadgeExpDate) ? { border: `1.5px solid ${getExpiryBadge(selectedGuard.BadgeExpDate).dot}`, borderRadius: "6px", overflow: "hidden" } : {}}>
                    <Calendar
                      className="w-100"
                      name="BadgeExpDate"
                      value={selectedGuard?.BadgeExpDate ? new Date(selectedGuard.BadgeExpDate) : null}
                      onChange={(e) => setSelectedGuard((prev) => ({ ...prev, BadgeExpDate: e.value ? e.value.toISOString().split("T")[0] : null }))}
                      dateFormat="dd/mm/yy"
                      placeholder="Badge Expiry Date"
                    />
                  </div>
                  {getExpiryBadge(selectedGuard?.BadgeExpDate) && (
                    <small style={{ color: getExpiryBadge(selectedGuard.BadgeExpDate).color, fontWeight: 600, fontSize: "11px", marginTop: "3px", display: "block" }}>
                      ● {getExpiryBadge(selectedGuard.BadgeExpDate).label}
                    </small>
                  )}
                </div>
                <div className="field col-6 mb-3">
                  <label>PVC Status</label>
                  <Checkbox
                    checked={selectedGuard?.PVCStatus === "Yes"}
                    onChange={(e) => {
                      setSelectedGuard((prev) => ({
                        ...prev,
                        PVCStatus: e.checked ? "Yes" : "No",
                      }));
                    }}
                    className="w-100"
                  />
                </div>
                {/* <div className="field col-6 mb-3">
                  <label>Attrited</label>
                  <div className="d-flex align-items-center gap-2">
                    
                  </div>
                </div> */}
                <div className="field col-6 mb-3">
                  <label>Status</label>
                  <Dropdown
                    value={guardStatus}
                    onChange={(e) => setGuardStatus(e.value)}
                    options={GUARD_STATUS_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Status"
                    className="w-100"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Duty Type</label>
                  <Dropdown
                    value={guardDutyType}
                    onChange={(e) => setGuardDutyType(e.value)}
                    options={DUTY_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Duty Type"
                    className="w-100"
                  />
                </div>
                <div className="field col-12 mb-3">
                  <label>Remarks</label>
                  <InputTextarea
                    name="Remarks"
                    value={selectedGuard?.Remarks || ""}
                    onChange={handleInputChange}
                    rows={5}
                    cols={30}
                    className="w-100"
                    placeholder="Remarks"
                  />
                </div>
              </div>
              )}
              {activeSidebarTab === "documents" && renderGuardDocumentCards(selectedGuard || {})}
            </div>
          </MasterSidebar>
    </>
  );
};

export default GuardMaster;

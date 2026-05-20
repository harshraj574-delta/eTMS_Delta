import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Tooltip } from "primereact/tooltip";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { CustomDataTable } from "./common/CustomDataTable";
import TableToolbar from "./common/TableToolbar";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import MasterSidebar from "./Master/MasterSidebar";
import { Checkbox } from "primereact/checkbox";
import { ToastContainer } from "react-toastify";

import sessionManager from "../utils/SessionManager";
import driverMasterService from "../services/compliance/DriverMasterService";
import ReportButton from "./common/ReportButton";
import Loader from "./common/Loader";
import { toastService } from "../services/toastService";

const DRIVER_STATUS_KEY = "driver_status_data";
const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "Bench", value: "Bench" },
  { label: "Terminated", value: "Terminated" },
];

const DRIVER_DUTY_TYPE_KEY = "driver_duty_type_data";
const DUTY_TYPE_OPTIONS = [
  { label: "All Duty", value: "all-duty" },
  { label: "No Duty", value: "no-duty" },
  { label: "Day Duty", value: "day-duty" },
];

const DEFAULT_DRIVER_DOCUMENT_OPTIONS = [
  { name: "Aadhar Card", value: 8 },
  { name: "Address Proof", value: 9 },
  { name: "Age Proof", value: 10 },
  { name: "Driving Licence", value: 11 },
  { name: "Medical Certificate", value: 12 },
  { name: "PV Certificate", value: 13 },
  { name: "Valid Badge", value: 14 },
];
const DRIVER_DOCS_STORAGE_KEY = "driver_docs";
const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/dnzzrvbdz/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "hqudzekg";
const DRIVER_PIC_STORAGE_KEY = "driver_picture_";

const DriverMaster = () => {
  const [visibleLeft, setVisibleLeft] = useState(false);
  const [driverDetails, setDriverDetails] = useState([]);
  const [addDriverMaster, setAddDriverMaster] = useState(false);
  const [loading, setLoading] = useState(false);
  const locationId = sessionManager.getUserSession().locationId;
  const userId = sessionManager.getUserSession().ID;

  // Lookup states
  const [facilities, setFacilities] = useState([]);
  const [venders, setVenders] = useState([]);
  const [documentDetails, setDocumentDetails] = useState(
    DEFAULT_DRIVER_DOCUMENT_OPTIONS
  );
  const [driverDocs, setDriverDocs] = useState({});
  const [uploadingDocIds, setUploadingDocIds] = useState({});
  const [uploadProgressByDoc, setUploadProgressByDoc] = useState({});
  const [activeSidebarTab, setActiveSidebarTab] = useState("details");
  const [driverPicUrl, setDriverPicUrl] = useState(null);
  const [picUploading, setPicUploading] = useState(false);
  const [picUploadProgress, setPicUploadProgress] = useState(0);
  const [driverPicMap, setDriverPicMap] = useState({});

  // Selected Values
  const [selFacility, setSelFacility] = useState(null);
  const [selVendor, setSelVendor] = useState(null);
  const [search, setSearch] = useState("");

  // Sort Table
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState(null);

  // Form state
  const [formData, setFormData] = useState(getInitialFormData());
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filteredDriverData, setFilteredDriverData] = useState([]);
  const op = useRef(null);
  const filterButtonRef = useRef(null);
  const driverPicInputRef = useRef(null);

  const [driverStatus, setDriverStatus] = useState(null);
  const [driverDutyType, setDriverDutyType] = useState(null);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  function getInitialFormData() {
    return {
      Id: 0,
      DriverId: "",
      DriverName: "",
      FacilityId: 0,
      VendorId: 0,
      FatherName: "",
      MotherName: "",
      PresentAddress: "",
      PermanentAddress: "",
      ContactNo: "",
      DateOfBirth: null,
      BloodGroup: "",
      Qualificaton: "",
      MaritalStatus: "",
      VehicleId: 0,
      LicenceNo: "",
      LicenceExpDate: null,
      BadgeNo: "",
      BadgeExpDate: null,
      DriverStatus: 0,
      Attrited: 0,
      AttritedDate: null,
      Warning_1: "",
      Warning_2: "",
      FinalWarning: "",
      AadharVerification: 0,
      PVStatus: 0,
      Remark: "",
      Medical_Fit_Certificate: 0,
      DriverInfo_Display: 0,
      InductionForm: 0,
      UpdatedBy: userId,
    };
  }

  const onSort = (e) => {
    setSortField(e.sortField);
    setSortOrder(e.sortOrder);
  };

  useEffect(() => {
    fetchFacilities();
    fetchDocumentDetails();
  }, []);

  useEffect(() => {
    if (selFacility) {
      fetchVenders(selFacility?.Id);
    }
  }, [selFacility]);

  useEffect(() => {
    if (!globalFilter) {
      setFilteredDriverData(driverDetails);
      return;
    }
    const lower = globalFilter.toLowerCase();
    setFilteredDriverData(
      driverDetails.filter((d) =>
        Object.values(d).some((v) => v && String(v).toLowerCase().includes(lower))
      )
    );
  }, [driverDetails, globalFilter]);

  useEffect(() => {
    if (!driverDetails.length) return;
    const map = {};
    driverDetails.forEach((d) => {
      if (d.DriverId) {
        const pic = localStorage.getItem(DRIVER_PIC_STORAGE_KEY + d.DriverId);
        if (pic) map[d.DriverId] = pic;
      }
    });
    setDriverPicMap(map);
  }, [driverDetails]);

  const loadDriverStatus = (driverId) => {
    try {
      const data = JSON.parse(localStorage.getItem(DRIVER_STATUS_KEY) || "{}");
      return data[String(driverId)] || null;
    } catch { return null; }
  };

  const saveDriverStatus = (driverId, status) => {
    try {
      const data = JSON.parse(localStorage.getItem(DRIVER_STATUS_KEY) || "{}");
      data[String(driverId)] = status;
      localStorage.setItem(DRIVER_STATUS_KEY, JSON.stringify(data));
    } catch (err) { console.error("Failed to save driver status:", err); }
  };

  const loadDriverDutyType = (driverId) => {
    try {
      const data = JSON.parse(localStorage.getItem(DRIVER_DUTY_TYPE_KEY) || "{}");
      return data[String(driverId)] || null;
    } catch { return null; }
  };

  const saveDriverDutyType = (driverId, dutyType) => {
    try {
      const data = JSON.parse(localStorage.getItem(DRIVER_DUTY_TYPE_KEY) || "{}");
      data[String(driverId)] = dutyType;
      localStorage.setItem(DRIVER_DUTY_TYPE_KEY, JSON.stringify(data));
    } catch (err) { console.error("Failed to save driver duty type:", err); }
  };

  const loadDriverPic = (driverId) => {
    try { return localStorage.getItem(DRIVER_PIC_STORAGE_KEY + driverId) || null; } catch { return null; }
  };

  const saveDriverPic = (driverId, url) => {
    try {
      if (url) localStorage.setItem(DRIVER_PIC_STORAGE_KEY + driverId, url);
      else localStorage.removeItem(DRIVER_PIC_STORAGE_KEY + driverId);
    } catch (err) { console.error("Failed to save driver picture:", err); }
  };

  const fetchFacilities = () => {
    driverMasterService
      .getFacilitiesByUserId(userId)
      .then((res) => {
        const data = JSON.parse(res.data) || [];
        console.log("Facilities", data);
        setFacilities(data);
      })
      .catch((err) => {
        console.log("Error", err);
      });
  };

  const fetchVenders = (id) => {
    driverMasterService
      .getVenders({ facilityid: id })
      .then((res) => {
        const data = JSON.parse(res.data) || [];
        setVenders(data);
      })
      .catch((err) => {
        console.log("Error", err);
      });
  };

  const fetchDocumentDetails = async () => {
    try {
      const response = await driverMasterService.getDocumentDetails({
        type: "D",
      });
      const data =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data || [];

      if (Array.isArray(data) && data.length > 0) {
        setDocumentDetails(
          data.map((item) => ({
            name: item.DocumentType,
            value: item.Id,
          }))
        );
      }
    } catch (error) {
      console.log("Error", error);
    }
  };

  const loadDriverDocs = (driverId) => {
    if (!driverId) {
      return {};
    }

    try {
      const allDocs =
        JSON.parse(localStorage.getItem(DRIVER_DOCS_STORAGE_KEY)) || {};
      return allDocs[driverId] || {};
    } catch (error) {
      console.log("Error", error);
      return {};
    }
  };

  const saveDriverDocs = (driverId, docs) => {
    if (!driverId) {
      return;
    }

    try {
      const allDocs =
        JSON.parse(localStorage.getItem(DRIVER_DOCS_STORAGE_KEY)) || {};
      allDocs[driverId] = docs;
      localStorage.setItem(
        DRIVER_DOCS_STORAGE_KEY,
        JSON.stringify(allDocs)
      );
    } catch (error) {
      console.log("Error", error);
    }
  };

  const resetDriverDocumentState = () => {
    setDriverDocs({});
    setUploadingDocIds({});
    setUploadProgressByDoc({});
    setDriverPicUrl(null);
    setActiveSidebarTab("details");
  };

  const handleDriverPicUpload = async (file) => {
    if (!file) return;
    const driverId = formData.DriverId?.trim();
    if (!driverId) { toastService.warn("Please enter the driver ID before uploading a picture."); return; }
    try {
      setPicUploading(true);
      setPicUploadProgress(0);
      const url = await uploadToCloudinary(file, driverId, "profile", (progress) => setPicUploadProgress(progress));
      setDriverPicUrl(url);
      saveDriverPic(driverId, url);
      setDriverPicMap((prev) => ({ ...prev, [driverId]: url }));
      toastService.success("Profile picture uploaded successfully.");
    } catch (error) {
      console.error("Error uploading driver picture:", error);
      toastService.error("Failed to upload profile picture.");
    } finally {
      setPicUploading(false);
      setPicUploadProgress(0);
    }
  };

  const uploadToCloudinary = (file, driverId, docTypeId, onProgress) =>
    new Promise((resolve, reject) => {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      uploadFormData.append(
        "asset_folder",
        `drivers/${driverId}/${docTypeId}`
      );

      const xhr = new XMLHttpRequest();
      xhr.open("POST", CLOUDINARY_UPLOAD_URL);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(
            Math.round((event.loaded / event.total) * 100)
          );
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);

          if (
            xhr.status >= 200 &&
            xhr.status < 300 &&
            data.secure_url
          ) {
            resolve(data.secure_url);
            return;
          }

          reject(
            new Error(data.error?.message || "Upload failed")
          );
        } catch (error) {
          reject(error);
        }
      };

      xhr.onerror = () => {
        reject(new Error("Upload failed"));
      };

      xhr.send(uploadFormData);
    });

  const handleDocUpload = async (file, docTypeId) => {
    if (!file) {
      return;
    }

    const driverId = formData.DriverId?.trim();

    if (!driverId) {
      toastService.warn(
        "Please enter the driver ID before uploading documents."
      );
      return;
    }

    try {
      setUploadingDocIds((prev) => ({
        ...prev,
        [docTypeId]: true,
      }));
      setUploadProgressByDoc((prev) => ({
        ...prev,
        [docTypeId]: 0,
      }));

      const url = await uploadToCloudinary(
        file,
        driverId,
        docTypeId,
        (progress) => {
          setUploadProgressByDoc((prev) => ({
            ...prev,
            [docTypeId]: progress,
          }));
        }
      );
      const updated = {
        ...driverDocs,
        [docTypeId]: url,
      };

      setDriverDocs(updated);
      saveDriverDocs(driverId, updated);
      toastService.success("Document uploaded successfully.");
    } catch (error) {
      console.log("Error", error);
      toastService.error("Failed to upload the document.");
    } finally {
      setUploadingDocIds((prev) => ({
        ...prev,
        [docTypeId]: false,
      }));
      setUploadProgressByDoc((prev) => ({
        ...prev,
        [docTypeId]: 0,
      }));
    }
  };

  // Fetch driver details from API
  const fetchDriverDetails = async (showSuccessToast = false) => {
    // Validate dropdowns before calling API
    if (!selFacility) {
      toastService.error("Please select Facility");
      return;
    }
    if (!selVendor) {
      toastService.error("Please select Vendor");
      return;
    }
    const params = {
      facilityid: selFacility?.Id || 0,
      vendorid: selVendor?.Id || 0,
      Search: search || "",
    };

    try {
      setLoading(true);
      const response = await driverMasterService.getDriverMasterDetails(
        params
      );
      const respData = JSON.parse(response.data);
      setDriverDetails(respData);
      setShowTable(true);
      setFirst(0);
      if (showSuccessToast) toastService.success("Data refreshed successfully.");
    } catch (error) {
      console.log("Error", error);
      toastService.error("Failed to load driver details.");
    } finally {
      setLoading(false);
    }
  };

  // Open sidebar with driver data
  const openEditSidebar = (driverId) => {
    const selectedDriver = driverDetails.find((d) => d.Id === driverId);

    if (selectedDriver) {
      setFormData({
        Id: selectedDriver.Id,
        DriverId: selectedDriver.DriverId || "",
        DriverName: selectedDriver.DriverName || "",
        FacilityId: selFacility?.Id || 0,
        VendorId: selVendor?.Id || 0,
        FatherName: selectedDriver.FatherName || "",
        MotherName: selectedDriver.MotherName || "",
        PresentAddress: selectedDriver.PresentAddress || "",
        PermanentAddress: selectedDriver.PermanentAddress || "",
        ContactNo: selectedDriver.ContactNo || "",
        DateOfBirth: selectedDriver.DateOfBirth ? new Date(selectedDriver.DateOfBirth) : null,
        BloodGroup: selectedDriver.BloodGroup || "",
        Qualificaton: "",
        MaritalStatus: "",
        VehicleId: 0,
        LicenceNo: selectedDriver.LicenceNo || "",
        LicenceExpDate: selectedDriver.LicenceExpDate
          ? new Date(selectedDriver.LicenceExpDate)
          : null,
        BadgeNo: selectedDriver.BadgeNo || "",
        BadgeExpDate: selectedDriver.BadgeExpDate ? new Date(selectedDriver.BadgeExpDate) : null,
        DriverStatus: 0,
        Attrited: 0,
        AttritedDate: null,
        Warning_1: "",
        Warning_2: "",
        FinalWarning: "",
        AadharVerification: 0,
        PVStatus: 0,
        Remark: selectedDriver.Remark || "",
        Medical_Fit_Certificate: 0,
        DriverInfo_Display: 0,
        InductionForm: 0,
        UpdatedBy: userId,
      });

      setDriverDocs(loadDriverDocs(selectedDriver.DriverId));
      setDriverStatus(loadDriverStatus(selectedDriver.DriverId));
      setDriverDutyType(loadDriverDutyType(selectedDriver.DriverId));
      setUploadingDocIds({});
      setUploadProgressByDoc({});
      setActiveSidebarTab("details");
      setDriverPicUrl(loadDriverPic(selectedDriver.DriverId));
      setEditingDriverId(driverId);
      setVisibleLeft(true);
    }
  };

  const openAddSidebar = () => {
    setFormData(getInitialFormData());
    resetDriverDocumentState();
    setDriverStatus(null);
    setDriverDutyType(null);
    setEditingDriverId(null);
    setAddDriverMaster(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] === 1 ? 0 : 1,
    }));
  };

  const validateForm = () => {
    if (!formData.DriverId.trim()) {
      toastService.warn("Please enter the driver ID.");
      return false;
    }
    if (!formData.DriverName.trim()) {
      toastService.warn("Please enter the driver name.");
      return false;
    }
    if (!formData.ContactNo.trim()) {
      toastService.warn("Please enter the contact number.");
      return false;
    }
    if (formData.DateOfBirth === null) {
      toastService.warn("Please select the date of birth.");
      return false;
    }
    if (formData.FacilityId === 0) {
      toastService.warn("Please select a facility.");
      return false;
    }
    if (formData.VendorId === 0) {
      toastService.warn("Please select a vendor.");
      return false;
    }
    return true;
  };

  const handleSaveDriver = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        DateOfBirth: formData.DateOfBirth
          ? formData.DateOfBirth.toISOString().split("T")[0]
          : "",
        LicenceExpDate: formData.LicenceExpDate
          ? formData.LicenceExpDate.toISOString().split("T")[0]
          : "",
        BadgeExpDate: formData.BadgeExpDate
          ? formData.BadgeExpDate.toISOString().split("T")[0]
          : "",
        AttritedDate: formData.AttritedDate
          ? formData.AttritedDate.toISOString().split("T")[0]
          : "",
      };

      const response = await driverMasterService.addUpdateDriverMaster(
        submitData
      );

      // Handle array response from API
      let result = JSON.parse(response.data);
      if (Array.isArray(result)) {
        result = result[0];
      }

      // Check for success (RESULT 0 or 1, or if MSG contains "Successfully")
      if (
        result.RESULT === 0 ||
        result.RESULT === 1 ||
        result.MSG?.includes("Successfully")
      ) {
        toastService.success(
          result.MSG || "Driver details saved successfully."
        );
        if (formData.DriverId) {
          saveDriverStatus(formData.DriverId, driverStatus);
          saveDriverDutyType(formData.DriverId, driverDutyType);
        }
        setDriverStatus(null);
        setDriverDutyType(null);
        setVisibleLeft(false);
        setAddDriverMaster(false);
        resetDriverDocumentState();
        fetchDriverDetails();
      } else {
        toastService.error(result.MSG || "Failed to save driver.");
      }
    } catch (error) {
      console.log("Error", error);
      toastService.error("Failed to save driver details.");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    const headers = ["ID", "Driver ID", "Name", "Facility", "Vendor", "Contact No.", "Licence No.", "Badge No.", "Licence Exp. Date", "Badge Exp. Date"];
    const csvRows = filteredDriverData.map((d) => [
      d.Id, d.DriverId, d.DriverName, d.FacilityName, d.VendorName,
      d.ContactNo, d.LicenceNo, d.BadgeNo, d.LicenceExpDate, d.BadgeExpDate,
    ]);
    const csvContent = [headers, ...csvRows].map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "DriverMaster.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getExpiryBadge = (dateVal) => {
    if (!dateVal) return null;
    const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(date) || date.getFullYear() <= 1900) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { label: "Expired", bg: "#FEE2E2", color: "#B91C1C", dot: "#EF4444" };
    if (diffDays <= 7) return { label: `${diffDays}d left`, bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" };
    if (diffDays <= 15) return { label: `${diffDays}d left`, bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" };
    return null;
  };

  const expiryDateBody = (dateStr) => {
    const badge = getExpiryBadge(dateStr);
    const style = badge ? { color: badge.color, fontWeight: 600 } : { color: "#374151" };
    if (!badge) return <span style={style}>{dateStr || "—"}</span>;
    const cls = badge.dot === "#EF4444" ? "expiry-tip-expired" : badge.dot === "#F59E0B" ? "expiry-tip-warning" : "expiry-tip-info";
    return (
      <span className={cls} data-pr-tooltip={badge.label} data-pr-position="top" style={style}>
        {dateStr || "—"}
      </span>
    );
  };

  const uploadedDocCount = documentDetails.filter((d) => driverDocs[d.value]).length;

  const renderDocumentCards = () => (
    <div className="row g-3">
      {documentDetails.map((doc) => {
        const url = driverDocs[doc.value];
        const isUploading = Boolean(uploadingDocIds[doc.value]);
        const progress = uploadProgressByDoc[doc.value] || 0;

        return (
          <div
            className="col-12 col-md-6"
            key={`driver-doc-${doc.value}`}
          >
            <div className="doc-upload-card">
              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                <div className="fw-semibold" style={{ fontSize: "14px" }}>{doc.name}</div>
                <span
                  className={`doc-status-badge ${
                    isUploading ? "uploading" : url ? "uploaded" : "pending"
                  }`}
                >
                  {isUploading ? "Uploading..." : url ? "Uploaded" : "Pending"}
                </span>
              </div>
              <div className="small text-muted mb-2">
                PDF only
              </div>
              <input
                type="file"
                accept="application/pdf"
                className="form-control form-control-sm mb-2"
                disabled={isUploading}
                onChange={(e) => {
                  handleDocUpload(
                    e.target.files?.[0],
                    doc.value
                  );
                  e.target.value = "";
                }}
              />
              {isUploading && (
                <div className="mb-2">
                  <div className="doc-progress-track">
                    <div
                      className="doc-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="small mt-1" style={{ color: "#6366f1", fontWeight: 600, fontSize: "12px" }}>
                    Uploading {progress}%
                  </div>
                </div>
              )}
              <div className="d-flex gap-2 flex-wrap">
                {url ? (
                  <>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm rounded-pill px-3"
                    >
                      Preview
                    </a>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                      onClick={() => {
                        const downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
                        window.open(downloadUrl, '_blank');
                      }}
                    >
                      Download
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill px-3"
                      disabled
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                      disabled
                    >
                      Download
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSidebarTabs = () => (
    <div className="doc-tabs-bar">
      <button
        type="button"
        className={`doc-tab-btn ${activeSidebarTab === "details" ? "active" : ""}`}
        onClick={() => setActiveSidebarTab("details")}
      >
        <i className="pi pi-user" style={{ fontSize: "13px" }} />
        Details
      </button>
      <button
        type="button"
        className={`doc-tab-btn ${activeSidebarTab === "documents" ? "active" : ""}`}
        onClick={() => setActiveSidebarTab("documents")}
      >
        <i className="pi pi-file" style={{ fontSize: "13px" }} />
        Documents
        <span className="doc-tab-count">{uploadedDocCount}/{documentDetails.length}</span>
      </button>
    </div>
  );

  return (
    <>
      <Loader isVisible={loading} fullScreen={true} />
      <Header
        pageTitle="Driver Master"
        showNewButton={true}
        onNewButtonClick={openAddSidebar}
      />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Driver Master</h6>
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
                    onChange={(e) => setSelFacility(e.value)}
                    options={facilities}
                    optionLabel="facilityName"
                    placeholder="Select Facility"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                  <label htmlFor="" className="form-label">
                    Vendor <span className="text-danger">*</span>
                  </label>
                  <Dropdown
                    value={selVendor}
                    onChange={(e) => setSelVendor(e.value)}
                    options={venders}
                    optionLabel="vendorName"
                    placeholder="Select Vendor"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-3 no-label">
                  <ReportButton
                    label="Submit"
                    disabled={!selFacility && !selVendor}
                    onClick={fetchDriverDetails}
                  />
                </div>
                <div className="col-12 col-md-12 col-lg-3 ms-auto mb-3">
                  <label htmlFor="" className="d-block">
                    Search Any
                  </label>
                  <InputText
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Any Value"
                    className="w-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Start */}
          {showTable && (
            <>
              <style>{`
                  .expiry-tooltip-expired .p-tooltip-text { background: #FEE2E2 !important; color: #B91C1C !important; font-weight: 600 !important; border: 1px solid #EF4444 !important; border-radius: 6px !important; }
                  .expiry-tooltip-expired.p-tooltip-top .p-tooltip-arrow { border-top-color: #FEE2E2 !important; }
                  .expiry-tooltip-warning .p-tooltip-text { background: #FEF3C7 !important; color: #92400E !important; font-weight: 600 !important; border: 1px solid #F59E0B !important; border-radius: 6px !important; }
                  .expiry-tooltip-warning.p-tooltip-top .p-tooltip-arrow { border-top-color: #FEF3C7 !important; }
                  .expiry-tooltip-info .p-tooltip-text { background: #DBEAFE !important; color: #1E40AF !important; font-weight: 600 !important; border: 1px solid #3B82F6 !important; border-radius: 6px !important; }
                  .expiry-tooltip-info.p-tooltip-top .p-tooltip-arrow { border-top-color: #DBEAFE !important; }
              `}</style>
              <div className="col-12 d-flex align-items-center gap-2 mt-3 mb-2">
                <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>Expiry Status:</span>
                {[
                  { dot: "#EF4444", bg: "#FEE2E2", color: "#B91C1C", label: "Expired" },
                  { dot: "#F59E0B", bg: "#FEF3C7", color: "#92400E", label: "≤ 7 days" },
                  { dot: "#3B82F6", bg: "#DBEAFE", color: "#1E40AF", label: "≤ 15 days" },
                ].map(({ dot, bg, color, label }) => (
                  <span key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", background: bg, color, fontWeight: 500, padding: "3px 10px", borderRadius: "20px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: dot, display: "inline-block" }}></span>
                    {label}
                  </span>
                ))}
              </div>
              <div className="col-12">
                <div className="card_tb p-3">
                  <TableToolbar
                    search={globalFilter}
                    onSearch={(e) => setGlobalFilter(e.target.value)}
                    onRefresh={() => { setGlobalFilter(""); fetchDriverDetails(true); }}
                    onExport={exportExcel}
                    showFilter={false}
                    overlayRef={op}
                    filterButtonRef={filterButtonRef}
                  />
                  <CustomDataTable
                    value={filteredDriverData.slice(first, first + rows).map((row) => ({ ...row, _picUrl: driverPicMap[row.DriverId] || null }))}
                    emptyMessage="No Records Found"
                    scrollable
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSort={onSort}
                    sortMode="single"
                    removableSort
                  >
                    <Column
                      header="Photo"
                      style={{ width: "60px" }}
                      body={(rowData) => {
                        const pic = rowData._picUrl || null;
                        return pic ? (
                          <img src={pic} alt={rowData.DriverName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #e5e7eb" }}>
                            <i className="pi pi-user" style={{ fontSize: 14, color: "#9ca3af" }} />
                          </div>
                        );
                      }}
                    />
                    <Column
                      field="Id"
                      header="ID"
                      body={(rowData) => (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            openEditSidebar(rowData.Id);
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {rowData.Id}
                        </a>
                      )}
                    ></Column>
                    <Column
                      field="DriverName"
                      header="Name"
                      body={(rowData) => rowData.DriverName?.toLowerCase()}
                    ></Column>
                    <Column field="FacilityName" header="Facility"></Column>
                    <Column field="VendorName" header="Vendor"></Column>
                    <Column field="ContactNo" header="Contact No."></Column>
                    <Column field="VehicleNo" header="Vehicle No."></Column>
                    <Column field="VehicleRegNo" header="Vehicle Reg. No."></Column>
                    <Column field="LicenceNo" header="Licence No."></Column>
                    <Column field="BadgeNo" header="Badge No."></Column>
                    <Column field="LicenceExpDate" header="Licence Exp. Date" body={(rowData) => expiryDateBody(rowData.LicenceExpDate)}></Column>
                    <Column field="BadgeExpDate" header="Badge Exp. Date" body={(rowData) => expiryDateBody(rowData.BadgeExpDate)}></Column>
                  </CustomDataTable>
                  <Tooltip target=".expiry-tip-expired" className="expiry-tooltip-expired" />
                  <Tooltip target=".expiry-tip-warning" className="expiry-tooltip-warning" />
                  <Tooltip target=".expiry-tip-info" className="expiry-tooltip-info" />
                  <CustomPaginator
                    first={first}
                    rows={rows}
                    totalRecords={filteredDriverData.length}
                    onPageChange={onPageChange}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

          {/* Edit Driver Master */}
          <MasterSidebar
            show={visibleLeft}
            onClose={() => {
              setVisibleLeft(false);
              setDriverDocs({});
              setUploadingDocIds({});
              setDriverPicUrl(null);
            }}
            title="Edit Driver Details"
            width="50%"
            footerButtons={[
              {
                label: "Cancel",
                className: "btn btn-outline-secondary",
                onClick: () => {
                  setVisibleLeft(false);
                  setDriverDocs({});
                  setUploadingDocIds({});
                  setDriverPicUrl(null);
                },
              },
              {
                label: "Save Changes",
                className: "btn btn-success",
                onClick: handleSaveDriver,
                loading: loading,
              },
            ]}
          >
            <div className="p-3 bg-white" >
              {renderSidebarTabs()}
              {activeSidebarTab === "details" && (
              <div className="row" >
                <div className="col-12 mb-4 d-flex flex-column align-items-center">
                  <div style={{ position: "relative", display: "inline-block" }}>
                    <div
                      style={{ width: 90, height: 90, borderRadius: "50%", border: "2px solid #e5e7eb", overflow: "hidden", cursor: "pointer", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
                      onClick={() => !picUploading && driverPicInputRef.current?.click()}
                    >
                      {driverPicUrl ? (
                        <img src={driverPicUrl} alt="Driver" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <i className="pi pi-user" style={{ fontSize: "2.2rem", color: "#9ca3af" }} />
                      )}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 28, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {picUploading ? <i className="pi pi-spin pi-spinner" style={{ color: "white", fontSize: 13 }} /> : <i className="pi pi-camera" style={{ color: "white", fontSize: 13 }} />}
                      </div>
                    </div>
                    {driverPicUrl && !picUploading && (
                      <button type="button"
                        style={{ position: "absolute", top: -5, right: -5, width: 22, height: 22, borderRadius: "50%", border: "none", background: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                        onClick={() => { const did = formData.DriverId?.trim(); setDriverPicUrl(null); if (did) { saveDriverPic(did, null); setDriverPicMap((prev) => { const n = { ...prev }; delete n[did]; return n; }); } }}
                      >
                        <i className="pi pi-times" style={{ fontSize: 10 }} />
                      </button>
                    )}
                    <input ref={driverPicInputRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => { handleDriverPicUpload(e.target.files?.[0]); e.target.value = ""; }} />
                  </div>
                  {picUploading && <small style={{ color: "#6366f1", fontWeight: 600, marginTop: 6 }}>Uploading {picUploadProgress}%</small>}
                  {!picUploading && <small style={{ color: "#9ca3af", marginTop: 6 }}>Click to {driverPicUrl ? "change" : "upload"} photo</small>}
                </div>
                <div className="col-12 mb-3">
                  <h6 className="sidebarSubTitle">Personal Details</h6>
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Driver ID <span style={{ color: "red" }}>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    value={formData.DriverId}
                    onChange={(e) =>
                      handleFormChange("DriverId", e.target.value)
                    }
                    placeholder="Driver Id"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Driver Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    value={formData.DriverName}
                    onChange={(e) =>
                      handleFormChange("DriverName", e.target.value)
                    }
                    placeholder="Driver Name"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Date of Birth <span style={{ color: "red" }}>*</span>
                  </label>
                  <Calendar
                    className="w-100"
                    value={formData.DateOfBirth}
                    onChange={(e) =>
                      handleFormChange("DateOfBirth", e.value)
                    }
                    placeholder="Date of Birth"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Contact Number <span style={{ color: "red" }}>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    value={formData.ContactNo}
                    onChange={(e) =>
                      handleFormChange("ContactNo", e.target.value)
                    }
                    placeholder="Contact Number"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Blood Group</label>
                  <InputText
                    className="form-control"
                    value={formData.BloodGroup}
                    onChange={(e) =>
                      handleFormChange("BloodGroup", e.target.value)
                    }
                    placeholder="Blood Group"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Qualification</label>
                  <InputText
                    className="form-control"
                    value={formData.Qualificaton}
                    onChange={(e) =>
                      handleFormChange("Qualificaton", e.target.value)
                    }
                    placeholder="Qualification"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Father's Name</label>
                  <InputText
                    className="form-control"
                    value={formData.FatherName}
                    onChange={(e) =>
                      handleFormChange("FatherName", e.target.value)
                    }
                    placeholder="Father's Name"
                  />
                </div>

                <div className="field col-6 mb-3">
                  <label>Present Address</label>
                  <InputText
                    className="form-control"
                    value={formData.PresentAddress}
                    onChange={(e) =>
                      handleFormChange("PresentAddress", e.target.value)
                    }
                    placeholder="Present Address"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Permanent Address</label>
                  <InputText
                    className="form-control"
                    value={formData.PermanentAddress}
                    onChange={(e) =>
                      handleFormChange("PermanentAddress", e.target.value)
                    }
                    placeholder="Permanent Address"
                  />
                </div>
                <div className="col-12 mb-3">
                  <h6 className="sidebarSubTitle">Vehicle Details</h6>
                </div>
                <div className="field col-3 mb-3">
                  <label>Licence Number</label>
                  <InputText
                    className="form-control"
                    value={formData.LicenceNo}
                    onChange={(e) =>
                      handleFormChange("LicenceNo", e.target.value)
                    }
                    placeholder="Licence Number"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label style={getExpiryBadge(formData.LicenceExpDate) ? { color: getExpiryBadge(formData.LicenceExpDate).color, fontWeight: 600 } : {}}>
                    Licence Expiry Date
                  </label>
                  <div style={getExpiryBadge(formData.LicenceExpDate) ? { border: `1.5px solid ${getExpiryBadge(formData.LicenceExpDate).dot}`, borderRadius: "6px", overflow: "hidden" } : {}}>
                    <Calendar
                      className="w-100"
                      value={formData.LicenceExpDate}
                      onChange={(e) => handleFormChange("LicenceExpDate", e.value)}
                      placeholder="Licence Expiry Date"
                    />
                  </div>
                  {getExpiryBadge(formData.LicenceExpDate) && (
                    <small style={{ color: getExpiryBadge(formData.LicenceExpDate).color, fontWeight: 600, fontSize: "11px", marginTop: "3px", display: "block" }}>
                      ● {getExpiryBadge(formData.LicenceExpDate).label}
                    </small>
                  )}
                </div>
                <div className="field col-3 mb-3">
                  <label>Badge Number</label>
                  <InputText
                    className="form-control"
                    value={formData.BadgeNo}
                    onChange={(e) =>
                      handleFormChange("BadgeNo", e.target.value)
                    }
                    placeholder="Badge Number"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label style={getExpiryBadge(formData.BadgeExpDate) ? { color: getExpiryBadge(formData.BadgeExpDate).color, fontWeight: 600 } : {}}>
                    Badge Expiry Date
                  </label>
                  <div style={getExpiryBadge(formData.BadgeExpDate) ? { border: `1.5px solid ${getExpiryBadge(formData.BadgeExpDate).dot}`, borderRadius: "6px", overflow: "hidden" } : {}}>
                    <Calendar
                      className="w-100"
                      value={formData.BadgeExpDate}
                      onChange={(e) => handleFormChange("BadgeExpDate", e.value)}
                      placeholder="Badge Expiry Date"
                    />
                  </div>
                  {getExpiryBadge(formData.BadgeExpDate) && (
                    <small style={{ color: getExpiryBadge(formData.BadgeExpDate).color, fontWeight: 600, fontSize: "11px", marginTop: "3px", display: "block" }}>
                      ● {getExpiryBadge(formData.BadgeExpDate).label}
                    </small>
                  )}
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Facility Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <Dropdown
                    value={formData.FacilityId}
                    onChange={(e) =>
                      handleFormChange("FacilityId", e.value)
                    }
                    options={facilities}
                    optionLabel="facilityName"
                    optionValue="Id"
                    placeholder="Select Facility Name"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Vendor Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <Dropdown
                    value={formData.VendorId}
                    onChange={(e) => handleFormChange("VendorId", e.value)}
                    options={venders}
                    optionLabel="vendorName"
                    optionValue="Id"
                    placeholder="Select Vendor Name"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Status</label>
                  <Dropdown
                    value={driverStatus}
                    onChange={(e) => setDriverStatus(e.value)}
                    options={STATUS_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Status"
                    className="w-100"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Duty Type</label>
                  <Dropdown
                    value={driverDutyType}
                    onChange={(e) => setDriverDutyType(e.value)}
                    options={DUTY_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Duty Type"
                    className="w-100"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>&nbsp;</label>
                  <div className="d-flex align-items-center" style={{ height: "35px" }}>
                    <Checkbox
                      checked={formData.AadharVerification === 1}
                      onChange={() =>
                        handleCheckboxChange("AadharVerification")
                      }
                      inputId="AadharVerification"
                    />
                    <label htmlFor="AadharVerification" className="ms-2 mb-0">
                      Aadhar Verification
                    </label>
                  </div>
                </div>
                <div className="field col-3 mb-3">
                  <label>&nbsp;</label>
                  <div className="d-flex align-items-center" style={{ height: "35px" }}>
                    <Checkbox
                      checked={formData.PVStatus === 1}
                      onChange={() => handleCheckboxChange("PVStatus")}
                      inputId="PVStatus"
                    />
                    <label htmlFor="PVStatus" className="ms-2 mb-0">
                      PV Status
                    </label>
                  </div>
                </div>
                <div className="field col-6 mb-3">
                  <label>Remark</label>
                  <InputText
                    className="form-control"
                    value={formData.Remark}
                    onChange={(e) =>
                      handleFormChange("Remark", e.target.value)
                    }
                    placeholder="Remark"
                  />
                </div>
                <div className="col-12 mb-3">
                  <h6 className="sidebarSubTitle">Other Details</h6>
                </div>
                <div className="field col-12 d-flex align-items-center gap-4">
                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={
                        formData.Medical_Fit_Certificate === 1
                      }
                      onChange={() =>
                        handleCheckboxChange("Medical_Fit_Certificate")
                      }
                      inputId="MedicalFitness"
                    />
                    <label
                      htmlFor="MedicalFitness"
                      className="ms-2"
                    >
                      Medical Fitness Certificate
                    </label>
                  </div>

                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={formData.DriverInfo_Display === 1}
                      onChange={() =>
                        handleCheckboxChange("DriverInfo_Display")
                      }
                      inputId="DriverInfo"
                    />
                    <label
                      htmlFor="DriverInfo"
                      className="ms-2"
                    >
                      Driver Information Display Dangler
                    </label>
                  </div>

                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={formData.InductionForm === 1}
                      onChange={() =>
                        handleCheckboxChange("InductionForm")
                      }
                      inputId="Induction"
                    />
                    <label htmlFor="Induction" className="ms-2">
                      Induction Form
                    </label>
                  </div>
                </div>
                </div>
              )}
              {activeSidebarTab === "documents" && (
                <div className="doc-tab-panel">
                  <div className="doc-tab-summary mb-3">
                    <span className="fw-semibold">Uploaded:</span>{" "}
                    <span style={{ color: "#6366f1", fontWeight: 700 }}>{uploadedDocCount}</span>
                    <span className="text-muted"> / {documentDetails.length} documents</span>
                  </div>
                  {renderDocumentCards()}
                </div>
              )}
              </div>
          </MasterSidebar>

          {/* Add Driver Master */}
          <MasterSidebar
            show={addDriverMaster}
            onClose={() => {
              setAddDriverMaster(false);
              setDriverDocs({});
              setUploadingDocIds({});
              setDriverPicUrl(null);
            }}
            title="Add Driver Details"
            width="50%"
            footerButtons={[
              {
                label: "Cancel",
                className: "btn btn-outline-secondary",
                onClick: () => {
                  setAddDriverMaster(false);
                  setDriverDocs({});
                  setUploadingDocIds({});
                  setDriverPicUrl(null);
                },
              },
              {
                label: "Save Changes",
                className: "btn btn-success",
                onClick: handleSaveDriver,
                loading: loading,
              },
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
                      onClick={() => !picUploading && driverPicInputRef.current?.click()}
                    >
                      {driverPicUrl ? (
                        <img src={driverPicUrl} alt="Driver" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <i className="pi pi-user" style={{ fontSize: "2.2rem", color: "#9ca3af" }} />
                      )}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 28, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {picUploading ? <i className="pi pi-spin pi-spinner" style={{ color: "white", fontSize: 13 }} /> : <i className="pi pi-camera" style={{ color: "white", fontSize: 13 }} />}
                      </div>
                    </div>
                    {driverPicUrl && !picUploading && (
                      <button type="button"
                        style={{ position: "absolute", top: -5, right: -5, width: 22, height: 22, borderRadius: "50%", border: "none", background: "#ef4444", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                        onClick={() => { const did = formData.DriverId?.trim(); setDriverPicUrl(null); if (did) { saveDriverPic(did, null); setDriverPicMap((prev) => { const n = { ...prev }; delete n[did]; return n; }); } }}
                      >
                        <i className="pi pi-times" style={{ fontSize: 10 }} />
                      </button>
                    )}
                    <input ref={driverPicInputRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => { handleDriverPicUpload(e.target.files?.[0]); e.target.value = ""; }} />
                  </div>
                  {picUploading && <small style={{ color: "#6366f1", fontWeight: 600, marginTop: 6 }}>Uploading {picUploadProgress}%</small>}
                  {!picUploading && <small style={{ color: "#9ca3af", marginTop: 6 }}>Click to {driverPicUrl ? "change" : "upload"} photo</small>}
                </div>
                <div className="col-12 mb-3">
                  <h6 className="sidebarSubTitle">Personal Details</h6>
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Driver ID <span style={{ color: "red" }}>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    value={formData.DriverId}
                    onChange={(e) =>
                      handleFormChange("DriverId", e.target.value)
                    }
                    placeholder="Driver Id"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Driver Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    value={formData.DriverName}
                    onChange={(e) =>
                      handleFormChange("DriverName", e.target.value)
                    }
                    placeholder="Driver Name"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Date of Birth <span style={{ color: "red" }}>*</span>
                  </label>
                  <Calendar
                    className="w-100"
                    value={formData.DateOfBirth}
                    onChange={(e) =>
                      handleFormChange("DateOfBirth", e.value)
                    }
                    placeholder="Date of Birth"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Contact Number <span style={{ color: "red" }}>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    value={formData.ContactNo}
                    onChange={(e) =>
                      handleFormChange("ContactNo", e.target.value)
                    }
                    placeholder="Contact Number"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Blood Group</label>
                  <InputText
                    className="form-control"
                    value={formData.BloodGroup}
                    onChange={(e) =>
                      handleFormChange("BloodGroup", e.target.value)
                    }
                    placeholder="Blood Group"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Qualification</label>
                  <InputText
                    className="form-control"
                    value={formData.Qualificaton}
                    onChange={(e) =>
                      handleFormChange("Qualificaton", e.target.value)
                    }
                    placeholder="Qualification"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Father's Name</label>
                  <InputText
                    className="form-control"
                    value={formData.FatherName}
                    onChange={(e) =>
                      handleFormChange("FatherName", e.target.value)
                    }
                    placeholder="Father's Name"
                  />
                </div>

                <div className="field col-6 mb-3">
                  <label>Present Address</label>
                  <InputText
                    className="form-control"
                    value={formData.PresentAddress}
                    onChange={(e) =>
                      handleFormChange("PresentAddress", e.target.value)
                    }
                    placeholder="Present Address"
                  />
                </div>
                <div className="field col-6 mb-3">
                  <label>Permanent Address</label>
                  <InputText
                    className="form-control"
                    value={formData.PermanentAddress}
                    onChange={(e) =>
                      handleFormChange("PermanentAddress", e.target.value)
                    }
                    placeholder="Permanent Address"
                  />
                </div>
                <div className="col-12 mb-3">
                  <h6 className="sidebarSubTitle">Vehicle Details</h6>
                </div>
                <div className="field col-3 mb-3">
                  <label>Licence Number</label>
                  <InputText
                    className="form-control"
                    value={formData.LicenceNo}
                    onChange={(e) =>
                      handleFormChange("LicenceNo", e.target.value)
                    }
                    placeholder="Licence Number"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label style={getExpiryBadge(formData.LicenceExpDate) ? { color: getExpiryBadge(formData.LicenceExpDate).color, fontWeight: 600 } : {}}>
                    Licence Expiry Date
                  </label>
                  <div style={getExpiryBadge(formData.LicenceExpDate) ? { border: `1.5px solid ${getExpiryBadge(formData.LicenceExpDate).dot}`, borderRadius: "6px", overflow: "hidden" } : {}}>
                    <Calendar
                      className="w-100"
                      value={formData.LicenceExpDate}
                      onChange={(e) => handleFormChange("LicenceExpDate", e.value)}
                      placeholder="Licence Expiry Date"
                    />
                  </div>
                  {getExpiryBadge(formData.LicenceExpDate) && (
                    <small style={{ color: getExpiryBadge(formData.LicenceExpDate).color, fontWeight: 600, fontSize: "11px", marginTop: "3px", display: "block" }}>
                      ● {getExpiryBadge(formData.LicenceExpDate).label}
                    </small>
                  )}
                </div>
                <div className="field col-3 mb-3">
                  <label>Badge Number</label>
                  <InputText
                    className="form-control"
                    value={formData.BadgeNo}
                    onChange={(e) =>
                      handleFormChange("BadgeNo", e.target.value)
                    }
                    placeholder="Badge Number"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label style={getExpiryBadge(formData.BadgeExpDate) ? { color: getExpiryBadge(formData.BadgeExpDate).color, fontWeight: 600 } : {}}>
                    Badge Expiry Date
                  </label>
                  <div style={getExpiryBadge(formData.BadgeExpDate) ? { border: `1.5px solid ${getExpiryBadge(formData.BadgeExpDate).dot}`, borderRadius: "6px", overflow: "hidden" } : {}}>
                    <Calendar
                      className="w-100"
                      value={formData.BadgeExpDate}
                      onChange={(e) => handleFormChange("BadgeExpDate", e.value)}
                      placeholder="Badge Expiry Date"
                    />
                  </div>
                  {getExpiryBadge(formData.BadgeExpDate) && (
                    <small style={{ color: getExpiryBadge(formData.BadgeExpDate).color, fontWeight: 600, fontSize: "11px", marginTop: "3px", display: "block" }}>
                      ● {getExpiryBadge(formData.BadgeExpDate).label}
                    </small>
                  )}
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Facility Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <Dropdown
                    value={formData.FacilityId}
                    onChange={(e) =>
                      handleFormChange("FacilityId", e.value)
                    }
                    options={facilities}
                    optionLabel="facilityName"
                    optionValue="Id"
                    placeholder="Select Facility Name"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>
                    Vendor Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <Dropdown
                    value={formData.VendorId}
                    onChange={(e) => handleFormChange("VendorId", e.value)}
                    options={venders}
                    optionLabel="vendorName"
                    optionValue="Id"
                    placeholder="Select Vendor Name"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Status</label>
                  <Dropdown
                    value={driverStatus}
                    onChange={(e) => setDriverStatus(e.value)}
                    options={STATUS_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Status"
                    className="w-100"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>Duty Type</label>
                  <Dropdown
                    value={driverDutyType}
                    onChange={(e) => setDriverDutyType(e.value)}
                    options={DUTY_TYPE_OPTIONS}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select Duty Type"
                    className="w-100"
                  />
                </div>
                <div className="field col-3 mb-3">
                  <label>&nbsp;</label>
                  <div className="d-flex align-items-center" style={{ height: "35px" }}>
                    <Checkbox
                      checked={formData.AadharVerification === 1}
                      onChange={() =>
                        handleCheckboxChange("AadharVerification")
                      }
                      inputId="AadharVerification"
                    />
                    <label htmlFor="AadharVerification" className="ms-2 mb-0">
                      Aadhar Verification
                    </label>
                  </div>
                </div>
                <div className="field col-3 mb-3">
                  <label>&nbsp;</label>
                  <div className="d-flex align-items-center" style={{ height: "35px" }}>
                    <Checkbox
                      checked={formData.PVStatus === 1}
                      onChange={() => handleCheckboxChange("PVStatus")}
                      inputId="PVStatus"
                    />
                    <label htmlFor="PVStatus" className="ms-2 mb-0">
                      PV Status
                    </label>
                  </div>
                </div>
                <div className="field col-6 mb-3">
                  <label>Remark</label>
                  <InputText
                    className="form-control"
                    value={formData.Remark}
                    onChange={(e) =>
                      handleFormChange("Remark", e.target.value)
                    }
                    placeholder="Remark"
                  />
                </div>
                <div className="col-12 mb-3">
                  <h6 className="sidebarSubTitle">Other Details</h6>
                </div>
                <div className="field col-12 d-flex align-items-center gap-4">
                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={
                        formData.Medical_Fit_Certificate === 1
                      }
                      onChange={() =>
                        handleCheckboxChange("Medical_Fit_Certificate")
                      }
                      inputId="MedicalFitness"
                    />
                    <label
                      htmlFor="MedicalFitness"
                      className="ms-2"
                    >
                      Medical Fitness Certificate
                    </label>
                  </div>

                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={formData.DriverInfo_Display === 1}
                      onChange={() =>
                        handleCheckboxChange("DriverInfo_Display")
                      }
                      inputId="DriverInfo"
                    />
                    <label
                      htmlFor="DriverInfo"
                      className="ms-2"
                    >
                      Driver Information Display Dangler
                    </label>
                  </div>

                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={formData.InductionForm === 1}
                      onChange={() =>
                        handleCheckboxChange("InductionForm")
                      }
                      inputId="Induction"
                    />
                    <label htmlFor="Induction" className="ms-2">
                      Induction Form
                    </label>
                  </div>
              </div>
              </div>
              )}
              {activeSidebarTab === "documents" && (
                <div className="doc-tab-panel">
                  <div className="doc-tab-summary mb-3">
                    <span className="fw-semibold">Uploaded:</span>{" "}
                    <span style={{ color: "#6366f1", fontWeight: 700 }}>{uploadedDocCount}</span>
                    <span className="text-muted"> / {documentDetails.length} documents</span>
                  </div>
                  {renderDocumentCards()}
                </div>
              )}
            </div>
          </MasterSidebar>
    </>
  );
};

export default DriverMaster;

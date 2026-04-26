import React, { useState, useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
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
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dnzzrvbdz/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "hqudzekg";

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

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  // Open sidebar with employee data
  const openEditSidebar = (guardData) => {
    setSelectedGuard(guardData);
    setVisibleLeft(true);
    loadGuardDocs(guardData);
    setActiveSidebarTab("details");
  };
const exportToExcel = () => {
  // Table data ko Excel sheet me convert karo
  const ws = XLSX.utils.json_to_sheet(GuardDetails);
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
  const fetchGuardDetails = async (facilityid) => {
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
      } catch (parseError) {
        console.error("Error parsing guard details:", parseError);
        setGuardDetails([]);
      }
    } catch (error) {
      console.error("Error fetching guard details:", error?.message || error);
      setGuardDetails([]);
      // You might want to add a toast notification here
      // toast.error("Failed to fetch guard details. Please try again.");
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
      PVCStatus: "No",
      status: "Y",
      Remarks: "",
    });
    resetGuardDocsState();
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
        PVCStatus: selectedGuard.PVCStatus == "No" ? 0 : 1,
        VaccineName: "",
        FirstDoseDate: "",
        //SecondDoseDate: '',
      };

      const response = await GuardMasterService.UpdateGuard(params);
      toastService.success("Guard updated successfully.");
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

  const resetGuardDocsState = () => {
    setGuardDocs({}); setUploadingDocIds({}); setUploadProgressByDoc({}); setActiveSidebarTab("details");
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
                  <div className="d-flex justify-content-end d-none">
                    <Button
                    label="Export Excel"
                    icon="pi pi-file-excel"
                    className="btn btn-primary no-label"
                    onClick={exportToExcel}
                  />
                  </div>
                </div>
                {/* <div className="col-2">
                                    <Button label="Submit" disabled={!selFacility} className="btn btn-dark no-label-prime" onClick={fetchGuardDetails} />
                                </div> */}
              </div>
            </div>
          </div>

          {/* Table Start */}
          <div className="col-12">
            <div className="card_tb">
              <DataTable
                value={[...GuardDetails].slice(first, first + rows)}
                emptyMessage="No guard data available"
                rowClassName={(rowData) => {
                  // return rowData[0].status === "Y" ? "bg-danger-subtle" : "";
                }}
              >
                <Column
                  sortable
                  field="guardSE2Id"
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
                <Column
                  sortable
                  field="BarCodeIssueDate"
                  header="Induction Date"
                />
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
              </DataTable>
              <CustomPaginator
                first={first}
                rows={rows}
                totalRecords={GuardDetails.length}
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
            onClose={() => setAddGuardMaster(false)}
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
                onClick: () => setAddGuardMaster(false)
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
            onClose={() => setVisibleLeft(false)}
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
                onClick: () => setVisibleLeft(false)
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

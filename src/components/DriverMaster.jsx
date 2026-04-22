import React, { useState, useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";

import { FileUpload } from "primereact/fileupload";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import MasterSidebar from "./Master/MasterSidebar";
import { Checkbox } from "primereact/checkbox";
import { Badge } from "primereact/badge";
import { ToastContainer } from "react-toastify";

import sessionManager from "../utils/SessionManager";
import driverMasterService from "../services/compliance/DriverMasterService";
import ReportButton from "./common/ReportButton";
import Loader from "./common/Loader";
import { toastService } from "../services/toastService";

const DEFAULT_DRIVER_DOCUMENT_OPTIONS = [
  { name: "Aadhar Card", value: 8 },
  { name: "Address Proof", value: 9 },
  { name: "Age Proof", value: 10 },
  { name: "Driving Licence", value: 11 },
  { name: "Medical Certificate", value: 12 },
  { name: "PV Certificate", value: 13 },
  { name: "Valid Badge", value: 14 },
];

const DriverMaster = () => {
  const customSortStyle = {
    ".p-sortable-column:not(.p-highlight) .p-sortable-column-icon": {
      opacity: 0,
    },
    ".p-sortable-column:hover .p-sortable-column-icon": {
      opacity: 1,
    },
  };

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
      DocumentType: 0,
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

  // Fetch driver details from API
  const fetchDriverDetails = async () => {
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
      setFirst(0); // Reset pagination on data fetch
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
        DateOfBirth: null,
        BloodGroup: selectedDriver.BloodGroup || "",
        Qualificaton: "",
        MaritalStatus: "",
        VehicleId: 0,
        LicenceNo: selectedDriver.LicenceNo || "",
        LicenceExpDate: selectedDriver.LicenceExpDate
          ? new Date(selectedDriver.LicenceExpDate)
          : null,
        BadgeNo: selectedDriver.BadgeNo || "",
        BadgeExpDate: null,
        DriverStatus: 0,
        Attrited: 0,
        AttritedDate: null,
        Warning_1: "",
        Warning_2: "",
        FinalWarning: "",
        AadharVerification: 0,
        PVStatus: 0,
        DocumentType: Number(
          selectedDriver.DocumentType || selectedDriver.DocumentId || 0
        ),
        Remark: selectedDriver.Remark || "",
        Medical_Fit_Certificate: 0,
        DriverInfo_Display: 0,
        InductionForm: 0,
        UpdatedBy: userId,
      });

      setEditingDriverId(driverId);
      setVisibleLeft(true);
    }
  };

  const openAddSidebar = () => {
    setFormData(getInitialFormData());
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
        setVisibleLeft(false);
        setAddDriverMaster(false);
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

  // Licence Exp. Date
  const LicenceExp = (rowData) => (
    <Badge
      value={rowData.LicenceExpDate}
      severity={
        rowData.LicenceExpDate === "N"
          ? "badge badge_success"
          : "badge badge_danger"
      }
    />
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
          <div className="col-12">
            <div className="card_tb">
              <DataTable
                value={driverDetails.slice(first, first + rows)}
                scrollable
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={onSort}
                sortMode="single"
                removableSort
                pt={customSortStyle}
              >
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
                  body={(rowData) => rowData.DriverName.toLowerCase()}
                ></Column>
                <Column field="FacilityName" header="Facility"></Column>
                <Column field="VendorName" header="Vendor"></Column>
                <Column field="ContactNo" header="Contact No."></Column>
                <Column field="VehicleNo" header="Vehicle No."></Column>
                <Column
                  field="VehicleRegNo"
                  header="Vehicle Reg. No."
                ></Column>
                <Column field="LicenceNo" header="Licence No."></Column>
                <Column
                  field="LicenceExpDate"
                  header="Licence Exp. Date"
                  body={LicenceExp}
                ></Column>
              </DataTable>
              <CustomPaginator
                first={first}
                rows={rows}
                totalRecords={driverDetails.length}
                onPageChange={onPageChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </div>
          </div>
        </div>
      </div>

          {/* Edit Driver Master */}
          <MasterSidebar
            show={visibleLeft}
            onClose={() => setVisibleLeft(false)}
            title="Edit Driver Details"
            width="50%"
            footerButtons={[
              {
                label: "Cancel",
                className: "btn btn-outline-secondary",
                onClick: () => setVisibleLeft(false),
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
              <div className="row" >
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
                  <label>Marital Status</label>
                  <InputText
                    className="form-control"
                    value={formData.MaritalStatus}
                    onChange={(e) =>
                      handleFormChange("MaritalStatus", e.target.value)
                    }
                    placeholder="Marital Status"
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
                <div className="field col-3 mb-3">
                  <label>Mother's Name</label>
                  <InputText
                    className="form-control"
                    value={formData.MotherName}
                    onChange={(e) =>
                      handleFormChange("MotherName", e.target.value)
                    }
                    placeholder="Mother's Name"
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
                  <label>Licence Expiry Date</label>
                  <Calendar
                    className="w-100"
                    value={formData.LicenceExpDate}
                    onChange={(e) =>
                      handleFormChange("LicenceExpDate", e.value)
                    }
                    placeholder="Licence Expiry Date"
                  />
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
                  <label>Badge Expiry Date</label>
                  <Calendar
                    className="w-100"
                    value={formData.BadgeExpDate}
                    onChange={(e) =>
                      handleFormChange("BadgeExpDate", e.value)
                    }
                    placeholder="Badge Expiry Date"
                  />
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
                <div className="field col-3 d-flex align-items-center">
                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={formData.AadharVerification === 1}
                      onChange={() =>
                        handleCheckboxChange("AadharVerification")
                      }
                      inputId="AadharVerification"
                    />
                    <label
                      htmlFor="AadharVerification"
                      className="ms-2"
                    >
                      Aadhar Verification
                    </label>
                  </div>
                </div>
                <div className="field col-3 d-flex align-items-center">
                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={formData.PVStatus === 1}
                      onChange={() => handleCheckboxChange("PVStatus")}
                      inputId="PVStatus"
                    />
                    <label htmlFor="PVStatus" className="ms-2">
                      PV Status
                    </label>
                  </div>
                </div>
                <div className="field col-12 mb-3">
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
                  <h6 className="sidebarSubTitle">Document Details</h6>
                </div>
                <div className="field col-3 mb-3">
                  <label>Document Type</label>
                  <Dropdown
                    value={formData.DocumentType || ""}
                    onChange={(e) =>
                      handleFormChange("DocumentType", e.value)
                    }
                    options={documentDetails}
                    optionLabel="name"
                    optionValue="value"
                    placeholder="Select Document Type"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label>Choose File</label>
                  <FileUpload
                    mode="basic"
                    name="demo[]"
                    url="/api/upload"
                    accept="image/*"
                    className="w-100"
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
              </div>
          </MasterSidebar>

          {/* Add Driver Master */}
          <MasterSidebar
            show={addDriverMaster}
            onClose={() => setAddDriverMaster(false)}
            title="Add Driver Details"
            width="50%"
            footerButtons={[
              {
                label: "Cancel",
                className: "btn btn-outline-secondary",
                onClick: () => setAddDriverMaster(false),
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
              <div className="row">
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
                  <label>Marital Status</label>
                  <InputText
                    className="form-control"
                    value={formData.MaritalStatus}
                    onChange={(e) =>
                      handleFormChange("MaritalStatus", e.target.value)
                    }
                    placeholder="Marital Status"
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
                <div className="field col-3 mb-3">
                  <label>Mother's Name</label>
                  <InputText
                    className="form-control"
                    value={formData.MotherName}
                    onChange={(e) =>
                      handleFormChange("MotherName", e.target.value)
                    }
                    placeholder="Mother's Name"
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
                  <label>Licence Expiry Date</label>
                  <Calendar
                    className="w-100"
                    value={formData.LicenceExpDate}
                    onChange={(e) =>
                      handleFormChange("LicenceExpDate", e.value)
                    }
                    placeholder="Licence Expiry Date"
                  />
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
                  <label>Badge Expiry Date</label>
                  <Calendar
                    className="w-100"
                    value={formData.BadgeExpDate}
                    onChange={(e) =>
                      handleFormChange("BadgeExpDate", e.value)
                    }
                    placeholder="Badge Expiry Date"
                  />
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
                <div className="field col-3 d-flex align-items-center">
                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={formData.AadharVerification === 1}
                      onChange={() =>
                        handleCheckboxChange("AadharVerification")
                      }
                      inputId="AadharVerification"
                    />
                    <label
                      htmlFor="AadharVerification"
                      className="ms-2"
                    >
                      Aadhar Verification
                    </label>
                  </div>
                </div>
                <div className="field col-3 d-flex align-items-center">
                  <div className="d-flex mt-3">
                    <Checkbox
                      checked={formData.PVStatus === 1}
                      onChange={() => handleCheckboxChange("PVStatus")}
                      inputId="PVStatus"
                    />
                    <label htmlFor="PVStatus" className="ms-2">
                      PV Status
                    </label>
                  </div>
                </div>
                <div className="field col-12 mb-3">
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
                  <h6 className="sidebarSubTitle">Document Details</h6>
                </div>
                <div className="field col-3 mb-3">
                  <label>Document Type</label>
                  <Dropdown
                    value={formData.DocumentType || ""}
                    onChange={(e) =>
                      handleFormChange("DocumentType", e.value)
                    }
                    options={documentDetails}
                    optionLabel="name"
                    optionValue="value"
                    placeholder="Select Document Type"
                    className="w-100"
                    filter
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label>Choose File</label>
                  <FileUpload
                    mode="basic"
                    name="demo[]"
                    url="/api/upload"
                    accept="image/*"
                    className="w-100"
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
            </div>
          </MasterSidebar>
    </>
  );
};

export default DriverMaster;

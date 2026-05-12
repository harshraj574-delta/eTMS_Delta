import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";

import { Checkbox } from "primereact/checkbox";
import { FileUpload } from "primereact/fileupload";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { CustomDataTable } from "./common/CustomDataTable";
import TableToolbar from "./common/TableToolbar";
import { Column } from "primereact/column";
import MasterSidebar from "./Master/MasterSidebar";
import sessionManager from "../utils/SessionManager.js";
import { apiService } from "../services/api";
import { RadioButton } from "primereact/radiobutton";
import { Check } from "lucide-react";
import { toastService } from "../services/toastService";
import { InputNumber } from "primereact/inputnumber";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { ToastContainer } from "react-toastify";
import CustomPaginator from "./common/CustomPaginator";
import Loader from "./common/Loader";

const VENDOR_VEHICLE_PCT_KEY = "vendor_vehicle_pct";
const VENDOR_ESCORT_TYPE_KEY = "vendor_escort_type";

const escortTypeOptions = [
  { label: "Transport", value: "transport" },
  { label: "Security", value: "security" },
];

const VendorMaster = () => {
  const [selectedFacility, setSelectedfacility] = useState(null);
  const [visibleLeft, setVisibleLeft] = useState(false);
  const [visibleLeftAdd, setVisibleLeftAdd] = useState(false);
  const [facilityList, setfacilityList] = useState([]);
  const [VendorList, setVendorList] = useState([]);
  // selected vendor
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Add newVendor state near other state declarations
  const [newVendor, setNewVendor] = useState({
    vendorName: "",
    vendorStrength: null,
    vendorStrength2: null,
    vendorStrength3: null,
    vendorContact: "",
    vendorInfo: "",
    EmailId: "",
    facilityId: "",
    vendorType: "route",
    attrited: 0,
  });

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filteredVendorData, setFilteredVendorData] = useState([]);
  const op = useRef(null);
  const filterButtonRef = useRef(null);
  const [addVehiclePct, setAddVehiclePct] = useState({ small: "", medium: "", large: "" });
  const [editVehiclePct, setEditVehiclePct] = useState({ small: "", medium: "", large: "" });
  const [addEscortType, setAddEscortType] = useState(null);
  const [editEscortType, setEditEscortType] = useState(null);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  useEffect(() => {
    BindFacilityDDL();
  }, []);

  useEffect(() => {
    if (!globalFilter) {
      setFilteredVendorData(VendorList);
      return;
    }
    const lower = globalFilter.toLowerCase();
    setFilteredVendorData(
      VendorList.filter((v) =>
        Object.values(v).some((val) => val && String(val).toLowerCase().includes(lower))
      )
    );
  }, [VendorList, globalFilter]);

  const exportExcel = () => {
    const headers = ["Facility", "Vendor Name", "Vendor Info", "Vendor Contact", "Email ID", "Fleet Strength", "Fleet Strength2", "Fleet Strength3", "Bill Type", "Attrited", "Updated By"];
    const csvRows = filteredVendorData.map((v) => [
      v.facilityName, v.vendorName, v.vendorInfo, v.vendorContact, v.EmailId,
      v.vendorStrength, v.vendorStrength2, v.vendorStrength3, v.vendorType,
      v.attrited === "0" ? "No" : "Yes", v.UpdatedBy,
    ]);
    const csvContent = [headers, ...csvRows].map((r) => r.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "VendorMaster.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  //Bind facility dropdown List from API
  const BindFacilityDDL = async () => {
    try {
      const response = await apiService.SelectFacility({
        Userid: sessionManager.getUserSession().ID,
      });
      setfacilityList(response);

      const userFacilityId = sessionManager.getUserSession().FacilityID;
      let resolvedFacilityId = null;

      if (response && response.some(f => f.Id === userFacilityId)) {
        resolvedFacilityId = userFacilityId;
      } else if (response && response.length > 0) {
        resolvedFacilityId = response[0].Id;
      }

      if (resolvedFacilityId) {
        setSelectedfacility(resolvedFacilityId);
        await BindVendorGrid(resolvedFacilityId);
        // Initialize newVendor with resolved facility
        setNewVendor(prev => ({ ...prev, facilityId: resolvedFacilityId }));
      }
    } catch (error) {
      console.error("Error fetching locationlist:", error);
    }
  };

  //Bind Vendor List from API
  const BindVendorGrid = async (facilityid) => {
    try {
      const response = await apiService.GetVendorByFacility({
        facilityid: facilityid,
      });
      //console.log("VendorList", response);
      setVendorList(response);
      setFirst(0); // Reset pagination on data fetch
    } catch (error) {
      console.error("Error fetching locationlist:", error);
    }
  };

  // Add this function to handle vendor selection
  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
    setEditVehiclePct(loadVehiclePct(vendor));
    setEditEscortType(loadEscortType(vendor.Id));
  };

  // Update vendor details using API
  const handleUpdateVendor = async () => {
    setIsSubmitting(true);
    try {
      if (!selectedVendor) {
        toastService.warn("Please select a vendor to update.");
        setIsSubmitting(false);
        return;
      } if (!selectedVendor.vendorName) {
        toastService.warn("Please enter vendor name");
        setIsSubmitting(false);
        return;

      } if (!selectedVendor.vendorContact) {
        toastService.warn("Please enter vendor contact");
        setIsSubmitting(false);
        return;
      } else if (!/^\d+$/.test(selectedVendor.vendorContact)) {
        toastService.warn("Contact number must be numeric only");
        setIsSubmitting(false);
        return;
      } else if (selectedVendor.vendorContact.length > 15) {
        toastService.warn("Contact number must not exceed 15 digits");
        setIsSubmitting(false);
        return;
      }
      if (!selectedVendor.EmailId) {
        toastService.warn("Please enter EmailId");
        setIsSubmitting(false);
        return;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedVendor.EmailId)) {
        toastService.warn("Please enter a valid EmailId");
        setIsSubmitting(false);
        return;
      }
      if (!selectedVendor.vendorStrength) {
        toastService.warn("Please enter Fleet Strength");
        setIsSubmitting(false);
        return;
      }
      if (!selectedVendor.vendorStrength2) {
        toastService.warn("Please enter Fleet Strength2");
        setIsSubmitting(false);
        return;
      }
      if (!selectedVendor.vendorStrength3) {
        toastService.warn("Please enter Fleet Strength3");
        setIsSubmitting(false);
        return;
      }

      const response = await apiService.UpdateVendor({
        ID: selectedVendor.Id,
        vendorName: selectedVendor.vendorName,
        vendorStrength: selectedVendor.vendorStrength,
        vendorStrength2: selectedVendor.vendorStrength2,
        vendorStrength3: selectedVendor.vendorStrength3,
        vendorContact: selectedVendor.vendorContact,
        vendorInfo: selectedVendor.vendorInfo,
        EmailId: selectedVendor.EmailId,
        facilityId: selectedVendor.facilityId,
        vendorType: selectedVendor.vendorType,
        attrited: selectedVendor.attrited,
        Updatedby: sessionManager.getUserSession().ID,
      });

      if (response[0].result === 1) {
        saveVehiclePct(selectedVendor.Id, editVehiclePct);
        saveEscortType(selectedVendor.Id, editEscortType);
        toastService.success("Data Updated Successfully");
        BindVendorGrid(selectedFacility);
        setVisibleLeft(false);
        setSelectedVendor(null);
        setEditVehiclePct({ small: "", medium: "", large: "" });
        setEditEscortType(null);
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveVendor = async () => {
    setIsSubmitting(true);
    try {
      //console.log("newVendor", newVendor);

      if (!newVendor) {
        toastService.warn("Please select a vendor to update.");
        setIsSubmitting(false);
        return;
      } if (newVendor.vendorName == "") {
        toastService.warn("Please Enter Vendor Name");
        setIsSubmitting(false);
        return;
      }
      // Validate vendor contact
      if (!newVendor.vendorContact) {
        toastService.warn("Please enter vendor contact");
        setIsSubmitting(false);
        return;
      }

      // Check if contact contains only numbers
      if (!/^\d+$/.test(newVendor.vendorContact)) {
        toastService.warn("Contact number must be numeric only");
        setIsSubmitting(false);
        return;
      }

      // Validate contact length
      if (newVendor.vendorContact.length > 15) {
        toastService.warn("Contact number must not exceed 15 digits");
        setIsSubmitting(false);
        return;
      }

      // Validate email presence
      if (!newVendor.EmailId?.trim()) {
        toastService.warn("Please enter Email Id");
        setIsSubmitting(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newVendor.EmailId)) {
        toastService.warn("Please enter a valid Email Id");
        setIsSubmitting(false);
        return;
      }

      if (!newVendor.vendorStrength) {
        toastService.warn("Please enter Fleet Strength");
        setIsSubmitting(false);
        return;
      }
      if (!newVendor.vendorStrength2) {
        toastService.warn("Please enter Fleet Strength 2");
        setIsSubmitting(false);
        return;
      }
      if (!newVendor.vendorStrength3) {
        toastService.warn("Please enter Fleet Strength 3");
        setIsSubmitting(false);
        return;
      }



      const response = await apiService.InsertVendor({
        vendorName: newVendor.vendorName,
        vendorStrength: newVendor.vendorStrength,
        vendorStrength2: newVendor.vendorStrength2,
        vendorStrength3: newVendor.vendorStrength3,
        vendorContact: newVendor.vendorContact,
        vendorInfo: newVendor.vendorInfo,
        EmailId: newVendor.EmailId,
        facilityId: newVendor.facilityId,
        vendorType: newVendor.vendorType,
        attrited: newVendor.attrited,
        Updatedby: sessionManager.getUserSession().ID,
      });

      if (response[0].result === 1) {
        toastService.success("Data Saved Successfully");
        // Refresh the vendor grid
        await BindVendorGrid(selectedFacility);
        // Reset the form
        //document.getElementById("raise_Feedback").classList.remove("show");
        // Reset newVendor to initial state
        setNewVendor({
          vendorName: "",
          vendorStrength: null,
          vendorStrength2: null,
          vendorStrength3: null,
          vendorContact: "",
          vendorInfo: "",
          EmailId: "",
          facilityId: selectedFacility,
          vendorType: "route",
          attrited: 0,
        });
        setAddVehiclePct({ small: "", medium: "", large: "" });
        setAddEscortType(null);
        setVisibleLeftAdd(false);
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadVehiclePct = (vendor) => {
    if (!vendor?.Id) return { small: "", medium: "", large: "" };
    try {
      const data = JSON.parse(localStorage.getItem(VENDOR_VEHICLE_PCT_KEY) || "{}");
      return data[String(vendor.Id)] || { small: "", medium: "", large: "" };
    } catch { return { small: "", medium: "", large: "" }; }
  };

  const saveVehiclePct = (vendorId, pct) => {
    try {
      const data = JSON.parse(localStorage.getItem(VENDOR_VEHICLE_PCT_KEY) || "{}");
      data[String(vendorId)] = pct;
      localStorage.setItem(VENDOR_VEHICLE_PCT_KEY, JSON.stringify(data));
    } catch {}
  };

  const loadEscortType = (vendorId) => {
    try {
      const data = JSON.parse(localStorage.getItem(VENDOR_ESCORT_TYPE_KEY) || "{}");
      return data[String(vendorId)] || null;
    } catch { return null; }
  };

  const saveEscortType = (vendorId, type) => {
    try {
      const data = JSON.parse(localStorage.getItem(VENDOR_ESCORT_TYPE_KEY) || "{}");
      data[String(vendorId)] = type;
      localStorage.setItem(VENDOR_ESCORT_TYPE_KEY, JSON.stringify(data));
    } catch {}
  };

  // Open sidebar with employee data
  const openEditSidebar = () => {
    setVisibleLeft(true); // Open sidebar
  };

  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header
        pageTitle="Vendor Master"
        showNewButton={true}
        onNewButtonClick={() => setVisibleLeftAdd(true)}
      />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Vendor Master</h6>
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
                    value={selectedFacility}
                    onChange={async (e) => {
                      setSelectedfacility(e.value);
                      setIsSubmitting(true);
                      await BindVendorGrid(e.value);
                      setIsSubmitting(false);
                    }}
                    options={facilityList}
                    optionLabel="facilityName"
                    optionValue="Id"
                    placeholder="Select Facility"
                    className="w-100"
                    filter
                    id="ddlfacility"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Start */}
          <div className="col-12">
            <div className="card_tb p-3">
              <TableToolbar
                search={globalFilter}
                onSearch={(e) => setGlobalFilter(e.target.value)}
                onRefresh={() => setGlobalFilter("")}
                onExport={exportExcel}
                showFilter={false}
                overlayRef={op}
                filterButtonRef={filterButtonRef}
              />
              <CustomDataTable
                value={filteredVendorData.slice(first, first + rows)}
                emptyMessage="No Records Found"
              >
                <Column field="facilityName" header="Facility" />
                <Column
                  sortable
                  field="vendorName"
                  header="Vendor Name"
                  body={(rowData) => (
                    <a
                      href="#"
                      className="text-capitalize"
                      onClick={(e) => {
                        e.preventDefault();
                        openEditSidebar();
                        handleVendorSelect(rowData);
                      }}
                    >
                      {rowData.vendorName}
                    </a>
                  )}
                />
                <Column field="vendorInfo" header="Vendor Info" />
                <Column field="vendorContact" header="Vendor Contact" />
                <Column field="EmailId" header="Email ID" />
                <Column field="vendorStrength" header="Fleet Strength" sortable />
                <Column sortable field="vendorStrength2" header="Fleet Strength2" />
                <Column sortable field="vendorStrength3" header="Fleet Strength3" />
                <Column field="vendorType" header="Bill Type" />
                <Column
                  field="attrited"
                  header="Attrited"
                  body={(rowData) => (rowData.attrited === "0" ? "No" : "Yes")}
                />
                <Column field="UpdatedBy" header="Updated By" />
              </CustomDataTable>
              <CustomPaginator
                first={first}
                rows={rows}
                totalRecords={filteredVendorData.length}
                onPageChange={onPageChange}
                rowsPerPageOptions={[50, 100, 150, 200]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Vendor */}
      <MasterSidebar
        show={visibleLeftAdd}
        onClose={() => { setVisibleLeftAdd(false); setAddVehiclePct({ small: "", medium: "", large: "" }); setAddEscortType(null); }}
        title={
          <div className="w-100 d-flex justify-content-between align-items-center pe-4">
            <span>Add Vendor</span>
            {newVendor.attrited == 1 && <span className="text-warning fs-6">Attrited</span>}
          </div>
        }
        width="50%"
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary",
            onClick: () => { setVisibleLeftAdd(false); setAddVehiclePct({ small: "", medium: "", large: "" }); setAddEscortType(null); },
          },
          {
            label: "Save Changes",
            className: "btn btn-success",
            onClick: handleSaveVendor,
            loading: isSubmitting,
          },
        ]}
      >
        <div className="p-3 bg-white">
          <div className="row">
                <div className="col-12">
                  <div className="bg-light-blue w-100 d-flex justify-content-between align-items-center mb-3 pe-3">
                    <h6 className="sidebarSubTitle">Basic Details</h6>
                    <div className="d-flex justify-content-between">
                      <Checkbox
                        id="chkAttrited"
                        checked={newVendor.attrited == 1}
                        onChange={(e) =>
                          setNewVendor({
                            ...newVendor,
                            attrited: e.checked ? 1 : 0,
                          })
                        }
                      />
                      <label htmlFor="chkAttrited" className="ms-2">
                        Attrited
                      </label>
                    </div>
                  </div>
                </div>

                <div className="field col-4 mb-3">
                  <label>
                    Facility <span>*</span>
                  </label>
                  <Dropdown
                    placeholder="Select Facility"
                    className="w-100"
                    filter
                    id="ddlNewfacility"
                    value={newVendor.facilityId}
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        facilityId: e.value,
                      })
                    }
                    options={facilityList}
                    optionLabel="facilityName"
                    optionValue="Id"
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label>
                    Vendor Name <span>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    name=""
                    placeholder="Vendor Name"
                    id="txtVendorName"
                    value={newVendor.vendorName}
                    onChange={(e) =>
                      setNewVendor({ ...newVendor, vendorName: e.target.value })
                    }
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label>Vendor Information </label>
                  <InputText
                    className="form-control"
                    name=""
                    placeholder="Vendor Information"
                    id="txtVendorInfo"
                    value={newVendor.vendorInfo}
                    onChange={(e) =>
                      setNewVendor({ ...newVendor, vendorInfo: e.target.value })
                    }
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label>Contact Number</label>
                  <InputText
                    className="form-control"
                    name=""
                    placeholder="Contact Number"
                    id="txtContactNo"
                    value={newVendor.vendorContact}
                    onChange={(e) =>
                      setNewVendor({
                        ...newVendor,
                        vendorContact: e.target.value,
                      })
                    }
                    maxLength={10}
                    minLength={10}
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label>
                    Email ID <span>*</span>
                  </label>
                  <InputText
                    className="form-control"
                    name=""
                    placeholder="Email ID"
                    id="txtEmailID"
                    value={newVendor.EmailId}
                    onChange={(e) =>
                      setNewVendor({ ...newVendor, EmailId: e.target.value })
                    }
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label className="d-block">Escort Vendor</label>
                  <Dropdown
                    placeholder="Select Type"
                    className="w-100"
                    value={addEscortType}
                    onChange={(e) => setAddEscortType(e.value)}
                    options={escortTypeOptions}
                    optionLabel="label"
                    optionValue="value"
                    showClear
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label className="d-block">
                    Fleet Strength <span>*</span>
                  </label>
                  <InputNumber
                    placeholder="Fleet Strength"
                    id="txtFleetStrenght"
                    value={newVendor.vendorStrength}
                    onValueChange={(e) =>
                      setNewVendor({ ...newVendor, vendorStrength: e.value })
                    }
                    useGrouping={false}
                    min={0}
                    max={100}
                    className="w-100"
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label className="d-block">
                    Fleet Strength2 <span>*</span>
                  </label>
                  <InputNumber
                    placeholder="Fleet Strength2"
                    id="txtFleetStrenght2"
                    value={newVendor.vendorStrength2}
                    onValueChange={(e) =>
                      setNewVendor({ ...newVendor, vendorStrength2: e.value })
                    }
                    useGrouping={false}
                    min={0}
                    max={100}
                    className="w-100"
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label className="d-block">
                    Fleet Strength3 <span>*</span>
                  </label>
                  <InputNumber
                    placeholder="Fleet Strength3"
                    id="txtFleetStrenght3"
                    value={newVendor.vendorStrength3}
                    onValueChange={(e) =>
                      setNewVendor({ ...newVendor, vendorStrength3: e.value })
                    }
                    useGrouping={false}
                    min={0}
                    max={100}
                    className="w-100"
                  />
                </div>

                <div className="field col-4 mb-3">
                  <label className="d-block">Small Vehicle %</label>
                  <InputText
                    className="form-control"
                    placeholder="Small Vehicle %"
                    value={addVehiclePct.small}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) setAddVehiclePct(prev => ({ ...prev, small: val }));
                    }}
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label className="d-block">Medium Vehicle %</label>
                  <InputText
                    className="form-control"
                    placeholder="Medium Vehicle %"
                    value={addVehiclePct.medium}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) setAddVehiclePct(prev => ({ ...prev, medium: val }));
                    }}
                  />
                </div>
                <div className="field col-4 mb-3">
                  <label className="d-block">Large Vehicle %</label>
                  <InputText
                    className="form-control"
                    placeholder="Large Vehicle %"
                    value={addVehiclePct.large}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d+$/.test(val)) setAddVehiclePct(prev => ({ ...prev, large: val }));
                    }}
                  />
                </div>

                <div className="field col-12 d-flex flex-wrap justify-content-start align-items-center gap-4 mt-4">
                  <div className="d-flex">
                    <label htmlFor="">Bill Type</label>
                  </div>
                  <div className="d-flex">
                    <RadioButton
                      id="rbRouteBasis"
                      name="vendorType"
                      value="route"
                      checked={newVendor.vendorType?.toLowerCase() == "route"}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, vendorType: e.value })
                      }
                    />
                    <label htmlFor="rbRouteBasis" className="ms-2">
                      Route Basis
                    </label>
                  </div>
                  <div className="d-flex">
                    <RadioButton
                      id="rbKMBasis"
                      name="vendorType"
                      value="km"
                      checked={newVendor.vendorType?.toLowerCase() == "km"}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, vendorType: e.value })
                      }
                    />
                    <label htmlFor="rbKMBasis" className="ms-2">
                      KM Basis
                    </label>
                  </div>
                  <div className="d-flex">
                    <RadioButton
                      id="rbPackageBasis"
                      name="vendorType"
                      value="package"
                      checked={newVendor.vendorType?.toLowerCase() == "package"}
                      onChange={(e) =>
                        setNewVendor({ ...newVendor, vendorType: e.value })
                      }
                    />
                    <label htmlFor="rbPackageBasis" className="ms-2">
                      Package Basis
                    </label>
                  </div>
                </div>
          </div>
        </div>
      </MasterSidebar>

      {/* Edit Vendor Sidebar */}
      <MasterSidebar
        show={visibleLeft}
        onClose={() => setVisibleLeft(false)}
        title={
          <div className="w-100 d-flex justify-content-between align-items-center pe-4">
            <span>{selectedVendor ? selectedVendor.vendorName : ""}</span>
            {selectedVendor?.attrited == 1 && <span className="text-warning fs-6">Attrited</span>}
          </div>
        }
        width="50%"
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary",
            onClick: () => setVisibleLeft(false),
          },
          {
            label: "Save",
            className: "btn btn-success",
            onClick: handleUpdateVendor,
            loading: isSubmitting,
          },
        ]}
      >
        <div className="p-3 bg-white">
              {selectedVendor && (
                <div className="row">
                  <div className="col-12">
                    <div className="bg-light-blue w-100 d-flex justify-content-between align-items-center mb-3 pe-3">
                      <h6 className="sidebarSubTitle">Basic Details</h6>
                      <div className="d-flex justify-content-between">
                        <Checkbox
                          id="chkEditAttrited"
                          checked={selectedVendor.attrited == 1}
                          onChange={(e) =>
                            setSelectedVendor({
                              ...selectedVendor,
                              attrited: e.checked ? 1 : 0,
                            })
                          }
                        />
                        <label htmlFor="chkEditAttrited" className="ms-2">
                          Attrited
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="field col-4 mb-3">
                    <label>
                      Facility <span>*</span>
                    </label>
                    <Dropdown
                      placeholder="Select Facility"
                      className="w-100"
                      filter
                      id="ddlEditfacility"
                      value={selectedVendor.facilityId}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          facilityId: e.value,
                        })
                      }
                      options={facilityList}
                      optionLabel="facilityName"
                      optionValue="Id"
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label>
                      Vendor Name <span>*</span>
                    </label>
                    <InputText
                      className="form-control"
                      name=""
                      placeholder="Vendor Name"
                      id="txtEditVendorName"
                      value={selectedVendor.vendorName}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          vendorName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label>Vendor Information </label>
                    <InputText
                      className="form-control"
                      name=""
                      placeholder="Vendor Information"
                      id="txtEditVendorInfo"
                      value={selectedVendor.vendorInfo}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          vendorInfo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label>Contact Number</label>
                    <InputText
                      className="form-control"
                      name=""
                      placeholder="Contact Number"
                      id="txtEditContactNo"
                      value={selectedVendor.vendorContact}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value) && value.length <= 15) {
                          setSelectedVendor({
                            ...selectedVendor,
                            vendorContact: value,
                          });
                        }
                      }}
                      maxLength={15}
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label>
                      Email ID <span>*</span>
                    </label>
                    <InputText
                      className="form-control"
                      name=""
                      placeholder="Email ID"
                      id="txtEditEmailID"
                      value={selectedVendor.EmailId}
                      onChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          EmailId: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label className="d-block">Escort Vendor</label>
                    <Dropdown
                      placeholder="Select Type"
                      className="w-100"
                      value={editEscortType}
                      onChange={(e) => setEditEscortType(e.value)}
                      options={escortTypeOptions}
                      optionLabel="label"
                      optionValue="value"
                      showClear
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label className="d-block">
                      Fleet Strength <span>*</span>
                    </label>
                    <InputNumber
                      placeholder="Fleet Strength"
                      id="txtEditFleetStrenght"
                      value={selectedVendor.vendorStrength}
                      onValueChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          vendorStrength: e.value,
                        })
                      }
                      useGrouping={false}
                      min={0}
                      max={100}
                      className="w-100"
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label className="d-block">
                      Fleet Strength2 <span>*</span>
                    </label>
                    <InputNumber
                      placeholder="Fleet Strength2"
                      id="txtEditFleetStrenght2"
                      value={selectedVendor.vendorStrength2}
                      onValueChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          vendorStrength2: e.value,
                        })
                      }
                      useGrouping={false}
                      min={0}
                      max={100}
                      className="w-100"
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label className="d-block">
                      Fleet Strength3 <span>*</span>
                    </label>
                    <InputNumber
                      placeholder="Fleet Strength3"
                      id="txtEditFleetStrenght3"
                      value={selectedVendor.vendorStrength3}
                      onValueChange={(e) =>
                        setSelectedVendor({
                          ...selectedVendor,
                          vendorStrength3: e.value,
                        })
                      }
                      useGrouping={false}
                      min={0}
                      max={100}
                      className="w-100"
                    />
                  </div>

                  <div className="field col-4 mb-3">
                    <label className="d-block">Small Vehicle %</label>
                    <InputText
                      className="form-control"
                      placeholder="Small Vehicle %"
                      value={editVehiclePct.small}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d+$/.test(val)) setEditVehiclePct(prev => ({ ...prev, small: val }));
                      }}
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label className="d-block">Medium Vehicle %</label>
                    <InputText
                      className="form-control"
                      placeholder="Medium Vehicle %"
                      value={editVehiclePct.medium}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d+$/.test(val)) setEditVehiclePct(prev => ({ ...prev, medium: val }));
                      }}
                    />
                  </div>
                  <div className="field col-4 mb-3">
                    <label className="d-block">Large Vehicle %</label>
                    <InputText
                      className="form-control"
                      placeholder="Large Vehicle %"
                      value={editVehiclePct.large}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d+$/.test(val)) setEditVehiclePct(prev => ({ ...prev, large: val }));
                      }}
                    />
                  </div>

                  <div
                    className="field col-12 d-flex flex-wrap justify-content-start align-items-center gap-4 mt-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <div className="d-flex">
                      <label htmlFor="">Bill Type</label>
                    </div>
                    <div className="d-flex">
                      <RadioButton
                        id="rbEditRouteBasis"
                        name="vendorType"
                        value="route"
                        checked={
                          selectedVendor.vendorType?.toLowerCase() == "route"
                        }
                        onChange={(e) =>
                          setSelectedVendor({
                            ...selectedVendor,
                            vendorType: e.value,
                          })
                        }
                      />
                      <label htmlFor="rbEditRouteBasis" className="ms-2">
                        Route Basis
                      </label>
                    </div>
                    <div className="d-flex">
                      <RadioButton
                        id="rbEditKMBasis"
                        name="vendorType"
                        value="km"
                        checked={
                          selectedVendor.vendorType?.toLowerCase() == "km"
                        }
                        onChange={(e) =>
                          setSelectedVendor({
                            ...selectedVendor,
                            vendorType: e.value,
                          })
                        }
                      />
                      <label htmlFor="rbEditKMBasis" className="ms-2">
                        KM Basis
                      </label>
                    </div>
                    <div className="d-flex">
                      <RadioButton
                        id="rbEditPackageBasis"
                        name="vendorType"
                        value="package"
                        checked={
                          selectedVendor.vendorType?.toLowerCase() == "package"
                        }
                        onChange={(e) =>
                          setSelectedVendor({
                            ...selectedVendor,
                            vendorType: e.value,
                          })
                        }
                      />
                      <label htmlFor="rbEditPackageBasis" className="ms-2">
                        Package Basis
                      </label>
                    </div>
                  </div>
                </div>
              )}
        </div>
      </MasterSidebar>
    </>
  );
};

export default VendorMaster;

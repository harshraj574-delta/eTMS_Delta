import React, { useState, useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";

import { Checkbox } from "primereact/checkbox";
import { FileUpload } from "primereact/fileupload";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Sidebar as PrimeSidebar } from "primereact/sidebar"; // Renamed to avoid conflict with your Sidebar component
import sessionManager from "../utils/SessionManager.js";
import { apiService } from "../services/api";
import { RadioButton } from "primereact/radiobutton";
import { Check } from "lucide-react";
import { toastService } from "../services/toastService";
import { InputNumber } from "primereact/inputnumber";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const VendorMaster = () => {
  const [selectedFacility, setSelectedfacility] = useState(null);
  const [visibleLeft, setVisibleLeft] = useState(false);
  const [visibleLeftAdd, setVisibleLeftAdd] = useState(false);
  const [facilityList, setfacilityList] = useState([]);
  const [VendorList, setVendorList] = useState([]);
  // selected vendor
  const [selectedVendor, setSelectedVendor] = useState(null);

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

  useEffect(() => {
    BindFacilityDDL();
    const currentFacilityId = sessionManager.getUserSession().FacilityID;
    setSelectedfacility(currentFacilityId);
    BindVendorGrid(currentFacilityId);
    // Initialize newVendor with current facility
    setNewVendor({
      vendorName: "",
      vendorStrength: null,
      vendorStrength2: null,
      vendorStrength3: null,
      vendorContact: "",
      vendorInfo: "",
      EmailId: "",
      facilityId: currentFacilityId,
      vendorType: "route",
      attrited: 0,
    });
  }, []);

  //Bind facility dropdown List from API
  const BindFacilityDDL = async () => {
    try {
      const response = await apiService.SelectFacility({
        Userid: sessionManager.getUserSession().ID,
      });
      setfacilityList(response);

      const userFacilityId = sessionManager.getUserSession().FacilityID;
      if (response && response.some(f => f.Id === userFacilityId)) {
        setSelectedfacility(userFacilityId);
        BindVendorGrid(userFacilityId);
      } else if (response && response.length > 0) {
        setSelectedfacility(response[0].Id);
        BindVendorGrid(response[0].Id);
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
      console.log("VendorList", response);
      setVendorList(response);
    } catch (error) {
      console.error("Error fetching locationlist:", error);
    }
  };

  // Add this function to handle vendor selection
  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
  };

  // Update vendor details using API
  const handleUpdateVendor = async () => {
    try {
      if (!selectedVendor) {
        toastService.warn("Please select a vendor to update.");
        return;
      } if (!selectedVendor.vendorName) {
        toastService.warn("Please enter vendor name");
        return;

      } if (!selectedVendor.vendorContact) {
        toastService.warn("Please enter vendor contact");
        return;
      } else if (!/^\d+$/.test(selectedVendor.vendorContact)) {
        toastService.warn("Contact number must be numeric only");
        return;
      } else if (selectedVendor.vendorContact.length > 15) {
        toastService.warn("Contact number must not exceed 15 digits");
        return;
      }
      if (!selectedVendor.EmailId) {
        toastService.warn("Please enter EmailId");
        return;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedVendor.EmailId)) {
        toastService.warn("Please enter a valid EmailId");
        return;
      }
      if (!selectedVendor.vendorStrength) {
        toastService.warn("Please enter Fleet Strength");
        return;
      }
      if (!selectedVendor.vendorStrength2) {
        toastService.warn("Please enter Fleet Strength2");
        return;
      }
      if (!selectedVendor.vendorStrength3) {
        toastService.warn("Please enter Fleet Strength3");
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
        toastService.success("Data Updated Successfully");
        // Refresh the vendor grid
        BindVendorGrid(selectedFacility);
        // Close the sidebar
        setVisibleLeft(false);
        // Clear the selected vendor
        setSelectedVendor(null);
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
    }
  };

  const handleSaveVendor = async () => {
    try {
      console.log("newVendor", newVendor);

      if (!newVendor) {
        toastService.warn("Please select a vendor to update.");
        return;
      } if (newVendor.vendorName == "") {
        toastService.warn("Please Enter Vendor Name");
        return;
      }
      // Validate vendor contact
      if (!newVendor.vendorContact) {
        toastService.warn("Please enter vendor contact");
        return;
      }

      // Check if contact contains only numbers
      if (!/^\d+$/.test(newVendor.vendorContact)) {
        toastService.warn("Contact number must be numeric only");
        return;
      }

      // Validate contact length
      if (newVendor.vendorContact.length > 15) {
        toastService.warn("Contact number must not exceed 15 digits");
        return;
      }

      // Validate email presence
      if (!newVendor.EmailId?.trim()) {
        toastService.warn("Please enter Email Id");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newVendor.EmailId)) {
        toastService.warn("Please enter a valid Email Id");
        return;
      }

      if (!newVendor.vendorStrength) {
        toastService.warn("Please enter Fleet Strength");
        return;
      }
      if (!newVendor.vendorStrength2) {
        toastService.warn("Please enter Fleet Strength 2");
        return;
      }
      if (!newVendor.vendorStrength3) {
        toastService.warn("Please enter Fleet Strength 3");
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
        BindVendorGrid(selectedFacility);
        // Reset the form
        document.getElementById("raise_Feedback").classList.remove("show");
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
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
    }
  };

  // Open sidebar with employee data
  const openEditSidebar = () => {
    setVisibleLeft(true); // Open sidebar
  };

  return (
    <>
      <Header
        pageTitle="Vendor Master"
        showNewButton={true}
        onNewButtonClick={() => setVisibleLeftAdd(true)}
      />
      <Sidebar />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Vendor Master</h6>
          </div>
          {/* Search Box */}
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row">
                <div className="col-2">
                  <label htmlFor="">Facility</label>
                  <Dropdown
                    value={selectedFacility}
                    onChange={(e) => {
                      setSelectedfacility(e.value);
                      BindVendorGrid(e.value);
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
            <div className="card_tb">
              <DataTable
                value={VendorList}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                rowClassName={(rowData) => {
                  console.log("row data", rowData);
                  // return rowData[0].attrited === "1" ? 'bg-danger-subtle' : '';
                }}
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
                <Column field="EmailId" header="EmailId" />
                <Column field="vendorStrength" header="Fleet Strength" />
                <Column field="vendorStrength2" header="Fleet Strength2" />
                <Column field="vendorStrength3" header="Fleet Strength3" />
                <Column field="vendorType" header="Vendor Type" />
                <Column
                  field="attrited"
                  header="Attrited"
                  body={(rowData) => (rowData.attrited === "0" ? "No" : "Yes")}
                />


                <Column field="UpdatedBy" header="Updated by" />
              </DataTable>
            </div>
          </div>
          {/* Add Vendor */}
          <PrimeSidebar
            visible={visibleLeftAdd}
            position="right"
            onHide={() => setVisibleLeftAdd(false)}
            style={{ width: "50%" }}
            showCloseIcon={false}
            dismissable={false}
          >
            <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
              <h6 className="sidebarTitle">Add Vendor</h6>
              <span className="d-flex align-items-center">
                <p className="text-warning">{newVendor.attrited == 1 ? "Attrited" : ""}</p>
                <Button
                  icon="pi pi-times"
                  className="p-button-rounded p-button-text"
                  onClick={() => setVisibleLeftAdd(false)}
                />
              </span>
            </div>
            <div className="sidebarBody">
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

                <div className="field col-12 d-flex flex-wrap justify-content-start align-items-center gap-4 mt-4">
                  <div className="d-flex">
                    <label htmlFor="">Vendor Type</label>
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
              {/* Fixed button container at bottom of sidebar */}
              <div className="sidebar-fixed-bottom position-absolute pe-3">
                <div className="d-flex gap-3 justify-content-end me-3">
                  <Button
                    label="Cancel"
                    className="btn btn-outline-secondary"
                    onClick={() => setVisibleLeftAdd(false)}
                  />
                  <Button
                    label="Save Changes"
                    className="btn btn-success"
                    onClick={handleSaveVendor}
                  />
                </div>
              </div>
            </div>
          </PrimeSidebar>

          {/* Edit Prime Sidebar */}
          <PrimeSidebar
            visible={visibleLeft}
            position="right"
            onHide={() => setVisibleLeft(false)}
            style={{ width: "50%" }}
            showCloseIcon={false}
            dismissable={false}
          >
            <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
              <h6 className="sidebarTitle">
                {selectedVendor ? selectedVendor.vendorName : ""}
              </h6>
              <span className="d-flex align-items-center">
                <p className="text-warning">{selectedVendor?.attrited == 1 ? 'Attrited' : ''}</p>
                <Button
                  icon="pi pi-times"
                  className="p-button-rounded p-button-text"
                  onClick={() => setVisibleLeft(false)}
                />
              </span>
            </div>
            <div className="sidebarBody">
              {selectedVendor && (
                <div className="row">
                  {/* <div className="col-12 mb-3">
                                    <h6 className="sidebarSubTitle">Add New Vendor</h6>
                                </div> */}

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
                        // Allow only numeric input and limit to 15 characters
                        if (/^\d*$/.test(value) && value.length <= 15) {
                          setSelectedVendor({
                            ...selectedVendor,
                            vendorContact: value,
                          });
                        }
                      }}
                      maxLength={15}
                    //   onChange={(e) =>
                    //     setSelectedVendor({
                    //       ...selectedVendor,
                    //       vendorContact: e.target.value,
                    //     })
                    //   }
                    //   maxLength={10}
                    //   minLength={10}
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

                  <div
                    className="field col-12 d-flex flex-wrap justify-content-start align-items-center gap-4 mt-3"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    <div className="d-flex">
                      <label htmlFor="">Vendor Type</label>
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
            <div className="sidebar-fixed-bottom position-absolute pe-3">
              <div className="d-flex gap-3 justify-content-end me-3">
                <Button
                  label="Cancel"
                  className="btn btn-outline-secondary"
                  onClick={() => setVisibleLeft(false)}
                />
                <Button
                  label="Save"
                  className="btn btn-success"
                  onClick={() => handleUpdateVendor()}
                />
              </div>
            </div>
          </PrimeSidebar>
        </div>
      </div>
    </>
  );
};

export default VendorMaster;

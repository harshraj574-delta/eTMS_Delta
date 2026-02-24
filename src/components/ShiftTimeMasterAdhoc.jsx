import React, { use, useEffect, useState } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { FileUpload } from "primereact/fileupload";
import { Checkbox } from "primereact/checkbox";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import ShiftTimeMasterAdhocService from "../services/compliance/ShiftTimeMasterAdhocService";
import { toastService } from "../services/toastService";
import ReportButton from "./common/ReportButton";

const ShiftTimeMasterAdhoc = () => {
  const [addAdhocSidebar, setAddAdhocSidebar] = useState(false);
  const [EditAdhocSidebar, setEditAdhocSidebar] = useState(false);
  const [facility, setFacility] = useState([]);
  const [selFacility, setSelFacility] = useState(null);
  const [facilityAdd, setFacilityAdd] = useState([]);
  const [selFacilityAdd, setSelFacilityAdd] = useState(null);
  const UserId = sessionStorage.getItem("ID");
  const [selectedShift, setSelectedShift] = useState(null);
  const TypeOptions = [
    { label: "Both", value: "B" },
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" }
  ];
  const TypeOptionsAdd = [
    { label: "Both", value: "B" },
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" }
  ];
  const TypeOptionsEdit = [
    { label: "Both", value: "B" },
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" }
  ];
  const [typeAdd, setTypeAdd] = useState("");
  const [type, setType] = useState("");
  const ShiftCategoryOptions = [
    { label: "Adhoc", value: "Adhoc" },
    { label: "Emergency", value: "Emergency" },
  ];
  const ShiftCategoryOptionsAdd = [
    { label: "Adhoc", value: "Adhoc" },
    { label: "Emergency", value: "Emergency" },
  ];
  const [shiftCategoryAdd, setShiftCategoryAdd] = useState("");
  const [shiftCategory, setShiftCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shiftTime, setShiftTime] = useState("");
  useEffect(() => {
    fetchFacilities();
    fetchFacilitiesAdd();
  }, [])
  const fetchFacilities = async () => {
    try {
      const response = await ShiftTimeMasterAdhocService.SelectFacility({ Userid: UserId });
      const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
      const formatted = parsedData.map(item => ({
        name: item.facilityName,
        value: item.Id,
      }));
      setFacility(formatted);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    }
  }
  const fetchFacilitiesAdd = async () => {
    try {
      const response = await ShiftTimeMasterAdhocService.SelectFacility({ Userid: UserId });
      const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
      const formatted = parsedData.map(item => ({
        name: item.facilityName,
        value: item.Id,
      }));
      setFacilityAdd(formatted);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    }
  }
  const DeleteShiftTime = async (shiftTimeId) => {
    try {
      const response = await ShiftTimeMasterAdhocService.DeleteShiftTime({
        ShiftTimeId: shiftTimeId,
        ProcessId: -1,
        FacilityId: selFacility,
      });
      console.log("DeleteShiftTime response:", response);
    } catch (error) {
      console.error("Error in DeleteShiftTime:", error);
      throw error;
    }
  }
  const handleDeleteClick = (rowIndex) => {
    confirmDialog({
      message: "Are you sure? You want to Delete Shift Time Master.",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: () => {
        const rowData = shiftData[rowIndex];
        if (rowData) {
          DeleteShiftTime(rowData.Id);
          toastService.success("Shift Time Master Deleted Successfully");
          fetchGetAdhocShiftTime();
        }
      },
      reject: () => {
        // Optional: Logic on cancel
        console.log("User canceled deletion");
      },
    });
  };
  const customSortStyle = {
    '.p-sortable-column:not(.p-highlight) .p-sortable-column-icon': {
      opacity: 0
    },
    '.p-sortable-column:hover .p-sortable-column-icon': {
      opacity: 1
    }
  };
  // Sort Table
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState(null);

  const onSort = (e) => {
    setSortField(e.sortField);
    setSortOrder(e.sortOrder);
  };
  const [shiftData, setShiftData] = useState([]);
  const fetchGetAdhocShiftTime = async () => {
    setIsSubmitting(true);
    if (!selFacility) {
      toastService.warn("Please select Facility");
      setIsSubmitting(false);
      return;
    }
    if (!type) {
      toastService.warn("Please select Trip Type");
      setIsSubmitting(false);
      return;
    }
    if (!shiftCategory) {
      toastService.warn("Please select Shift Category");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await ShiftTimeMasterAdhocService.GetAdhocShiftTime({
        facilityId: selFacility,
        TripType: type,
        Shifttype: shiftCategory
      });
      //console.log("GetAdhocShiftTime response:", response);
      const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
      if (!parsedData || parsedData.length === 0) {
        toastService.error("No records found");
        setShiftData([]); // clear table data
        return;
      }
      setShiftData(parsedData);
    } catch (error) {
      console.error("Error fetching Adhoc Shift Time:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAddShiftTime = async () => {
    setIsSubmitting(true);
    if (!selFacilityAdd) {
      toastService.warn("Please select Facility");
      setIsSubmitting(false);
      return;
    }
    if (!typeAdd) {
      toastService.warn("Please select Trip Type");
      setIsSubmitting(false);
      return;
    }
    if (!shiftCategoryAdd) {
      toastService.warn("Please select Shift Category");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await ShiftTimeMasterAdhocService.AddShiftTime({
        shiftTime: shiftTime,
        facilityId: selFacilityAdd,
        shiftType: shiftCategoryAdd,
        Day: "0",
        buffer: 0,
        type: typeAdd,
        DayLight: 0,
        WeekEndType: 0,
        ProcessIds: "0",
        UpdatedBy: Number(UserId),
        Zone: "",
      }); console.log("AddShiftTime response:", response);
      if (response === 1) {
        toastService.success("Shift Time added successfully");
        setAddAdhocSidebar(false);
        fetchGetAdhocShiftTime();
      } else if (response === 0) {
        toastService.warn("ShiftTime Already Exists!!!");
      }
    } catch (error) {
      console.error("Error fetching Adhoc Shift Time:", error);
    }
    finally {
      setIsSubmitting(false);
    }
  }
  const handleEditClick = (rowData) => {
  const selected = {
    ...rowData,
   Type: rowData.Type?.trim().toUpperCase() || "", // ensure no extra spaces
    Shifttype: rowData.Shifttype?.trim() || "Adhoc"
  };
  
  console.log("Selected row data for edit:", selected); // <-- this logs the exact object
  setSelectedShift(selected);
  setEditAdhocSidebar(true);
};
  const actionTemplate = (rowData, options) => {
    return (
      <>
        <Button
          label="Edit"
          //icon="pi pi-pencil"
          className="btn btn-outline-success btn-sm me-2"
          onClick={() => handleEditClick(rowData)}
        />
        <Button
          label="Delete"
          //icon="pi pi-trash"
          className="btn btn-outline-danger btn-sm btn-sm"
          onClick={() => handleDeleteClick(options.rowIndex)}
        />
      </>
    );
  };
  return (
    <div>
      {isSubmitting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="spinner-border text-primary"
            style={{ width: 60, height: 60, fontSize: 32 }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <Header
        pageTitle="Shift Time Master"
        showNewButton={true}
        onNewButtonClick={setAddAdhocSidebar}
      />
      <Sidebar />
      <ConfirmDialog />
      <div className="middle">
        {/* Filter Section */}
        <div className="card_tb p-3 mb-3">
          <div className="row">
            <div className="field col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <label className="form-label">Facility Name <span className="text-danger">*</span></label>
              <Dropdown className="w-100" placeholder="Select Facility" options={facility} value={selFacility} optionLabel="name"
                onChange={(e) => setSelFacility(e.value)} />
            </div>

            <div className="field col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <label className="form-label">Trip Type <span className="text-danger">*</span></label>
              <Dropdown className="w-100" placeholder="Select Type" options={TypeOptions} value={type}
                optionLabel="label" onChange={(e) => { setType(e.value) }} />
            </div>
            <div className="field col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <label className="form-label">Shift Category <span className="text-danger">*</span></label>
              <Dropdown className="w-100" placeholder="Select Category" optionLabel="label" options={ShiftCategoryOptions} value={shiftCategory} onChange={(e) => setShiftCategory(e.value)}
              />
            </div>
            <div className="field col-12 col-sm-6 col-md-4 col-lg-3 mb-3 no-label">
              <ReportButton label="Submit" onClick={fetchGetAdhocShiftTime} />
            </div>
          </div>
        </div>

        {/* DataTable Section */}
        {shiftData.length > 0 && (
          <div className="card_tb">
            <DataTable value={shiftData}
              scrollable
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSort}
              sortMode="single"
              removableSort
              paginator
              rows={50}
              emptyMessage="No records found"
              rowsPerPageOptions={[50, 100, 150, 200]} pt={customSortStyle}>
              <Column field="shiftTime" header="Shift Time"></Column>
              <Column field="Type" header="Shift Type"></Column>
              <Column field="facilityName" header="Facility Name"></Column>
              <Column field="Active" header="Active"></Column>
              <Column body={actionTemplate} header="Actions"></Column>
            </DataTable>
          </div>
        )}

      </div>
      <PrimeSidebar visible={addAdhocSidebar} position="right" onHide={() => setVisibleLeft(false)} width="50%" showCloseIcon={false} dismissable={false} style={{ width: '30%', backdropFilter: 'blur(8px)' }}>
        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
          <h6 className="sidebarTitle">Add Shift Time Master</h6>
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-text"
            onClick={() => setAddAdhocSidebar(false)} />
        </div>
        <div className="sidebarBody">
          <div className="row">
            <div className="field col-12 mb-3">
              <label>Shift Time</label>
              <InputText className="form-control" name="" placeholder="Shift Time" maxLength={4} onChange={(e) => {
                const value = e.target.value;
                const numericValue = value.replace(/\D/g, '');
                if (numericValue.length <= 4) {
                  e.target.value = numericValue;
                }
                setShiftTime(numericValue);
                // else {
                //   e.target.value = numericValue.slice(0, 4); // Limit to 4 characters
                // }
              }} />
            </div>
            <div className="field col-12 mb-3">
              <label>Shift Type</label>
              <Dropdown className="w-100" name="" placeholder="Shift Type" options={TypeOptionsAdd} value={typeAdd} onChange={(e) => setTypeAdd(e.value)} />
            </div>

            <div className="field col-12 mb-3">
              <label>Shift Category</label>
              <Dropdown optionLabel="label" placeholder="Select Shift Category" className="w-100" filter options={ShiftCategoryOptionsAdd} value={shiftCategoryAdd} onChange={(e) => setShiftCategoryAdd(e.value)} />
            </div>
            <div className="field col-12 mb-3">
              <label>Facility Name</label>
              <Dropdown optionLabel="name" placeholder="Select Facility Name" className="w-100" filter options={facilityAdd} value={selFacilityAdd} onChange={(e) => setSelFacilityAdd(e.value)} />
            </div>
          </div>
          {/* Fixed button container at bottom of sidebar */}
          <div className="sidebar-fixed-bottom">
            <div className="d-flex gap-3 justify-content-end">
              <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setAddAdhocSidebar(false)} />
              <Button label="Add" className="btn btn-success" onClick={handleAddShiftTime} />
            </div>
          </div>
        </div>
      </PrimeSidebar>
      <PrimeSidebar visible={EditAdhocSidebar} position="right" onHide={() => setVisibleLeft(false)} width="50%" showCloseIcon={false} dismissable={false} style={{ width: '30%', backdropFilter: 'blur(8px)' }}>
        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
          <h6 className="sidebarTitle">Edit Shift Time Master</h6>
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-text"
            onClick={() => setEditAdhocSidebar(false)} />
        </div>
        <div className="sidebarBody">
          {selectedShift && (
            <div className="row">
              <div className="field col-12 mb-3">
                <label>Shift Time</label>
                <InputText className="form-control" value={selectedShift.shiftTime}
                  onChange={(e) =>
                    setSelectedShift({ ...selectedShift, shiftTime: e.target.value })
                  } placeholder="Shift Time" />
              </div>
              <div className="field col-12 mb-3">
                <label>Shift Type</label>
                <Dropdown
                  className="w-100"
                  options={TypeOptionsEdit} 
                  optionLabel="label"
                  optionValue="value"
                  value={selectedShift?.Type}
                  onChange={(e) => {
                    console.log("Dropdown selected value:", e.value);
                    setSelectedShift({ ...selectedShift, Type: e.value })
                  }} />
              </div>
              {/* <div className="field col-12 mb-3">
              <label>Shift Category</label>
              <Dropdown optionLabel="name" placeholder="Select Shift Category" className="w-100" filter />
            </div> */}
              <div className="field col-12 mb-3">
                <label>Facility Name</label>
                <InputText
                  className="form-control"
                  value={selectedShift.facilityName}
                  readOnly
                />
              </div>
              <div className="field col-12 mb-3">
                <label>Active</label>
                <InputText
                  className="form-control"
                  value={selectedShift.Active ? "Active" : "Inactive"}
                  readOnly
                />
              </div>
            </div>
          )}
          {/* Fixed button container at bottom of sidebar */}
          <div className="sidebar-fixed-bottom">
            <div className="d-flex gap-3 justify-content-end">
              <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setEditAdhocSidebar(false)} />
              <Button label="Update" className="btn btn-success" />
            </div>
          </div>
        </div>
      </PrimeSidebar>
    </div>
  );
};
export default ShiftTimeMasterAdhoc;

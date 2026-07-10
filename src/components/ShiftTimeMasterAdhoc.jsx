import React, { use, useEffect, useState } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import MasterSidebar from "./Master/MasterSidebar";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { FileUpload } from "primereact/fileupload";
import { Checkbox } from "primereact/checkbox";
import AppConfirmDialog from "./common/AppConfirmDialog";
import CustomPaginator from "./common/CustomPaginator";
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
  const [typeAdd, setTypeAdd] = useState("");
  const [type, setType] = useState("");
  const ShiftCategoryOptions = [
    { label: "Adhoc", value: "Adhoc" },
    { label: "Emergency", value: "Emergency" },
  ];
  const [shiftCategoryAdd, setShiftCategoryAdd] = useState("");
  const [shiftCategory, setShiftCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ visible: false, rowIndex: null });
  const closeDeleteConfirm = () => setDeleteConfirm({ visible: false, rowIndex: null });
  const [shiftTime, setShiftTime] = useState("");
  useEffect(() => {
    fetchFacilities();
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
    setDeleteConfirm({ visible: true, rowIndex });
  };

  const handleDeleteConfirm = () => {
    const { rowIndex } = deleteConfirm;
    closeDeleteConfirm();
    const rowData = shiftData[rowIndex];
    if (rowData) {
      DeleteShiftTime(rowData.Id);
      toastService.success("Shift Time Master Deleted Successfully");
      fetchGetAdhocShiftTime();
    }
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

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

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
      setFirst(0); // Reset pagination on new search
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
    let mappedType = "";
    const lowerType = rowData.Type?.toLowerCase().trim() || "";
    if (lowerType === "pick" || lowerType === "p") mappedType = "P";
    else if (lowerType === "drop" || lowerType === "d") mappedType = "D";
    else if (lowerType === "both" || lowerType === "b") mappedType = "B";
    else mappedType = rowData.Type;

    const selected = {
      ...rowData,
      Type: mappedType,
      Shifttype: rowData.Shifttype?.trim() || "Adhoc"
    };
    
    console.log("Selected row data for edit:", selected);
    setSelectedShift(selected);
    setEditAdhocSidebar(true);
  };

  const handleUpdateShiftTime = async () => {
    setIsSubmitting(true);
    if (!selectedShift?.shiftTime) {
      toastService.warn("Please enter Shift Time");
      setIsSubmitting(false);
      return;
    }
    if (!selectedShift?.Type) {
      toastService.warn("Please select Shift Type");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await ShiftTimeMasterAdhocService.UpdateShiftTime({
        shiftTime: selectedShift.shiftTime,
        facilityId: selectedShift.FacilityId || selectedShift.facilityId || selFacility,
        shiftType: selectedShift.Shifttype || "Adhoc",
        Day: "0",
        ID: selectedShift.Id,
        buffer: 0,
        type: selectedShift.Type,
        DayLight: 0,
        WeekEndType: 0,
        ProcessIds: "0",
        UpdatedBy: Number(UserId),
        Zone: "",
      });
      console.log("UpdateShiftTime response:", response);
      if (response === 1) {
        toastService.success("Shift Time updated successfully");
        setEditAdhocSidebar(false);
        fetchGetAdhocShiftTime();
      } else if (response === 0) {
        toastService.warn("ShiftTime Update Failed or Already Exists!");
      } else {
        toastService.success("Shift Time updated successfully");
        setEditAdhocSidebar(false);
        fetchGetAdhocShiftTime();
      }
    } catch (error) {
      console.error("Error updating Adhoc Shift Time:", error);
    } finally {
      setIsSubmitting(false);
    }
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
      <AppConfirmDialog
        visible={deleteConfirm.visible}
        onHide={closeDeleteConfirm}
        title="Confirm Delete"
        variant="delete"
        message="Are you sure you want to delete this Shift Time Master?"
        onConfirm={handleDeleteConfirm}
      />
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
            <DataTable value={shiftData.slice(first, first + rows)}
              scrollable
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSort}
              sortMode="single"
              removableSort
              emptyMessage="No records found"
              pt={customSortStyle}>
              <Column field="shiftTime" header="Shift Time"></Column>
              <Column field="Type" header="Shift Type"></Column>
              <Column field="facilityName" header="Facility Name"></Column>
              <Column field="Active" header="Active"></Column>
              <Column body={actionTemplate} header="Actions"></Column>
            </DataTable>
            <CustomPaginator
              first={first}
              rows={rows}
              totalRecords={shiftData.length}
              onPageChange={onPageChange}
              rowsPerPageOptions={[50, 100, 150, 200]}
            />
          </div>
        )}

      </div>
      <MasterSidebar
        show={addAdhocSidebar}
        onClose={() => setAddAdhocSidebar(false)}
        title="Add Shift Time Master"
        width="30%"
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary",
            onClick: () => setAddAdhocSidebar(false),
          },
          {
            label: "Add",
            className: "btn btn-success",
            onClick: handleAddShiftTime,
          },
        ]}
      >
        <div className="p-3">
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
              <Dropdown className="w-100" name="" placeholder="Shift Type" options={TypeOptions} value={typeAdd} onChange={(e) => setTypeAdd(e.value)} />
            </div>

            <div className="field col-12 mb-3">
              <label>Shift Category</label>
              <Dropdown optionLabel="label" placeholder="Select Shift Category" className="w-100" filter options={ShiftCategoryOptions} value={shiftCategoryAdd} onChange={(e) => setShiftCategoryAdd(e.value)} />
            </div>
            <div className="field col-12 mb-3">
              <label>Facility Name</label>
              <Dropdown optionLabel="name" placeholder="Select Facility Name" className="w-100" filter options={facility} value={selFacilityAdd} onChange={(e) => setSelFacilityAdd(e.value)} />
            </div>
          </div>
        </div>
      </MasterSidebar>
      <MasterSidebar
        show={EditAdhocSidebar}
        onClose={() => setEditAdhocSidebar(false)}
        title="Edit Shift Time Master"
        width="30%"
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary",
            onClick: () => setEditAdhocSidebar(false),
          },
          {
            label: "Update",
            className: "btn btn-success",
            onClick: handleUpdateShiftTime,
          },
        ]}
      >
        <div className="p-3">
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
                  options={TypeOptions} 
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
        </div>
      </MasterSidebar>
    </div>
  );
};
export default ShiftTimeMasterAdhoc;

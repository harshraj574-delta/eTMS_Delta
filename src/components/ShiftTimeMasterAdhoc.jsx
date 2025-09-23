import React, { useEffect, useState } from "react";
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

const ShiftTimeMasterAdhoc = () => {
  const [addAdhocSidebar, setAddAdhocSidebar] = useState(false);
    const [EditAdhocSidebar, setEditAdhocSidebar] = useState(false);

     const handleSearchClick = () => {
        confirmDialog({
          message: "Are you sure? You want to Delete Shift Time Master.",
          header: "Confirmation",
          icon: "pi pi-exclamation-triangle",
          acceptClassName: "p-button-danger",
          accept: () => {
            // Logic after confirmation (e.g., delete action)
            console.log("User confirmed deletion");
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

  // Dummy data (API se aa sakti hai)
  const [shiftData, setShiftData] = useState([
    {
      shiftTime: "Morning Shift",
      startTime: "08:00 AM",
      endTime: "BLR",
      totalHours: "4 Hours",
      gracePeriod: "10 mins",
    },
    {
      shiftTime: "Evening Shift",
      startTime: "01:00 PM",
      endTime: "BLR",
      totalHours: "4 Hours",
      gracePeriod: "15 mins",
    },
  ]);

  // Action buttons render karne ke liye template
  const actionTemplate = (rowData) => {
    return (
      <>
        <Button
          label="Edit"
          //icon="pi pi-pencil"
          className="btn btn-primary btn-sm me-2"
            onClick={() => setEditAdhocSidebar(true)}
        />
        <Button
          label="Delete"
          //icon="pi pi-trash"
          className="btn btn-danger btn-sm"
            onClick={handleSearchClick}
        />
      </>
    );
  };

  return (
    <div>
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
            <div className="field col-2 mb-3">
              <label>Facility Name</label>
              <select className="form-select">
                <option>Select Facility</option>
              </select>
            </div>
            <div className="field col-2 mb-3">
              <label>Type</label>
              <select className="form-select">
                <option>Select Type</option>
                <option value="type3">Ad-hoc</option>
                <option value="type1">Emergency</option>
              </select>
            </div>
            <div className="field col-2 mb-3">
              <label>Type</label>
              <select className="form-select">
                <option>Select Type</option>
                <option value="type3">Both</option>
                <option value="type1">Pick</option>
                <option value="type2">Drop</option>
              </select>
            </div>
            <div className="field col-2 mb-3">
              <button className="btn btn-primary mt-4">Search</button>
            </div>
          </div>
        </div>

        {/* DataTable Section */}
        <div className="card_tb">
          <DataTable value={shiftData}
                                          scrollable
                                          sortField={sortField}
                                          sortOrder={sortOrder}
                                          onSort={onSort}
                                          sortMode="single"
                                          removableSort
                                          paginator
                                          rows={10}
                                          rowsPerPageOptions={[5, 10, 25, 50]} pt={customSortStyle}>
            <Column field="shiftTime" header="Shift Time"></Column>
            <Column field="startTime" header="Shift Type"></Column>
            <Column field="endTime" header="Faciltiy Name"></Column>
            <Column body={actionTemplate} header="Actions"></Column>
          </DataTable>
        </div>
      </div>


       <PrimeSidebar visible={addAdhocSidebar} position="right" onHide={() => setVisibleLeft(false)} width="50%" showCloseIcon={false} dismissable={false} style={{width:'30%', backdropFilter: 'blur(8px)'}}>
                              <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                                  <h6 className="sidebarTitle">Add Shift Time Master</h6>
                                  <Button 
            icon="pi pi-times" 
            className="p-button-rounded p-button-text" 
            onClick={() => setAddAdhocSidebar(false)}         />
                              </div>
                              <div className="sidebarBody">
                                  <div className="row">
                                      <div className="field col-12 mb-3">
                                          <label>Shift Time</label>
                                          <InputText className="form-control" name="" placeholder="Shift Time" />
                                      </div>
                                      <div className="field col-12 mb-3">
                                          <label>Shift Type</label>
                                          <InputText className="form-control" name="" placeholder="Shift Type" />
                                      </div>

                                      <div className="field col-12 mb-3">
                                          <label>Shift Category</label>
                                          <Dropdown optionLabel="name" placeholder="Select Shift Category" className="w-100" filter />
                                      </div>
                                      <div className="field col-12 mb-3">
                                          <label>Facility Name</label>
                                          <Dropdown optionLabel="name" placeholder="Select Facility Name" className="w-100" filter />
                                      </div>                                    
                                  </div>
                                  {/* Fixed button container at bottom of sidebar */}
                                  <div className="sidebar-fixed-bottom">
                                          <div className="d-flex gap-3 justify-content-end">
                                              <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setAddAdhocSidebar(false)} />
                                              <Button label="Add Save" className="btn btn-success" />
                                          </div>
                                      </div>
                              </div>
                          </PrimeSidebar>

                          <PrimeSidebar visible={EditAdhocSidebar} position="right" onHide={() => setVisibleLeft(false)} width="50%" showCloseIcon={false} dismissable={false} style={{width:'30%', backdropFilter: 'blur(8px)'}}>
                              <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
                                  <h6 className="sidebarTitle">Edit Shift Time Master</h6>
                                  <Button 
            icon="pi pi-times" 
            className="p-button-rounded p-button-text" 
            onClick={() => setEditAdhocSidebar(false)} />
                              </div>
                              <div className="sidebarBody">
                                  <div className="row">
                                      <div className="field col-12 mb-3">
                                          <label>Shift Time</label>
                                          <InputText className="form-control" name="" placeholder="Shift Time" />
                                      </div>
                                      <div className="field col-12 mb-3">
                                          <label>Shift Type</label>
                                          <InputText className="form-control" name="" placeholder="Shift Type" />
                                      </div>

                                      <div className="field col-12 mb-3">
                                          <label>Shift Category</label>
                                          <Dropdown optionLabel="name" placeholder="Select Shift Category" className="w-100" filter />
                                      </div>
                                      <div className="field col-12 mb-3">
                                          <label>Facility Name</label>
                                          <Dropdown optionLabel="name" placeholder="Select Facility Name" className="w-100" filter />
                                      </div>                                    
                                  </div>
                                  {/* Fixed button container at bottom of sidebar */}
                                  <div className="sidebar-fixed-bottom">
                                          <div className="d-flex gap-3 justify-content-end">
                                              <Button label="Cancel" className="btn btn-outline-secondary" onClick={() => setEditAdhocSidebar(false)} />
                                              <Button label="Save Changes" className="btn btn-success" />
                                          </div>
                                      </div>
                              </div>
                          </PrimeSidebar>

    </div>
  );
};

export default ShiftTimeMasterAdhoc;

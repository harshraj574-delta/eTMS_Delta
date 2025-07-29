import React, { useEffect, useState } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import ShiftTimeMasterService from "../services/compliance/ShiftTimeMaster";
import sessionManager from "../utils/SessionManager";
import { toastService } from "../services/toastService";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { Checkbox } from "primereact/checkbox";
import { MultiSelect } from 'primereact/multiselect';
import { Dialog } from 'primereact/dialog';


const userID = sessionManager.getUserSession().ID; // Replace with actual user id
const ShiftTimeMaster = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [tripType] = useState([

    { label: "Pick", value: 0 },
    { label: "Drop", value: 1 },

  ]);
  const [selectedTypeOptions] = useState([
    { label: "Both", value: "Both" },
    { label: "Standard", value: "Standard" },
    { label: "Adhoc", value: "Adhoc" },
  ]);
  const [selectedNewType, setSelectedNewType] = useState("Standard");
  const [tripTypeValue, setTripTypeValue] = useState(0);
  const [weekDayValue, setWeekDayValue] = useState(0);
  const [weekDay] = useState([
    { label: "Weekday", value: 0 },
    { label: "Weekend", value: 1 },
    { label: "Both", value: 2 },
  ]);
  const [selectedRows, setSelectedRows] = useState([]);
  // New
  const [selectedFacility, setSelectedFacility] = useState(1);
  const [facilities, setFacilities] = useState([]);

  const [selectedProcess, setSelectedProcess] = useState(0);
  const [processes, setProcesses] = useState([]);
  const [shiftData, setShiftData] = useState([]);
  const [processNew, setProcessNew] = useState([]);
  const [selectedProcessNew, setSelectedProcessNew] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const cities = [
  //   { name: 'New York', code: 'NY' },
  //   { name: 'Rome', code: 'RM' },
  //   { name: 'London', code: 'LDN' },
  //   { name: 'Istanbul', code: 'IST' },
  //   { name: 'Paris', code: 'PRS' }
  // ];
  const [checked, setChecked] = useState(false);
  const [checkedItemsDrop, setCheckedItemsDrop] = useState({});
  const [checkedDrop, setCheckedDrop] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const timesDrop = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timesDrop.push(time);
    }
  }
  // Divide times into rows of 3 items per row
  const rowsDrop = [];
  for (let i = 0; i < timesDrop.length; i += 3) {
    rowsDrop.push(timesDrop.slice(i, i + 3));
  }

  const toggleCheckboxDrop = (time) => {
    setCheckedItemsDrop((prev) => ({

      ...prev,
      [time]: !prev[time],

      // ...prev,
      // [time]: !prev[time],

      // const allChecked = Object.values(checkedItemsDrop).every(Boolean);
      // setCheckedDrop(allChecked);
      // return newItems;
    }));
  };

  const [checkedItems, setCheckedItems] = useState({});
  // Shift Times from 00:00 to 23:30 in 30 mins interval
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      times.push(time);
    }
  }

  // Divide times into rows of 3 items per row
  const rows = [];
  for (let i = 0; i < times.length; i += 3) {
    rows.push(times.slice(i, i + 3));
  }

  const toggleCheckbox = (time) => {
    setCheckedItems((prev) => ({
      ...prev,
      [time]: !prev[time],
    }));
  };

  // Status button template
  const statusBodyTemplate = (rowData) => {
    const isActive = rowData.Active === "Active" || rowData.Active === true || rowData.Active === 1;

    return (
      <Button
        label={isActive ? "Active" : "Deactive"}
        className={
          isActive
            ? "btn btn-outline-success btn-sm"
            : "btn btn-outline-danger btn-sm"
        }
        onClick={() => openStatusDialog(rowData)}
      />
    );
  };
  const openStatusDialog = (shift) => {
    setSelectedShift(shift);
    setShowStatusDialog(true);
  };

  const closeStatusDialog = () => {
    setShowStatusDialog(false);
    setSelectedShift(null);
  };
  const confirmStatusChange = async () => {
    if (!selectedShift) return;
    setIsLoading(true);
    try {
      const currentStatus = selectedShift.Active === "Active" || selectedShift.Active === true || selectedShift.Active === 1;
      const newStatus = currentStatus ? 1 : 0; // Toggle status
      const response = await ShiftTimeMasterService.UpdateShiftStatus({
        shiftid: selectedShift.Id,
        status: newStatus,
      });

      // Parse response if it's a string
      let parsedResponse = response;
      if (typeof response === "string") {
        parsedResponse = JSON.parse(response);
      }

      // Check RESULT field in the first element
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0 && parsedResponse[0].RESULT === 1) {
        toastService.success("Shift status updated successfully!");
        fetchShiftData(); // Refresh the data
      } else {
        toastService.error("Failed to update shift status");
      }

    } catch (error) {
      console.error("Error updating shift status:", error);
      toastService.error("An error occurred while updating shift status");
    } finally {
      setIsLoading(false);
      closeStatusDialog();
    }
  };

  // const confirmStatusChange = async () => {
  //   if (!selectedShift) return;
  //   setIsLoading(true);
  //   try {
  //     const currentStatus =
  //       selectedShift.Active === "Active" ||
  //       selectedShift.Active === true ||
  //       selectedShift.Active === 1;
  //     const newStatus = currentStatus ? 1 : 0;

  //     const response = await ShiftTimeMasterService.UpdateShiftStatus({
  //       shiftid: selectedShift.Id, // Corrected here
  //       status: newStatus,
  //     });

  //     let parsedResponse = typeof response === "string" ? JSON.parse(response) : response;

  //     if (Array.isArray(parsedResponse) && parsedResponse.length > 0 && parsedResponse[0].RESULT === 1) {
  //       toastService.success("Shift status updated successfully!");
  //     //    const formattedTripType = tripTypeValue === 0 ? "P" : "D";

  //     // // Format weekday value to string
  //     // const formattedWeekday = weekDayValue.toString();
  //     //   console.log("Refreshing shift data with:", {
  //     //     facilityid: selectedFacility,
  //     //   processid: selectedProcess,
  //     //   triptype: formattedTripType,
  //     //   weekday: formattedWeekday,
  //     //   });
  //       fetchShiftData(); // Refresh the data
  //     } else {
  //       toastService.error("Failed to update shift status");
  //     }
  //   } catch (error) {
  //     console.error("Error updating shift status:", error);
  //     toastService.error("An error occurred while updating shift status");
  //   } finally {
  //     setIsLoading(false);
  //     closeStatusDialog();
  //   }
  // };

  // Delete button template
  const deleteBodyTemplate = (rowData) => (
    <Button
      className="btn btn-sm btn-outline-danger"
      onClick={() => {
        alert(`Deleted shift for ${rowData.facilityName}`);
      }}
    >
      Delete
    </Button>
  );
  useEffect(() => {
    if (selectedFacility && selectedProcess !== undefined) {
      fetchShiftData();
    }
  }, [selectedFacility, selectedProcess, tripTypeValue, weekDayValue]);

  //  fetch Shift Data in Table
  // const fetchShiftData = async () => {
  //   try {
  //     // Format trip type value (0 -> "P", 1 -> "D")
  //     const formattedTripType = tripTypeValue === 0 ? "P" : "D";
  //     // Format weekday value to string
  //     const formattedWeekday = weekDayValue.toString();
  //     const response = await ShiftTimeMasterService.GetSelectedShiftTime({
  //       facilityid: selectedFacility,
  //       processid: selectedProcess,
  //       triptype: formattedTripType,
  //       weekday: formattedWeekday,
  //     });
  //     console.log("API Request Parameters:", {
  //       facilityid: selectedFacility,
  //       processid: selectedProcess,
  //       triptype: formattedTripType,
  //       weekday: formattedWeekday,
  //     });
  //     let parsedData = [];
  //     if (typeof response === 'string') {
  //       parsedData = JSON.parse(response);
  //     } else {
  //       parsedData = response;
  //     }
  //     console.log("API Response:", parsedData);
  //     const validateData = Array.isArray(parsedData) ? parsedData : [parsedData];
  //     setShiftData(validateData);
  //     if (validateData.length > 0) {
  //       toastService.success("Shift Data Fetched Successfully");
  //     } else {
  //       toastService.error("No Shift Data Found");
  //     }
  //   } catch (error) {
  //     console.error("Failed to fetch shift data:", error);
  //     toastService.error("Failed to fetch shift data");
  //   }
  // };
  const fetchShiftData = async () => {
    setIsSubmitting(true);
    try {
      const formattedTripType = tripTypeValue === 0 ? "P" : "D";
      const formattedWeekday = weekDayValue.toString();
      const response = await ShiftTimeMasterService.GetSelectedShiftTime({
        facilityid: selectedFacility,
        processid: selectedProcess,
        triptype: formattedTripType,
        weekday: formattedWeekday,
      });
      let parsedData = [];
      if (typeof response === 'string') {
        try {
          parsedData = JSON.parse(response);
        } catch (e) {
          parsedData = [];
        }
      } else {
        parsedData = response;
      }
      // Sometimes API returns object instead of array
      const validateData = Array.isArray(parsedData) ? parsedData : (parsedData ? [parsedData] : []);
      setShiftData(validateData);
      // No toast here, only on user action
    } catch (error) {
      console.error("Failed to fetch shift data:", error);
      setShiftData([]);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // Fetch facilities from API
  const fetchFacilities = async () => {
    try {
      const response = await ShiftTimeMasterService.SelectFacility({
        userid: userID,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
          label: item.facility || item.facilityName,
          value: item.Id,
        }))
        : [];
      setFacilities(formattedData);
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
    }
  };

  // Fetch Get Process from API
  const fetchGetProcess = async (facilityId) => {
    try {
      const response = await ShiftTimeMasterService.GetProcess({
        locationid: facilityId,
        empid: 0,
      });

      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;

      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
          label: item.processName,
          value: item.Id,
        }))
        : [];

      setProcesses(formattedData);
      setProcessNew(formattedData);
      //console.log("Processes:", formattedData);
    } catch (error) {
      console.error("Failed to fetch processes:", error);
    }
  };
  useEffect(() => {
    fetchFacilities();
    if (selectedFacility) {
      fetchGetProcess(selectedFacility);
    }
  }, [selectedFacility]);


  const handleNewButtonClick = () => {
    setSidebarVisible(true); // Show the PrimeSidebar
    // Reset form values
    setSelectedProcessNew([]);
    setCheckedItems({});
    setCheckedItemsDrop({});
    setChecked(false);
    setCheckedDrop(false);
    //const userFacilityId = sessionManager.getUserSession().FacilityID;
    //setSelectedloginfacility(userFacilityId);
    //setSelectedlogoutfacility(userFacilityId);
    // const offcanvasElement = document.getElementById("raise_Feedback");
    // if (offcanvasElement) {
    //   const offcanvas = new Offcanvas(offcanvasElement);
    //   offcanvas.show();
    // }
    // optional: resetFormValues();
  };
  // Function to refresh trip data

 const insertShiftTime = async () => {
  setIsSubmitting(true);
  try {
    // Validation: Process
    if (!selectedProcessNew || selectedProcessNew.length === 0) {
      toastService.error("Please select at least one process.");
      setIsSubmitting(false);
      return;
    }

    // Validation: Pick or Drop
    const hasDrop = timesDrop.some(time => checkedItemsDrop[time]);
    const hasPick = times.some(time => checkedItems[time]);

    if (!hasDrop && !hasPick) {
      toastService.error("Please select at least one pick or drop time.");
      setIsSubmitting(false);
      return;
    }

    // Prepare Payload
    const selectedDropTimes = Object.keys(checkedItemsDrop).filter(key => checkedItemsDrop[key]);
    const selectedPickTimes = Object.keys(checkedItems).filter(key => checkedItems[key]);
    const processIds = Array.isArray(selectedProcessNew)
      ? selectedProcessNew.map(p => (typeof p === "object" ? p.value : p))
      : [];

    const dropTimesStr = selectedDropTimes.join(",");
    const pickTimesStr = selectedPickTimes.join(",");
    const processIdsStr = processIds.join(",");

    const response = await ShiftTimeMasterService.UpdateShiftTimeGrid({
      FacilityId: selectedFacility,
      DropTimes: dropTimesStr,
      PickTimes: pickTimesStr,
      Day: weekDayValue.toString(),
      ProcessIds: processIdsStr,
      ZoneNames: null,
      WeekEndType: weekDayValue,
      Buffer: 0,
      UpdatedBy: Number(userID),
      ShiftType: selectedNewType,
    });

    //console.log("Shift Time Updated:", response);

    let parsedResponse = typeof response === "string" ? JSON.parse(response) : response;

    // Step 1: Check for Already Exist Message FIRST
    if (Array.isArray(parsedResponse) && parsedResponse.length === 1) {
      const firstItem = parsedResponse[0];
      if (typeof firstItem === "string" && firstItem.toLowerCase().includes("shift time already exist")) {
        toastService.warn(firstItem);
        setIsSubmitting(false);
        return;
      }
    }

    // Step 2: Success Check AFTER Already Exist Check
    if (
      (parsedResponse && parsedResponse.RESULT === 1) ||
      (Array.isArray(parsedResponse) && parsedResponse.length > 0 && typeof parsedResponse[0] !== "string")
    ) {
      setSidebarVisible(false);
      await fetchShiftData();
      toastService.success("Shift Time Updated Successfully");
    } else {
      toastService.error("Error Updating Shift Time");
    }

  } catch (error) {
    console.error("Error Updating Shift Time:", error);
    toastService.error("Error Updating Shift Time");
  } finally {
    setIsSubmitting(false);
  }
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
      <Header pageTitle="Shift Time Master" showNewButton={true} onNewButtonClick={handleNewButtonClick} />
      <Sidebar />
      <div className="middle">
        <div className="card_tb p-3">
          <div className="row">
            <div className="field col-3 mb-3">
              <label>Facility</label>
              <Dropdown
                id="facility"
                placeholder="Select Facility"
                className="w-100"
                filter
                options={facilities}
                value={selectedFacility}
                onChange={(e) => {
                  setSelectedFacility(e.value);
                  setSelectedProcess(0);
                  fetchGetProcess(e.value);
                  setShiftData([]);
                }}
              // defaultValue={1}
              />
            </div>
            <div className="field col-3 mb-3">
              <label>Process</label>
              <Dropdown
                id="process"
                placeholder="Select Process"
                className="w-100"
                filter
                options={processes}
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.value)}

              />
            </div>
            <div className="field col-3 mb-3">
              <label>Trip Type</label>
              <Dropdown
                placeholder="Select"
                className="w-100"
                value={tripTypeValue}
                options={tripType}
                onChange={(e) => setTripTypeValue(e.value)}
              />
            </div>
            <div className="field col-3 mb-3">
              <label>Day Type</label>
              <Dropdown
                placeholder="Select"
                className="w-100"
                value={weekDayValue}
                options={weekDay}
                onChange={(e) => setWeekDayValue(e.value)}
              />
            </div>
            {/* <div className="field col-2 mb-3 no-label">
              <Button
                label="Add New Shift Time"
                className="btn btn-primary"
                onClick={() => setSidebarVisible(true)}
              />

            </div> */}
          </div>
        </div>
        <div className="row">
          <div className="col-12 p-3">
            <div className="card_tb">
              <DataTable
                rows={50}
                rowsPerPageOptions={[50, 100, 150, 200]}
                value={shiftData}
                paginator
                className="p-datatable-sm"
                responsiveLayout="scroll"
                selection={selectedRows}
                onSelectionChange={(e) => setSelectedRows(e.value)}
              >
                {/* <Column
                  selectionMode="multiple"
                  headerStyle={{ width: "3em" }}
                /> */}
                <Column field="shiftTime" header="Shift" />
                <Column field="Type" header="Trip Type" />
                <Column field="facilityName" header="Facility" />
                <Column field="Day" header="Day Type" />
                <Column
                  field="Active"
                  header="Status"
                  body={statusBodyTemplate}
                  style={{ minWidth: "150px" }}
                />
                <Column
                  field=""
                  header="Delete"
                  body={deleteBodyTemplate}
                  style={{ minWidth: "100px", display: "none" }}
                />
              </DataTable>
            </div>
          </div>
        </div>
        <PrimeSidebar
          visible={sidebarVisible}
          onHide={() => setSidebarVisible(false)}
          position="right"
          style={{ width: "50%", backdropFilter: "blur(8px)" }}
          showCloseIcon={false}
          dismissable={false}
          id="raise_Feedback"
        >
          <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
            <h6 className="sidebarTitle">Add New Shift Time</h6>
            <span
              className="material-icons me-3"
              style={{ cursor: "pointer" }}
              onClick={() => setSidebarVisible(false)}
            >
              close
            </span>
          </div>
          <div className="sidebarBody p-3">
            <div className="row">
              <div className="col-3 mb-3">
                <label>Process</label>
                <MultiSelect
                  value={selectedProcessNew}
                  onChange={(e) => setSelectedProcessNew(e.value)}
                  options={processNew}
                  optionLabel="label"
                  placeholder="Select Process"
                  maxSelectedLabels={3}
                  className="w-100"
                />
              </div>
              <div className="col-3 mb-3">
                <label>Type</label>
                <Dropdown
                  options={selectedTypeOptions}
                  value={selectedNewType}
                  onChange={(e) => setSelectedNewType(e.value)}
                  placeholder="Select Shift Time"
                  className="w-100"
                />
              </div>
              <div className="col-6"></div>
              <div className="col-6">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr className="table-dark">
                      <th colSpan={3}>
                        {" "}
                        <Checkbox
                          onChange={(e) => {
                            setChecked(e.checked);
                            const newCheckedItems = {};
                            times.forEach(time => {
                              newCheckedItems[time] = e.checked;
                            })
                            setCheckedItems(newCheckedItems);
                          }} checked={checked}
                          className="me-2"
                        ></Checkbox>{" "}
                        Shift Time Pick
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        {row.map((time) => (
                          <td key={time}>
                            <Checkbox
                              onChange={() => toggleCheckbox(time)}
                              checked={!!checkedItems[time]}
                              className="me-2"
                            />
                            {time}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="col-6">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr className="table-dark">
                      <th colSpan={3}>
                        {" "}
                        <Checkbox
                          onChange={(e) => {
                            setCheckedDrop(e.checked);
                            // Update all drop checkboxes
                            const newCheckedItems = {};
                            timesDrop.forEach(time => {
                              newCheckedItems[time] = e.checked;
                            });
                            setCheckedItemsDrop(newCheckedItems);
                          }}
                          checked={checkedDrop}
                          className="me-2"
                        ></Checkbox>{" "}
                        Shift Time Drop
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        {row.map((time) => (
                          <td key={time}>
                            <Checkbox
                              onChange={() => toggleCheckboxDrop(time)}
                              checked={!!checkedItemsDrop[time]}
                              className="me-2"
                            />
                            {time}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="sidebar-fixed-bottom position-absolute pe-3">
            <div className="d-flex gap-3 justify-content-end">
              <Button
                label="Cancel"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSidebarVisible(false);
                }}
              />
              <Button label="Save" className="btn btn-success" onClick={insertShiftTime} />
            </div>
          </div>
        </PrimeSidebar>
        <Dialog
          visible={showStatusDialog}
          onHide={closeStatusDialog}
          header="Confirmation"
          modal
          footer={
            <>
              <Button
                label="Cancel"
                onClick={closeStatusDialog}
                className="btn btn-outline-dark"
              />
              <Button
                label="OK"
                onClick={confirmStatusChange}
                disabled={isLoading}
                className="btn btn-primary ms-3"
              />
            </>
          }
        >
          <p>
            Are you sure you want to {selectedShift && (selectedShift.Active === "Active" || selectedShift.Active === true || selectedShift.Active === 1) ? "Deactivate" : "Activate"} the shift for {selectedShift?.shiftTime}?
          </p>
        </Dialog>
      </div>
    </div>
  );
};



export default ShiftTimeMaster;

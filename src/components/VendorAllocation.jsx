import React, { useState } from "react";
import { useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import CostMasterService from "../services/compliance/CostMasterService";
import sessionManager from "../utils/SessionManager.js";
import { vendorAllocationService } from "../services/compliance/VendorAllocationService.js";

const VendorAllocation = () => {
  const [selectdate, setSelectDate] = useState(new Date());
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(1);
  const userID = sessionManager.getUserSession().ID;
  const [tripType] = useState([
    {
      label: "Pickup",
      value: "P",
    },
    {
      label: "Drop",
      value: "D",
    },
  ]);
  const [selectedTripType, setSelectedTripType] = useState("P");
  const [shiftTimeOptions, setShiftTimeOptions] = useState([]);
  const [selectedShiftTime, setSelectedShiftTime] = useState("");
  useEffect(() => {
    fetchFacilities();
    fetchShiftTimeByFacility();
    fetchShiftTimeByFacility(selectedFacility);
    setSelectedShiftTime(""); // facility/trip type change pe reset

  }, [selectedFacility, selectedTripType]);

  // Dummy data for DataTable
  const dummyData = [
    {
      id: 1,
      shiftDate: "2024-07-01",
      facility: "Facility A",
      tripType: "Pickup",
      shiftTime: "09:00",
      vendor: "Vendor X",
    },
    {
      id: 2,
      shiftDate: "2024-07-02",
      facility: "Facility B",
      tripType: "Drop",
      shiftTime: "18:00",
      vendor: "Vendor Y",
    },
    {
      id: 3,
      shiftDate: "2024-07-03",
      facility: "Facility C",
      tripType: "Pickup",
      shiftTime: "10:00",
      vendor: "Vendor Z",
    },
    {
      id: 4,
      shiftDate: "2024-07-04",
      facility: "Facility D",
      tripType: "Drop",
      shiftTime: "19:00",
      vendor: "Vendor X",
    },
    {
      id: 5,
      shiftDate: "2024-07-05",
      facility: "Facility E",
      tripType: "Pickup",
      shiftTime: "08:30",
      vendor: "Vendor Y",
    },
    {
      id: 6,
      shiftDate: "2024-07-06",
      facility: "Facility F",
      tripType: "Drop",
      shiftTime: "17:30",
      vendor: "Vendor Z",
    },
    {
      id: 7,
      shiftDate: "2024-07-07",
      facility: "Facility G",
      tripType: "Pickup",
      shiftTime: "07:45",
      vendor: "Vendor X",
    },
    {
      id: 8,
      shiftDate: "2024-07-08",
      facility: "Facility H",
      tripType: "Drop",
      shiftTime: "20:00",
      vendor: "Vendor Y",
    },
    {
      id: 9,
      shiftDate: "2024-07-09",
      facility: "Facility I",
      tripType: "Pickup",
      shiftTime: "06:30",
      vendor: "Vendor Z",
    },
    {
      id: 10,
      shiftDate: "2024-07-10",
      facility: "Facility J",
      tripType: "Drop",
      shiftTime: "21:00",
      vendor: "Vendor X",
    },
  ];

  // Vendor options for dropdown
  const vendorOptions = [
    { label: "Vendor X", value: "Vendor X" },
    { label: "Vendor Y", value: "Vendor Y" },
    { label: "Vendor Z", value: "Vendor Z" },
  ];

  // State for table data
  const [tableData, setTableData] = React.useState(dummyData);
  // Fetch facilities from API
  const fetchFacilities = async () => {
    try {
      const response = await CostMasterService.SelectFacility({
        Userid: userID,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
          label: item.facility || item.facilityName, // Using facility or facilityName from your API response
          value: item.Id, // Using Id from your API response
        }))
        : [];
      setFacilities(formattedData);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    }
  };
  //Fetch Shift Time by Facility 
  const fetchShiftTimeByFacility = async () => {
    try {
      const response = await vendorAllocationService.GetShiftByFacilityType({
        facid: selectedFacility,
        type: selectedTripType,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
        const formattedData = parsedResponse.map((item) => ({
          name: item.shiftTime, // Assuming shiftTime is the field you want to display
          value: item.shiftTime, // Assuming shiftTime is the field you want to use as value
        }));
        setShiftTimeOptions(formattedData);
        console.log("Shift times fetched successfully:", formattedData);
        // Update the Shift Time dropdown options here
      } else {
        console.warn("No shift times found for the selected facility and trip type.");
      }
    }
    catch (error) {
      console.error("Error fetching shift time by facility:", error);
    }
  };
  return (
    <div>
      {/* <h2>Vendor Allocation</h2> */}
      {/* Yahan aap vendor allocation ka form, table ya controls add kar sakte hain */}
      <Header
        pageTitle="Vendor Allocation"
        showNewButton={false}
        onNewButtonClick={() => setAddNewCost(false)}
      />
      <Sidebar />

      <div className="middle">
        <div className="card_tb p-3">
          <div className="row">
            <div className="field col-2 mb-3">
              <label>Shift Date</label>
              <Calendar
                className="w-100"
                name="shiftDate"
                placeholder="Shift Date"
                dateFormat="dd-mm-yy"
                onChange={(e) => setSelectDate(e.value)}
                value={selectdate}
              />
            </div>

            <div className="field col-2 mb-3">
              <label>Facility Name</label>
              <Dropdown
                options={facilities}
                placeholder="Select Facility"
                className="w-100"
                filter
                value={selectedFacility}
                onChange={(e) => {
                  setSelectedFacility(e.value);
                  // setSelectedShiftTime(""); // Reset shift time when facility changes
                  fetchShiftTimeByFacility();
                }}
              />
            </div>
            <div className="field col-2 mb-3">
              <label>Trip Type</label>
              <Dropdown
                options={tripType}
                value={selectedTripType}
                onChange={(e) => setSelectedTripType(e.value)}
                placeholder="Select Trip Type"
                className="w-100"
                filter
              />
            </div>
            <div className="field col-2 mb-3">
              <label>Shift Time</label>
              <Dropdown
                options={shiftTimeOptions}
                optionLabel="name" // Assuming shiftTime is the field you want to display
                onChange={(e) => setSelectedShiftTime(e.value)}
                placeholder="Select Shift Time"
                value={selectedShiftTime}
                className="w-100"
                filter
              />
            </div>
            <div className="field col-2 mb-3 no-label">
              <Button
                label="Show"
                className="btn btn-primary"
                onClick={() => handleUpdateVendor()}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3 d-flex justify-content-between align-items-center">
              <ul className="vendor_info">
                <li>
                  <small>Total Routes</small> 50
                </li>
                <li>
                  <small>Total Employees</small> 212
                </li>
                <li>
                  <small>Delta</small> 01
                </li>
              </ul>
              <button className="btn btn-primary">
                <span className="material-icons me-2">save</span> Save All
              </button>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-12 p-3 pt-0">
            <div className="card_tb">
              <DataTable
                value={tableData}
                paginator
                rows={10}
                className="p-datatable-sm"
                responsiveLayout="scroll"
              >
                <Column field="shiftDate" header="Shift Date" />
                <Column field="facility" header="Facility" />
                <Column field="tripType" header="Trip Type" />
                <Column field="shiftTime" header="Shift Time" />
                <Column
                  field="vendor"
                  header="Vendor"
                  style={{ minWidth: "160px", maxWidth: "200px", width: "180px" }}
                  body={(rowData) => (
                    <Dropdown
                      value={rowData.vendor}
                      options={vendorOptions}
                      onChange={(e) => {
                        const updated = tableData.map((row) =>
                          row.id === rowData.id ? { ...row, vendor: e.value } : row
                        );
                        setTableData(updated);
                      }}
                      placeholder="Select Vendor"
                      className="w-100"
                      style={{ minWidth: "120px" }}
                    />
                  )}
                />
              </DataTable>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col text-end">
            <button className="btn btn-primary">
              <span className="material-icons me-2">save</span> Save All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAllocation;

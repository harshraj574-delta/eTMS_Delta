import React, { use, useState } from "react";
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
import { toastService } from "../services/toastService.js";


const VendorAllocation = () => {
  const [selectdate, setSelectDate] = useState(new Date());
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(1);
  const userID = sessionManager.getUserSession().ID;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchData, setFetchData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [routeStatistics, setRouteStatistics] = useState({
    TotalRoutes: 0,
    TotalEmps: 0,
  });
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
  const [assignedVendorCounts, setAssignedVendorCounts] = useState([]);
  const [isDataShown, setIsDataShown] = useState(false);
  const isBackDate = selectdate && new Date(selectdate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  useEffect(() => {
    fetchFacilities();
    fetchShiftTimeByFacility();
    fetchShiftTimeByFacility(selectedFacility);
    setSelectedShiftTime(""); // facility/trip type change pe reset

  }, [selectedFacility, selectedTripType]);
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
      toastService.error("Error fetching facilities:", error);
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
        //console.log("Shift times fetched successfully:", formattedData);
        // Update the Shift Time dropdown options here
      } else {
        toastService.warn("No shift times found for the selected facility and trip type.");
      }
    }
    catch (error) {
      toastService.error("Error fetching shift time by facility:", error);
    }
  };
  const handleShowData = async () => {
    setIsSubmitting(true);
    setIsDataShown(true);
    if (!selectedShiftTime) {
      toastService.warn("Please select a shift time.");
      setIsSubmitting(false);
      setIsDataShown(false);
      return;
    }
    // Format date as "M/D/YYYY"
    const formatDate = (dateObj) => {
      const date = new Date(dateObj);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    const formattedDate = formatDate(selectdate);

    try {
      const response = await vendorAllocationService.GetRoutesByOrder({
        sDate: formattedDate,
        eDate: formattedDate,
        FacilityID: selectedFacility,
        TripType: selectedTripType,
        Shifttimes: selectedShiftTime,
        OrderBy: "Location",
        Direction: "ASC",
        Routeid: 0,
        occ_seater: "",
      });

      let parsedData = typeof response === "string" ? JSON.parse(response) : response;

      if (!parsedData || parsedData.length === 0) {
        toastService.error("No record found.");
        setFetchData([]);
        setIsDataShown(false);
        return;
      }

      // Restore vendor mapping from localStorage
      const vendorMap = JSON.parse(localStorage.getItem("routeVendorMap") || "{}");
      parsedData = parsedData.map((row, index) => ({
        ...row,
        vendor: vendorMap[row.RouteID] || row.vendor || null,
        _rowIndex: index,
      }));
      setFetchData(parsedData);
      await fetchVendors(); // Make sure this is awaited
      await GetRoutesStatistics();
    } catch (error) {
      setFetchData([]);
      setIsDataShown(false);
      toastService.error("Error fetching routes by order:", error);
    } finally {
      setIsSubmitting(false);
      await fetchAssignedVendorCounts(); // Refresh assigned vendor counts after fetching data
    }
  };

  const GetRoutesStatistics = async () => {
    setIsSubmitting(true);
    if (!selectedShiftTime) {
      setRouteStatistics({ TotalRoutes: 0, TotalEmps: 0 });
      return;
    }
    const formatDate = (dateObj) => {
      const date = new Date(dateObj);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    const formattedDate = formatDate(selectdate);

    try {
      const response = await vendorAllocationService.GetRoutesStatistics({
        sdate: formattedDate,
        edate: formattedDate,
        triptype: selectedTripType,
        facilityid: selectedFacility,
        shifttime: selectedShiftTime,
      });

      let parsedData = typeof response === "string" ? JSON.parse(response) : response;

      console.log("Parsed Route Statistics", parsedData);
      const stat = Array.isArray(parsedData) && parsedData.length > 0 ? parsedData[0] : {};

      setRouteStatistics({
        TotalRoutes: stat.TotalRoutes ?? 0,
        TotalEmps: stat.TotalEmps ?? 0,
      });


    } catch (error) {
      toastService.error("Error fetching routes statistics:", error);
      setRouteStatistics({ TotalRoutes: 0, TotalEmps: 0 });
      setIsDataShown(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (selectedFacility) {
      fetchVendors();
    }
  }, [selectedFacility]);
  //Fetch Vendors
  const fetchVendors = async () => {
    try {
      const response = await CostMasterService.GetVendorByFac({
        facilityid: selectedFacility,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
          label: item.vendor || item.vendorName, // Using facility or facilityName from your API response
          value: item.Id, // Using Id from your API response
        }))
        : [];
      setVendors([{ label: "-Select Vendors-", value: 0 }, ...formattedData]);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };
  const handleSaveAll = async () => {
    setIsSubmitting(true);
    try {
      // Save mapping in localStorage
      const vendorMap = fetchData.reduce((acc, row) => {
        if (row.vendor && row.vendor !== 0) acc[row.RouteID] = row.vendor;
        return acc;
      }, {});
      localStorage.setItem("routeVendorMap", JSON.stringify(vendorMap));

      for (const row of fetchData) {
        if (!row.vendor || row.vendor === 0) continue;
        const params = {
          RouteID: row.RouteID,
          VendorID: row.vendor,
          vehicletype: "0",
          vehicleID: "0",
          vehicleno: "",
          drivername: "",
          driverContact: "",
          actTotalstops: 0,
          actStarttime: "01/01/2014",
          actEndtime: "01/01/2014",
          routeno: "0",
          isActual: 0,
          delayreason: "",
          userid: userID,
          GuardID: 0,
          Isadmin: sessionManager.getUserSession().Isadmin,
          DriverId: 0,
        };
        try {
          await vendorAllocationService.AssignStickerToRoutes(params);
        } catch (err) {
          toastService.error(`Error saving for RouteID ${row.RouteID}`);
        }
      }
      toastService.success("All data saved successfully!");
    } catch (error) {
      toastService.error("Error saving data!");
    } finally {
      setIsSubmitting(false);
      await fetchAssignedVendorCounts(); // Refresh assigned vendor counts after saving
    }
  };
  // Vendor count fetch function
  const fetchAssignedVendorCounts = async () => {
    try {
      const formatDate = (dateObj) => {
        const date = new Date(dateObj);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };
      const formattedDate = formatDate(selectdate);

      let response = await vendorAllocationService.GetAssignedVendorCount({
        sdate: formattedDate,
        edate: formattedDate,
        facilityid: selectedFacility,
        triptype: selectedTripType,
        shifttimes: selectedShiftTime,
      });
      // Parse if string
      if (typeof response === "string") {
        response = JSON.parse(response);
      }
      console.log("Assigned Vendor Counts Response:", response);
      setAssignedVendorCounts(Array.isArray(response) ? response : []);
    } catch (error) {
      setAssignedVendorCounts([]);
      toastService.error("Error fetching assigned vendor counts");
    }
  };
  return (
    <div>
      {/* <h2>Vendor Allocation</h2> */}
      {/* Yahan aap vendor allocation ka form, table ya controls add kar sakte hain */}
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
                onClick={() => handleShowData()}
              />
            </div>
          </div>
        </div>
        {isDataShown && (
          <>
            <div className="row">
              <div className="col-12">
                <div className="card_tb p-3 d-flex justify-content-between align-items-center">
                  <ul className="vendor_info">
                    <li>
                      <small>Total Routes-</small> {routeStatistics?.TotalRoutes ?? 0},
                    </li>
                    <li>
                      <small>Total Employees-</small> {routeStatistics?.TotalEmps ?? 0},
                    </li>
                    {/* Vendor count list */}
                    {assignedVendorCounts.filter((v) => v.AssignedVendor > 0).length > 0 ? (
                      assignedVendorCounts
                        .filter((v) => v.AssignedVendor > 0)
                        .map((v, i) => (
                          <li key={i}>
                            <small>{v.vendor}-</small> {v.AssignedVendor}
                          </li>
                        ))
                    ) : null}
                  </ul>
                  <button className="btn btn-primary" onClick={handleSaveAll} >
                    <span className="material-icons me-2">save</span> Save All
                  </button>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-12 p-3 pt-0">
                <div className="card_tb">
                  <DataTable
                    value={fetchData}
                    className="p-datatable-sm"
                    responsiveLayout="scroll"
                    emptyMessage="No data found"
                  >
                    <Column field="RouteID" header="RouteID" sortable />
                    <Column field="ZONE" header="Zone" />
                    <Column field="Location" header="Location" />
                    <Column field="totalStop" header="Total Stop" sortable />
                    <Column field="PlanVehicleType" header="Planned Vehicle" />
                    <Column
                      field="vendor"
                      header="Vendor"
                      style={{ minWidth: "160px", maxWidth: "200px", width: "180px" }}
                      body={(rowData) => (
                        <Dropdown
                          value={rowData.vendor ?? null}
                          options={vendors}
                          onChange={(e) => {
                            // Row index ya unique ID se update karein
                            setFetchData((prev) =>
                              prev.map((row, idx) =>
                                idx === rowData._rowIndex
                                  ? { ...row, vendor: e.value }
                                  : row
                              )
                            );
                          }}
                          placeholder="Select Vendor"
                          className="w-100"
                          disabled={isBackDate}
                        />
                      )}
                    />

                  </DataTable>
                  {/* ✅ Show total count */}
                  <div className="mt-2 text-start">

                    Showing {fetchData.length} of {fetchData.length} entries
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col text-end">
                <button className="btn btn-primary" onClick={handleSaveAll} disabled={isBackDate}>
                  <span className="material-icons me-2">save</span> Save All
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorAllocation;

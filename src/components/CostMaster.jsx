import React, { useState, useEffect, useMemo, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import sessionManager from "../utils/SessionManager";
import CostMasterService from "../services/compliance/CostMasterService";
import { toastService } from "../services/toastService";
import { set } from "lodash";
import { CustomDataTable } from "./common/CustomDataTable";
import TableToolbar from "./common/TableToolbar";
import { ToastContainer } from "react-toastify";
import noReportImage from "../assets/no_report.png";

const CostMaster = () => {
  // Separate states for different dropdowns
  const [facilities, setFacilities] = useState([]);
  const [vendors, setVendors] = useState([
    { label: "-All Vendors-", value: 0 },
  ]);
  const [acCost, setAcCost] = useState("");
  const [acCostError, setAcCostError] = useState("");
  const [nonAcCost, setNonAcCost] = useState("");
  const [nonAcCostError, setNonAcCostError] = useState("");
  const [fuelRate, setFuelRate] = useState("");
  const [fuelRateError, setFuelRateError] = useState("");
  const [guardRate, setGuardRate] = useState("");
  const [guardRateError, setGuardRateError] = useState("");
  const [editRowData, setEditRowData] = useState(null);
  const [editAcCost, setEditAcCost] = useState("");
  const [editNonAcCost, setEditNonAcCost] = useState("");
  const [editFuelRate, setEditFuelRate] = useState("");
  const [editGuardRate, setEditGuardRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({
    // Add default filter keys here if needed
  });
  const op = useRef(null);
  const filterButtonRef = useRef(null);
  const [showTable, setShowTable] = useState(false);

  const validateAcCost = (value) => {
    if (!value) {
      setAcCostError("Enter New Ac Cost");
      return false;
    }
    if (!/^[1-9]\d*(\.\d{1,2})?$/.test(value)) {
      setAcCostError("Enter Valid Cost");
      return false;
    }
    const numericValue = parseFloat(value);
    if (numericValue < 0 || numericValue > 99999) {
      setAcCostError("Please Enter the Numeric Value between 0 and 99999");
      return false;
    }
    setAcCostError("");
    return true;
  };
  const validateNonAcCost = (value) => {
    if (!value) {
      setNonAcCostError("Enter New Non Ac Cost");
      return false;
    }
    if (!/^[1-9]\d*(\.\d{1,2})?$/.test(value)) {
      setNonAcCostError("Enter Valid Cost");
      return false;
    }
    const numericValue = parseFloat(value);
    if (numericValue < 0 || numericValue > 99999) {
      setNonAcCostError("Please Enter the Numeric Value between 0 and 99999");
      return false;
    }
    setNonAcCostError("");
    return true;
  };

  const validateFuelRate = (value) => {
    if (!value) {
      setFuelRateError("Enter Fuel Rate");
      return false;
    }
    if (!/^[0-9]\d*(\.\d{1,2})?$/.test(value)) {
      setFuelRateError("Enter Valid Fuel Rate");
      return false;
    }
    const numericValue = parseFloat(value);
    if (numericValue < 0 || numericValue > 999999) {
      setFuelRateError("Please Enter the Numeric Value between 0 and 999999");
      return false;
    }
    setFuelRateError("");
    return true;
  };
  const validateGuardRate = (value) => {
    if (!value) {
      setGuardRateError("Enter Guard Rate.");
      return false;
    }
    if (!/^[1-9]\d*(\.\d{1,2})?$/.test(value)) {
      setGuardRateError("Enter Valid Guard Rate.");
      return false;
    }
    const numericValue = parseFloat(value);
    if (numericValue < 0 || numericValue > 999999) {
      setGuardRateError("Please Enter the Numeric Value in Guard Rate.");
      return false;
    }
    setGuardRateError("");
    return true;
  };

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [vehicleTypes] = useState([
    { label: "-All-", value: 0 },
    { label: "4 Seater", value: 1 },
    { label: "6 Seater", value: 2 },
  ]);
  const [vehicleTypesNew] = useState([
    { label: "-All-", value: 0 },
    { label: "4 Seater", value: 1 },
    { label: "6 Seater", value: 2 },
  ]);
  const [routestypes] = useState([
    { label: "-All-", value: 0 },
    { label: "Front", value: "N" },
    { label: "Back-to-Back", value: "B" },
  ]);
  const [routestypesNew] = useState([
    { label: "-All-", value: 0 },
    { label: "Front", value: "N" },
    { label: "Back-to-Back", value: "B" },
  ]);
  const [zones, setZones] = useState([{ label: "-All Zones-", value: 0 }]); // Initialize costData as an empty array instead of undefined
  const [costData, setCostData] = useState([]);
  const [vendorsNew, setVendorsNew] = useState([]);
  const [zonesNew, setZonesNew] = useState([]);

  // Selected values
  const [selectedFacility, setSelectedFacility] = useState(1);
  const [selectedFacilityNew, setSelectedFacilityNew] = useState(1);
  const [selectedVendor, setSelectedVendor] = useState(0);
  const [selectedVendorNew, setSelectedVendorNew] = useState(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [selectedVehicleTypeNew, setSelectedVehicleTypeNew] = useState(null);
  const [selectedZone, setSelectedZone] = useState(0);
  const [selectedZoneNew, setSelectedZoneNew] = useState(null);
  const [selectedRouteType, setSelectedRouteType] = useState(null);
  const [selectedRouteTypeNew, setSelectedRouteTypeNew] = useState(null);
  // State for loading and error handling for datatable and add new cos
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [AddNewCost, setAddNewCost] = useState(false);
  const [EditNewCost, setEditNewCost] = useState(false);
  const UserID = sessionStorage.getItem("ID");

  const dt = useRef(null);
  useEffect(() => {
    fetchFacilities();
    fetchZones();
    if (selectedFacility) {
      fetchVendors();
    }
    setSelectedVendor(null);
  }, [selectedFacility]);
  useEffect(() => {
    fetchZonesForNewCost(selectedFacilityNew);
    if (selectedFacilityNew) {
      fetchVendorsForNewCost(selectedFacilityNew); // For Add New Cost sidebar
    }
  }, [selectedFacilityNew]);
  // Separate fetch function for Add New Cost sidebar
  const fetchVendorsForNewCost = async (facilityId) => {
    try {
      const response = await CostMasterService.GetVendorByFac({
        facilityid: facilityId,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.vendor || item.vendorName,
            value: item.Id,
          }))
        : [];
      setVendorsNew(formattedData); // New state for Add New Cost vendors
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };
  const fetchZonesForNewCost = async (facilityId) => {
    try {
      const response = await CostMasterService.SelectZoneByFac({
        facilityid: facilityId,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.zone || item.zoneName, // Using facility or facilityName from your API response
            value: item.id, // Using Id from your API response
          }))
        : [];
      setZonesNew(formattedData); // New state for Add New Cost zones
      setLoading(false);
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };
  //Fetch Facilities
  const fetchFacilities = async () => {
    try {
      const response = await CostMasterService.SelectFacility({
        Userid: UserID,
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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    }
  };
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
      setVendors([{ label: "-All Vendors-", value: 0 }, ...formattedData]); // <-- Array, not object
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };
  //Fetch Zones
  const fetchZones = async () => {
    try {
      const response = await CostMasterService.SelectZoneByFac({
        facilityid: selectedFacility,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.zone || item.zoneName, // Using facility or facilityName from your API response
            value: item.id, // Using Id from your API response
          }))
        : [];
      setZones([{ label: "-All Zones-", value: 0 }, ...formattedData]); // <-- Array, not object
      setLoading(false);
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };
  // Function to handle adding new cost
  const AddNewCostHandler = () => {
    setIsSubmitting(true);
    // Validate all fields before allowing to add new cost
    const isAcCostValid = validateAcCost(acCost);
    const isNonAcCostValid = validateNonAcCost(nonAcCost);
    const isFuelRateValid = validateFuelRate(fuelRate);
    const isGuardRateValid = validateGuardRate(guardRate);
    if (
      !isAcCostValid ||
      !isNonAcCostValid ||
      !isFuelRateValid ||
      !isGuardRateValid
    ) {
      toastService.error("Please fill all required fields correctly.");
      setIsSubmitting(false);

      return;
    }
    // Proceed with adding new cost
    const params = {
      effectiveDate: selectedDate,
      newrate: acCost,
      vehicleTypeID: selectedVehicleTypeNew,
      facilityid: selectedFacilityNew,
      userid: UserID,
      routetype: selectedRouteTypeNew,
      NonAcCost: parseFloat(nonAcCost),
      vehicleStatus: 0,
      fuelrate: parseFloat(fuelRate),
      guardCost: parseFloat(guardRate),
      zone: selectedZoneNew,
      vendorid: selectedVendorNew,
      fueltype: "0",
    };
    CostMasterService.AddNewCost(params)
      .then((response) => {
        //console.log("AddNewCost response:", response);
        if (response) {
          toastService.success("Cost added successfully");
          setAddNewCost(false);
          //handleasearch(); // Refresh the data after adding new cost
        } else {
          toastService.error("Failed to add cost");
        }
      })
      .catch((error) => {
        console.error("Error adding new cost:", error);
        toastService.error("Error adding new cost");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleSearch = async () => {
    setIsSubmitting(true);
    setLoading(true);
    const params = {
      vendorid: selectedVendor,
      vehicletype: selectedVehicleType,
      facilityid: selectedFacility,
      routetype: selectedRouteType,
      vehicleStatus: 0,
      zone: selectedZone,
      fueltype: "0",
    };
    try {
      const response = await CostMasterService.GetCost(params);
      //console.log("GetCost", response);
      let parsedData = [];
      if (typeof response === "string") {
        parsedData = JSON.parse(response);
      } else {
        parsedData = response;
      }
      // Ensure the data is an array and validate/transform if needed
      const validatedData = Array.isArray(parsedData)
        ? parsedData
        : [parsedData];
      setCostData(validatedData);
      setLoading(false);
      setShowTable(true);

      if (validatedData.length > 0) {
        toastService.success("Cost data fetched successfully");
      } else {
        toastService.error("No records found");
      }
    } catch (error) {
      console.error("Error fetching cost data:", error);
      setCostData([]); // Set empty array on error
      setLoading(false);
      toastService.error("Error fetching cost data");
      setShowTable(true); // Show empty table on error
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUpdateCost = async () => {
    setIsSubmitting(true);
    try {
      const params = {
        id: editRowData?.id, // ya jis field me aapke row ki primary id ho
        Cost: editAcCost,
        NonAcCost: editNonAcCost,
        UpdatedBy: UserID,
        guardcost: editGuardRate,
        fuelrate: editFuelRate,
      };
      let res = await CostMasterService.sprUpdateCost(params);
      //console.log("sprUpdateCost response:", res);
      // If response is string, parse it
      if (typeof res === "string") {
        try {
          res = JSON.parse(res);
        } catch (e) {
          setIsSubmitting(false);
          // Not a JSON string, leave as is
        }

        toastService.success("Record Updated Successfully!");
        setEditNewCost(false);
        handleSearch(); // Refresh table data
      } else {
        toastService.error("Failed to update record!");
      }
    } catch (error) {
      console.error("Error updating cost:", error);
      toastService.error("Error updating cost");
    } finally {
      setIsSubmitting(false);
    }
  };
  // Add this function for Excel export
  const exportExcel = () => {
    if (dt.current) {
      const fileName = `employee_list_${new Date().toISOString().slice(0, 10)}`;
      dt.current.exportCSV({ fileName });
    }
  };

  // const paginatorLeft = (
  //   <Button
  //     type="button"
  //     icon="pi pi-refresh"
  //     text
  //     onClick={() => handleSearch()}
  //   />
  // );
  // const paginatorRight = (
  //   <Button type="button" icon="pi pi-download" text onClick={exportExcel} />
  // );

  return (
    <>
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
        pageTitle="Cost Master"
        showNewButton={true}
        onNewButtonClick={() => setAddNewCost(true)}
      />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Trip Rate Master</h6>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row">
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2">
                  <label htmlFor="facility">Facility</label>
                  <Dropdown
                    id="facility"
                    placeholder="Select Facility"
                    value={selectedFacility}
                    options={facilities}
                    onChange={(e) => {
                      setSelectedFacility(e.value);
                      setSelectedVendor(null);
                    }}
                    className="w-100"
                    defaultValue={1}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2">
                  <label htmlFor="vendor">Vendor</label>
                  <Dropdown
                    id="vendor"
                    value={selectedVendor}
                    options={vendors}
                    placeholder="Select Vendor"
                    onChange={(e) => setSelectedVendor(e.value)}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2">
                  <label htmlFor="vehicleType">Vehicle Type</label>
                  <Dropdown
                    id="vehicleType"
                    value={selectedVehicleType}
                    options={vehicleTypes}
                    placeholder="Select Vehicle Type"
                    onChange={(e) => setSelectedVehicleType(e.value)}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2">
                  <label htmlFor="zone">Zone</label>
                  <Dropdown
                    id="zone"
                    value={selectedZone}
                    options={zones}
                    placeholder="Select Zone"
                    onChange={(e) => setSelectedZone(e.value)}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2">
                  <label htmlFor="routeType">Route Type</label>
                  <Dropdown
                    id="routeType"
                    value={selectedRouteType}
                    options={routestypes}
                    placeholder="Select Route Type"
                    onChange={(e) => setSelectedRouteType(e.value)}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 d-flex align-items-end mb-2">
                  <style>
                    {`
                      .run-report-btn {
                        background-color: #1C1D20 !important;
                        border-color: #1C1D20 !important;
                        transition: background-color 0.3s, border-color 0.3s;
                      }
                      .run-report-btn:hover {
                        background-color: #0d6efd !important;
                        border-color: #0d6efd !important;
                      }
                    `}
                  </style>
                  <Button
                    label="Show Data"
                    className="btn btn-primary w-100 run-report-btn"
                    onClick={handleSearch}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card_tb">
              {!showTable && (
                <div
                  className="d-flex flex-column align-items-center justify-content-center p-5"
                  style={{ minHeight: "70vh" }}
                >
                  <img
                    src={noReportImage}
                    alt="No Report Selected"
                    style={{
                      maxWidth: "100px",
                      opacity: 0.5,
                      marginBottom: "1rem",
                    }}
                  />
                  <p
                    className="text-muted mb-0"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Please select above parameters to show data
                  </p>
                </div>
              )}

              {showTable && (
                <div className="p-3">
                  <TableToolbar
                    onSearch={(e) => setGlobalFilter(e.target.value)}
                    search={globalFilter}
                    onRefresh={handleSearch}
                    onExport={exportExcel}
                    showFilter={true}
                    filters={filters}
                    setFilters={setFilters}
                    overlayRef={op}
                    filterButtonRef={filterButtonRef}
                  >
                    <div className="ota-filter-header">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="ota-filter-icon">
                            <i className="pi pi-filter" />
                          </span>
                          <div>
                            <div className="ota-filter-title">Advanced filters</div>
                            <div className="ota-filter-subtitle">
                              No additional filters
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ota-filter-body">
                      {/* Placeholder for future advanced filters */}
                    </div>
                  </TableToolbar>
                  <CustomDataTable
                    value={costData}
                    ref={dt}
                    paginator
                    rows={50}
                    tableStyle={{ minWidth: "50rem" }}
                    size="small"
                    loading={loading}
                    emptyMessage={error ? `Error: ${error}` : "No records found"}
                    stripedRows
                    // currentPageReportTemplate="Showing {first} to {last} of {totalRecords} employees"
                    // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    // paginatorLeft={paginatorLeft}
                    // paginatorRight={paginatorRight}
                    globalFilter={globalFilter}
                    header={null}
                    rowsPerPageOptions={[50, 100, 200, 300]}
                  >
                    <Column
                      field="vendorname"
                      header="Vendor"
                      sortable
                      body={(rowData) => (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditRowData(rowData);
                            setEditAcCost(rowData.Cost || "0");
                            setEditNonAcCost(rowData.NonAcCost || "0");
                            setEditFuelRate(rowData.fuelrate || "0");
                            setEditGuardRate(rowData.guardcost || "0");
                            setEditNewCost(true);
                          }}
                        >
                          {rowData.vendorname}
                        </a>
                      )}
                    />
                    <Column field="VehicleType" header="Vehicle Type" sortable />
                    <Column field="routetype" header="Route Type" sortable />
                    <Column field="ZoneName" header="Zone Name" sortable />
                    <Column field="Cost" header="AC Cost" sortable />
                    <Column field="NonAcCost" header="Non-AC Cost" sortable />
                    <Column field="fuelrate" header="Fuel Rate" sortable />
                    <Column field="guardcost" header="Guard Cost" sortable />
                    <Column
                      field="DATE"
                      header="From Date"
                      sortable
                      body={(rowData) => {
                        const value = rowData.DATE;
                        if (!value) return value ?? ""; // null, undefined, empty string
                        const dateObj = new Date(value);
                        if (!isNaN(dateObj.getTime())) {
                          return dateObj.toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          });
                        }
                        // If not a valid date, show as is
                        return value;
                      }}
                    />
                    <Column
                      field="Enddate"
                      header="To Date"
                      sortable
                      body={(rowData) => {
                        // Try to parse date, if invalid, show as is
                        const value = rowData.Enddate;
                        if (!value) return value ?? ""; // null, undefined, empty string
                        const dateObj = new Date(value);
                        // Check if date is valid
                        if (!isNaN(dateObj.getTime())) {
                          return dateObj.toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          });
                        }
                        // If not a valid date, show as is
                        return value;
                      }}
                    />
                  </CustomDataTable>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Cost sidebar */}
      <PrimeSidebar
        visible={AddNewCost}
        position="right"
        showCloseIcon={false}
        dismissable={false}
        style={{ width: "40%" }}
      >
        {/* Sidebar content */}
        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
          <h6 className="sidebarTitle">Add New Cost</h6>
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-text"
            onClick={() => {
              setAddNewCost(false);
            }}
          />
        </div>
        <div className="sidebarBody">
          <div className="row">
            <div className="col-6 mb-3">
              <label>
                Facility <span>*</span>
              </label>
              <Dropdown
                placeholder="Select Facility"
                value={selectedFacilityNew}
                options={facilities}
                onChange={(e) => {
                  setSelectedFacilityNew(e.value);
                  setSelectedVendorNew(null);
                }}
                className="w-100"
                defaultValue={1}
                id="facility"
                filter
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Vendor <span>*</span>
              </label>
              <Dropdown
                id="vendor"
                value={selectedVendorNew}
                options={vendorsNew}
                placeholder="Select Vendor"
                onChange={(e) => setSelectedVendorNew(e.value)}
                className="w-100"
                filter
              />
            </div>
            <div className="col-6 mb-3">
              <label>Vehicle Type</label>
              <Dropdown
                id="vehicleType"
                value={selectedVehicleTypeNew}
                options={vehicleTypesNew}
                placeholder="Select Vehicle Type"
                onChange={(e) => setSelectedVehicleTypeNew(e.value)}
                className="w-100"
                filter
              />
            </div>
            <div className="col-6 mb-3">
              <label>Effective Date</label>
              <Calendar
                className="w-100"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.value)}
              ></Calendar>
            </div>
            <div className="col-6 mb-3">
              <label>
                Route Zone <span>*</span>
              </label>
              <Dropdown
                id="zone"
                value={selectedZoneNew}
                options={zonesNew}
                onChange={(e) => setSelectedZoneNew(e.value)}
                placeholder="Select Route Zone"
                className="w-100"
                filter
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Route Type <span>*</span>
              </label>
              <Dropdown
                id="routeType"
                value={selectedRouteTypeNew}
                options={routestypesNew}
                onChange={(e) => setSelectedRouteTypeNew(e.value)}
                placeholder="Select Route Type"
                className="w-100"
                filter
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Ac Cost <span>*</span>
              </label>
              <InputText
                className={`form-control ${acCostError ? "is-invalid" : ""}`}
                value={acCost}
                onChange={(e) => {
                  setAcCost(e.target.value);
                  validateAcCost(e.target.value);
                }}
                placeholder="Enter Ac Cost"
              />
              {acCostError && (
                <div className="invalid-feedback">{acCostError}</div>
              )}
            </div>
            <div className="col-6 mb-3">
              <label>
                Non-Ac Cost <span>*</span>
              </label>
              <InputText
                className={`form-control ${nonAcCostError ? "is-invalid" : ""}`}
                value={nonAcCost}
                onChange={(e) => {
                  setNonAcCost(e.target.value);
                  validateNonAcCost(e.target.value);
                }}
                placeholder="Enter Non-Ac Cost"
              />
              {nonAcCostError && (
                <div className="invalid-feedback">{nonAcCostError}</div>
              )}
            </div>
            <div className="col-6 mb-3">
              <label>
                Fuel Rate <span>*</span>
              </label>
              <InputText
                className={`form-control ${fuelRateError ? "is-invalid" : ""}`}
                value={fuelRate}
                onChange={(e) => {
                  setFuelRate(e.target.value);
                  validateFuelRate(e.target.value);
                }}
                placeholder="Enter Fuel Rate"
              />
              {fuelRateError && (
                <div className="invalid-feedback">{fuelRateError}</div>
              )}
            </div>
            <div className="col-6 mb-3">
              <label>
                Guard Rate <span>*</span>
              </label>
              <InputText
                className={`form-control ${guardRateError ? "is-invalid" : ""}`}
                value={guardRate}
                onChange={(e) => {
                  setGuardRate(e.target.value);
                  validateGuardRate(e.target.value);
                }}
                placeholder="Enter Guard Rate"
              />
              {guardRateError && (
                <div className="invalid-feedback">{guardRateError}</div>
              )}
            </div>
          </div>
        </div>
        <div className="sidebar-fixed-bottom position-absolute pe-3">
          <div className="d-flex gap-3 justify-content-end">
            <Button
              label="Cancel"
              className="btn btn-outline-secondary"
              onClick={() => {
                setAddNewCost(false);
                // Reset all fields when closing the sidebar
                setAcCost("");
                setNonAcCost("");
                setFuelRate("");
                setGuardRate("");
                setSelectedDate(new Date());
                setSelectedVendorNew(null);
                setSelectedVehicleTypeNew(null);
                setSelectedZoneNew(null);
                setSelectedRouteTypeNew(null);
              }}
            />
            <Button
              label="Save"
              className="btn btn-success"
              onClick={() => {
                //setAddNewCost(false);
                // Reset all fields when closing the sidebar
                setAcCost("");
                setNonAcCost("");
                setFuelRate("");
                setGuardRate("");
                setSelectedDate(new Date());
                setSelectedVendorNew(null);
                setSelectedVehicleTypeNew(null);
                setSelectedZoneNew(null);
                setSelectedRouteTypeNew(null);
                AddNewCostHandler();
              }}
            />
          </div>
        </div>
      </PrimeSidebar>

      {/* Edit New Cost sidebar */}
      <PrimeSidebar
        visible={EditNewCost}
        position="right"
        showCloseIcon={false}
        dismissable={false}
        style={{ width: "40%" }}
      >
        {/* Sidebar content */}
        <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
          <h6 className="sidebarTitle">{editRowData?.vendorname || ""}</h6>
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-text"
            onClick={() => {
              setEditNewCost(false);
            }}
          />
        </div>
        <div className="sidebarBody">
          <div className="row">
            <div className="col-6 mb-3" style={{ display: "none" }}>
              <label>
                Facility <span></span>
              </label>
              <InputText
                className="form-control"
                value={editRowData?.facilityName || ""}
                readOnly
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Vendor <span></span>
              </label>
              <InputText
                className="form-control"
                value={editRowData?.vendorname || ""}
                readOnly
              />
            </div>
            <div className="col-6 mb-3">
              <label>Vehicle Type</label>
              <InputText
                className="form-control"
                value={editRowData?.VehicleType || ""}
                readOnly
              />
            </div>
            <div className="col-6 mb-3">
              <label>From Date</label>
              {/* <Calendar className="w-100"></Calendar> */}
              <InputText
                className="form-control"
                value={editRowData?.DATE || ""}
                readOnly
              />
            </div>
            <div className="col-6 mb-3">
              <label>To Date</label>
              {/* <Calendar className="w-100"></Calendar> */}
              <InputText
                className="form-control"
                value={editRowData?.Enddate || ""}
                readOnly
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Route Zone <span></span>
              </label>
              <InputText
                className="form-control"
                value={editRowData?.ZoneName || ""}
                readOnly
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Route Type <span></span>
              </label>
              <InputText
                className="form-control"
                value={editRowData?.routetype || ""}
                readOnly
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Ac Cost <span>*</span>
              </label>
              <InputText
                className="form-control"
                value={editAcCost}
                onChange={(e) => setEditAcCost(e.target.value)}
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Non-Ac Cost <span>*</span>
              </label>
              <InputText
                className="form-control"
                value={editNonAcCost}
                onChange={(e) => setEditNonAcCost(e.target.value)}
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Fuel Rate <span>*</span>
              </label>
              <InputText
                className="form-control"
                value={editFuelRate}
                onChange={(e) => setEditFuelRate(e.target.value)}
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Guard Rate <span>*</span>
              </label>
              <InputText
                className="form-control"
                value={editGuardRate}
                onChange={(e) => setEditGuardRate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="sidebar-fixed-bottom position-absolute pe-3">
          <div className="d-flex gap-3 justify-content-end">
            <Button
              label="Cancel"
              className="btn btn-outline-secondary"
              onClick={() => {
                setEditNewCost(false);
              }}
            />
            <Button
              label="Save"
              className="btn btn-success"
              onClick={handleUpdateCost}
            />
          </div>
        </div>
      </PrimeSidebar>
    </>
  );
};

export default CostMaster;

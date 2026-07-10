import React, { useState, useEffect, useMemo, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import MasterSidebar from "./Master/MasterSidebar";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import CostMasterService from "../services/compliance/CostMasterService";
import CostMasterPackageService from "../services/compliance/CostMasterPackageService";
import { toastService } from "../services/toastService";
import { set } from "lodash";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import TableToolbar from "./common/TableToolbar";
import noReportImage from "../assets/no_report.png";

const CostMasterPackage = () => {
  // Dropdown options
  const [facilities, setFacilities] = useState([]);
  const [vendors, setVendors] = useState([
    { label: "-All Vendors-", value: 0 },
  ]);
  const [selectedVendor, setSelectedVendor] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({});
  const op = useRef(null);
  const filterButtonRef = useRef(null);
  const [showTable, setShowTable] = useState(false);
  // Selected filter values
  const [selectedFacility, setSelectedFacility] = useState(1);
  const [selectedFacilityNew, setSelectedFacilityNew] = useState(1);
  const [selectedVendorNew, setSelectedVendorNew] = useState(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [selectedVehicleTypeNew, setSelectedVehicleTypeNew] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [vehicleTypesNew] = useState([
    { label: "-All-", value: 0 },
    { label: "4 Seater", value: 1 },
    { label: "6 Seater", value: 2 },
  ]);
  const [AddNewCost, setAddNewCost] = useState(false);
  const [acCost, setAcCost] = useState("");
  const [nonAcCost, setNonAcCost] = useState("");
  const [fuelRate, setFuelRate] = useState("");
  const [guardRate, setGuardRate] = useState("");
  const [km, setKm] = useState("");
  const [hrs, setHrs] = useState("");
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [costData, setCostData] = useState([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const [vehicleTypes] = useState([
    { label: "-All-", value: 0 },
    { label: "4 Seater", value: 1 },
    { label: "6 Seater", value: 2 },
  ]);
  const [routestypesNew] = useState([
    { label: "-All-", value: 0 },
    { label: "Front", value: "N" },
    { label: "Back-to-Back", value: "B" },
  ]);
  const [editRowData, setEditRowData] = useState(null);
  const [EditNewCost, setEditNewCost] = useState(false);
  const [acCostError, setAcCostError] = useState("");
  const [nonAcCostError, setNonAcCostError] = useState("");
  const [fuelRateError, setFuelRateError] = useState("");
  const [guardRateError, setGuardRateError] = useState("");
  const [vendorsNew, setVendorsNew] = useState([]);
  const [editAcCost, setEditAcCost] = useState("");
  const [editNonAcCost, setEditNonAcCost] = useState("");
  const [editFuelRate, setEditFuelRate] = useState("");
  const [editGuardRate, setEditGuardRate] = useState("");
  const [kmEdit, setKmEdit] = useState("");
  const [hrsEdit, setHrsEdit] = useState("");
  const UserID = sessionStorage.getItem("ID");

  const dt = useRef(null);

  // Sample data for the table

  // Create repeated data for demonstration
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
  useEffect(() => {
    fetchFacilities();
    // Load data on component mount
    if (selectedFacility) {
      fetchVendors();
    }
    setSelectedVendor(null);
  }, [selectedFacility]);
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
      setVendors([{ label: "-All Vendors-", value: 0 }, ...formattedData]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };
  const handleSearch = async () => {
    // Validate all dropdowns before calling API
    if (selectedVendor === null || selectedVendor === undefined) {
      toastService.error("Please select Vendor");
      return;
    }
    if (selectedVehicleType === null || selectedVehicleType === undefined) {
      toastService.error("Please select Vehicle Type");
      return;
    }
    setIsSubmitting(true);
    setLoading(true);
    const params = {
      vendorid: selectedVendor,
      vehicletype: selectedVehicleType,
      facilityid: selectedFacility,
      vehicleStatus: 0,
      fueltype: "0",
    };
    try {
      const response = await CostMasterPackageService.PackageGetCost(params);
      //console.log("PackageGetCost response:", response);
      let parsedData = [];
      if (typeof response === "string") {
        parsedData = JSON.parse(response);
      } else {
        parsedData = response;
      }
      // If null/undefined/empty object, treat as no data
      let validatedData = [];
      if (Array.isArray(parsedData)) {
        validatedData = parsedData;
      } else if (
        parsedData &&
        typeof parsedData === "object" &&
        Object.keys(parsedData).length > 0
      ) {
        validatedData = [parsedData];
      } else {
        validatedData = [];
      }
      setCostData(validatedData);
      setFirst(0); // Reset pagination on data fetch
      setLoading(false);
      setShowTable(true);

      if (!validatedData || validatedData.length === 0) {
        toastService.error("No records found");
      } else {
        toastService.success("Cost data fetched successfully");
      }
    } catch (error) {
      console.error("Error fetching cost data:", error);
      setCostData([]); // Set empty array on error
      setLoading(false);
      toastService.error("Error fetching cost data");
      setShowTable(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    if (selectedFacilityNew) {
      fetchVendorsForNewCost(selectedFacilityNew); // For Add New Cost sidebar
    }
  }, [selectedFacilityNew]);
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
  const exportExcel = () => {
    if (!costData.length) {
      toastService.error("No data to export");
      return;
    }
    const headers = ["Vendor", "Vehicle Type", "AC Cost", "Non-AC Cost", "Fuel Rate", "Guard Cost", "Kms", "Hrs", "From Date", "To Date"];
    const csvRows = costData.map((r) => [
      r.vendorname, r.VehicleType, r.Cost, r.NonAcCost,
      r.fuelrate, r.guardcost, r.km, r.hrs,
      r.DATE, r.Enddate,
    ]);
    const csv = [headers, ...csvRows]
      .map((row) => row.map((c) => `"${c ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CostMasterPackage_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const AddNewCostPackageHandler = () => {
    // Logic for adding a new cost package
    setIsSubmitting(true);
    try {
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
      const params = {
        effectiveDate: selectedDate,
        newrate: acCost,
        vehicleTypeID: selectedVehicleTypeNew,
        facilityid: selectedFacilityNew,
        userid: UserID,
        NonAcCost: parseFloat(nonAcCost),
        vehicleStatus: 0,
        fuelrate: parseFloat(fuelRate),
        guardCost: parseFloat(guardRate),
        kms: parseFloat(km),
        hrs: parseFloat(hrs),
        vendorid: selectedVendorNew,
        fueltype: "0",
      };
      const responce = CostMasterPackageService.AddNewPackageCost(params);
      //console.log("Add Cost Package Response:", responce);
      if (responce) {
        toastService.success("Cost package added successfully");
        setAddNewCost(false);
        setIsSubmitting(false);
        handleSearch(); // Refresh data after adding
      } else {
        toastService.error("Failed to add cost package");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error adding new cost package:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUpdateCost = async () => {
    setIsSubmitting(true);
    try {
      const params = {
        Id: editRowData?.id, // ya jis field me aapke row ki primary id ho
        Cost: editAcCost,
        NonAcCost: editNonAcCost,
        UpdatedBy: UserID,
        guardcost: editGuardRate,
        fuelrate: editFuelRate,
        kms: kmEdit,
        hrs: hrsEdit,
      };
      let res = await CostMasterPackageService.sprUpdatePackageCost(params);
      //console.log("Update Cost Response:", res);
      if (typeof res === "string") {
        try {
          res = JSON.parse(res);
        } catch (e) {
          setIsSubmitting(false);
          console.error("Error parsing response:", e);
        }
        toastService.success("Record Updated Successfully!");
        setEditNewCost(false);
        setEditRowData(null);
        handleSearch(); // Refresh data after update
      } else {
        toastService.error("Failed to update record");
      }
    } catch (error) {
      console.error("Error updating cost:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Zone name column template with clickable link
  const zoneNameTemplate = (rowData) => (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        handleRowClick(rowData);
      }}
    >
      {rowData.zoneName}
    </a>
  );

  // const paginatorLeft = (
  //   <Button type="button" icon="pi pi-refresh" text onClick={handleSearch} />
  // );
  // const paginatorRight = (
  //   <Button type="button" icon="pi pi-download" text onClick={exportExcel} />
  // );

  // Shared form for both Add and Edit sidebars

  return (
    <>
      <Loader isVisible={isSubmitting || loading} fullScreen={true} />
      <Header
        pageTitle="Cost Master"
        showNewButton={true}
        onNewButtonClick={() => setAddNewCost(true)}
      />
      <Sidebar />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Cost Master Package</h6>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row">
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 mb-2">
                  <label htmlFor="facility" className="form-label">
                    Facility <span className="text-danger">*</span>
                  </label>
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
                  <label htmlFor="vendor" className="form-label">
                    Vendor <span className="text-danger">*</span>
                  </label>
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
                  <label htmlFor="vehicleType" className="form-label">
                    Vehicle Type <span className="text-danger">*</span>
                  </label>
                  <Dropdown
                    id="vehicleType"
                    value={selectedVehicleType}
                    options={vehicleTypes}
                    placeholder="Select Vehicle Type"
                    onChange={(e) => setSelectedVehicleType(e.value)}
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
                    ref={dt}
                    value={costData.slice(first, first + rows)}
                    tableStyle={{ minWidth: "50rem" }}
                    size="small"
                    emptyMessage={error ? `Error: ${error}` : "No records found"}
                    stripedRows
                    // currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
                    // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    // paginatorLeft={paginatorLeft}
                    // paginatorRight={paginatorRight}
                    header={null}
                  >
                    <Column
                      field="vendorname"
                      header="Vendor"
                      sortable
                      body={(rowData) => (
                        <a
                          href="#"
                          style={{
                            color: "#007bff",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            setEditRowData(rowData);
                            setEditNewCost(true);
                            setEditRowData(rowData);
                            setEditAcCost(rowData.Cost || "0");
                            setEditNonAcCost(rowData.NonAcCost || "0");
                            setEditFuelRate(rowData.fuelrate || "0");
                            setEditGuardRate(rowData.guardcost || "0");
                            setKmEdit(rowData.km || "0");
                            setHrsEdit(rowData.hrs || "0");
                          }}
                        >
                          {rowData.vendorname}
                        </a>
                      )}
                    />
                    <Column field="VehicleType" header="Vehicle Type" sortable />
                    <Column field="Cost" header="AC Cost" sortable />
                    <Column field="NonAcCost" header="Non-AC Cost" sortable />
                    <Column field="fuelrate" header="Fuel Rate" sortable />
                    <Column field="guardcost" header="Guard Cost" sortable />
                    <Column field="km" header="Kms" sortable />
                    <Column field="hrs" header="Hrs" sortable />
                    {/* <Column field="endTime" header="End Time" sortable /> */}
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
                  <CustomPaginator
                    first={first}
                    rows={rows}
                    totalRecords={costData.length}
                    onPageChange={onPageChange}
                    rowsPerPageOptions={[50, 100, 200, 300]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MasterSidebar
        show={AddNewCost}
        onClose={() => {
          setAddNewCost(false);
          setAcCost("");
          setNonAcCost("");
          setFuelRate("");
          setGuardRate("");
          setKm("");
          setHrs("");
          setSelectedDate(new Date());
          setSelectedVendorNew(null);
          setSelectedVehicleTypeNew(null);
        }}
        title="Add New Cost"
        width="40%"
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary",
            onClick: () => {
              setAddNewCost(false);
              setAcCost("");
              setNonAcCost("");
              setFuelRate("");
              setGuardRate("");
              setKm("");
              setHrs("");
              setSelectedDate(new Date());
              setSelectedVendorNew(null);
              setSelectedVehicleTypeNew(null);
            },
          },
          {
            label: "Save",
            className: "btn btn-success",
            onClick: () => {
              setAcCost("");
              setNonAcCost("");
              setFuelRate("");
              setGuardRate("");
              setKm("");
              setHrs("");
              setSelectedDate(new Date());
              setSelectedVendorNew(null);
              setSelectedVehicleTypeNew(null);
              AddNewCostPackageHandler();
            },
          },
        ]}
      >
        <div className="p-3 bg-white">
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

            {/* <div className="col-6 mb-3">
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
            </div> */}
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
            <div className="col-6 mb-3">
              <label>
                Hrs <span>*</span>
              </label>
              <InputText
                className="form-control"
                value={hrs}
                onChange={(e) => {
                  setHrs(e.target.value);
                }}
                placeholder="Enter Hrs"
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Kms <span>*</span>
              </label>
              <InputText
                className="form-control"
                value={km}
                onChange={(e) => {
                  setKm(e.target.value);
                }}
                placeholder="Enter Kms"
              />
            </div>
          </div>
        </div>
      </MasterSidebar>
      {/* Edit Cost sidebar */}
      <MasterSidebar
        show={EditNewCost}
        onClose={() => setEditNewCost(false)}
        title={editRowData?.vendorname || ""}
        width="40%"
        footerButtons={[
          {
            label: "Cancel",
            className: "btn btn-outline-secondary",
            onClick: () => setEditNewCost(false),
          },
          {
            label: "Save",
            className: "btn btn-success",
            onClick: handleUpdateCost,
          },
        ]}
      >
        <div className="p-3">
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
            <div className="col-6 mb-3">
              <label>
                Kms <span>*</span>
              </label>
              <InputText
                className="form-control"
                value={kmEdit || ""}
                onChange={(e) => setKmEdit(e.target.value)}
              />
            </div>
            <div className="col-6 mb-3">
              <label>
                Hrs <span>*</span>
              </label>
              <InputText
                className="form-control"
                value={hrsEdit || ""}
                onChange={(e) => setHrsEdit(e.target.value)}
              />
            </div>
          </div>
        </div>
      </MasterSidebar>
    </>
  );
};

export default CostMasterPackage;

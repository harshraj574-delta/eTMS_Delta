import React, { useState, useEffect } from "react";
import Header from "../Master/Header";
import Sidebar from "../Master/SidebarMenu";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import sessionManager from "../../utils/SessionManager.js";
import { toastService } from "../../services/toastService.js";
import {
  useFacilitiesQuery,
  useShiftTimesQuery,
  useVendorsQuery,
  useAllocationRoutesQuery,
  useAllocationStatisticsQuery,
  useAssignedVendorCountsQuery,
  useAssignVendorMutation,
} from "./hooks/useVendorAllocationQueries";

import ReportButton from "../common/ReportButton";
import calendarIcon from "../../assets/calendar.png";
import noReportImage from "../../assets/no_report.png";
import Loader from "../common/Loader";

const TRIP_TYPES = [
  { label: "Pickup", value: "P" },
  { label: "Drop", value: "D" },
];

// Backend expects "M/D/YYYY"
const formatDate = (dateObj) => {
  const date = new Date(dateObj);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const VendorAllocation = () => {
  const userID = sessionManager.getUserSession().ID;

  // Filter selections (uncommitted until Show is clicked)
  const [selectdate, setSelectDate] = useState(new Date());
  const [selectedFacility, setSelectedFacility] = useState(1);
  const [selectedTripType, setSelectedTripType] = useState("P");
  const [selectedShiftTime, setSelectedShiftTime] = useState("");

  // Committed search criteria — drives the routes/statistics/counts queries
  const [committedParams, setCommittedParams] = useState(null);

  // Editable copy of the routes (per-row vendor dropdown edits)
  const [fetchData, setFetchData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const isBackDate =
    selectdate &&
    new Date(selectdate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

  // Dropdown data
  const { data: facilities = [] } = useFacilitiesQuery(userID);
  const { data: shiftTimeOptions = [] } = useShiftTimesQuery(
    selectedFacility,
    selectedTripType
  );
  const { data: vendors = [] } = useVendorsQuery(selectedFacility);

  // Committed search data
  const {
    data: routesData,
    isFetching: routesFetching,
    isFetched: routesFetched,
  } = useAllocationRoutesQuery(committedParams);
  const { data: routeStatistics = { TotalRoutes: 0, TotalEmps: 0 } } =
    useAllocationStatisticsQuery(committedParams);
  const { data: assignedVendorCounts = [] } =
    useAssignedVendorCountsQuery(committedParams);

  const assignVendorMutation = useAssignVendorMutation();

  // Reset shift time when its option set changes meaning (facility/trip type)
  useEffect(() => {
    setSelectedShiftTime("");
  }, [selectedFacility, selectedTripType]);

  // Seed the editable table copy whenever fresh routes arrive
  useEffect(() => {
    if (!committedParams || !routesFetched) return;

    if (!routesData || routesData.length === 0) {
      toastService.error("No record found.");
      setFetchData([]);
      setCommittedParams(null); // back to the empty state
      return;
    }

    setFetchData(
      routesData.map((row, index) => ({
        ...row,
        vendor: row.PlannedVendorID || row.vendorId || null,
        _rowIndex: index,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesData, routesFetched]);

  const isDataShown = !!committedParams && fetchData.length > 0;

  const handleShowData = () => {
    if (!selectdate) {
      toastService.warn("Please select a shift date.");
      return;
    }
    if (!selectedFacility) {
      toastService.warn("Please select a facility name.");
      return;
    }
    if (!selectedTripType) {
      toastService.warn("Please select a trip type.");
      return;
    }
    if (!selectedShiftTime) {
      toastService.warn("Please select a shift time.");
      return;
    }

    setCommittedParams({
      sDate: formatDate(selectdate),
      facilityId: selectedFacility,
      tripType: selectedTripType,
      shiftTime: selectedShiftTime,
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
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
          await assignVendorMutation.mutateAsync(params);
        } catch (err) {
          toastService.error(`Error saving for RouteID ${row.RouteID}`);
        }
      }
      toastService.success("All data saved successfully!");
    } catch (error) {
      toastService.error("Error saving data!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Loader isVisible={isSaving || routesFetching} fullScreen={true} />
      <Header
        pageTitle="Vendor Allocation"
        showNewButton={false}
      />
      <Sidebar />

      <div className="middle">
        <div className="card_tb p-3">
          <div className="row">
            <div className="field col-12 col-md-6 col-lg-2 mb-3">
              <label htmlFor="shiftDate" className="form-label">Shift Date <span className="text-danger">*</span></label>
              <div className="custom-calendar-wrapper">
                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                <Calendar
                  className="w-100 custom-calendar-input"
                  name="shiftDate"
                  placeholder="Shift Date"
                  dateFormat="dd-mm-yy"
                  onChange={(e) => setSelectDate(e.value)}
                  value={selectdate}
                />
              </div>
            </div>

            <div className="field col-12 col-md-6 col-lg-2 mb-3">
              <label htmlFor="facility" className="form-label">Facility Name <span className="text-danger">*</span></label>
              <Dropdown
                options={facilities}
                placeholder="Select Facility"
                className="w-100"
                filter
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.value)}
              />
            </div>
            <div className="field col-12 col-md-6 col-lg-2 mb-3">
              <label htmlFor="tripType" className="form-label">Trip Type <span className="text-danger">*</span></label>
              <Dropdown
                options={TRIP_TYPES}
                value={selectedTripType}
                onChange={(e) => setSelectedTripType(e.value)}
                placeholder="Select Trip Type"
                className="w-100"
                filter
              />
            </div>
            <div className="field col-12 col-md-6 col-lg-2 mb-3">
              <label htmlFor="shift" className="form-label">Shift Time <span className="text-danger">*</span></label>
              <Dropdown
                options={shiftTimeOptions}
                optionLabel="name"
                onChange={(e) => setSelectedShiftTime(e.value)}
                placeholder="Select Shift"
                value={selectedShiftTime}
                className="w-100"
                filter
              />
            </div>
            <div className="field col-12 col-md-6 col-lg-2 mb-3 no-label">
              <ReportButton
                label="Show"
                onClick={handleShowData}
              />
            </div>
          </div>
        </div>
        {!isDataShown && (
          <div className="card_tb">
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
              <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                Please select above parameters to show data
              </p>
            </div>
          </div>
        )}
        {isDataShown && (
          <>
            <div className="row">
              <div className="col-12">
                <div className="card_tb p-3 d-flex justify-content-between align-items-center">
                  <ul className="vendor_info">
                    <li>
                      <small>Total Routes-</small> {routeStatistics?.TotalRoutes ?? 0}
                    </li>
                    <li>
                      <small>Total Employees-</small> {routeStatistics?.TotalEmps ?? 0}
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
                  <button className="btn btn-primary" onClick={handleSaveAll} disabled={isBackDate} >
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
                    scrollable={true}
                    scrollHeight="400px"
                    emptyMessage="No data found"
                  >
                    <Column field="RouteID" header="RouteID" sortable />
                    <Column field="ZONE" header="Zone" />
                    <Column field="Location" header="Location" />
                    <Column field="totalStop" header="Total Stop" sortable />
                    <Column field="PlanVehicleType" header="Planned Vehicle" />
                    <Column
                      field="totaldist"
                      header="Distance (km)"
                      sortable
                      body={(rowData) => rowData.totaldist ? `${rowData.totaldist} km` : "-"}
                    />
                    <Column
                      field="vendor"
                      header="Vendor"
                      style={{ minWidth: "160px", maxWidth: "200px", width: "180px" }}
                      body={(rowData) => (
                        <Dropdown
                          value={rowData.vendor}
                          options={vendors}
                          onChange={(e) => {
                            setFetchData((prev) =>
                              prev.map((row, idx) =>
                                idx === rowData._rowIndex
                                  ? { ...row, vendor: e.value }
                                  : row
                              )
                            );
                          }}
                          placeholder="Select "
                          className="w-100"
                          disabled={isBackDate}
                        />
                      )}
                    />

                  </DataTable>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <style>
        {`
          .custom-calendar-wrapper {
            position: relative;
            width: 100%;
          }
          .custom-calendar-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 22px;
            height: 22px;
            z-index: 2;
            pointer-events: none;
          }
          .custom-calendar-input .p-inputtext {
            padding-left: 35px !important;
          }
        `}
      </style>
    </div>
  );
};

export default VendorAllocation;

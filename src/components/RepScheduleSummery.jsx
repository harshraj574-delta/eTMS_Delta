import React, { useEffect, useState, useMemo } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import RepScheduleSummeryService from "../services/compliance/RepScheduleSummeryService";
import sessionManager from "../utils/SessionManager";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";

const RepScheduleSummery = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const userId = sessionManager.getUserSession().ID;
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());

  const reportTypeOptions = useMemo(
    () => [
      { label: "Vendor Wise Billing Report", value: "VENDOR" },
      { label: "Detailed Billing Report", value: "DETAILED" },
    ],
    []
  );

  const [selectedReportType, setSelectedReportType] = useState(null);
  const [appliedReportType, setAppliedReportType] = useState(null);

  const [facilities, setFacilities] = useState([]);
  const [selFacility, setSelFacility] = useState(null);
  const [showTable, setShowTable] = useState(false);

  // Expansion state using index array (like OTAReport)
  const [expandedRows, setExpandedRows] = useState([]);
  // Cache child data keyed by vendorId
  const [vendorChildData, setVendorChildData] = useState({});

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await RepScheduleSummeryService.SelectFacility({
        Userid: userId,
      });
      const parsed =
        typeof response === "string" ? JSON.parse(response) : response;
      const formatted = Array.isArray(parsed)
        ? parsed.map((f) => ({
            label: f.facility || f.facilityName,
            value: f.Id,
          }))
        : [];
      setFacilities(formatted);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      toastService.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Extract VendorID / VID from any parent row
  const extractVendorId = (row) => {
    if (!row) return null;
    return (
      row?.VID ??
      row?.vid ??
      row?.vendorId ??
      row?.VendorId ??
      row?.VendorID ??
      row?.vendor ??
      row?.id ??
      row?.ID ??
      null
    );
  };

  const detailedColumns = [
    { field: "ShiftDate", header: "Shift Date" },
    { field: "PlanVendorName", header: "Plan Vendor Name" },
    { field: "ActVendorName", header: "Act Vendor Name" },
    { field: "VehicleNo", header: "Vehicle No" },
    { field: "TripType", header: "Trip Type" },
    { field: "RouteId", header: "Route Id" },
    { field: "RouteNo", header: "Route No" },
    { field: "Location", header: "Location" },
    { field: "BillingZone", header: "Billing Zone" },
    { field: "RouteZone", header: "Route Zone" },
    { field: "LogInOut", header: "Log In Out" },
    { field: "ActLogInOut", header: "Act Log In Out" },
    { field: "VehicleType", header: "Deployed Vehicle Type" },
    { field: "BillingVehicleType", header: "Billing Vehicle Type" },
    { field: "TotCapacity", header: "Tot Capacity" },
    { field: "SchedulePax", header: "Schedule Pax" },
    { field: "ActPax", header: "Act Pax" },
    { field: "NoShowPax", header: "No Show Pax" },
    { field: "FuleType", header: "Fuel Type" },
    { field: "FuleRate", header: "Fuel Rate" },
    { field: "Cost", header: "Cost" },
    { field: "TollName", header: "Toll Name" },
    { field: "TollCost", header: "Toll Cost" },
    { field: "GuardCost", header: "Guard Cost" },
    { field: "TotalCost", header: "Total Cost" },
    { field: "TripSheetUpdated", header: "Trip Sheet" },
  ];

  // Render columns for detailed report
  const renderDetailedColumns = () => {
    if (!data || data.length === 0) return null;
    const first = data[0];
    const hasField = (f) => Object.prototype.hasOwnProperty.call(first, f);

    const anyPreferredPresent = detailedColumns.some((c) => hasField(c.field));
    if (!anyPreferredPresent) {
      const keys = Object.keys(first);
      return keys.map((k) => <Column key={k} field={k} header={k} />);
    }
    return detailedColumns.map((c) => (
      <Column key={c.field} field={c.field} header={c.header} />
    ));
  };

  const handleRunReport = async () => {
    if (!selectedReportType) {
      toastService.warn("Please select report type");
      return;
    }
    if (!selFacility) {
      toastService.warn("Please select facility");
      return;
    }

    setAppliedReportType(selectedReportType);
    setShowTable(true);
    setExpandedRows([]);
    setVendorChildData({});

    const params = {
      sDate: formatDate(fromDate),
      eDate: formatDate(toDate),
      facilityid: selFacility,
    };

    try {
      setLoading(true);
      let response;
      if (selectedReportType === "VENDOR") {
        response = await RepScheduleSummeryService.RepVendorWiseBill_parent(
          params
        );
      } else {
        response = await RepScheduleSummeryService.RepScheduleMISSummery(
          params
        );
      }

      const parsed =
        typeof response === "string" ? JSON.parse(response) : response;
      const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
      setData(arr);
      if (!arr.length) toastService.error("No records found");
    } catch (err) {
      console.error("Error running schedule summary:", err);
      toastService.error("Failed to fetch report data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle row expansion (like OTAReport)
  const toggleRowExpansion = async (index, rowData) => {
    const newExpandedRows = [...expandedRows];
    const rowIndex = newExpandedRows.indexOf(index);

    if (rowIndex > -1) {
      // Collapse
      newExpandedRows.splice(rowIndex, 1);
      setExpandedRows(newExpandedRows);
      return;
    }

    // Expand
    const vid = extractVendorId(rowData);

    // Fetch child data if not cached
    if (vid && !vendorChildData[vid]) {
      try {
        setLoading(true);
        const params = {
          sDate: formatDate(fromDate),
          eDate: formatDate(toDate),
          facilityid: selFacility,
          vendorid: vid,
        };
        const resp = await RepScheduleSummeryService.RepVendorWiseBill_child(
          params
        );
        const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
        const childArr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
        setVendorChildData((prev) => ({ ...prev, [vid]: childArr }));
      } catch (err) {
        console.error("Error fetching vendor child data:", err);
        toastService.error("Failed to load vendor child data");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    newExpandedRows.push(index);
    setExpandedRows(newExpandedRows);
  };

  const onInputChangeHideTable = (setter) => (e) => {
    setter(e.target ? e.target.value : e.value);
    setShowTable(false);
  };

  return (
    <div>
      <Loader isVisible={loading} fullScreen={true} />
      <Header pageTitle={"Detailed & Vendor Billing Report"} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />

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
          .ota-row-odd > * {
            background-color: #fafafa !important;
          }
          .ota-row-hover:hover > * {
            background-color: #e9ecef !important;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .vendor-table thead th {
            background-color: #f9f9fb !important;
            font-weight: 800;
            color: var(--grey-4);
            border: 1px solid #dee2e6;
            padding: 16px 10px;
            font-size: 13px;
            text-align: center;
            vertical-align: middle;
          }
          .vendor-table tbody td {
            padding: 0.5rem;
            border: 1px solid #dee2e6;
            font-size: 0.875rem;
            text-align: center;
            vertical-align: middle;
          }
          .vendor-table .table-light th {
            background-color: #f9f9fb !important;
          }
          .nested-vendor-table thead th {
            background-color: #f9f9fb !important;
            font-weight: 800;
            color: var(--grey-4);
            border: 1px solid #dee2e6;
            padding: 16px 10px;
            font-size: 13px;
            text-align: center;
          }
          .nested-vendor-table tbody td {
            padding: 0.5rem;
            border: 1px solid #dee2e6;
            font-size: 0.8125rem;
            text-align: center;
          }
          .expansion-icon {
            color: #0d6efd;
            font-size: 20px;
            vertical-align: middle;
            cursor: pointer;
          }
          .expansion-icon:hover {
            color: #0a58ca;
          }
        `}
      </style>

      <div className="middle">
        <div className="card_tb p-3">
          <div className="row g-2">
            <div className="col-12 col-sm-6 col-md-2 col-lg-2">
              <label className="form-label">
                From Date <span>*</span>
              </label>
              <div className="custom-calendar-wrapper">
                <img
                  src={calendarIcon}
                  alt="calendar"
                  className="custom-calendar-icon"
                />
                <Calendar
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.value);
                    setShowTable(false);
                  }}
                  dateFormat="mm/dd/yy"
                  className="w-100 custom-calendar-input"
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-2 col-lg-2">
              <label className="form-label">
                To Date <span>*</span>
              </label>
              <div className="custom-calendar-wrapper">
                <img
                  src={calendarIcon}
                  alt="calendar"
                  className="custom-calendar-icon"
                />
                <Calendar
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.value);
                    setShowTable(false);
                  }}
                  dateFormat="mm/dd/yy"
                  className="w-100 custom-calendar-input"
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-3">
              <label className="form-label">
                Report Type <span>*</span>
              </label>
              <Dropdown
                options={reportTypeOptions}
                value={selectedReportType}
                onChange={(e) => {
                  setSelectedReportType(e.value);
                  setShowTable(false);
                }}
                optionLabel="label"
                placeholder="Select Report Type"
                className="w-100"
                filter
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-3">
              <label className="form-label">
                Facility Name <span>*</span>
              </label>
              <Dropdown
                options={facilities}
                value={selFacility}
                onChange={onInputChangeHideTable(setSelFacility)}
                optionLabel="label"
                placeholder="Select Facility"
                className="w-100"
                filter
              />
            </div>
            <div className="col-12 col-sm-6 col-md-2 col-lg-2 d-flex align-items-end">
              <Button
                label="Run Report"
                className="btn btn-primary w-100 run-report-btn"
                onClick={handleRunReport}
              />
            </div>
          </div>
        </div>

        {!showTable && (
          <div className="row">
            <div className="col-12">
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
                  <p
                    className="text-muted mb-0"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Please select above parameters to show report data
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showTable && (
          <div className="row">
            <div className="col-12">
              <div className="card_tb">
                <div className="p-3">
                  {appliedReportType === "VENDOR" ? (
                    <div className="table-responsive">
                      <table className="table table-sm mb-0 vendor-table">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "40px" }}></th>
                            <th>Vendor Name</th>
                            <th>Sc Route</th>
                            <th>Schedule Amount</th>
                            <th>Guard Count</th>
                            <th>Guard Amount</th>
                            <th>UnSchedule</th>
                            <th>Toll Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center p-4">
                                {error ? `Error: ${error}` : "No records found"}
                              </td>
                            </tr>
                          ) : (
                            data.map((row, index) => {
                              const vid = extractVendorId(row);
                              const isExpanded = expandedRows.includes(index);
                              const childData = vendorChildData[vid] || [];

                              return (
                                <React.Fragment key={index}>
                                  <tr
                                    className={`${
                                      index % 2 !== 0 ? "ota-row-odd" : ""
                                    } ota-row-hover`}
                                  >
                                    <td>
                                      <a
                                        href="#!"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          toggleRowExpansion(index, row);
                                        }}
                                      >
                                        {isExpanded ? (
                                          <span className="material-icons expansion-icon">
                                            remove_circle
                                          </span>
                                        ) : (
                                          <span className="material-icons expansion-icon">
                                            add_circle
                                          </span>
                                        )}
                                      </a>
                                    </td>
                                    <td style={{ textAlign: "left" }}>
                                      {row.vendorName}
                                    </td>
                                    <td>{row.ScRoute}</td>
                                    <td>{row.ScheduleAmount}</td>
                                    <td>{row.GuardCount}</td>
                                    <td>{row.RouteGuardCost}</td>
                                    <td>{row.UnSchedule}</td>
                                    <td>{row.TollCost}</td>
                                  </tr>

                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={8} className="leftStrip p-2">
                                        <div className="expanded-content">
                                          {childData.length === 0 ? (
                                            <p className="text-center text-muted m-3">
                                              No details found
                                            </p>
                                          ) : (
                                            <div className="table-responsive">
                                              <table className="table table-sm table-bordered mb-0 nested-vendor-table">
                                                <thead>
                                                  <tr>
                                                    <th>Vendor Name</th>
                                                    <th>Vehicle Type</th>
                                                    <th>Sc Route</th>
                                                    <th>Schedule Rate</th>
                                                    <th>Schedule Amount</th>
                                                    <th>Guard Count</th>
                                                    <th>Guard Amount</th>
                                                    <th>UnSchedule</th>
                                                    <th>Unschedule Amount</th>
                                                    <th>Toll Cost</th>
                                                    <th>Grand Total</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {childData.map(
                                                    (childRow, cIdx) => (
                                                      <tr
                                                        key={cIdx}
                                                        className={`${
                                                          cIdx % 2 !== 0
                                                            ? "ota-row-odd"
                                                            : ""
                                                        } ota-row-hover`}
                                                      >
                                                        <td
                                                          style={{
                                                            textAlign: "left",
                                                          }}
                                                        >
                                                          {childRow.vendorName}
                                                        </td>
                                                        <td>
                                                          {childRow.VehicleType}
                                                        </td>
                                                        <td>
                                                          {childRow.ScRoute}
                                                        </td>
                                                        <td>{childRow.Cost}</td>
                                                        <td>
                                                          {
                                                            childRow.ScheduleAmount
                                                          }
                                                        </td>
                                                        <td>
                                                          {childRow.GuardCount}
                                                        </td>
                                                        <td>
                                                          {
                                                            childRow.RouteGuardCost
                                                          }
                                                        </td>
                                                        <td>
                                                          {childRow.UnSchedule}
                                                        </td>
                                                        <td>
                                                          {
                                                            childRow.UnscheduleAmount
                                                          }
                                                        </td>
                                                        <td>
                                                          {childRow.TollCost}
                                                        </td>
                                                        <td>
                                                          {childRow.GrandTotal}
                                                        </td>
                                                      </tr>
                                                    )
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <DataTable
                      value={data}
                      paginator
                      rows={100}
                      tableStyle={{ minWidth: "50rem" }}
                      size="small"
                      loading={loading}
                      emptyMessage={
                        error ? `Error: ${error}` : "No records found"
                      }
                      stripedRows
                      className="p-datatable-gridlines process-datatable"
                      rowsPerPageOptions={[50, 100, 200, 300]}
                    >
                      {renderDetailedColumns()}
                    </DataTable>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepScheduleSummery;
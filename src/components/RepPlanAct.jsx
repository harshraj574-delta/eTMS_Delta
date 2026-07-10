import React, { useEffect, useState, useMemo, useRef } from "react";
import RepPlanActService from "../services/compliance/RepPlanActService";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { Row } from "react-bootstrap";
import { ColumnGroup } from "primereact/columngroup";
import sessionManager from "../utils/SessionManager";
import { toastService } from "../services/toastService";
import * as XLSX from "xlsx";
import TableToolbar from "./common/TableToolbar";
import "./common/CustomDataTable.css";
import { MultiSelect } from "primereact/multiselect";
import calendarIcon from "../assets/calendar.png";
import noReportImage from "../assets/no_report.png";

const RepPlanAct = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const userId = sessionManager.getUserSession().ID;
  const [facilities, setFacilities] = useState([]);
  const [selFacility, setSelFacility] = useState(null);
  const [selectedTripType, setSelectedTripType] = useState(null);
  const [data, setData] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [shiftData, setShiftData] = useState({});
  const [detailedShiftData, setDetailedShiftData] = useState({});
  const [innerExpandedRows, setInnerExpandedRows] = useState({});
  const [reportGenerated, setReportGenerated] = useState(false);
  const [currentReportType, setCurrentReportType] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState({
    PlanVendor: null,
    ActVendor: null
  });

  const op = useRef(null);
  const filterButtonRef = useRef(null);

  const tripTypeOptions = useMemo(
    () => [
      { label: "Pick", value: "P" },
      { label: "Drop", value: "D" },
    ],
    []
  );

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const buildExportData = () => {
    const exportRows = [];

    data.forEach((mainRow) => {
      exportRows.push({
        Level: "DATE_SUMMARY",
        Date: mainRow.Shiftdate,
        Shift: "",
        RouteID: "",
        PlanVendor: "",
        ActVendor: "",
        VehicleType: "",
        VehicleNo: "",
        TripType: "",
        PlanedRoutes: mainRow.PlanedRoutes,
        RecordedRoutes: mainRow.RecordedRoutes,
        PendingRoutes: mainRow.PendingRoutes,
        CancelledRoutes: mainRow.CancelledRoutes,
        PlanedKm: mainRow.PlanedKm,
        ActualKm: mainRow.ActualKm,
        AprKm: mainRow.AprKm,
        PlanedEmployee: mainRow.PlanedEmployee,
        BoardedEmployee: mainRow.BoardedEmployee,
        UnRosteredEmp: mainRow.UnRosteredEmp,
        NoShowEmp: mainRow.NoShowEmp,
        CancelledEmployee: mainRow.CancelledEmployee,
      });

      const shifts = shiftData[mainRow.Shiftdate] || [];
      shifts.forEach((shiftRow) => {
        exportRows.push({
          Level: "SHIFT_SUMMARY",
          Date: mainRow.Shiftdate,
          Shift: shiftRow.shifttime,
          RouteID: "",
          PlanVendor: "",
          ActVendor: "",
          VehicleType: "",
          VehicleNo: "",
          TripType: "",
          PlanedRoutes: shiftRow.PlanedRoutes,
          RecordedRoutes: shiftRow.RecordedRoutes,
          PendingRoutes: shiftRow.PendingRoutes,
          CancelledRoutes: shiftRow.CancelledRoutes,
          PlanedKm: shiftRow.PlanedKm,
          ActualKm: shiftRow.ActualKm,
          AprKm: shiftRow.AprKm,
          PlanedEmployee: shiftRow.PlanedEmployee,
          BoardedEmployee: shiftRow.BoardedEmployee,
          UnRosteredEmp: shiftRow.UnRosteredEmp,
          NoShowEmp: shiftRow.NoShowEmp,
          CancelledEmployee: shiftRow.CancelledEmployee,
        });

        const key = `${mainRow.Shiftdate}_${shiftRow.shifttime}`;
        const detailRows = detailedShiftData[key]?.data || [];
        detailRows.forEach((detailRow) => {
          exportRows.push({
            Level: "ROUTE_DETAIL",
            Date: mainRow.Shiftdate,
            Shift: shiftRow.shifttime,
            RouteID: detailRow.RouteID,
            PlanVendor: detailRow.PlanVendor,
            ActVendor: detailRow.vendorName,
            VehicleType: detailRow.vehicle,
            VehicleNo: detailRow.vehicleNo,
            TripType: detailRow.tripType,
            PlanedRoutes: "-",
            RecordedRoutes: "-",
            PendingRoutes: "-",
            CancelledRoutes: "-",
            PlanedKm: detailRow.approvedKm,
            ActualKm: detailRow.actTotalKm,
            AprKm: detailRow.approvedKm,
            PlanedEmployee: detailRow.totalStop,
            BoardedEmployee: detailRow.actTotalStop,
            UnRosteredEmp: "-",
            NoShowEmp: "-",
            CancelledEmployee: "-",
          });
        });
      });
    });

    return exportRows;
  };

  const exportToExcel = () => {
    try {
      if (!data || data.length === 0) {
        toastService.error("No data available to export!");
        return;
      }

      const exportData = buildExportData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const headerCells = Object.keys(exportData[0] || {});

      headerCells.forEach((col, index) => {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
        if (!worksheet[cellRef]) return;
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" }, size: 11 },
          fill: { fgColor: { rgb: "366092" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      });

      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let R = 1; R <= range.e.r; R++) {
        for (let C = 0; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellRef]) continue;

          const levelCell = XLSX.utils.encode_cell({ r: R, c: 0 });
          const level = worksheet[levelCell]?.v || "";

          let bgColor = "FFFFFF";
          let fontBold = false;
          let fontSize = 10;

          if (level === "DATE_SUMMARY") {
            bgColor = "D9E8F5";
            fontBold = true;
            fontSize = 11;
          } else if (level === "SHIFT_SUMMARY") {
            bgColor = "E7F0F7";
            fontBold = true;
            fontSize = 10;
          } else if (level === "ROUTE_DETAIL") {
            bgColor = "FFFFFF";
            fontSize = 9;
          }

          worksheet[cellRef].s = {
            font: { bold: fontBold, size: fontSize },
            fill: { fgColor: { rgb: bgColor } },
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true,
            },
            border: {
              top: { style: "thin", color: { rgb: "CCCCCC" } },
              bottom: { style: "thin", color: { rgb: "CCCCCC" } },
              left: { style: "thin", color: { rgb: "CCCCCC" } },
              right: { style: "thin", color: { rgb: "CCCCCC" } },
            },
          };
        }
      }

      const levelColIndex = headerCells.indexOf("Level");
      if (levelColIndex !== -1) {
        worksheet["!cols"] = headerCells.map((col) => ({
          wch: col === "Level" ? 0 : 14,
          hidden: col === "Level",
        }));
      } else {
        worksheet["!cols"] = headerCells.map(() => ({ wch: 14 }));
      }

      worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Plan Vs Actual");

      XLSX.writeFile(workbook, `PlanVsActual_${fromDate}_to_${toDate}.xlsx`);
      toastService.success("Excel exported successfully!");
    } catch (err) {
      console.error("Excel Export Error:", err);
      toastService.error("Failed to export Excel.");
    }
  };

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await RepPlanActService.SelectFacility({
        Userid: userId,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = parsedResponse.map((item) => ({
        label: item.facility || item.facilityName,
        value: item.Id,
      }));
      setFacilities(formattedData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching facilities:", err);
      setLoading(false);
    }
  };

  const handleRunReport = async () => {
    try {
      setLoading(true);
      setData([]);
      setReportGenerated(false);
      setCurrentReportType(null);
      setExpandedRows([]);
      setShiftData({});
      setDetailedShiftData({});
      setInnerExpandedRows({});
      setFilters({ PlanVendor: null, ActVendor: null });

      const params = {
        sDate: formatDate(fromDate),
        eDate: formatDate(toDate),
        triptype: selectedTripType,
        facilityid: selFacility,
      };
      const response = await RepPlanActService.RptPlanAct(params);
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const dataArray = Array.isArray(parsedResponse)
        ? parsedResponse
        : [parsedResponse];

      console.log("Report DateWiseData:", dataArray);
      if (dataArray.length === 0) {
        toastService.error("No data found for the selected criteria.");
        setReportGenerated(false);
        setCurrentReportType(null);
      } else {
        toastService.success("Report generated successfully.");
        setReportGenerated(true);
        setCurrentReportType("PlanVsActual");
      }
      setData(dataArray);
    } catch (err) {
      console.error("Error running report:", err);
      toastService.error("Error fetching report data");
      setData([]);
      setReportGenerated(false);
      setCurrentReportType(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const toggleRowExpansion = async (index, rowData) => {
    const newExpandedRows = [...expandedRows];
    const rowIndex = newExpandedRows.indexOf(index);

    if (rowIndex > -1) {
      newExpandedRows.splice(rowIndex, 1);
      setExpandedRows(newExpandedRows);
      setInnerExpandedRows((prev) => {
        const next = { ...prev };
        delete next[rowData.Shiftdate];
        return next;
      });
      return;
    }

    try {
      setLoading(true);
      const params = {
        sDate: rowData.Shiftdate,
        eDate: rowData.Shiftdate,
        facilityid: selFacility,
        triptype: selectedTripType,
      };
      const response = await RepPlanActService.RptPlanActShiftWise(params);
      const parsed =
        typeof response === "string" ? JSON.parse(response) : response;

      console.log("ShiftWise Data:", parsed);

      setShiftData((prev) => ({
        ...prev,
        [rowData.Shiftdate]: parsed || [],
      }));

      newExpandedRows.push(index);
      setExpandedRows(newExpandedRows);
    } catch (err) {
      console.error("Error fetching shift-wise data:", err);
      toastService.error("Failed to load shift-wise data.");
    } finally {
      setLoading(false);
    }
  };

  const handleShiftRowToggle = async (e, parentRow, shiftRow) => {
    if (e) e.preventDefault();

    const shiftKey = shiftRow.shifttime;
    const dateKey = parentRow.Shiftdate;
    const key = `${dateKey}_${shiftKey}`;

    const currentExpanded = innerExpandedRows[dateKey] || {};
    const isCurrentlyExpanded = currentExpanded[shiftKey];

    if (isCurrentlyExpanded) {
      const next = { ...currentExpanded };
      delete next[shiftKey];
      setInnerExpandedRows((prev) => ({
        ...prev,
        [dateKey]: next,
      }));
      return;
    }

    if (!detailedShiftData[key]) {
      try {
        setLoading(true);
        const params = {
          sDate: dateKey,
          facilityid: selFacility,
          triptype: selectedTripType,
          shift: shiftKey,
        };
        const resp = await RepPlanActService.RptPlanActDetailed(params);
        const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;

        setDetailedShiftData((prev) => ({
          ...prev,
          [key]: { data: parsed || [] },
        }));
      } catch (err) {
        console.error("Error fetching detailed shift data:", err);
        toastService.error("Failed to load detailed data.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    setInnerExpandedRows((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        [shiftKey]: true,
      },
    }));
  };

  const getUniqueValues = (field) => {
    // Accumulate values from all loaded detailed data
    const allDetails = Object.values(detailedShiftData)
      .flatMap(item => item.data || []);

    // Also include vendorName if we are looking for ActVendor (mapped to vendorName in export)
    // Field 'PlanVendor' maps to 'PlanVendor'
    // Field 'ActVendor' maps to 'vendorName' in detailRow based on export logic
    let targetField = field;
    if (field === 'ActVendor') targetField = 'vendorName';

    const values = allDetails.map((item) => item[targetField]).filter(Boolean);
    return [...new Set(values)].map((val) => ({ label: val, value: val }));
  };

  const clearAdvancedFilters = () => {
    setFilters({ PlanVendor: null, ActVendor: null });
    if (op.current) op.current.hide();
    toastService.info("Filters cleared");
  };

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply advanced filters
    if (filters.PlanVendor && filters.PlanVendor.length > 0) {
      filtered = filtered.filter((item) => {
        // Advanced filters apply to the detailed shifts or the dates themselves?
        // Note: The original code lacked the advanced filter logic in this hook!
        // Adding safety check if item has PlanVendor (which it might not at the top DATE level).
        return true; // We'll leave this basic for now to avoid breaking tree view logic
      });
    }

    if (!globalFilter || globalFilter.trim() === "") {
      return filtered;
    }
    const searchLower = globalFilter.toLowerCase();
    return filtered.filter((item) => {
        // Fast path for top-level date summary rows
        const valuesToSearch = [
            item.Shiftdate, item.PlanedRoutes, item.RecordedRoutes,
            item.PlanedKm, item.ActualKm
        ];
        return valuesToSearch.some((val) =>
            val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
        );
    });
  }, [data, globalFilter, filters]);

  return (
    <div>
      <Loader isVisible={loading} fullScreen={true} />
      <Header pageTitle={"Plan Vs Actual Information"} />
      <Sidebar />

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
          .plan-act-table thead th {
            background-color: #f9f9fb !important;
            font-weight: 800;
            border: 1px solid #dee2e6;
            padding: 12px 5px;
            font-size: 13px;
            text-align: center;
            vertical-align: middle;
            color: #545557;
          }
          .plan-act-table tbody td {
            padding: 0.5rem;
            border: 1px solid #dee2e6;
            font-size: 0.875rem;
            text-align: center;
            vertical-align: middle;
          }
          .plan-act-table .table-light th {
            background-color: #f9f9fb !important;
          }
          .nested-table thead th {
            background-color: #f9f9fb !important;
            font-weight: 800;
            border: 1px solid #dee2e6;
            padding: 12px 5px;
            font-size: 13px;
            text-align: center;
            color: #545557;
          }
          .nested-table tbody td {
            padding: 0.5rem;
            border: 1px solid #dee2e6;
            font-size: 0.8125rem;
            text-align: center;
          }
          .detail-table thead th {
            background-color: #f9f9fb !important;
            font-weight: 800;
            border: 1px solid #dee2e6;
            padding: 12px 5px;
            font-size: 13px;
            text-align: center;
            color: #545557;
          }
          .detail-table tbody td {
            padding: 0.4rem;
            border: 1px solid #dee2e6;
            font-size: 0.75rem;
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
              <label htmlFor="fromDate" className="form-label">
                From Date <span>*</span>
              </label>
              <div className="custom-calendar-wrapper">
                <img
                  src={calendarIcon}
                  alt="calendar"
                  className="custom-calendar-icon"
                />
                <Calendar
                  id="fromDate"
                  className="w-100 custom-calendar-input"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.value)}
                  dateFormat="mm/dd/yy"
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-2 col-lg-2">
              <label htmlFor="toDate" className="form-label">
                To Date <span>*</span>
              </label>
              <div className="custom-calendar-wrapper">
                <img
                  src={calendarIcon}
                  alt="calendar"
                  className="custom-calendar-icon"
                />
                <Calendar
                  id="toDate"
                  className="w-100 custom-calendar-input"
                  value={toDate}
                  onChange={(e) => setToDate(e.value)}
                  dateFormat="mm/dd/yy"
                />
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-3">
              <label htmlFor="facility" className="form-label">
                Facility Name
              </label>
              <Dropdown
                id="facility"
                options={facilities}
                value={selFacility}
                onChange={(e) => setSelFacility(e.value)}
                optionLabel="label"
                placeholder="Select Facility"
                className="w-100"
                filter
              />
            </div>
            <div className="col-12 col-sm-6 col-md-3 col-lg-3">
              <label htmlFor="tripType" className="form-label">
                Trip Type
              </label>
              <Dropdown
                id="tripType"
                options={tripTypeOptions}
                optionLabel="label"
                value={selectedTripType}
                onChange={(e) => setSelectedTripType(e.value)}
                placeholder="Select Trip Type"
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

        {!reportGenerated && (
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

        {reportGenerated && (
          <div className="row">
            <div className="col-12">
              <div className="card_tb">
                <div className="p-3">
                  <TableToolbar
                    search={globalFilter}
                    onSearch={(e) => setGlobalFilter(e.target.value)}
                    onRefresh={handleRunReport}
                    onExport={exportToExcel}
                    showFilter={true}
                    overlayRef={op}
                    filterButtonRef={filterButtonRef}
                    filters={filters}
                    setFilters={setFilters}
                    activeFilterCount={
                      Object.values(filters).filter(
                        (f) => Array.isArray(f) && f.length > 0
                      ).length
                    }
                  >
                    <div className="p-3">
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="fw-bold mb-1">Plan Vendor</label>
                          <MultiSelect
                            value={filters.PlanVendor}
                            options={getUniqueValues("PlanVendor")}
                            onChange={(e) =>
                              setFilters({ ...filters, PlanVendor: e.value })
                            }
                            placeholder="Select Plan Vendor"
                            className="w-100"
                            display="chip"
                          />
                        </div>
                        <div className="col-12">
                          <label className="fw-bold mb-1">Actual Vendor</label>
                          <MultiSelect
                            value={filters.ActVendor}
                            options={getUniqueValues("ActVendor")}
                            onChange={(e) =>
                              setFilters({ ...filters, ActVendor: e.value })
                            }
                            placeholder="Select Actual Vendor"
                            className="w-100"
                            display="chip"
                          />
                        </div>
                        <div className="col-12 d-flex justify-content-end mt-3">
                          <Button
                            label="Clear all filters"
                            icon="pi pi-filter-slash"
                            className="p-button-outlined p-button-secondary w-100"
                            onClick={clearAdvancedFilters}
                            size="small"
                          />
                        </div>
                      </div>
                    </div>
                  </TableToolbar>

                  <div className="table-responsive">
                    <table className="table table-sm mb-0 plan-act-table custom-html-table">
                      <thead className="table-light">
                        <tr>
                          <th rowSpan={2} style={{ width: "40px" }}></th>
                          <th rowSpan={2} style={{ textAlign: "left" }}>
                            Date
                          </th>
                          <th colSpan={4} className="text-center">
                            Routes
                          </th>
                          <th colSpan={5} className="text-center">
                            Employees
                          </th>
                        </tr>
                        <tr>
                          <th>Planned</th>
                          <th>Executed</th>
                          <th>Pending</th>
                          <th>Cancelled</th>
                          <th>Rostered</th>
                          <th>UnRostered</th>
                          <th>Boarded</th>
                          <th>No-Show</th>
                          {/* <th>OTBYTPT</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="text-center p-4">
                              {error ? `Error: ${error}` : "No records found"}
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((row, index) => (
                            <React.Fragment key={index}>
                              <tr
                                className={`${index % 2 !== 0 ? "ota-row-odd" : ""
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
                                    {expandedRows.includes(index) ? (
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
                                  {row.Shiftdate}
                                </td>
                                <td>{row.PlanedRoutes}</td>
                                <td>{row.RecordedRoutes}</td>
                                <td>{row.PendingRoutes}</td>
                                <td>{row.CancelledRoutes}</td>
                                <td>{row.PlanedEmployee}</td>
                                <td>{row.UnRosteredEmp}</td>
                                <td>{row.BoardedEmployee}</td>
                                <td>{row.NoShowEmp}</td>
                                {/* <td>{row.CancelledEmployee}</td> */}
                              </tr>

                              {expandedRows.includes(index) && (
                                <tr>
                                  <td colSpan={11} className="leftStrip p-2">
                                    <div className="expanded-content">
                                      <div className="table-responsive">
                                        <table className="table table-sm table-bordered mb-0 nested-table">
                                          <thead>
                                            <tr>
                                              <th
                                                rowSpan={2}
                                                style={{ width: "40px" }}
                                              ></th>
                                              <th rowSpan={2}>Shift</th>
                                              <th colSpan={4}>Routes</th>
                                              <th colSpan={5}>Employees</th>
                                            </tr>
                                            <tr>
                                              <th>Planned</th>
                                              <th>Executed</th>
                                              <th>Pending</th>
                                              <th>Cancelled</th>
                                              <th>Rostered</th>
                                              <th>UnRostered</th>
                                              <th>Boarded</th>
                                              <th>No-Show</th>
                                              <th>Cancelled</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {(
                                              shiftData[row.Shiftdate] || []
                                            ).map((shiftRow, sIdx) => {
                                              const innerExpanded =
                                                innerExpandedRows[
                                                row.Shiftdate
                                                ] || {};
                                              const isExpanded =
                                                innerExpanded[
                                                shiftRow.shifttime
                                                ];

                                              return (
                                                <React.Fragment
                                                  key={shiftRow.shifttime}
                                                >
                                                  <tr
                                                    className={`${sIdx % 2 !== 0
                                                      ? "ota-row-odd"
                                                      : ""
                                                      } ota-row-hover`}
                                                  >
                                                    <td>
                                                      <a
                                                        href="#!"
                                                        onClick={(e) =>
                                                          handleShiftRowToggle(
                                                            e,
                                                            row,
                                                            shiftRow
                                                          )
                                                        }
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
                                                    <td>
                                                      {shiftRow.shifttime}
                                                    </td>
                                                    <td>
                                                      {shiftRow.PlanedRoutes}
                                                    </td>
                                                    <td>
                                                      {shiftRow.RecordedRoutes}
                                                    </td>
                                                    <td>
                                                      {shiftRow.PendingRoutes}
                                                    </td>
                                                    <td>
                                                      {shiftRow.CancelledRoutes}
                                                    </td>
                                                    <td>
                                                      {shiftRow.PlanedEmployee}
                                                    </td>
                                                    <td>
                                                      {shiftRow.UnRosteredEmp}
                                                    </td>
                                                    <td>
                                                      {shiftRow.BoardedEmployee}
                                                    </td>
                                                    <td>
                                                      {shiftRow.NoShowEmp}
                                                    </td>
                                                    <td>
                                                      {
                                                        shiftRow.CancelledEmployee
                                                      }
                                                    </td>
                                                  </tr>

                                                  {isExpanded && (
                                                    <tr>
                                                      <td
                                                        colSpan={11}
                                                        className="leftStrip p-2"
                                                      >
                                                        <div className="expanded-content">
                                                          <div className="table-responsive">
                                                            <table className="table table-sm table-bordered mb-0 detail-table">
                                                              <thead>
                                                                <tr>
                                                                  <th>
                                                                    Route ID
                                                                  </th>
                                                                  <th>
                                                                    Plan Vendor
                                                                  </th>
                                                                  <th>
                                                                    Act Vendor
                                                                  </th>
                                                                  <th>
                                                                    Vehicle Type
                                                                  </th>
                                                                  <th>
                                                                    Vehicle No
                                                                  </th>
                                                                  <th>Shift</th>
                                                                  <th>
                                                                    Trip Type
                                                                  </th>
                                                                  {/* <th>
                                                                    Planned Kms
                                                                  </th> */}
                                                                  <th>
                                                                     Kms Runs
                                                                  </th>
                                                                  {/* <th>
                                                                    Approved Kms
                                                                  </th> */}
                                                                  <th>
                                                                    Planned
                                                                    Stops
                                                                  </th>
                                                                  <th>
                                                                    Actual Stops
                                                                  </th>
                                                                </tr>
                                                              </thead>
                                                              <tbody>
                                                                {(() => {
                                                                  const key = `${row.Shiftdate}_${shiftRow.shifttime}`;
                                                                  const detail =
                                                                    detailedShiftData[
                                                                      key
                                                                    ]?.data ||
                                                                    [];

                                                                  // Apply filters
                                                                  let filteredDetail = detail;
                                                                  if (filters.PlanVendor && filters.PlanVendor.length > 0) {
                                                                    filteredDetail = filteredDetail.filter(d => filters.PlanVendor.includes(d.PlanVendor));
                                                                  }
                                                                  if (filters.ActVendor && filters.ActVendor.length > 0) {
                                                                    filteredDetail = filteredDetail.filter(d => filters.ActVendor.includes(d.vendorName));
                                                                  }

                                                                  if (
                                                                    filteredDetail.length ===
                                                                    0
                                                                  ) {
                                                                    return (
                                                                      <tr>
                                                                        <td
                                                                          colSpan={
                                                                            12
                                                                          }
                                                                          className="text-center p-3"
                                                                        >
                                                                          No
                                                                          records
                                                                          found
                                                                        </td>
                                                                      </tr>
                                                                    );
                                                                  }

                                                                  return filteredDetail.map(
                                                                    (
                                                                      detailRow,
                                                                      dIdx
                                                                    ) => (
                                                                      <tr
                                                                        key={
                                                                          dIdx
                                                                        }
                                                                        className={`${dIdx %
                                                                          2 !==
                                                                          0
                                                                          ? "ota-row-odd"
                                                                          : ""
                                                                          } ota-row-hover`}
                                                                      >
                                                                        <td>
                                                                          {
                                                                            detailRow.RouteID
                                                                          }
                                                                        </td>
                                                                        <td>
                                                                          {
                                                                            detailRow.PlanVendor
                                                                          }
                                                                        </td>
                                                                        <td>
                                                                          {
                                                                            detailRow.vendorName
                                                                          }
                                                                        </td>
                                                                        <td>
                                                                          {
                                                                            detailRow.vehicle
                                                                          }
                                                                        </td>
                                                                        <td>
                                                                          {
                                                                            detailRow.vehicleNo
                                                                          }
                                                                        </td>
                                                                        <td>
                                                                          {
                                                                            detailRow.shiftTime
                                                                          }
                                                                        </td>
                                                                        <td>
                                                                          {
                                                                            detailRow.tripType
                                                                          }
                                                                        </td>
                                                                        {/* <td>
                                                                          {
                                                                            detailRow.approvedKm
                                                                          }
                                                                        </td> */}
                                                                        <td>
                                                                          {
                                                                            detailRow.actTotalKm
                                                                          }
                                                                        </td>
                                                                        {/* <td>
                                                                          {
                                                                            detailRow.approvedKm
                                                                          }
                                                                        </td> */}
                                                                        <td>
                                                                          {
                                                                            detailRow.totalStop
                                                                          }
                                                                        </td>
                                                                        <td>
                                                                          {
                                                                            detailRow.actTotalStop
                                                                          }
                                                                        </td>
                                                                      </tr>
                                                                    )
                                                                  );
                                                                })()}
                                                              </tbody>
                                                            </table>
                                                          </div>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  )}
                                                </React.Fragment>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepPlanAct;
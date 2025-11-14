import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import RepVehUsgVenService from "../services/compliance/RepVehUsgVenService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";

const VehicleUtilizationReport = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedTripType, setSelectedTripType] = useState("P");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedDates, setExpandedDates] = useState([]);
  const [expandedVendors, setExpandedVendors] = useState({});

  const UserID = sessionStorage.getItem("ID");

  const tripTypes = [
    { label: "Pick", value: "P" },
    { label: "Drop", value: "D" },
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await RepVehUsgVenService.SelectFacility({
        Userid: UserID,
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
      console.error("Error fetching facilities:", error);
      toastService.error("Error fetching facilities");
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const groupDataByDateVendorVehicle = (data) => {
    const groupedByDate = {};

    data.forEach((item) => {
      const date = item.shiftDate;

      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          shiftDate: date,
          vendors: {},
          TotalRoutes: 0,
          TotalCapacity: 0,
          TotalEmps: 0,
          ActTotalEmps: 0,
        };
      }

      const dateGroup = groupedByDate[date];
      const vendor = item.Vendor;

      if (!dateGroup.vendors[vendor]) {
        dateGroup.vendors[vendor] = {
          Vendor: vendor,
          vehicles: [],
          TotalRoutes: 0,
          TotalCapacity: 0,
          TotalEmps: 0,
          ActTotalEmps: 0,
        };
      }

      dateGroup.vendors[vendor].vehicles.push(item);
      dateGroup.vendors[vendor].TotalRoutes += item.TotalRoutes || 0;
      dateGroup.vendors[vendor].TotalCapacity += item.TotalCapacity || 0;
      dateGroup.vendors[vendor].TotalEmps += item.TotalEmps || 0;
      dateGroup.vendors[vendor].ActTotalEmps += item.ActTotalEmps || 0;

      dateGroup.TotalRoutes += item.TotalRoutes || 0;
      dateGroup.TotalCapacity += item.TotalCapacity || 0;
      dateGroup.TotalEmps += item.TotalEmps || 0;
      dateGroup.ActTotalEmps += item.ActTotalEmps || 0;
    });

    return Object.values(groupedByDate).map((dateGroup) => {
      const planUtilPer =
        dateGroup.TotalCapacity > 0
          ? ((dateGroup.TotalEmps / dateGroup.TotalCapacity) * 100).toFixed(2)
          : 0;
      const actOccPer =
        dateGroup.TotalCapacity > 0
          ? ((dateGroup.ActTotalEmps / dateGroup.TotalCapacity) * 100).toFixed(
              2
            )
          : 0;

      const vendors = Object.values(dateGroup.vendors).map((vendorGroup) => {
        const vPlanUtilPer =
          vendorGroup.TotalCapacity > 0
            ? (
                (vendorGroup.TotalEmps / vendorGroup.TotalCapacity) *
                100
              ).toFixed(2)
            : 0;
        const vActOccPer =
          vendorGroup.TotalCapacity > 0
            ? (
                (vendorGroup.ActTotalEmps / vendorGroup.TotalCapacity) *
                100
              ).toFixed(2)
            : 0;

        return {
          ...vendorGroup,
          PlanOccPer: parseFloat(vPlanUtilPer),
          ActOccPer: parseFloat(vActOccPer),
        };
      });

      return {
        ...dateGroup,
        vendors,
        PlanOccPer: parseFloat(planUtilPer),
        ActOccPer: parseFloat(actOccPer),
      };
    });
  };

  const handleSearch = async () => {
    if (!selectedFacility) {
      toastService.error("Please select a facility");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);

    try {
      const params = {
        sDate: formatDate(startDate),
        eDate: formatDate(endDate),
        facilityId: selectedFacility,
        tripType: selectedTripType,
      };

      const response = await RepVehUsgVenService.RptVehUsgVen(params);

      let parsedData = [];
      if (typeof response === "string") {
        parsedData = JSON.parse(response);
      } else if (response && response.data) {
        parsedData =
          typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;
      } else {
        parsedData = response;
      }

      const validatedData = Array.isArray(parsedData)
        ? parsedData
        : [parsedData];

      setRawData(validatedData);
      const groupedData = groupDataByDateVendorVehicle(validatedData);
      setReportData(groupedData);

      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        if (validatedData.length > 0) {
          toastService.success(
            `Report data fetched successfully. ${validatedData.length} records found.`
          );
        } else {
          toastService.warn("No records found");
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
      setRawData([]);
      setError(error.message);

      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        toastService.error("Error fetching report data: " + error.message);
      }, 100);
    }
  };

  const exportExcel = () => {
    if (rawData.length === 0) {
      toastService.error("No data to export");
      return;
    }
    const fileName = `vehicle_utilization_report_${new Date()
      .toISOString()
      .slice(0, 10)}`;
    exportToCSV(rawData, fileName);
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            const stringValue = String(value);
            if (
              stringValue.includes(",") ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleDateExpansion = (index) => {
    const newExpandedDates = [...expandedDates];
    const dateIndex = newExpandedDates.indexOf(index);
    if (dateIndex > -1) {
      newExpandedDates.splice(dateIndex, 1);
      // Clear vendor expansions for this date
      const newExpandedVendors = { ...expandedVendors };
      delete newExpandedVendors[index];
      setExpandedVendors(newExpandedVendors);
    } else {
      newExpandedDates.push(index);
    }
    setExpandedDates(newExpandedDates);
  };

  const toggleVendorExpansion = (dateIndex, vendorIndex) => {
    const key = `${dateIndex}-${vendorIndex}`;
    const newExpandedVendors = { ...expandedVendors };

    if (!newExpandedVendors[dateIndex]) {
      newExpandedVendors[dateIndex] = [];
    }

    const vendorIndexPos = newExpandedVendors[dateIndex].indexOf(vendorIndex);
    if (vendorIndexPos > -1) {
      newExpandedVendors[dateIndex].splice(vendorIndexPos, 1);
    } else {
      newExpandedVendors[dateIndex].push(vendorIndex);
    }

    setExpandedVendors(newExpandedVendors);
  };

  const paginatorLeft = (
    <Button
      type="button"
      icon="pi pi-refresh"
      text
      onClick={() => handleSearch()}
      tooltip="Refresh"
      tooltipOptions={{ position: "top" }}
    />
  );

  const paginatorRight = (
    <Button
      type="button"
      icon="pi pi-download"
      text
      onClick={exportExcel}
      tooltip="Export"
      tooltipOptions={{ position: "top" }}
    />
  );

  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header pageTitle="Vehicle Utilization" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Display Vehicle Utilization</h6>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                  <label htmlFor="startDate" className="form-label">
                    From Date <span>*</span>
                  </label>
                  <Calendar
                    id="startDate"
                    className="w-100"
                    value={startDate}
                    onChange={(e) => setStartDate(e.value)}
                    dateFormat="mm/dd/yy"
                    showIcon
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                  <label htmlFor="endDate" className="form-label">
                    To Date <span>*</span>
                  </label>
                  <Calendar
                    id="endDate"
                    className="w-100"
                    value={endDate}
                    onChange={(e) => setEndDate(e.value)}
                    dateFormat="mm/dd/yy"
                    showIcon
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                  <label htmlFor="facility" className="form-label">
                    Facility <span>*</span>
                  </label>
                  <Dropdown
                    id="facility"
                    placeholder="Select Facility"
                    value={selectedFacility}
                    options={facilities}
                    onChange={(e) => setSelectedFacility(e.value)}
                    className="w-100"
                    filter
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                  <label htmlFor="tripType" className="form-label">
                    Trip Type <span>*</span>
                  </label>
                  <Dropdown
                    id="tripType"
                    value={selectedTripType}
                    options={tripTypes}
                    onChange={(e) => setSelectedTripType(e.value)}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-flex align-items-end">
                  <Button
                    label="Run Report"
                    className="btn btn-primary w-100"
                    onClick={handleSearch}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card_tb">
              {loading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : reportData.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">Shift Date</th>
                        <th className="text-center">Vendor</th>
                        <th className="text-center d-none d-md-table-cell">
                          Vehicle Type
                        </th>
                        <th className="text-center">Total Trips</th>
                        <th className="text-center d-none d-lg-table-cell">
                          Total Capacity
                        </th>
                        <th className="text-center d-none d-md-table-cell">
                          Employee Scheduled
                        </th>
                        <th className="text-center d-none d-xl-table-cell">
                          Planned Utilization%
                        </th>
                        <th className="text-center d-none d-lg-table-cell">
                          Actual Employees Boarded
                        </th>
                        <th className="text-center">Actual Occupancy %</th>
                        <th style={{ width: "40px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((dateRow, dateIndex) => (
                        <React.Fragment key={dateIndex}>
                          {/* Date Level Row */}
                          <tr>
                            <td className="text-center fw-bold">
                              {dateRow.shiftDate}
                            </td>
                            <td className="text-center"></td>
                            <td className="text-center d-none d-md-table-cell"></td>
                            <td className="text-center fw-bold">
                              {dateRow.TotalRoutes}
                            </td>
                            <td className="text-center fw-bold d-none d-lg-table-cell">
                              {dateRow.TotalCapacity}
                            </td>
                            <td className="text-center fw-bold d-none d-md-table-cell">
                              {dateRow.TotalEmps}
                            </td>
                            <td className="text-center fw-bold d-none d-xl-table-cell">
                              {dateRow.PlanOccPer}
                            </td>
                            <td className="text-center fw-bold d-none d-lg-table-cell">
                              {dateRow.ActTotalEmps}
                            </td>
                            <td className="text-center fw-bold">
                              {dateRow.ActOccPer}
                            </td>
                            <td>
                              <a
                                href="#!"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleDateExpansion(dateIndex);
                                }}
                              >
                                {expandedDates.includes(dateIndex) ? (
                                  <span
                                    className="material-icons"
                                    style={{ fontSize: "20px" }}
                                  >
                                    remove_circle
                                  </span>
                                ) : (
                                  <span
                                    className="material-icons"
                                    style={{ fontSize: "20px" }}
                                  >
                                    add_circle
                                  </span>
                                )}
                              </a>
                            </td>
                          </tr>

                          {/* Vendor Level Rows - Expanded Section */}
                          {expandedDates.includes(dateIndex) && (
                            <tr>
                              <td colSpan="10" className="leftStrip p-2">
                                <div className="expanded-content">
                                  <div className="table-responsive">
                                    <table className="table table-sm table-bordered mb-0">
                                      <thead>
                                        <tr>
                                          <th>Vendor</th>
                                          <th>Total Trips</th>
                                          <th className="d-none d-lg-table-cell">
                                            Total Capacity
                                          </th>
                                          <th className="d-none d-md-table-cell">
                                            Employee Scheduled
                                          </th>
                                          <th className="d-none d-xl-table-cell">
                                            Planned Utilization%
                                          </th>
                                          <th className="d-none d-lg-table-cell">
                                            Actual Employees Boarded
                                          </th>
                                          <th>Actual Occupancy %</th>
                                          <th style={{ width: "40px" }}></th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {dateRow.vendors.map(
                                          (vendorRow, vendorIndex) => (
                                            <React.Fragment
                                              key={`${dateIndex}-${vendorIndex}`}
                                            >
                                              <tr>
                                                <td className="fw-bold">
                                                  {vendorRow.Vendor}
                                                </td>
                                                <td className="fw-bold">
                                                  {vendorRow.TotalRoutes}
                                                </td>
                                                <td className="fw-bold d-none d-lg-table-cell">
                                                  {vendorRow.TotalCapacity}
                                                </td>
                                                <td className="fw-bold d-none d-md-table-cell">
                                                  {vendorRow.TotalEmps}
                                                </td>
                                                <td className="fw-bold d-none d-xl-table-cell">
                                                  {vendorRow.PlanOccPer}
                                                </td>
                                                <td className="fw-bold d-none d-lg-table-cell">
                                                  {vendorRow.ActTotalEmps}
                                                </td>
                                                <td className="fw-bold">
                                                  {vendorRow.ActOccPer}
                                                </td>
                                                <td>
                                                  <a
                                                    href="#!"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      toggleVendorExpansion(
                                                        dateIndex,
                                                        vendorIndex
                                                      );
                                                    }}
                                                  >
                                                    {expandedVendors[
                                                      dateIndex
                                                    ]?.includes(vendorIndex) ? (
                                                      <span
                                                        className="material-icons"
                                                        style={{
                                                          fontSize: "20px",
                                                        }}
                                                      >
                                                        remove_circle
                                                      </span>
                                                    ) : (
                                                      <span
                                                        className="material-icons"
                                                        style={{
                                                          fontSize: "20px",
                                                        }}
                                                      >
                                                        add_circle
                                                      </span>
                                                    )}
                                                  </a>
                                                </td>
                                              </tr>

                                              {/* Vehicle Type Level Rows - Expanded Section */}
                                              {expandedVendors[
                                                dateIndex
                                              ]?.includes(vendorIndex) && (
                                                <tr>
                                                  <td
                                                    colSpan="8"
                                                    className="leftStrip p-2"
                                                  >
                                                    <div className="expanded-content">
                                                      <div className="table-responsive">
                                                        <table className="table table-sm table-bordered mb-0">
                                                          <thead>
                                                            <tr>
                                                              <th>
                                                                Vehicle Type
                                                              </th>
                                                              <th>
                                                                Total Trips
                                                              </th>
                                                              <th className="d-none d-lg-table-cell">
                                                                Total Capacity
                                                              </th>
                                                              <th className="d-none d-md-table-cell">
                                                                Employee
                                                                Scheduled
                                                              </th>
                                                              <th className="d-none d-xl-table-cell">
                                                                Planned
                                                                Utilization%
                                                              </th>
                                                              <th className="d-none d-lg-table-cell">
                                                                Actual Employees
                                                                Boarded
                                                              </th>
                                                              <th>
                                                                Actual Occupancy
                                                                %
                                                              </th>
                                                            </tr>
                                                          </thead>
                                                          <tbody>
                                                            {vendorRow.vehicles.map(
                                                              (
                                                                vehicleRow,
                                                                vehicleIndex
                                                              ) => (
                                                                <tr
                                                                  key={
                                                                    vehicleIndex
                                                                  }
                                                                >
                                                                  <td>
                                                                    {
                                                                      vehicleRow.vehicleType
                                                                    }
                                                                  </td>
                                                                  <td>
                                                                    {
                                                                      vehicleRow.TotalRoutes
                                                                    }
                                                                  </td>
                                                                  <td className="d-none d-lg-table-cell">
                                                                    {
                                                                      vehicleRow.TotalCapacity
                                                                    }
                                                                  </td>
                                                                  <td className="d-none d-md-table-cell">
                                                                    {
                                                                      vehicleRow.TotalEmps
                                                                    }
                                                                  </td>
                                                                  <td className="d-none d-xl-table-cell">
                                                                    {vehicleRow.PlanOccPer?.toFixed(
                                                                      2
                                                                    )}
                                                                  </td>
                                                                  <td className="d-none d-lg-table-cell">
                                                                    {
                                                                      vehicleRow.ActTotalEmps
                                                                    }
                                                                  </td>
                                                                  <td>
                                                                    {vehicleRow.ActOccPer?.toFixed(
                                                                      2
                                                                    )}
                                                                  </td>
                                                                </tr>
                                                              )
                                                            )}
                                                          </tbody>
                                                        </table>
                                                      </div>
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                  <div className="d-flex justify-content-between align-items-center p-2">
                    {paginatorLeft}
                    {paginatorRight}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted">
                  {error
                    ? `Error: ${error}`
                    : "Please select a facility and click 'Run Report' to view results"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VehicleUtilizationReport;

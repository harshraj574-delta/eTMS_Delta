import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import OTAReportService from "../services/compliance/OTAReportService";
import { toastService } from "../services/toastService";
import { ToastContainer, toast } from "react-toastify";

const OTAReport = () => {
  const [facilities, setFacilities] = useState([]);
  const [vendors, setVendors] = useState([
    { label: "-All Vendors-", value: 0 },
  ]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(0);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [currentReportType, setCurrentReportType] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [detailedData, setDetailedData] = useState([]);
  const [rawShiftData, setRawShiftData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);

  const UserID = sessionStorage.getItem("ID");
  const dt = useRef(null);

  const reportTypes = [
    { label: "Detailed", value: "detailed" },
    { label: "Shift Wise", value: "shiftwise" },
    { label: "Vendor Wise", value: "vendorwise" },
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacility) {
      fetchVendors();
    }
  }, [selectedFacility]);

  const fetchFacilities = async () => {
    try {
      const response = await OTAReportService.SelectFacility({
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

  const fetchVendors = async () => {
    try {
      const response = await OTAReportService.GetVendorByFacility({
        facilityId: selectedFacility,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.vendor || item.vendorName,
            value: item.Id,
          }))
        : [];
      setVendors([{ label: "-All Vendors-", value: 0 }, ...formattedData]);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toastService.error("Error fetching vendors");
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

  const groupShiftDataByDate = (shiftData) => {
    const grouped = {};

    shiftData.forEach((shift) => {
      const date = shift.shiftDate;
      if (!grouped[date]) {
        grouped[date] = {
          shiftDate: date,
          shifts: [],
          TotalCabs: 0,
          Arrived: 0,
          OnTime: 0,
          Delayed: 0,
        };
      }
      grouped[date].shifts.push(shift);
      grouped[date].TotalCabs += shift.TotalCabs || 0;
      grouped[date].Arrived += shift.Arrived || 0;
      grouped[date].OnTime += shift.OnTime || 0;
      grouped[date].Delayed += shift.Delayed || 0;
    });

    const result = Object.values(grouped).map((group) => {
      const onTimePer =
        group.TotalCabs > 0
          ? ((group.OnTime / group.TotalCabs) * 100).toFixed(1)
          : 0;
      const delayedPer =
        group.TotalCabs > 0
          ? ((group.Delayed / group.TotalCabs) * 100).toFixed(1)
          : 0;

      return {
        ...group,
        OnTimePer: parseFloat(onTimePer),
        DelayedPer: parseFloat(delayedPer),
      };
    });

    return result;
  };

  const groupVendorDataByDate = (vendorData) => {
    const grouped = {};

    vendorData.forEach((item) => {
      const date = item.shiftDate;
      if (!grouped[date]) {
        grouped[date] = {
          shiftDate: date,
          vendors: [],
          TotalCabs: 0,
          Arrived: 0,
          OnTime: 0,
          Delayed: 0,
        };
      }
      grouped[date].vendors.push(item);
      grouped[date].TotalCabs += item.TotalCabs || 0;
      grouped[date].Arrived += item.Arrived || 0;
      grouped[date].OnTime += item.OnTime || 0;
      grouped[date].Delayed += item.Delayed || 0;
    });

    const result = Object.values(grouped).map((group) => {
      const onTimePer =
        group.TotalCabs > 0
          ? ((group.OnTime / group.TotalCabs) * 100).toFixed(1)
          : 0;
      const delayedPer =
        group.TotalCabs > 0
          ? ((group.Delayed / group.TotalCabs) * 100).toFixed(1)
          : 0;

      return {
        ...group,
        OnTimePer: parseFloat(onTimePer),
        DelayedPer: parseFloat(delayedPer),
      };
    });

    return result;
  };

  const handleSearch = async () => {
    if (!selectedReportType) {
      toastService.error("Please select a report type");
      return;
    }

    if (!selectedFacility) {
      toastService.error("Please select a facility");
      return;
    }

    if (selectedReportType === "detailed" && selectedVendor === null) {
      toastService.error("Please select a vendor");
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
      };

      let response;

      switch (selectedReportType) {
        case "detailed":
          response = await OTAReportService.RepOTAdetail({
            ...params,
            vendorId: selectedVendor,
          });
          break;
        case "shiftwise":
          response = await OTAReportService.RptArrivalShiftWise(params);
          break;
        case "vendorwise":
          response = await OTAReportService.RptArrivalVendorWise(params);
          break;
        default:
          throw new Error("Invalid report type");
      }

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

      if (selectedReportType === "shiftwise") {
        setRawShiftData(validatedData);
        const groupedData = groupShiftDataByDate(validatedData);
        setReportData(groupedData);
      } else if (selectedReportType === "vendorwise") {
        const groupedVendorData = groupVendorDataByDate(validatedData);
        setReportData(groupedVendorData);
        setDetailedData(validatedData);
      } else {
        setReportData(validatedData);
      }

      if (selectedReportType === "shiftwise") {
        const detailResponse = await OTAReportService.RepOTAdetail({
          ...params,
          vendorId: 0,
        });

        let detailParsedData = [];
        if (typeof detailResponse === "string") {
          detailParsedData = JSON.parse(detailResponse);
        } else if (detailResponse && detailResponse.data) {
          detailParsedData =
            typeof detailResponse.data === "string"
              ? JSON.parse(detailResponse.data)
              : detailResponse.data;
        } else {
          detailParsedData = detailResponse;
        }

        const detailValidatedData = Array.isArray(detailParsedData)
          ? detailParsedData
          : [detailParsedData];

        setDetailedData(detailValidatedData);
      }

      setCurrentReportType(selectedReportType);
      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        if (validatedData.length > 0) {
          toastService.success(
            `Report data fetched successfully.`
          );
        } else {
          toastService.warn("No records found");
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
      setDetailedData([]);
      setError(error.message);

      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        toastService.error("Error fetching report data: " + error.message);
      }, 100);
    }
  };

  const exportExcel = () => {
    const fileName = `ota_report_${currentReportType}_${new Date().toISOString().slice(0, 10)}`;

    if (currentReportType === "detailed") {
      if (dt.current) {
        dt.current.exportCSV({ fileName });
      }
      return;
    }

    if (currentReportType === "shiftwise") {
      if (rawShiftData.length === 0) {
        toastService.error("No data to export");
        return;
      }
      exportToCSV(rawShiftData, fileName);
      return;
    }

    if (currentReportType === "vendorwise") {
      if (detailedData.length === 0) {
        toastService.error("No data to export");
        return;
      }
      exportToCSV(detailedData, fileName);
      return;
    }
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

  const formatArrivalTime = (rowData) => {
    if (!rowData.ArrivalTime) return "-";
    const date = new Date(rowData.ArrivalTime);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleRowExpansion = (index) => {
    const newExpandedRows = [...expandedRows];
    const rowIndex = newExpandedRows.indexOf(index);
    if (rowIndex > -1) {
      newExpandedRows.splice(rowIndex, 1);
    } else {
      newExpandedRows.push(index);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header pageTitle="OTA Reports" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">On Time Arrival Reports</h6>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="reportType" className="form-label">
                    Report Type <span>*</span>
                  </label>
                  <Dropdown
                    id="reportType"
                    placeholder="Select Report Type"
                    value={selectedReportType}
                    options={reportTypes}
                    onChange={(e) => {
                      setSelectedReportType(e.value);
                      if (e.value !== "detailed") {
                        setSelectedVendor(0);
                      }
                    }}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                  <label htmlFor="facility" className="form-label">
                    Facility <span>*</span>
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
                    filter
                  />
                </div>
                {selectedReportType === "detailed" && (
                  <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                    <label htmlFor="vendor" className="form-label">
                      Vendor <span>*</span>
                    </label>
                    <Dropdown
                      id="vendor"
                      value={selectedVendor}
                      options={vendors}
                      placeholder="Select Vendor"
                      onChange={(e) => setSelectedVendor(e.value)}
                      className="w-100"
                      filter
                    />
                  </div>
                )}
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 d-flex align-items-end">
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
              {currentReportType === "detailed" && (
                <div className="table-responsive">
                  <DataTable
                    value={reportData}
                    ref={dt}
                    paginator
                    rows={50}
                    tableStyle={{ minWidth: "50rem" }}
                    size="small"
                    loading={loading}
                    emptyMessage={
                      error ? `Error: ${error}` : "No records found"
                    }
                    stripedRows
                    paginatorLeft={paginatorLeft}
                    paginatorRight={paginatorRight}
                    rowsPerPageOptions={[50, 100, 200, 300]}
                  >
                    <Column field="Unit" header="Facility" sortable />
                    <Column field="TripDate" header="Trip Date" sortable />
                    <Column field="Shift" header="Shift" sortable />
                    <Column
                      field="ActShift"
                      header="Reporting Time"
                      sortable
                    />
                    <Column field="RouteID" header="Route ID" sortable />
                    <Column
                      field="PlanVendor"
                      header="Plan Vendor"
                      sortable
                    />
                    <Column field="Vendor" header="Vendor" sortable />
                    <Column field="DAY" header="Day" sortable />
                    <Column field="ZONE" header="Zone" sortable />
                    <Column field="Area" header="Area" sortable />
                    <Column
                      field="DriverCode"
                      header="Driver Code"
                      sortable
                    />
                    <Column
                      field="ActualCabNo"
                      header="Actual Cab No"
                      sortable
                    />
                    <Column
                      field="ArrivalTime"
                      header="Arr/Dep Time"
                      sortable
                      body={formatArrivalTime}
                    />
                    <Column field="TIME" header="Time" sortable />
                    <Column field="Remark" header="Trip Remark" sortable />
                    <Column field="NoOfPax" header="No Of Pax" sortable />
                    <Column
                      field="OTA_Category"
                      header="OTA/OTD Category"
                      sortable
                    />
                  </DataTable>
                </div>
              )}

              {currentReportType === "shiftwise" && (
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">Shift Date</th>
                        <th className="text-center d-none d-md-table-cell">
                          Total Cabs
                        </th>
                        <th className="text-center d-none d-md-table-cell">
                          Arrived
                        </th>
                        <th className="text-center">On Time</th>
                        <th className="text-center">Delayed</th>
                        <th className="text-center d-none d-lg-table-cell">
                          On Time %
                        </th>
                        <th className="text-center d-none d-lg-table-cell">
                          Delayed %
                        </th>
                        <th style={{ width: "40px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, index) => (
                        <React.Fragment key={index}>
                          <tr>
                            <td className="text-center">{row.shiftDate}</td>
                            <td className="text-center d-none d-md-table-cell">
                              {row.TotalCabs}
                            </td>
                            <td className="text-center d-none d-md-table-cell">
                              {row.Arrived}
                            </td>
                            <td className="text-center">{row.OnTime}</td>
                            <td className="text-center">{row.Delayed}</td>
                            <td className="text-center d-none d-lg-table-cell">
                              {row.OnTimePer}
                            </td>
                            <td className="text-center d-none d-lg-table-cell">
                              {row.DelayedPer}
                            </td>
                            <td>
                              <a
                                href="#!"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleRowExpansion(index);
                                }}
                              >
                                {expandedRows.includes(index) ? (
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

                          {expandedRows.includes(index) && (
                            <tr>
                              <td colSpan="8" className="leftStrip p-2">
                                <div className="expanded-content">
                                  <div className="table-responsive">
                                    <table className="table table-sm table-bordered mb-0">
                                      <thead>
                                        <tr>
                                          <th>Shift</th>
                                          <th>Total Cabs</th>
                                          <th>Arrived</th>
                                          <th>On Time</th>
                                          <th>Delayed</th>
                                          <th className="d-none d-md-table-cell">
                                            On Time %
                                          </th>
                                          <th className="d-none d-md-table-cell">
                                            Delayed %
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {row.shifts?.map((shift, sIdx) => (
                                          <tr key={sIdx}>
                                            <td>{shift.shiftTime}</td>
                                            <td>{shift.TotalCabs}</td>
                                            <td>{shift.Arrived}</td>
                                            <td>{shift.OnTime}</td>
                                            <td>{shift.Delayed}</td>
                                            <td className="d-none d-md-table-cell">
                                              {shift.OnTimePer}
                                            </td>
                                            <td className="d-none d-md-table-cell">
                                              {shift.DelayedPer}
                                            </td>
                                          </tr>
                                        ))}
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
              )}

              {currentReportType === "vendorwise" && (
                <div className="table-responsive">
                  <table className="table table-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-center">Shift Date</th>
                        <th className="text-center d-none d-md-table-cell">
                          Total Cabs
                        </th>
                        <th className="text-center d-none d-md-table-cell">
                          Arrived
                        </th>
                        <th className="text-center">On Time</th>
                        <th className="text-center">Delayed</th>
                        <th className="text-center d-none d-lg-table-cell">
                          On Time %
                        </th>
                        <th className="text-center d-none d-lg-table-cell">
                          Delayed %
                        </th>
                        <th style={{ width: "40px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((row, index) => (
                        <React.Fragment key={index}>
                          <tr>
                            <td className="text-center">{row.shiftDate}</td>
                            <td className="text-center d-none d-md-table-cell">
                              {row.TotalCabs}
                            </td>
                            <td className="text-center d-none d-md-table-cell">
                              {row.Arrived}
                            </td>
                            <td className="text-center">{row.OnTime}</td>
                            <td className="text-center">{row.Delayed}</td>
                            <td className="text-center d-none d-lg-table-cell">
                              {row.OnTimePer}
                            </td>
                            <td className="text-center d-none d-lg-table-cell">
                              {row.DelayedPer}
                            </td>
                            <td>
                              <a
                                href="#!"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleRowExpansion(index);
                                }}
                              >
                                {expandedRows.includes(index) ? (
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

                          {expandedRows.includes(index) && (
                            <tr>
                              <td colSpan="8" className="leftStrip p-2">
                                <div className="expanded-content">
                                  {row.vendors?.length === 0 ? (
                                    <p>No vendor records found</p>
                                  ) : (
                                    <div className="table-responsive">
                                      <table className="table table-sm table-bordered mb-0">
                                        <thead>
                                          <tr>
                                            <th>Vendor</th>
                                            <th>Total Cabs</th>
                                            <th>Arrived</th>
                                            <th>On Time</th>
                                            <th>Delayed</th>
                                            <th className="d-none d-md-table-cell">
                                              On Time %
                                            </th>
                                            <th className="d-none d-md-table-cell">
                                              Delayed %
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {row.vendors?.map((vendor, vIdx) => (
                                            <tr key={vIdx}>
                                              <td>{vendor.vendorName}</td>
                                              <td>{vendor.TotalCabs}</td>
                                              <td>{vendor.Arrived}</td>
                                              <td>{vendor.OnTime}</td>
                                              <td>{vendor.Delayed}</td>
                                              <td className="d-none d-md-table-cell">
                                                {vendor.OnTimePer}
                                              </td>
                                              <td className="d-none d-md-table-cell">
                                                {vendor.DelayedPer}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
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
              )}

              {!currentReportType && (
                <div className="p-4 text-center text-muted">
                  Please select a report type and click "Show Data" to view
                  results
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OTAReport;
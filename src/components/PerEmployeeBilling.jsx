import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import PerEmployeeBillingService from "../services/compliance/PerEmployeeBillingService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";

const PerEmployeeBilling = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentReportType, setCurrentReportType] = useState(null);

  const UserID = sessionStorage.getItem("ID");
  const dt = useRef(null);

  const reportTypes = [
    { label: "Detailed", value: "detailed" },
    { label: "Process Wise", value: "processwise" },
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await PerEmployeeBillingService.SelectFacility({
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

  const handleSearch = async () => {
    if (!selectedReportType) {
      toastService.error("Please select a report type");
      return;
    }

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
      };

      let response;

      if (selectedReportType === "detailed") {
        response = await PerEmployeeBillingService.SPR_PerEmployeeCost(params);
      } else {
        response = await PerEmployeeBillingService.SPR_ProcessWiseCost(params);
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

      setReportData(validatedData);
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
      setError(error.message);
      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        toastService.error("Error fetching report data: " + error.message);
      }, 100);
    }
  };

  const exportExcel = () => {
    if (dt.current) {
      const fileName = `employee_billing_${currentReportType}_${new Date().toISOString().slice(0, 10)}`;
      dt.current.exportCSV({ fileName });
    }
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
      <Header pageTitle="Employee Billing Reports" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Employee Wise Billing Reports</h6>
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
                    onChange={(e) => setSelectedReportType(e.value)}
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
                    onChange={(e) => setSelectedFacility(e.value)}
                    className="w-100"
                    filter
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-4 col-lg-2 d-flex align-items-end">
                  <Button
                    label="Show Data"
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
                    <Column
                      field="FacilityName"
                      header="Facility"
                      sortable
                    />
                    <Column field="ShiftDate" header="Shift Date" sortable />
                    <Column field="TripType" header="Trip Type" sortable />
                    <Column field="ShiftTime" header="Shift Time" sortable />
                    <Column
                      field="VendorName"
                      header="Vendor Name"
                      sortable
                    />
                    <Column
                      field="VehicleType"
                      header="Vehicle Type"
                      sortable
                    />
                    <Column field="RouteId" header="Route ID" sortable />
                    <Column
                      field="EmployeeId"
                      header="Employee ID"
                      sortable
                    />
                    <Column
                      field="EmployeeName"
                      header="Employee Name"
                      sortable
                    />
                    <Column
                      field="ManagerName"
                      header="Manager Name"
                      sortable
                    />
                    <Column
                      field="ManagerId"
                      header="Manager ID"
                      sortable
                    />
                    <Column field="Gender" header="Gender" sortable />
                    <Column
                      field="ProcessName"
                      header="Process Name"
                      sortable
                    />
                    <Column
                      field="TravelStatus"
                      header="Travel Status"
                      sortable
                    />
                    <Column
                      field="Cost"
                      header="Cost"
                      sortable
                      body={(rowData) => rowData.Cost?.toFixed(2)}
                    />
                    <Column
                      field="PerEmpCost"
                      header="Per Emp Cost"
                      sortable
                      body={(rowData) => rowData.PerEmpCost?.toFixed(2)}
                    />
                    <Column
                      field="GuardCost"
                      header="Guard Cost"
                      sortable
                      body={(rowData) => rowData.GuardCost?.toFixed(2)}
                    />
                    <Column
                      field="PerEmpGuardCost"
                      header="Per Emp Guard Cost"
                      sortable
                      body={(rowData) => rowData.PerEmpGuardCost?.toFixed(2)}
                    />
                    <Column field="ActPax" header="Act Pax" sortable />
                    <Column
                      field="NoShowPax"
                      header="No Show Pax"
                      sortable
                    />
                    <Column
                      field="TotalCost"
                      header="Total Cost"
                      sortable
                      body={(rowData) => rowData.TotalCost?.toFixed(2)}
                    />
                    <Column
                      field="PerEmpTotalCost"
                      header="Per Emp Total Cost"
                      sortable
                      body={(rowData) => rowData.PerEmpTotalCost?.toFixed(2)}
                    />
                    <Column field="SchPax" header="Sch Pax" sortable />
                  </DataTable>
                </div>
              )}

              {currentReportType === "processwise" && (
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
                    <Column
                      field="FacilityName"
                      header="Facility"
                      sortable
                    />
                    <Column field="ShiftDate" header="Shift Date" sortable />
                    <Column field="TripType" header="Trip Type" sortable />
                    <Column field="ShiftTime" header="Shift Time" sortable />
                    <Column
                      field="VendorName"
                      header="Vendor Name"
                      sortable
                    />
                    <Column
                      field="VehicleType"
                      header="Vehicle Type"
                      sortable
                    />
                    <Column
                      field="ProcessName"
                      header="Process Name"
                      sortable
                    />
                    <Column
                      field="Cost"
                      header="Trip Cost"
                      sortable
                      body={(rowData) => rowData.Cost?.toFixed(2)}
                    />
                    <Column
                      field="GuardCost"
                      header="Guard Cost"
                      sortable
                      body={(rowData) => rowData.GuardCost?.toFixed(2)}
                    />
                    <Column
                      field="TotalCost"
                      header="Total Cost"
                      sortable
                      body={(rowData) => rowData.TotalCost?.toFixed(2)}
                    />
                    <Column
                      field="PerEmpCost"
                      header="Per Emp Cost"
                      sortable
                      body={(rowData) => rowData.PerEmpCost?.toFixed(2)}
                    />
                    <Column
                      field="PerEmpGuardCost"
                      header="Per Emp Guard Cost"
                      sortable
                      body={(rowData) => rowData.PerEmpGuardCost?.toFixed(2)}
                    />
                    <Column
                      field="PerEmpTotalCost"
                      header="Per Emp Total Cost"
                      sortable
                      body={(rowData) => rowData.PerEmpTotalCost?.toFixed(2)}
                    />
                  </DataTable>
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

export default PerEmployeeBilling;
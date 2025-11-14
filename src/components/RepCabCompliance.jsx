import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import RepCabComplianceService from "../services/compliance/RepCabComplianceService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";

const RepCabCompliance = () => {
  const [facilities, setFacilities] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [penaltyType, setPenaltyType] = useState("1");
  const [reportData, setReportData] = useState([]);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const UserID = sessionStorage.getItem("ID");
  const dt = useRef(null);

  const penaltyTypeOptions = [
    { label: "Operations", value: "1" },
    { label: "Compliance", value: "2" },
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
      const response = await RepCabComplianceService.SelectFacility({
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
      const response = await RepCabComplianceService.GetVendorByFacility({
        facilityId: selectedFacility,
      });

      let parsedResponse = response;

      if (typeof response === "string") {
        parsedResponse = JSON.parse(response);
      }

      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.vendorName,
            value: item.Id,
          }))
        : [];

      setVendors(formattedData);
      setSelectedVendor(null);
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
    return `${year}-${month}-${day}`;
  };

  // Parse nested JSON response
  const parseNestedJsonResponse = (response) => {
    try {
      let parsedData = response;

      // First level parsing
      if (typeof parsedData === "string") {
        parsedData = JSON.parse(parsedData);
      }

      // Handle JsonResult wrapper
      if (Array.isArray(parsedData) && parsedData[0]?.JsonResult) {
        parsedData = JSON.parse(parsedData[0].JsonResult);
      }

      // Handle data property
      if (parsedData?.data) {
        parsedData =
          typeof parsedData.data === "string"
            ? JSON.parse(parsedData.data)
            : parsedData.data;
      }

      return Array.isArray(parsedData)
        ? parsedData
        : parsedData
          ? [parsedData]
          : [];
    } catch (error) {
      console.error("Error parsing response:", error);
      return [];
    }
  };

  // Extract dynamic columns from data
  const extractColumns = (data) => {
    if (!data || data.length === 0) return [];

    const allKeys = new Set();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => allKeys.add(key));
    });

    return Array.from(allKeys).map((key) => ({
      field: key,
      header: formatColumnHeader(key),
    }));
  };

  // Format column header for display
  const formatColumnHeader = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  };

  const handleSearch = async () => {
    if (!selectedFacility) {
      toastService.error("Please select a facility");
      return;
    }

    if (!selectedVendor) {
      toastService.error("Please select a vendor");
      return;
    }

    if (!penaltyType || penaltyType === "0") {
      toastService.error("Please select penalty type");
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
        tripType: "",
        vendorIDs: selectedVendor.toString(),
      };

      let response;
      if (penaltyType === "2") {
        response = await RepCabComplianceService.RptCabCompliance(params);
      } else {
        response = await RepCabComplianceService.RptOperationsPenalty(
          params
        );
      }

      const validatedData = parseNestedJsonResponse(response);
      const columns = extractColumns(validatedData);

      setReportData(validatedData);
      setDynamicColumns(columns);
      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        if (validatedData.length > 0) {
          toastService.success(
            `Report generated successfully. ${validatedData.length} records found.`
          );
        } else {
          toastService.warn("No records found");
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
      setDynamicColumns([]);
      setError(error.message);
      setLoading(false);
      setIsSubmitting(false);

      setTimeout(() => {
        toastService.error("Error fetching report data: " + error.message);
      }, 100);
    }
  };

  const exportExcel = () => {
    if (reportData.length === 0) {
      toastService.error("No data to export");
      return;
    }

    try {
      const reportType =
        penaltyType === "2" ? "Cab_Compliance" : "Operations_Penalty";
      const facilityName =
        facilities.find((f) => f.value === selectedFacility)?.label ||
        "Report";
      const vendorName =
        vendors.find((v) => v.value === selectedVendor)?.label || "All";

      const fileName = `${reportType}_${facilityName}_${vendorName}_${new Date().toISOString().slice(0, 10)}`;

      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report Data");

      const wscols = dynamicColumns.map(() => ({ wch: 20 }));
      ws["!cols"] = wscols;

      XLSX.writeFile(wb, `${fileName}.xlsx`);
      toastService.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toastService.error("Error exporting report");
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
      tooltip="Export to Excel"
      tooltipOptions={{ position: "top" }}
      disabled={reportData.length === 0}
    />
  );

  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header pageTitle="Cab Penalty Report" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Cab Penalty Report</h6>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
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
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
                  <label htmlFor="vendor" className="form-label">
                    Vendor <span>*</span>
                  </label>
                  <Dropdown
                    id="vendor"
                    placeholder="Select Vendor"
                    value={selectedVendor}
                    options={vendors}
                    onChange={(e) => setSelectedVendor(e.value)}
                    className="w-100"
                    filter
                    disabled={!selectedFacility}
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-2 col-lg-2">
                  <label htmlFor="penaltyType" className="form-label">
                    Penalty Type <span>*</span>
                  </label>
                  <Dropdown
                    id="penaltyType"
                    placeholder="Select Type"
                    value={penaltyType}
                    options={penaltyTypeOptions}
                    onChange={(e) => setPenaltyType(e.value)}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-2 col-lg-2 d-flex align-items-end">
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
                  {dynamicColumns.map((col) => (
                    <Column
                      key={col.field}
                      field={col.field}
                      header={col.header}
                      sortable
                      style={{ minWidth: "150px" }}
                    />
                  ))}
                </DataTable>
              </div>

              {!reportData.length && !loading && (
                <div className="p-4 text-center text-muted">
                  Please fill all criteria and click "Run Report" to view
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

export default RepCabCompliance;
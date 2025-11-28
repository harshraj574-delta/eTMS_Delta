import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import RepNoShowService from "../services/compliance/RepNoShowService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";

const RepNoShow = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const UserID = sessionStorage.getItem("ID");
  const dt = useRef(null);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await RepNoShowService.SelectFacility({
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
        tripType: "P",
      };

      const response = await RepNoShowService.RptNoshow(params);

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

    if (dt.current) {
      const fileName = `no_show_report_${new Date()
        .toISOString()
        .slice(0, 10)}`;
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
      <Header pageTitle="No-Show Reports" showNewButton={false} />
      <Sidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="middle">
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Detailed No-Show Report</h6>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="card_tb p-3">
              <div className="row g-2">
                <div className="col-12 col-sm-6 col-md-3 col-lg-3">
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
                <div className="col-12 col-sm-6 col-md-3 col-lg-3">
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
                <div className="col-12 col-sm-6 col-md-3 col-lg-3">
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
              <div className="table-responsive">
                <DataTable
                  value={reportData}
                  ref={dt}
                  paginator
                  rows={50}
                  tableStyle={{ minWidth: "50rem" }}
                  size="small"
                  loading={loading}
                  emptyMessage={error ? `Error: ${error}` : "No records found"}
                  stripedRows
                  paginatorLeft={paginatorLeft}
                  paginatorRight={paginatorRight}
                  rowsPerPageOptions={[50, 100, 200, 300]}
                >
                  <Column field="facilityName" header="Facility" sortable />
                  <Column field="empCode" header="Emp ID" sortable />
                  <Column field="empName" header="Emp Name" sortable />
                  <Column field="processName" header="Project" sortable />
                  <Column field="Manager" header="Manager" sortable />
                  <Column
                    field="RoutedInstances"
                    header="Routes Instances"
                    sortable
                  />
                  <Column
                    field="NoShowInstances"
                    header="No Show Instances"
                    sortable
                  />
                </DataTable>
              </div>

              {!reportData.length && !loading && (
                <div className="p-4 text-center text-muted">
                  Please select a facility and click "Run Report" to view
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

export default RepNoShow;

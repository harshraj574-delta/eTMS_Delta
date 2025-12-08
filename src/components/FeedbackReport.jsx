import React, { useState, useEffect, useRef } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import RepFeedbackReportService from "../services/compliance/RepFeedbackReportService";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import TableToolbar from "./common/TableToolbar";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";

const FeedbackReport = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState("2");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [replyDetails, setReplyDetails] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  const UserID = sessionStorage.getItem("ID");
  const dt = useRef(null);
  const op = useRef(null);
  const filterButtonRef = useRef(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const statusOptions = [
    { label: "Both", value: "2" },
    { label: "Open", value: "0" },
    { label: "Closed", value: "1" },
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await RepFeedbackReportService.SelectFacility({
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

      formattedData.unshift({ label: "All Facility", value: 0 });
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
    if (selectedFacility === null) {
      toastService.error("Please select a facility");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setExpandedRows([]);
    setReplyDetails({});

    try {
      const params = {
        sDate: formatDate(startDate),
        eDate: formatDate(endDate),
        facilityId: selectedFacility,
        statusID: selectedStatus,
      };

      const response = await RepFeedbackReportService.RepFeedBackDetails(
        params
      );

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
      setHasSearched(true);

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

  const fetchReplyDetails = async (ticketNo) => {
    setLoadingReplies((prev) => ({ ...prev, [ticketNo]: true }));

    try {
      const response = await RepFeedbackReportService.RepSelectReply({
        TicketNo: ticketNo,
      });

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

      setReplyDetails((prev) => ({
        ...prev,
        [ticketNo]: validatedData,
      }));
    } catch (error) {
      console.error("Error fetching reply details:", error);
      toastService.error("Error fetching reply details for " + ticketNo);
      setReplyDetails((prev) => ({
        ...prev,
        [ticketNo]: [],
      }));
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [ticketNo]: false }));
    }
  };

  const handleRowToggle = async (rowData) => {
    const ticketNo = rowData.TicketNo;
    const isExpanded = expandedRows.includes(ticketNo);

    if (isExpanded) {
      setExpandedRows(expandedRows.filter((t) => t !== ticketNo));
    } else {
      setExpandedRows([...expandedRows, ticketNo]);
      if (!replyDetails[ticketNo]) {
        await fetchReplyDetails(ticketNo);
      }
    }
  };

  const exportExcel = () => {
    if (reportData.length === 0) {
      toastService.error("No data to export");
      return;
    }

    // Check if any rows are expanded
    const hasExpandedRows = expandedRows.length > 0;

    let csvContent = "";

    if (hasExpandedRows) {
      // Export with drill-down details
      csvContent = [
        [
          "Ticket No",
          "Facility",
          "Employee Code",
          "Employee Name",
          "Description",
          "Shift Date",
          "Raised Time",
          "Updated By",
          "Updated Time",
          "Updated Remark",
          "Status",
          "Reply - Action By",
          "Reply - Description",
          "Reply - Updated Time",
          "Reply - Status",
        ].join(","),
      ];

      reportData.forEach((row) => {
        const replies = replyDetails[row.TicketNo];

        if (replies && replies.length > 0) {
          // Add main row with first reply
          replies.forEach((reply, replyIndex) => {
            const rowData = [
              replyIndex === 0 ? row.TicketNo : "",
              replyIndex === 0 ? row.facilityname : "",
              replyIndex === 0 ? row.empCode : "",
              replyIndex === 0 ? row.empName : "",
              replyIndex === 0 ? `"${row.Desrp || ""}"` : "",
              replyIndex === 0 ? row.Shiftdate : "",
              replyIndex === 0 ? row.RaisedTime : "",
              replyIndex === 0 ? row.ActionBy : "",
              replyIndex === 0 ? row.ActionAt || "-" : "",
              replyIndex === 0 ? `"${row.Remark || "-"}"` : "",
              replyIndex === 0 ? row.Status : "",
              reply.empCode && reply.empName
                ? `${reply.empCode} - ${reply.empName}`
                : "-",
              `"${reply.Descp || "-"}"`,
              reply.UpdatedAt || "-",
              reply.Status || "-",
            ];
            csvContent.push(rowData.join(","));
          });
        } else {
          // Add main row without replies
          const rowData = [
            row.TicketNo,
            row.facilityname,
            row.empCode,
            row.empName,
            `"${row.Desrp || ""}"`,
            row.Shiftdate,
            row.RaisedTime,
            row.ActionBy,
            row.ActionAt || "-",
            `"${row.Remark || "-"}"`,
            row.Status,
            "",
            "",
            "",
            "",
          ];
          csvContent.push(rowData.join(","));
        }
      });

      csvContent = csvContent.join("\n");
    } else {
      // Export only main data without drill-down
      csvContent = [
        [
          "Ticket No",
          "Facility",
          "Employee Code",
          "Employee Name",
          "Description",
          "Shift Date",
          "Raised Time",
          "Updated By",
          "Updated Time",
          "Updated Remark",
          "Status",
        ].join(","),
        ...reportData.map((row) =>
          [
            row.TicketNo,
            row.facilityname,
            row.empCode,
            row.empName,
            `"${row.Desrp || ""}"`,
            row.Shiftdate,
            row.RaisedTime,
            row.ActionBy,
            row.ActionAt || "-",
            `"${row.Remark || "-"}"`,
            row.Status,
          ].join(",")
        ),
      ].join("\n");
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toastService.success(
      hasExpandedRows
        ? "Report with drill-down details exported successfully"
        : "Report exported successfully"
    );
  };

  const handleReload = () => {
    if (reportData.length > 0) {
      handleSearch();
    } else {
      toastService.info("Please run the report first");
    }
  };

  const rowExpansionTemplate = (rowData) => {
    const ticketNo = rowData.TicketNo;
    const replies = replyDetails[ticketNo] || [];
    const isLoading = loadingReplies[ticketNo];

    if (isLoading) {
      return (
        <div className="p-3 text-center">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2 text-muted">Loading reply details...</span>
        </div>
      );
    }

    if (replies.length === 0) {
      return (
        <div className="p-3">
          <p className="text-muted mb-0">No reply details available</p>
        </div>
      );
    }

    return (
      <div className="expanded-content p-3">
        <div className="table-responsive">
          <table className="table table-sm table-bordered mb-0">
            <thead className="table-light">
              <tr>
                <th>Ticket No</th>
                <th>Action By</th>
                <th>Description</th>
                <th>Updated Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {replies.map((reply, index) => (
                <tr key={index}>
                  <td>{reply.TicktNo || ticketNo}</td>
                  <td>
                    {reply.empCode && reply.empName
                      ? `${reply.empCode} - ${reply.empName}`
                      : "-"}
                  </td>
                  <td>{reply.Descp || "-"}</td>
                  <td>{reply.UpdatedAt || "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        reply.Status === "Closed"
                          ? "bg-success"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {reply.Status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const filteredData = reportData.filter((item) => {
    if (!globalFilter) return true;
    const searchTerm = globalFilter.toLowerCase();
    return Object.values(item).some(
      (val) => val && val.toString().toLowerCase().includes(searchTerm)
    );
  });

  return (
    <>
      <Loader isVisible={isSubmitting} fullScreen={true} />
      <Header
        pageTitle="Feedback Report"
        showNewButton={false}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className={`middle ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="row">
          <div className="col-12">
            <h6 className="pageTitle">Display Feedback Report</h6>
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
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                    <Calendar
                      id="startDate"
                      className="w-100 custom-calendar-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.value)}
                      dateFormat="mm/dd/yy"
                    />
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-md-3 col-lg-3">
                  <label htmlFor="endDate" className="form-label">
                    To Date <span>*</span>
                  </label>
                  <div className="custom-calendar-wrapper">
                    <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                    <Calendar
                      id="endDate"
                      className="w-100 custom-calendar-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.value)}
                      dateFormat="mm/dd/yy"
                    />
                  </div>
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
                  <label htmlFor="status" className="form-label">
                    Status <span>*</span>
                  </label>
                  <Dropdown
                    id="status"
                    placeholder="Select Status"
                    value={selectedStatus}
                    options={statusOptions}
                    onChange={(e) => setSelectedStatus(e.value)}
                    className="w-100"
                  />
                </div>
                <div className="col-12 col-sm-6 col-md-2 col-lg-2 d-flex align-items-end">
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
                    `}
                  </style>
                  <Button
                    label="Run Report"
                    className="btn btn-primary w-100 run-report-btn"
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
              {!hasSearched && (
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
              )}

              {hasSearched && (
                <div className="p-3">
                  <TableToolbar
                    search={globalFilter}
                    onSearch={(e) => setGlobalFilter(e.target.value)}
                    onRefresh={handleReload}
                    onExport={exportExcel}
                    showFilter={true}
                    overlayRef={op}
                    filterButtonRef={filterButtonRef}
                  >
                    <div className="p-4 text-center">
                      <i
                        className="pi pi-info-circle text-muted mb-3 d-block"
                        style={{ fontSize: "2rem" }}
                      />
                      <p
                        className="m-0 text-muted"
                        style={{ fontSize: "0.875rem" }}
                      >
                        No advanced filters available.
                      </p>
                    </div>
                  </TableToolbar>

                  <div className="table-responsive">
                    <table className="table table-sm table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "40px" }}></th>
                          <th className="text-center">Ticket No</th>
                          <th className="text-center">Facility</th>
                          <th className="text-center">Employee Code</th>
                          <th className="text-center">Employee Name</th>
                          <th className="text-center">Description</th>
                          <th className="text-center">Shift Date</th>
                          <th className="text-center">Raised Time</th>
                          <th className="text-center">Updated By</th>
                          <th className="text-center">Updated Time</th>
                          <th className="text-center">Updated Remark</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="12" className="text-center p-4">
                              <div
                                className="spinner-border text-primary"
                                role="status"
                              >
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredData.length === 0 ? (
                          <tr>
                            <td colSpan="12" className="text-center p-4 text-muted">
                              {error ? `Error: ${error}` : "No records found matching your search"}
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((feedback, index) => (
                            <React.Fragment key={index}>
                              <tr>
                                <td>
                                  <a
                                    href="#!"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleRowToggle(feedback);
                                    }}
                                  >
                                    {expandedRows.includes(feedback.TicketNo) ? (
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
                                <td className="text-center">
                                  <a
                                    href="#!"
                                    className="text-decoration-none"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleRowToggle(feedback);
                                    }}
                                  >
                                    {feedback.TicketNo}
                                  </a>
                                </td>
                                <td className="text-center">
                                  {feedback.facilityname}
                                </td>
                                <td className="text-center">{feedback.empCode}</td>
                                <td className="text-center">{feedback.empName}</td>
                                <td className="text-center">
                                  <span
                                    className="text-truncate d-inline-block"
                                    style={{ maxWidth: "200px" }}
                                    title={feedback.Desrp}
                                  >
                                    {feedback.Desrp}
                                  </span>
                                </td>
                                <td className="text-center">
                                  {feedback.Shiftdate}
                                </td>
                                <td className="text-center">
                                  {feedback.RaisedTime}
                                </td>
                                <td className="text-center">{feedback.ActionBy}</td>
                                <td className="text-center">
                                  {feedback.ActionAt || "-"}
                                </td>
                                <td className="text-center">
                                  {feedback.Remark || "-"}
                                </td>
                                <td className="text-center">
                                  <span
                                    className={`badge ${
                                      feedback.Status === "Closed"
                                        ? "bg-success"
                                        : "bg-warning text-dark"
                                    }`}
                                  >
                                    {feedback.Status}
                                  </span>
                                </td>
                              </tr>
                              {expandedRows.includes(feedback.TicketNo) && (
                                <tr>
                                  <td colSpan="12" className="leftStrip p-0">
                                    {rowExpansionTemplate(feedback)}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackReport;
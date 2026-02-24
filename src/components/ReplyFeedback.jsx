import React, { useState, useEffect, useMemo } from "react";
import Header from "./Master/Header";
import SidebarMenu from "./Master/SidebarMenu";
import { ToastContainer } from "react-toastify";
import sessionManager from "../utils/SessionManager";
import { toastService } from "../services/toastService";
import Loader from "./common/Loader";
import calendarIcon from "../assets/calendar.png";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import noReportImage from "../assets/no_report.png";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import ReplyFeedbackService from "../services/compliance/ReplyFeedbackService";
import { Dropdown } from "primereact/dropdown";
import ReportButton from "./common/ReportButton";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import MasterSidebar from "./Master/MasterSidebar";

const ReplyFeedback = () => {
    const [loading, setLoading] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState("");
    const [facilities, setFacilities] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("");
    const statusOptions = useMemo(() => [
        { label: "Open", value: "0" },
        { label: "Closed", value: "1" },
    ], []);
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const [fromDate, setFromDate] = useState(oneYearAgo);
    const [toDate, setToDate] = useState(today);
    const [hasSearched, setHasSearched] = useState(false);
    const [feedbackData, setFeedbackData] = useState([]);
    const [masterFeedbackData, setMasterFeedbackData] = useState([]);
    const [expandedRows, setExpandedRows] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [replyDesc, setReplyDesc] = useState('');
    const [replyStatus, setReplyStatus] = useState('0');
    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const onPageChange = (event) => {
        setFirst(event.first);
        setRowsPerPage(event.rows);
    };
    const UserId = sessionManager.getUserSession().ID;

    const resetReplyForm = () => {
        setReplyDesc('');
        setReplyStatus('0');
    };

    const DescriptionColumnTemplate = (rowData) => {
        const maxLength = 40;
        const fullText = rowData.Desrp || "";
        const trimmedText =
            fullText.length > maxLength
                ? fullText.slice(0, maxLength) + "..."
                : fullText;

        return (
            <span
                title={fullText}
                style={{
                    cursor: "pointer",
                    display: "inline-block",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    verticalAlign: "middle",
                }}
            >
                {trimmedText}
            </span>
        );
    };

    const handleToggle = (e, rowData) => {
        e.preventDefault();
        if (expandedRows === rowData.TicketNo) {
            setExpandedRows(null);
            setMasterFeedbackData([]);
        } else {
            setExpandedRows(rowData.TicketNo);
            handleViewDetails(rowData.TicketNo);
        }
    };

    const handleTicketClick = (rowData) => {
        setSelectedRow(rowData);
        setShowSidebar(true);
        const statusValue = statusOptions.find(o => o.label === rowData.Status)?.value || '0';
        setReplyStatus(statusValue);
        handleViewDetails(rowData.TicketNo);
    };

    const actionTemplate = (rowData) => {
        return (
            <a
                href="#!"
                onClick={(e) => handleToggle(e, rowData)}
            >
                {expandedRows === rowData.TicketNo ? (
                    <span className="material-icons expansion-icon">
                        remove_circle
                    </span>
                ) : (
                    <span className="material-icons expansion-icon">
                        add_circle
                    </span>
                )}
            </a>
        );
    };

    const rowExpansionTemplate = (rowData) => {
        return (
            <div className="p-3">
                <CustomDataTable
                    value={masterFeedbackData}
                    className="p-datatable-sm"
                    emptyMessage="No conversation found"
                >
                    <Column
                        header="Action By"
                        body={(rowData) => (
                            <span>
                                {rowData.empCode}-{rowData.empName || 'N/A'}
                            </span>
                        )}
                    />
                    <Column field="Descp" header="Description" />
                    <Column field="UpdatedAt" header="Last Updated" />
                    <Column field="Status" header="Status" />
                </CustomDataTable>
            </div>
        );
    };

    const fetchFacilities = async () => {
        try {
            const response = await ReplyFeedbackService.SelectFacility({ Userid: UserId });
            const parsed = typeof response === 'string' ? JSON.parse(response) : response;
            const formatted = (parsed || []).map(item => ({
                facilityName: item.facility || item.facilityName || "",
                Id: item.Id || item.id || item.Value || "",
            }));
            setFacilities(formatted);
            const userFacilityId = sessionManager.getUserSession().locationId;
            const defaultFacility = formatted.find(fac =>
                fac.Id == userFacilityId ||
                fac.Id.toString() === userFacilityId.toString()
            );
            if (defaultFacility) {
                setSelectedFacility(defaultFacility.Id);
            } else if (formatted.length > 0) {
                setSelectedFacility(formatted[0].Id);
            }
        } catch (err) {
            console.error("Error fetching facilities:", err);
            toastService?.error?.("Failed to load facilities. Please try again.");
        }
    };

    useEffect(() => {
        fetchFacilities();
    }, []);

    const handleSubmit = async () => {
        if (!fromDate) {
            toastService.warn("From Date is required");
            return;
        }
        if (!toDate) {
            toastService.warn("To Date is required");
            return;
        }
        if (!selectedFacility) {
            toastService.warn("Facility is required");
            return;
        }
        if (!selectedStatus) {
            toastService.warn("Status is required");
            return;
        }

        setLoading(true);
        try {
            const params = {
                sDate: fromDate.toISOString().split('T')[0], 
                eDate: toDate.toISOString().split('T')[0],
                StatusID: selectedStatus,
                FacilityID: selectedFacility,
            };
            const response = await ReplyFeedbackService.sprFeedBackDetails(params);
            const data = typeof response === 'string' ? JSON.parse(response) : response;
            setExpandedRows(null);
            setMasterFeedbackData([]);
            setFeedbackData(Array.isArray(data) ? data : []);
            setHasSearched(true);
            if (!data || data.length === 0) {
                toastService.warn("No feedback details found for the selected criteria");
            } else {
                toastService.success("Feedback details loaded successfully");
            }
        } catch (error) {
            console.error("Error fetching feedback:", error);
            toastService.error("Failed to load feedback details. Please try again.");
            setFeedbackData([]);
            setHasSearched(true);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id) => {
        setLoading(true);
        try {
            const response = await ReplyFeedbackService.sprSelectReply({ ticketno: id });
            const data = typeof response === 'string' ? JSON.parse(response) : response;
            setMasterFeedbackData(Array.isArray(data) ? data : []);
            // if (data.length > 0) {
            //     // setExpandedRows is already set in handleToggle
            // } else {
            //     setExpandedRows(null);
            //     toastService.warn("No conversation found");
            // }
        } catch (error) {
            console.error("Error fetching details:", error);
            toastService.error("Failed to load details. Please try again.");
            setExpandedRows(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReply = async () => {
        if (!replyDesc.trim()) {
            toastService.warn("Reply description is required");
            return;
        }
        setLoading(true);
        try {
            await ReplyFeedbackService.sprInsertReply({
                TicktNo: selectedRow.TicketNo,
                Descp: replyDesc,
                ActionId: UserId,
                StatusId: replyStatus
            });
            toastService.success("Reply saved successfully");
            setShowSidebar(false);
            resetReplyForm();
            handleSubmit();
        } catch (error) {
            console.error("Error saving reply:", error);
            toastService.error("Failed to save your reply. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="container-fluid p-0">
            <ToastContainer position="top-right" autoClose={3000} />
            <Loader isVisible={loading} fullScreen={true} />
            <Header pageTitle={"Manage Employee Feedback"} mainTitle={"Admin"} />
            <SidebarMenu />
            <div className="middle">
                <div className="card_tb p-3">
                    <div className="row">
                        <div className="field col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                            <label className="form-label">From Date <span className="text-danger">*</span></label>
                            <div className="custom-calendar-wrapper">
                                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                <Calendar
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.value)}
                                    minDate={oneYearAgo}
                                    maxDate={new Date()}
                                    showIcon={false}
                                    className="w-100 custom-calendar-input"
                                    placeholder="Select Date"
                                />
                            </div>
                        </div>
                        <div className="field col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                            <label className="form-label">To Date <span className="text-danger">*</span></label>
                            <div className="custom-calendar-wrapper">
                                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                <Calendar
                                    value={toDate}
                                    onChange={(e) => {
                                        const selected = e.value;
                                        if (fromDate && selected < fromDate) {
                                            toastService.warn("To date cannot be earlier than From date");
                                            return;
                                        }
                                        setToDate(selected);
                                    }}
                                    minDate={fromDate}
                                    maxDate={new Date()}
                                    showIcon={false}
                                    className="w-100 custom-calendar-input"
                                    placeholder="Select Date"
                                />
                            </div>
                        </div>
                        <div className="field col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                            <label className="form-label">Facility <span className="text-danger">*</span></label>
                            <Dropdown
                                value={selectedFacility}
                                options={facilities}
                                optionLabel="facilityName"
                                optionValue="Id"
                                onChange={(e) => setSelectedFacility(e.value)}
                                placeholder="Select Facility"
                                className="w-100"
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-4 col-lg-2 mb-3">
                            <label className="form-label">Status <span className="text-danger">*</span></label>
                            <Dropdown
                                value={selectedStatus}
                                options={statusOptions}
                                onChange={(e) => setSelectedStatus(e.value)}
                                placeholder="Select Status"
                                className="w-100 custom-multiselect"
                                display="chip"
                                filter
                            />
                        </div>
                        <div className="field col-12 col-sm-6 col-md-4 col-lg-2 mb-3 no-label">
                            <ReportButton
                                label="Submit"
                                onClick={handleSubmit}
                            />
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
                                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                        Please select above parameters to show Employee Feedback
                                    </p>
                                </div>
                            )}
                            {hasSearched && feedbackData.length === 0 && (
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center p-5"
                                    style={{ minHeight: "70vh" }}
                                >
                                    <img
                                        src={noReportImage}
                                        alt="No Data"
                                        style={{
                                            maxWidth: "100px",
                                            opacity: 0.5,
                                            marginBottom: "1rem",
                                        }}
                                    />
                                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                        No feedback found for the selected criteria
                                    </p>
                                </div>
                            )}
                            {hasSearched && feedbackData.length > 0 && (
                                <div className="p-3">
                                    <CustomDataTable
                                        value={feedbackData.slice(first, first + rowsPerPage)}
                                        className="p-datatable-sm"
                                        emptyMessage="No feedback data"
                                        expandedRows={expandedRows ? { [expandedRows]: true } : {}}
                                        onRowToggle={(e) => setExpandedRows(e.data ? Object.keys(e.data)[0] : null)}
                                        rowExpansionTemplate={rowExpansionTemplate}
                                        dataKey="TicketNo"
                                    >
                                        <Column body={actionTemplate} header="" style={{ width: '50px' }} />
                                        <Column body={(rowData) => <span onClick={rowData.TypeName ? () => handleTicketClick(rowData) : undefined} style={{ cursor: rowData.TypeName ? 'pointer' : 'not-allowed', color: rowData.TypeName ? 'blue' : 'gray', pointerEvents: rowData.TypeName ? 'auto' : 'none' }}>{rowData.TicketNo}</span>} header="Ticket_Number" />
                                        <Column field="RaisedDate" header="Date" />
                                        <Column field="empCode" header="EmployeeId" />
                                        <Column field="empName" header="Employee Name" />
                                        <Column field="TypeName" header="Type" />
                                        <Column body={DescriptionColumnTemplate} header="Description" />
                                        <Column field="RouteId" header="Route Id" />
                                        <Column field="ActionBy" header="Last Action" />
                                        <Column field="Status" header="Status" />
                                    </CustomDataTable>
                                    <CustomPaginator
                                        first={first}
                                        rows={rowsPerPage}
                                        totalRecords={feedbackData.length}
                                        onPageChange={onPageChange}
                                        rowsPerPageOptions={[50, 100, 150, 200]}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <MasterSidebar
                show={showSidebar}
                onClose={() => {
                    setShowSidebar(false);
                    resetReplyForm();
                }}
                title={`Feedback Details for Ticket :${selectedRow?.TicketNo}`}
                width="30%"
                className="sidebar-responsive"
                backdropOpacity={0.5}
                backdropBlur="10px"
                headerBgColor="bg-secondary"
                headerTextColor="text-white"
                id="FeedbackDetailsSidebar"
                footer={
                    <div className="offcanvas-footer">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setShowSidebar(false);
                                resetReplyForm();
                            }}
                        />
                        <Button
                            label="Save"
                            className="btn btn-success btn-sm ms-3"
                            onClick={handleSaveReply}
                            loading={loading}
                        />
                    </div>
                }
            >
                <div className="p-3">
                    <div className="row g-2">
                        <div className="field col-12 mb-2">
                            <label>Ticket No:</label>
                            <InputText type="text" readOnly value={selectedRow?.TicketNo || ''} className="form-control" />
                        </div>
                        <div className="field col-12 mb-2">
                            <label>Employee Id & Name:</label>
                            <InputText type="text" readOnly value={`${selectedRow?.empCode || ''}-${selectedRow?.empName || ''}`} className="form-control" />
                        </div>
                        <div className="field col-12 mb-2">
                            <label>Raised Date:</label>
                            <InputText type="text" readOnly value={selectedRow?.RaisedDate || ''} className="form-control" />
                        </div>
                        <div className="field col-12 mb-2">
                            <label>Complaint Type:</label>
                            <InputText type="text" readOnly value={selectedRow?.TypeName || ''} className="form-control" />
                        </div>
                        <div className="field col-12 mb-2">
                            <label>Trip Sheet Id:</label>
                            <InputText type="text" readOnly value={selectedRow?.RouteId || ''} className="form-control" />
                        </div>
                        <div className="field col-12 mb-2">
                            <label>Employee Feedback:</label>
                            <InputTextarea readOnly value={selectedRow?.Desrp || ''} rows={2} className="w-100" />
                        </div>
                        <div className="field col-12 mb-2">
                            <label>Reply:</label>
                            <InputTextarea value={replyDesc} onChange={(e) => setReplyDesc(e.target.value)} rows={3} className="w-100" placeholder="Enter reply (max 500 characters)" maxLength={500} />
                        </div>
                        <div className="field col-12 mb-2">
                            <label>Status:</label>
                            <Dropdown
                                value={replyStatus}
                                onChange={(e) => setReplyStatus(e.value)}
                                options={statusOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Status"
                                className="w-100"
                            />
                        </div>
                    </div>
                </div>
            </MasterSidebar>
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
                    width: 16px; 
                    height: 16px;
                    pointer-events: none; 
                    z-index: 10;
                }
                .custom-calendar-input .p-inputtext {
                    padding-left: 35px !important;
                }
                .custom-multiselect .p-multiselect-label {
                    display: flex;
                    align-items: center;
                    height: 100%;
                    padding-top: 0 !important;
                    padding-bottom: 0 !important;
                }
                .replicate-header {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-weight: 600;
                    font-size: 19px;
                    line-height: 28px;
                    letter-spacing: -0.02em;
                    color: #1C1D20;
                    border-bottom: 1px solid #dee2e6;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                }
                `}
            </style>

        </div>

    )

}
export default ReplyFeedback;
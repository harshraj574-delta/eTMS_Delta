import React, { useState, useEffect, useMemo } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import BCPMasterService from "../services/compliance/BCPMasterService";
import PerEmployeeBillingService from "../services/compliance/PerEmployeeBillingService";
import { vendorAllocationService } from "../services/compliance/VendorAllocationService";
import MasterSidebar from "./Master/MasterSidebar";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";
import "./common/CustomDataTable.css";

const BCPMaster = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [selectedTripType, setSelectedTripType] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const UserID = sessionStorage.getItem("ID");

    const [showAddBCP, setShowAddBCP] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newFromDate, setNewFromDate] = useState(new Date());
    const [newToDate, setNewToDate] = useState(new Date());
    const [newFacilityId, setNewFacilityId] = useState(null);
    const [newTripType, setNewTripType] = useState(null);
    const [newShift, setNewShift] = useState(null);
    const [newBcpPercent, setNewBcpPercent] = useState("");
    const [facilitiesForNew, setFacilitiesForNew] = useState([]);
    const [shiftTimeOptions, setShiftTimeOptions] = useState([]);
    const [editingBCP, setEditingBCP] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const resetFormFields = () => {
        setEditingBCP(null);
        setIsEditMode(false);
        setNewTitle("");
        setNewDescription("");
        setNewFromDate(new Date());
        setNewToDate(new Date());
        setNewFacilityId(null);
        setNewTripType(null);
        setNewShift(null);
        setNewBcpPercent("");
        setShiftTimeOptions([]);
    };

    const parseDateValue = (value) => {
        if (!value) return null;
        const parsedDate = new Date(value);
        return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    };

    const getFacilityName = (rowData) =>
        rowData.facility ||
        rowData.facilityName ||
        rowData.FacilityName ||
        rowData.Facility ||
        rowData.Name ||
        rowData.Location ||
        rowData.fullName ||
        rowData.FullName ||
        "Unknown";

    const openAddBCP = () => {
        resetFormFields();
        setShowAddBCP(true);
    };

    const closeSidebar = () => {
        setShowAddBCP(false);
        resetFormFields();
    };

    const handleEditBCP = (rowData) => {
        setEditingBCP({
            Id: rowData.Id || rowData.id || rowData.ID,
        });
        setIsEditMode(true);
        setNewTitle(rowData.Title || "");
        setNewDescription(rowData.Description || "");
        setNewFromDate(parseDateValue(rowData.FromDate));
        setNewToDate(parseDateValue(rowData.ToDate));
        setNewTripType(rowData.TripType || null);
        setNewFacilityId(
            rowData.FacilityId || rowData.facilityId || rowData.Facility || rowData.facility || null
        );
        setNewShift(rowData.Shift || null);
        setNewBcpPercent(rowData.BcpPercent != null ? String(rowData.BcpPercent) : "");
        setShowAddBCP(true);
    };

    const getFacilityBody = (rowData) => getFacilityName(rowData);

    const actionBodyTemplate = (rowData) => (
        <Button
            icon="pi pi-pencil"
            className="p-button-text"
            onClick={() => handleEditBCP(rowData)}
        />
    );

    const tripTypes = [
        { label: "PickUp", value: "P" },
        { label: "Drop", value: "D" },
    ];

    const paginatedData = useMemo(
        () => reportData.slice(first, first + rowsPerPage),
        [reportData, first, rowsPerPage]
    );

    useEffect(() => {
        fetchFacilities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (showAddBCP) {
            fetchFacilitiesForNew();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAddBCP]);

    useEffect(() => {
        if (newFacilityId && newTripType) {
            fetchShiftTimeByFacility();
        } else {
            setShiftTimeOptions([]);
            setNewShift(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newFacilityId, newTripType]);

    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const handleSearch = async () => {
        if (!startDate || !endDate || !selectedFacility || !selectedTripType) {
            toastService.error("Please select From Date, To Date, Facility and Trip Type.");
            return;
        }

        setIsSubmitting(true);
        setHasSearched(true);

        try {
            const payload = {
                FacilityId: selectedFacility,
                FromDate: formatDate(startDate),
                ToDate: formatDate(endDate),
                TripType: selectedTripType,
            };

            //console.log("GetBCPMasterList payload:", payload);
            const response = await BCPMasterService.GetBCPMasterList(payload);
            //console.log("GetBCPMasterList response:", response);

            let data = [];
            if (typeof response === "string") {
                try {
                    data = JSON.parse(response);
                } catch (error) {
                    console.error("Error parsing BCP response string:", error);
                    data = [];
                }
            } else if (Array.isArray(response)) {
                data = response;
            } else if (response && typeof response === "object") {
                data = Array.isArray(response.data) ? response.data : [];
            }

            setReportData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading BCP master list:", error);
            toastService.error("Unable to load report data. Please try again.");
            setReportData([]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePageChange = (event) => {
        setFirst(event.first);
        setRowsPerPage(event.rows);
    };

    const handleSave = async () => {
        if (!newTitle || !newDescription || !newFromDate || !newToDate || !newFacilityId || !newTripType || !newShift || !newBcpPercent) {
            toastService.error("Please fill all required fields.");
            return;
        }

        try {
            const params = {
                Title: newTitle,
                Description: newDescription,
                FromDate: formatDate(newFromDate),
                ToDate: formatDate(newToDate),
                FacilityId: newFacilityId,
                ProcessId: 1,
                TripType: newTripType,
                Shift: newShift,
                BcpPercent: parseFloat(newBcpPercent),
            };

            if (isEditMode && editingBCP?.Id) {
                params.Id = editingBCP.Id;
                params.UpdatedBy = UserID;
                await BCPMasterService.UpdateBCPMaster(params);
                toastService.success("BCP Master updated successfully.");
            } else {
                params.CreatedBy = UserID;
                await BCPMasterService.InsertBCPMaster(params);
                toastService.success("BCP Master added successfully.");
            }

            setShowAddBCP(false);
            resetFormFields();

            if (hasSearched) {
                handleSearch();
            }
        } catch (error) {
            console.error("Error saving BCP Master:", error);
            toastService.error(isEditMode ? "Error updating BCP Master." : "Error saving BCP Master.");
        }
    };

    const parseFacilityList = (response) => {
        let data = response;
        if (typeof data === "string") {
            data = JSON.parse(data);
        }
        if (data && typeof data === "object") {
            if (Array.isArray(data)) return data;
            if (Array.isArray(data.data)) return data.data;
            if (Array.isArray(data.Table)) return data.Table;
            if (Array.isArray(data.Facilities)) return data.Facilities;
            if (Array.isArray(data.d)) return data.d;
            if (Array.isArray(data[0])) return data[0];
        }
        return [];
    };

    const buildFacilityOptions = (items) =>
        items.map((item) => ({
            label:
                item.facility ||
                item.facilityName ||
                item.FacilityName ||
                item.Facility ||
                item.Name ||
                item.fullName ||
                item.FullName ||
                item.Location ||
                "Unknown",
            value: item.Id || item.id || item.FacilityId || item.facilityId || item.ID || item.Id,
        }));

    const buildShiftOptions = (items) =>
        items.map((item) => {
            const shiftLabel =
                item.shiftTime ||
                item.ShiftTime ||
                item.shifttime ||
                item.Shift ||
                item.Name ||
                item.name ||
                item.value ||
                item.Value ||
                "Unknown";
            return {
                label: shiftLabel,
                value: shiftLabel,
            };
        });

    const fetchFacilities = async () => {
        if (!UserID) {
            toastService.error("Unable to fetch facilities: user not found.");
            return;
        }

        try {
            const response = await PerEmployeeBillingService.SelectFacility({
                Userid: UserID,
            });
            const parsedList = parseFacilityList(response);
            const formattedData = buildFacilityOptions(parsedList);
            if (formattedData.length === 0) {
                //console.warn("BCPMaster: no facilities returned from SelectFacility", response);
            }
            setFacilities(formattedData);
        } catch (err) {
            console.error("Error fetching facilities:", err);
            toastService.error("Error fetching facilities");
        }
    };

    const fetchFacilitiesForNew = async () => {
        if (!UserID) {
            toastService.error("Unable to fetch facilities: user not found.");
            return;
        }

        try {
            const response = await PerEmployeeBillingService.SelectFacility({
                Userid: UserID,
            });
            const parsedList = parseFacilityList(response);
            const formattedData = buildFacilityOptions(parsedList);
            if (formattedData.length === 0) {
               // console.warn("BCPMaster: no facilities returned for new BCP form", response);
            }
            setFacilitiesForNew(formattedData);
        } catch (err) {
            console.error("Error fetching facilities for new:", err);
            toastService.error("Error fetching facilities");
        }
    };

    const fetchShiftTimeByFacility = async () => {
        if (!newFacilityId || !newTripType) return;

        try {
           // console.log("Fetching shift time for facility:", newFacilityId, "trip type:", newTripType);
            const response = await vendorAllocationService.GetShiftByFacilityType({
                facid: newFacilityId,
                type: newTripType,
            });
            //console.log("Shift API response:", response);
            
            const parsedResponse =
                typeof response === "string" ? JSON.parse(response) : response;
            //console.log("Parsed response:", parsedResponse);
            
            let shiftList = [];
            if (Array.isArray(parsedResponse)) {
                shiftList = parsedResponse;
            } else if (parsedResponse && typeof parsedResponse === "object") {
                if (Array.isArray(parsedResponse.data)) shiftList = parsedResponse.data;
                else if (Array.isArray(parsedResponse.Table)) shiftList = parsedResponse.Table;
                else if (Array.isArray(parsedResponse.d)) shiftList = parsedResponse.d;
                else if (Array.isArray(parsedResponse.Shifts)) shiftList = parsedResponse.Shifts;
            }
            
            //console.log("Final shift list:", shiftList);
            
            if (shiftList.length > 0) {
                const formattedData = buildShiftOptions(shiftList);
                //console.log("Formatted shift options:", formattedData);
                setShiftTimeOptions(formattedData);
            } else {
                console.warn("No shift times found in response");
                setShiftTimeOptions([]);
                toastService.warn("No shift times found for the selected facility and trip type.");
            }
        } catch (error) {
            console.error("Error fetching shift time by facility:", error);
            toastService.error("Error fetching shift time by facility");
        }
    };
    return (
        <>
            <Loader isVisible={isSubmitting} fullScreen={true} />
            <Header pageTitle="BCPMaster" showNewButton={true} onNewButtonClick={openAddBCP} />
            <Sidebar />
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle"></h6>
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
                                    <div className="custom-calendar-wrapper">
                                        <img
                                            src={calendarIcon}
                                            alt="calendar"
                                            className="custom-calendar-icon"
                                        />
                                        <Calendar
                                            id="startDate"
                                            className="w-100 custom-calendar-input"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.value)}
                                            dateFormat="mm/dd/yy"
                                        />
                                    </div>
                                </div>

                                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                                    <label htmlFor="endDate" className="form-label">
                                        To Date <span>*</span>
                                    </label>
                                    <div className="custom-calendar-wrapper">
                                        <img
                                            src={calendarIcon}
                                            alt="calendar"
                                            className="custom-calendar-icon"
                                        />
                                        <Calendar
                                            id="endDate"
                                            className="w-100 custom-calendar-input"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.value)}
                                            dateFormat="mm/dd/yy"
                                        />
                                    </div>
                                </div>

                                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                                    <label htmlFor="reportType" className="form-label">
                                        Report Type <span>*</span>
                                    </label>
                                    <Dropdown
                                        id="reportType"
                                        placeholder="Select Report Type"
                                        value={selectedTripType}
                                        options={tripTypes}
                                        onChange={(e) => setSelectedTripType(e.value)}
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
                      .custom-html-table {
                        width: 100%;
                        border-collapse: collapse;
                      }
                      .custom-html-table th {
                        background-color: #f8f9fa;
                        border-bottom: 2px solid #dee2e6;
                        padding: 0.75rem;
                        font-weight: 600;
                        font-size: 0.875rem;
                      }
                      .custom-html-table td {
                        padding: 0.75rem;
                        border-bottom: 1px solid #dee2e6;
                        font-size: 0.875rem;
                      }

                      .ota-row-hover:hover > td {
                        background-color: #e9ecef !important;
                        cursor: pointer;
                        transition: background-color 0.2s;
                      }

                      .leftStrip {
                        padding: 0 !important;
                      }
                      .innerCell {
                        padding: 0 !important;
                      }
                      .expanded-content {
                        background-color: #f8f9fa;
                        padding: 0 !important;
                        margin: 0 !important;
                      }

                      .nested-table {
                        width: 100%;
                        border-collapse: collapse;
                        background-color: #fff;
                        margin: 0 !important;
                      }
                      .nested-table th {
                        background-color: #f1f3f4;
                        border: 1px solid #dee2e6;
                        padding: 0.5rem 0.75rem;
                        font-weight: 600;
                        font-size: 0.8125rem;
                      }
                      .nested-table td {
                        border: 1px solid #dee2e6;
                        padding: 0.5rem 0.75rem;
                        font-size: 0.8125rem;
                      }
                      .nested-table .ota-row-hover:hover > td {
                        background-color: #e9ecef !important;
                      }

                      .expand-icon {
                        color: #0d6efd;
                        cursor: pointer;
                        font-size: 20px !important;
                        vertical-align: middle;
                      }
                      .expand-icon:hover {
                        color: #0a58ca;
                      }
                    `}
                                    </style>

                                    <Button
                                        label="Submit"
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
                            {!hasSearched ? (
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
                                        Please select above parameters to show report data
                                    </p>
                                </div>
                            ) : reportData.length === 0 ? (
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
                                        No report data found for the selected criteria.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <CustomDataTable
                                        value={paginatedData}
                                        className="p-datatable-sm"
                                        paginator
                                        rows={rowsPerPage}
                                        first={first}
                                        onPage={handlePageChange}
                                        rowsPerPageOptions={[5, 10, 25, 50]}
                                    >
                                        <Column field="Id" header="ID" sortable />
                                        <Column header="Facility" body={getFacilityBody} />
                                        <Column field="Title" header="Title" />
                                        <Column field="Description" header="Description" />
                                        <Column field="FromDate" header="From Date" body={(rowData) => formatDateForDisplay(rowData.FromDate)} />
                                        <Column field="ToDate" header="To Date" body={(rowData) => formatDateForDisplay(rowData.ToDate)} />
                                        <Column field="TripType" header="Trip Type" />
                                        <Column field="Shift" header="Shift" />
                                        <Column field="BcpPercent" header="BCP %" />
                                        <Column header="Action" body={actionBodyTemplate}  />
                                    </CustomDataTable>
                                    <CustomPaginator
                                        first={first}
                                        rows={rowsPerPage}
                                        totalRecords={reportData.length}
                                        onPageChange={handlePageChange}
                                        rowsPerPageOptions={[5, 10, 25, 50]}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <MasterSidebar
                show={showAddBCP}
                onClose={closeSidebar}
                title={isEditMode ? "Edit BCP Master" : "Add New BCP Master"}
                width="500px"
                backdropOpacity={0.7}
                backdropBlur="50px"
                footer={
                    <div className="offcanvas-footer">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={closeSidebar}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-success mx-3"
                            onClick={handleSave}
                        >
                            {isEditMode ? "Update" : "Save"}
                        </button>
                    </div>
                }
            >
                <div className="p-3">
                    <div className="mb-3">
                        <label htmlFor="title" className="form-label">
                            Title <span>*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Enter Title"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="description" className="form-label">
                            Description <span>*</span>
                        </label>
                        <textarea
                            className="form-control"
                            id="description"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="Enter Description"
                            rows="3"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="fromDate" className="form-label">
                            From Date <span>*</span>
                        </label>
                        <Calendar
                            id="fromDate"
                            className="w-100"
                            value={newFromDate}
                            onChange={(e) => setNewFromDate(e.value)}
                            dateFormat="mm/dd/yy"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="toDate" className="form-label">
                            To Date <span>*</span>
                        </label>
                        <Calendar
                            id="toDate"
                            className="w-100"
                            value={newToDate}
                            onChange={(e) => setNewToDate(e.value)}
                            dateFormat="mm/dd/yy"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="tripType" className="form-label">
                            Trip Type <span>*</span>
                        </label>
                        <Dropdown
                            id="tripType"
                            placeholder="Select Trip Type"
                            value={newTripType}
                            options={tripTypes}
                            onChange={(e) => setNewTripType(e.value)}
                            className="w-100"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="newFacility" className="form-label">
                            Facility <span>*</span>
                        </label>
                        <Dropdown
                            id="newFacility"
                            placeholder="Select Facility"
                            value={newFacilityId}
                            options={facilitiesForNew}
                            onChange={(e) => setNewFacilityId(e.value)}
                            className="w-100"
                            filter
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="newShift" className="form-label">
                            Shift <span>*</span>
                        </label>
                        <Dropdown
                            id="newShift"
                            placeholder="Select Shift"
                            value={newShift}
                            options={shiftTimeOptions}
                            onChange={(e) => setNewShift(e.value)}
                            className="w-100"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="bcpPercent" className="form-label">
                            BCP % <span>*</span>
                        </label>
                        <input
                            type="number"
                            className="form-control"
                            id="bcpPercent"
                            value={newBcpPercent}
                            onChange={(e) => setNewBcpPercent(e.target.value)}
                            placeholder="Enter BCP %"
                        />
                    </div>
                </div>
            </MasterSidebar>
        </>
    );
};

export default BCPMaster;

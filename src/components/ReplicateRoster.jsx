import React, { useState, useEffect } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import ReportButton from "./common/ReportButton";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { RadioButton } from "primereact/radiobutton";
import { ToastContainer } from "react-toastify";
import { toastService } from "../services/toastService";
import ReplicateRosterService from "../services/compliance/ReplicateRosterService";
import sessionManager from "../utils/SessionManager";
import calendarIcon from "../assets/calendar.png"; // Import the calendar icon
import { Column } from "primereact/column";

const ReplicateRoster = () => {
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date(new Date().getTime() + 24 * 60 * 60 * 1000)); // Default to tomorrow
    const [facilities, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [tripType, setTripType] = useState("P"); // 'P' for Pick, 'D' for Drop
    const [shifts, setShifts] = useState([]);
    const [selectedShifts, setSelectedShifts] = useState([]);
    const [statsData, setStatsData] = useState([]);
    const [showStatsTable, setShowStatsTable] = useState(false);

    // Pagination state
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);

    const userId = sessionManager.getUserSession().ID;

    useEffect(() => {
        fetchFacilities();
    }, []);

    useEffect(() => {
        if (selectedFacility) {
            fetchShifts();
        } else {
            setShifts([]);
        }
    }, [selectedFacility, tripType]);

    const fetchFacilities = async () => {
        try {
            let data = await ReplicateRosterService.SelectFacility({ Userid: userId });
            
            if (typeof data === "string") {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error("Error parsing facility response:", e);
                }
            }

            // Handle potential .d wrapper from older ASP.NET services
            if (data && data.d) {
                data = data.d;
            }

            if (Array.isArray(data)) {
                setFacilities(data);
            } else if (data && typeof data === 'object') {
                setFacilities([data]);
            } else {
                setFacilities([]);
            }
        } catch (error) {
            toastService.error("Failed to load facilities.");
            setFacilities([]);
        }
    };

    const fetchShifts = async () => {
        try {
            let data = await ReplicateRosterService.GetShiftByFacilityType({
                facid: selectedFacility,
                type: tripType
            });

             if (typeof data === "string") {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error("Error parsing shifts response:", e);
                }
            }
            
             if (data && data.d) {
                data = data.d;
            }

            if (Array.isArray(data)) {
                setShifts(data);
            } else if (data && typeof data === 'object') {
                setShifts([data]);
            } else {
                 setShifts([]);
            }
        } catch (error) {
            toastService.error("Failed to load shifts.");
             setShifts([]);
        }
    };

    const handleReplicate = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const shiftTimeStr = selectedShifts.map(s => s.shiftTime).join(",");
            const response = await ReplicateRosterService.ReplicateRoster({
                CopyFromDate: formatDate(fromDate),
                CopyToDate: formatDate(toDate),
                facilityid: selectedFacility,
                ShiftTime: shiftTimeStr,
                TripType: tripType,
                uname: userId,
                isvendor: 0 // Default based on legacy code checkbox being hidden
            });
            
            // Check response format based on legacy code inspection
            // Legacy: .ElementAtOrDefault(0).result.ToString()
            const resultMsg = Array.isArray(response) && response.length > 0 ? response[0].result : "Operation completed";
            toastService.success(resultMsg || "Replication processed.");
            
        } catch (error) {
            toastService.error("Error during replication.");
        } finally {
            setLoading(false);
        }
    };

    const handleShowStats = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const shiftTimeStr = selectedShifts.map(s => s.shiftTime).join(",");
            let data = await ReplicateRosterService.GetExceptionCount({
                CopyFromDate: formatDate(fromDate),
                CopyToDate: formatDate(toDate),
                facilityid: selectedFacility,
                ShiftTime: shiftTimeStr,
                TripType: tripType
            });

            if (typeof data === "string") {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    console.error("Error parsing stats response:", e);
                }
            }
            
            if (data && data.d) {
                data = data.d;
            }

            setStatsData(Array.isArray(data) ? data : []);
            setShowStatsTable(true);
        } catch (error) {
            toastService.error("Failed to fetch statistics.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoToException = () => {
         if (!validateForm()) return;
         const shiftTimeStr = selectedShifts.map(s => s.shiftTime).join(",");
         const url = `ReplicationException.aspx?fromDate=${formatDate(fromDate)}&toDate=${formatDate(toDate)}&facId=${selectedFacility}&rtype=${tripType}&strShifttimes=${shiftTimeStr}`;
         window.open(url, "_blank");
    };

    const validateForm = () => {
        if (!fromDate) {
            toastService.warn("Select From Date.");
            return false;
        }
        if (!selectedFacility || selectedFacility === "0") {
            toastService.warn("Select a Facility.");
            return false;
        }
        if (!toDate) {
            toastService.warn("Select To Date.");
            return false;
        }
        if (toDate <= fromDate) {
             toastService.warn("To Date must be greater than From Date.");
             return false;
        }
        if (!selectedShifts || selectedShifts.length === 0) {
            toastService.warn("Select at least one Shift.");
            return false;
        }
        return true;
    };

    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [month, day, year].join('/');
    };

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    return (
        <div className="container-fluid p-0">
             <ToastContainer position="top-right" autoClose={3000} />
             <Loader isVisible={loading} fullScreen={true} />
             <Header pageTitle="Replicate Roster" mainTitle="Compliance" />
             <Sidebar />
             <div className="middle">


                {/* Replicate From Section */}
                <div className="card_tb p-3 mb-3">
                    <h5 className="replicate-header">Replicate From</h5>
                    <div className="row">
                        <div className="col-md-3 mb-3">
                            <label className="form-label fw-bold">Date <span className="text-danger">*</span></label>
                            <div className="custom-calendar-wrapper">
                                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                <Calendar
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.value)}
                                    showIcon={false}
                                    className="w-100 custom-calendar-input"
                                    placeholder="Select Date"
                                />
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <label className="form-label fw-bold">Facility <span className="text-danger">*</span></label>
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
                         <div className="col-md-3 mb-3">
                            <label className="form-label fw-bold">Trip Type</label>
                            <Dropdown
                                value={tripType}
                                options={[
                                    { label: "Pick", value: "P" },
                                    { label: "Drop", value: "D" },
                                ]}
                                onChange={(e) => setTripType(e.value)}
                                placeholder="Select Trip Type"
                                className="w-100"
                            />
                        </div>
                        <div className="col-md-3 mb-3">
                            <label className="form-label fw-bold">Shift <span className="text-danger">*</span></label>
                            <MultiSelect
                                value={selectedShifts}
                                options={shifts}
                                optionLabel="shiftTime"
                                onChange={(e) => setSelectedShifts(e.value)}
                                placeholder="Select Shifts"
                                className="w-100 custom-multiselect"
                                display="chip"
                                filter
                            />
                        </div>
                    </div>
                </div>

                {/* Replicate To Section */}
                <div className="card_tb p-3 mb-3">
                     <h5 className="replicate-header">Replicate To</h5>
                     <div className="row align-items-end">
                        <div className="col-md-3 mb-3">
                             <label className="form-label fw-bold">Date <span className="text-danger">*</span></label>
                            <div className="custom-calendar-wrapper">
                                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                <Calendar
                                    value={toDate}
                                    onChange={(e) => setToDate(e.value)}
                                    showIcon={false}
                                    className="w-100 custom-calendar-input"
                                    placeholder="Select Date"
                                    minDate={fromDate}
                                />
                            </div>
                        </div>
                     </div>
                </div>

                {/* Actions */}
                <div className="card_tb p-3 mb-3 text-center">
                    <div className="d-flex justify-content-center gap-3">
                        <ReportButton label={showStatsTable ? "Hide Statistics" : "Show Statistics"} onClick={() => showStatsTable ? setShowStatsTable(false) : handleShowStats()} />
                        <ReportButton label="Replicate" onClick={handleReplicate} />
                        <ReportButton label="Go To Exception" onClick={handleGoToException} />
                    </div>
                </div>

                {/* Statistics Table */}
                {showStatsTable && (
                    <div className="card_tb p-3">
                         <CustomDataTable
                            value={statsData.slice(first, first + rows)}
                            className="p-datatable-sm"
                            emptyMessage="No statistics available."
                            rowClassName={(data, props) => props.rowIndex % 2 !== 0 ? "ota-row-odd" : ""}
                        >
                            <Column field="SourceRoutes" header="Source Routes" sortable />
                            <Column field="SourceEmp" header="Source Employees" sortable />
                            <Column field="DelExceptionCount" header="Delete Exception" sortable />
                            <Column field="AddExceptionCount" header="Add Exception" sortable />
                        </CustomDataTable>
                        <CustomPaginator
                            first={first}
                            rows={rows}
                            totalRecords={statsData.length}
                            onPageChange={onPageChange}
                            rowsPerPageOptions={[10, 20]}
                        />
                    </div>
                )}
             </div>
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
    );
};

export default ReplicateRoster;

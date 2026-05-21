import React, { useState, useEffect, useRef, useMemo } from "react";
import SidebarMenu from "./Master/SidebarMenu";
import Header from "./Master/Header";
import TabSwitcher from "./common/TabSwitcher";
import { Calendar } from "primereact/calendar";
import calendarIcon from "../assets/calendar.png";
import ReportButton from "./common/ReportButton";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import HelpDeskService from "../services/compliance/HelpDeskService";
import sessionManager from "../utils/SessionManager";
import { toastService } from "../services/toastService";
import Loader from "./common/Loader";
import { ToastContainer } from "react-toastify";
import noReportImage from "../assets/no_report.png";
import { CustomDataTable } from "./common/CustomDataTable";
import CustomPaginator from "./common/CustomPaginator";
import { Column } from "primereact/column";
import MasterSidebar from "./Master/MasterSidebar";
import { Button } from "primereact/button";
import AnimatedCounter from "./common/AnimatedCounter";

const HelpDesk = () => {
    const [loading, setLoading] = useState(false);
    const [loadingRows, setLoadingRows] = useState({});
    const [activeTab, setActiveTab] = useState("open");
    const [facility, setFacilities] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const UserId = sessionManager.getUserSession().ID;
    const locationId = sessionManager.getUserSession().locationId;
    const [tripType, setTripType] = useState("P");
    const tripTypeOptions = useMemo(() => [
        { label: "Pick", value: "P" },
        { label: "Drop", value: "D" }
    ], []);
    const [tripFilter, setTripFilter] = useState(1);
    const tripOptions = useMemo(() => [
        { label: "All Trips", value: 1 },
        { label: "Trip Tracking Status", value: 3 }
    ], []);
    const [shiftTimeOptions, setShiftTimeOptions] = useState([]);
    const [selectedShiftTime, setSelectedShiftTime] = useState("");
    const [employeeDate, setEmployeeDate] = useState(new Date());
    const [routeDate, setRouteDate] = useState(new Date());
    const [empSearchText, setEmpSearchText] = useState("");
    const [employeeData, setEmployeeData] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [employeeDetails, setEmployeeDetails] = useState(null);
    const [expandedRows, setExpandedRows] = useState([]);
    const [employeeDetailsMap, setEmployeeDetailsMap] = useState({});
    const [scheduleLogData, setScheduleLogData] = useState(null);
    const [showScheduleSidebar, setShowScheduleSidebar] = useState(false);
    const [routeSummary, setRouteSummary] = useState(null);
    const [routeDetails, setRouteDetails] = useState([]);
    const [showRouteSidebar, setShowRouteSidebar] = useState(false);
    const [dropRouteSummary, setDropRouteSummary] = useState(null);
    const [dropRouteDetails, setDropRouteDetails] = useState([]);
    const [showDropRouteSidebar, setShowDropRouteSidebar] = useState(false);
    const [routeId, setRouteId] = useState("");
    const [routeIdSummary, setRouteIdSummary] = useState(null);
    const [routeIdDetails, setRouteIdDetails] = useState([]);
    const [showRouteIdSidebar, setShowRouteIdSidebar] = useState(false);
    const [routeList, setRouteList] = useState([]);
    const [hasRouteSearched, setHasRouteSearched] = useState(false);
    const [routeStats, setRouteStats] = useState({
        AllTripCount: "",
        TripNotStartedCount: "",
        TripStartedCount: "",
        TripCompletedCount: "",
        TripClosedCount: ""
    });

    const [showStats, setShowStats] = useState(false);
    const [expandedRoutes, setExpandedRoutes] = useState([]);
    const [routeEmployeeDetailsMap, setRouteEmployeeDetailsMap] = useState({});
    const [loadingRoutes, setLoadingRoutes] = useState({});
    const [incidentMaster, setIncidentMaster] = useState([]);
    useEffect(() => {
        setShowStats(false);
    }, [activeTab]);

    useEffect(() => {
        const loadIncidentMaster = async () => {
            try {
                const res = await HelpDeskService.GetIncidentMaster();
                let data = [];
                if (typeof res === "string") {
                    data = JSON.parse(res);
                } else if (Array.isArray(res)) {
                    data = res;
                } else if (typeof res === "object") {
                    data = res.data || [];
                }
                setIncidentMaster(data);
            } catch (error) {
                console.log("Error loading incident master:", error);
            }
        };
        loadIncidentMaster();
    }, []);
    const actionOptions = [
        { label: "Select", value: "" },
        { label: "Boarded", value: "B" },
        { label: "No-Show", value: "N" },
        { label: "OTBYTPT", value: "C" }
    ];
    const [showMap, setShowMap] = useState(false);
    const onPageChange = (event) => {
        setFirst(event.first);
        setRowsPerPage(event.rows);
    };
    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
    };
    const getTodayDate = () => new Date();
    useEffect(() => {
        fetchFacility();
    }, []);
    const fetchFacility = async () => {
        try {
            const response = await HelpDeskService.SelectFacility({
                Userid: UserId,
            })
            const parsedResponse = typeof response === "string" ? JSON.parse(response) : response;
            const formattedData = Array.isArray(parsedResponse) ? parsedResponse.map((item) => ({
                label: item.facility || item.facilityName,
                value: item.Id,
            }))
                : [];
            setFacilities(formattedData);
        } catch (error) {
            console.log("Facility Load Error", error);
            throw error;
        }
    }
    useEffect(() => {
        if (selectedFacility && tripType) {
            fetchShiftTimeByFacility();
        }
    }, [selectedFacility, tripType]);
    const fetchShiftTimeByFacility = async () => {
        try {
            const response = await HelpDeskService.GetShiftByFacilityType({
                facid: selectedFacility,
                type: tripType,
            });
            const parsedResponse =
                typeof response === "string" ? JSON.parse(response) : response;
            if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
                const formattedData = parsedResponse.map((item) => ({
                    name: item.shiftTime,
                    value: item.shiftTime,
                }));
                setShiftTimeOptions(formattedData);

            } else {
                toastService.warn("No shift times found for the selected facility and trip type.");
            }
        }
        catch (error) {
            toastService.error("Error fetching shift time by facility:", error);
        }
    };
    const handleEmpSearch = async () => {
        if (!empSearchText) {
            toastService.warn("Please enter Employee Id / Name / Email");
            return;
        }
        setLoading(true);
        try {
            const response = await HelpDeskService.EmpSearch({
                locationid: locationId,
                empidname: empSearchText,
                IsAdmin: "N",
            });
            console.log("EmpSearch Raw:", response);
            let data = [];
            if (typeof response === "string") {
                data = JSON.parse(response);
            }
            else if (Array.isArray(response)) {
                data = response;
            }
            else if (typeof response === "object") {
                data = response.data ?? [];
            }
            //console.log("Parsed Data:", data);
            setEmployeeData(data || []);
            setEmployeeDetailsMap({});
            setExpandedRows([]);
            setHasSearched(true);
            if (!data || data.length === 0) {
                toastService.warn("No data found");
            }
        } catch (error) {
            console.error("EmpSearch Error:", error);
            toastService.error("Error fetching employee data");
        } finally {
            setLoading(false);
        }
    };
    // const handleEmpClick = async (rowData) => {
    //     try {
    //         setLoading(true);
    //         setSelectedRow(rowData);
    //         const response = await HelpDeskService.GetEmployeeDetails({
    //             empid: rowData.id,
    //         });
    //         console.log("Raw Employee Details:", response);
    //         let parsedData = [];
    //         if (typeof response === "string") {
    //             try {
    //                 parsedData = JSON.parse(response);
    //             } catch (e) {
    //                 console.error("JSON Parse Error:", e);
    //                 parsedData = [];
    //             }
    //         }
    //         else if (Array.isArray(response)) {
    //             parsedData = response;
    //         }
    //         else if (typeof response === "object") {
    //             parsedData = response.data || [response];
    //         }
    //         // console.log("Parsed Employee Data:", parsedData);
    //         const empDetails = parsedData?.length > 0 ? parsedData[0] : null;
    //         if (!empDetails) {
    //             toastService.warn("No employee details found");
    //             return;
    //         }
    //         setEmployeeDetails(empDetails);
    //         setShowSidebar(true);
    //     } catch (error) {
    //         console.log("Employee Details Error:", error);
    //         toastService.error("Error fetching employee details");
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const handleEmpClick = async (rowData) => {
        try {
            setLoading(true);
            setSelectedRow(rowData);
            const [detailsRes, empRes] = await Promise.all([
                HelpDeskService.GetEmployeeDetails({
                    empid: rowData.id,
                }),
                HelpDeskService.GetEmployee({
                    Userid: rowData.id,
                })
            ]);
            let parsedDetails = [];
            if (typeof detailsRes === "string") {
                parsedDetails = JSON.parse(detailsRes);
            } else if (Array.isArray(detailsRes)) {
                parsedDetails = detailsRes;
            } else if (typeof detailsRes === "object") {
                parsedDetails = detailsRes.data || [detailsRes];
            }
            const empDetails = parsedDetails?.length > 0 ? parsedDetails[0] : null;
            if (!empDetails) {
                toastService.warn("No employee details found");
                return;
            }
            let employeeList = [];
            if (typeof empRes === "string") {
                employeeList = JSON.parse(empRes);
            } else if (Array.isArray(empRes)) {
                employeeList = empRes;
            } else if (typeof empRes === "object") {
                employeeList = empRes.data || [];
            }
            const extraData = employeeList.find(
                (emp) => emp.empCode === empDetails.empCode
            );
            const finalData = {
                ...empDetails,
                ...extraData,
            };
            //console.log("Final Employee Data:", finalData);
            setEmployeeDetails(finalData);
            setShowSidebar(true);
        } catch (error) {
            console.log("Employee Details Error:", error);
            toastService.error("Error fetching employee details");
        } finally {
            setLoading(false);
        }
    };
    const handleRowExpand = async (rowData) => {
        const empCode = rowData.empCode;
        const isExpanded = expandedRows.some((r) => r.empCode === empCode);
        if (isExpanded) {
            setExpandedRows(expandedRows.filter((r) => r.empCode !== empCode));
            return;
        }
        setExpandedRows([...expandedRows, rowData]);
        setLoadingRows((prev) => ({ ...prev, [empCode]: true }));
        try {
            const response = await HelpDeskService.GetHelpDeskEmployeeDetail({
                sDate: formatDate(employeeDate),
                empid: rowData.id,
            });
            const parsedData = typeof response === "string" ? JSON.parse(response) : response;
            setEmployeeDetailsMap((prev) => ({
                ...prev,
                [empCode]: parsedData,
            }));
        } catch (err) {
            toastService.error("Error fetching employee details");
            console.error(err);
        } finally {
            setLoadingRows((prev) => ({ ...prev, [empCode]: false }));
        }
    };
    const handleShiftClick = async (rowData, parentRow) => {
        try {
            setLoading(true);
            const response = await HelpDeskService.GetEmpScheduleLog({
                sDate: formatDate(rowData.ShiftDate),
                empid: parentRow.id,
            });
            let parsedData = [];
            if (typeof response === "string") {
                parsedData = JSON.parse(response);
            } else if (Array.isArray(response)) {
                parsedData = response;
            } else if (typeof response === "object") {
                parsedData = response.data || [];
            }

            if (!parsedData || parsedData.length === 0) {
                toastService.warn("No schedule log found");
                return;
            }
            const selectedShift = rowData.Shifts;
            const matchedData =
                parsedData.find((item) => item.startDate === rowData.ShiftDate) ||
                parsedData[0];
            setScheduleLogData(matchedData);
            setShowScheduleSidebar(true);
        } catch (error) {
            console.error("Schedule Log Error:", error);
            toastService.error("Error fetching schedule log");
        } finally {
            setLoading(false);
        }
    };
    const handleRouteClick = async (routeId) => {
        if (!routeId || routeId === "N/A") {
            toastService.warn("Pickup route data not found.");
            setRouteSummary(null);
            setRouteDetails([]);
            setShowRouteSidebar(false);
            return;
        }
        try {
            setLoading(true);
            const [summaryRes, detailsRes] = await Promise.all([
                HelpDeskService.GetRouteSummary({
                    routeids: routeId,
                }),
                HelpDeskService.GetRoutesDetailsnew({
                    RouteID: routeId,
                    isAdd: 1,
                }),
            ]);
            let summaryData = [];
            if (typeof summaryRes === "string") {
                summaryData = JSON.parse(summaryRes);
            } else {
                summaryData = summaryRes;
            }
            let detailsData = [];
            if (typeof detailsRes === "string") {
                detailsData = JSON.parse(detailsRes);
            } else {
                detailsData = detailsRes;
            }
            setRouteSummary(summaryData?.[0] || null);
            setRouteDetails(detailsData || []);
            setShowRouteSidebar(true);
        } catch (error) {
            console.error("Route Error:", error);
            toastService.error("Error fetching route data");
        } finally {
            setLoading(false);
        }
    };

    const handleDropRouteClick = async (routeId) => {
        if (!routeId || routeId === "N/A") {
            toastService.warn("Drop route data not found.");
            setDropRouteSummary(null);
            setDropRouteDetails([]);
            setShowDropRouteSidebar(false);
            return;
        }
        try {
            setLoading(true);

            const [summaryRes, detailsRes] = await Promise.all([
                HelpDeskService.GetRouteSummary({
                    routeids: routeId,
                }),
                HelpDeskService.GetRoutesDetailsnew({
                    RouteID: routeId,
                    isAdd: 1,
                }),
            ]);
            // Summary Parse
            let summaryData = [];
            if (typeof summaryRes === "string") {
                summaryData = JSON.parse(summaryRes);
            } else {
                summaryData = summaryRes;
            }
            // Details Parse
            let detailsData = [];
            if (typeof detailsRes === "string") {
                detailsData = JSON.parse(detailsRes);
            } else {
                detailsData = detailsRes;
            }
            setDropRouteSummary(summaryData?.[0] || null);
            setDropRouteDetails(detailsData || []);
            setShowDropRouteSidebar(true);
        } catch (error) {
            console.error("Drop Route Error:", error);
            toastService.error("Error fetching drop route data");
        } finally {
            setLoading(false);
        }
    };
    const handleRouteSearch = async (routeId) => {

        if (!routeId || routeId === "N/A") {
            toastService.warn("Enter route ID.");
            setRouteIdSummary(null);
            setRouteIdDetails([]);
            setShowRouteIdSidebar(false);
            return;
        }
        try {
            setLoading(true);
            const [summaryRes, detailsRes] = await Promise.all([
                HelpDeskService.GetRouteSummary({
                    routeids: routeId,
                }),
                HelpDeskService.GetRoutesDetailsnew({
                    RouteID: routeId,
                    isAdd: 1,
                }),
            ]);
            let summaryData = [];
            if (typeof summaryRes === "string") {
                summaryData = JSON.parse(summaryRes);
            } else if (Array.isArray(summaryRes)) {
                summaryData = summaryRes;
            } else if (typeof summaryRes === "object") {
                summaryData = summaryRes.data || [summaryRes];
            }
            let detailsData = [];
            if (typeof detailsRes === "string") {
                detailsData = JSON.parse(detailsRes);
            } else if (Array.isArray(detailsRes)) {
                detailsData = detailsRes;
            } else if (typeof detailsRes === "object") {
                detailsData = detailsRes.data || [];
            }
            if (!summaryData.length) {
                toastService.warn("No Route Data Found");
                setRouteIdSummary(null);
                setRouteIdDetails([]);
                return;
            }
            setRouteIdSummary(summaryData[0]);
            setRouteIdDetails(detailsData);
            setShowRouteIdSidebar(true);
        } catch (error) {
            console.log("Route Search Error:", error);
            toastService.error("Error fetching route data");
        } finally {
            setLoading(false);
        }
    };
    const cleanText = (text) => {
        return text ? text.replace(/<[^>]*>/g, '') : '';
    };
    const getTripTypeLabel = (type) => {
        return type === "P" ? "PickUP" : type === "D" ? "Drop" : "N/A";
    };

    const formattedDate = formatDate(routeDate);

    const handleSaveTracking = async () => {
        try {
            setLoading(true);
            let currentRouteDetails, currentRouteSummary, sidebarType;
            if (showRouteIdSidebar) {
                currentRouteDetails = routeIdDetails;
                currentRouteSummary = routeIdSummary;
                sidebarType = 'routeId';
            } else if (showDropRouteSidebar) {
                currentRouteDetails = dropRouteDetails;
                currentRouteSummary = dropRouteSummary;
                sidebarType = 'drop';
            } else {
                currentRouteDetails = routeDetails;
                currentRouteSummary = routeSummary;
                sidebarType = 'pick';
            }
            const missingStatusRows = currentRouteDetails.filter(row => !row.trackingStatus);
            if (missingStatusRows.length > 0) {
                toastService.warn("Please select action for all employees");
                setLoading(false);
                return;
            }
            const promises = currentRouteDetails.map((row) => {
                // Convert time values to integers
                const hh = parseInt(row.ActETAhh) || 0;
                const mm = parseInt(row.ActETAmm) || 0;

                const payload = {
                    RouteID: currentRouteSummary?.RouteID || "",
                    EmployeeID: row.id || "",
                    ActTripStartDate: formattedDate ? new Date(formattedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], // Ensure YYYY-MM-DD format
                    TrackingAction: row.trackingStatus || "",
                    ActETAhh: hh || "",
                    ActETAmm: mm || "",
                    TrackingRemark: row.remark || "",
                    UpdateBy: UserId || ""
                };
                console.log("Tracking Payload:", payload);
                return HelpDeskService.UpdateTrackingStatus(payload);
            });
            await Promise.all(promises);
            toastService.success("Tracking updated successfully");
            // Close the appropriate sidebar
            if (sidebarType === 'routeId') {
                setShowRouteIdSidebar(false);
            } else if (sidebarType === 'drop') {
                setShowDropRouteSidebar(false);
            } else {
                setShowRouteSidebar(false);
            }
        } catch (error) {
            console.error("Save Error:", error);
            console.error("Error Response:", error?.response?.data);
            toastService.error("Error while updating tracking status: " + (error?.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRowSave = async (rowData) => {
        if (!rowData) {
            toastService.warn("No row selected for saving");
            return;
        }

        setLoading(true);
        setLoadingRows((prev) => ({ ...prev, [rowData.RouteID || rowData.id || "row"]: true }));

        try {
            let updated = false;

            const vehiclePayload = {
                RouteID: rowData.RouteID || "",
                VehicleNo: rowData.VehicleNo || rowData.vehicleNo || "",
                Remark: rowData.remark || rowData.Remark || "",
                Driver: rowData.DriverName || rowData.Driver || rowData.driverName || "",
                DriverContact: rowData.DriverContact || rowData.drivercontact || "",
                DelayReason: rowData.DelayReason || "",
                UpdateBy: UserId || ""
            };

            if (vehiclePayload.RouteID && vehiclePayload.VehicleNo) {
                await HelpDeskService.sprUpdateVehicleRemark(vehiclePayload);
                updated = true;
            }

            const employeeId = rowData.EmployeeID || rowData.id || rowData.ID;
            if (employeeId) {
                const trackingPayload = {
                    RouteID: rowData.RouteID || "",
                    EmployeeID: employeeId,
                    ActTripStartDate: formattedDate ? new Date(formattedDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                    TrackingAction: rowData.trackingStatus || rowData.TripStatus || "",
                    ActETAhh: rowData.ActETAhh || "",
                    ActETAmm: rowData.ActETAmm || "",
                    TrackingRemark: rowData.remark || rowData.Remark || "",
                    UpdateBy: UserId || ""
                };
                await HelpDeskService.UpdateTrackingStatus(trackingPayload);
                updated = true;
            }

            if (!updated) {
                toastService.warn("Nothing to update for this row");
                return;
            }

            setRouteList((prev) =>
                prev.map((item) =>
                    item.RouteID === rowData.RouteID
                        ? { ...item, ...rowData }
                        : item
                )
            );

            toastService.success("Row updated successfully");
        } catch (error) {
            console.error("Error saving row:", error);
            toastService.error("Error while saving row: " + (error?.response?.data?.message || error.message));
        } finally {
            setLoading(false);
            setLoadingRows((prev) => {
                const next = { ...prev };
                delete next[rowData.RouteID || rowData.id || "row"];
                return next;
            });
        }
    };

    const handleTabChange = (value) => {
        setActiveTab(value);
        // Employee → Route
        if (value === "closed") {
            // Employee data clear
            setEmployeeData([]);
            setHasSearched(false);
            setExpandedRows([]);
            setEmployeeDetailsMap({});
            setSelectedRow(null);
            // optional: inputs bhi reset
            setEmpSearchText("");
            setEmployeeDate(getTodayDate());
        }
        //Route → Employee
        if (value === "open") {
            // Route data clear
            setRouteSummary(null);
            setRouteDetails([]);
            // optional: inputs reset
            setRouteId("");
            setRouteDate(getTodayDate());
            setSelectedFacility(null);
            setTripType(null);
            setSelectedShiftTime(null);
        }
    };
    const getNoDataMessage = () => {
        if (activeTab === "open") {
            return "Please select above parameters to show Employee Details";
        } else {
            return "Please select above parameters to show Route Details";
        }
    };
    const getEmptyResultMessage = () => {
        return activeTab === "open"
            ? "No employee data found for the selected criteria"
            : "No route data found for the selected criteria";
    };

    const handleRouteRowExpand = async (routeData) => {
        const routeId = routeData.RouteID;
        if (expandedRoutes.some((r) => r.RouteID === routeId)) {
            setExpandedRoutes(expandedRoutes.filter((r) => r.RouteID !== routeId));
            return;
        }
        if (routeEmployeeDetailsMap[routeId]) {
            setExpandedRoutes([...expandedRoutes, routeData]);
            return;
        }
        setLoadingRoutes({ ...loadingRoutes, [routeId]: true });
        try {
            const res = await HelpDeskService.GetRoutesDetailsnew({
                RouteID: routeId,
                isAdd: 1
            });
            console.log("GetRoutesDetailsnew Response for RouteID", routeId, ":", res);
            let employeeData = [];
            if (typeof res === "string") {
                employeeData = JSON.parse(res);
            } else if (Array.isArray(res)) {
                employeeData = res;
            } else if (typeof res === "object") {
                employeeData = res.data || res.details || [];
            }
            setRouteEmployeeDetailsMap({
                ...routeEmployeeDetailsMap,
                [routeId]: employeeData || []
            });
            setExpandedRoutes([...expandedRoutes, routeData]);
        } catch (error) {
            console.log("Route Employee Details Error:", error);
            toastService.error("Error fetching employee details for route");
            setRouteEmployeeDetailsMap({
                ...routeEmployeeDetailsMap,
                [routeId]: []
            });
        } finally {
            setLoadingRoutes({ ...loadingRoutes, [routeId]: false });
        }
    };

    const handleExpandedRouteCancel = (routeId) => {
        setExpandedRoutes(expandedRoutes.filter((r) => r.RouteID !== routeId));
    };

    const handleSaveExpandedRouteDetails = async (routeId) => {
        const employeeDetails = routeEmployeeDetailsMap[routeId] || [];
        if (employeeDetails.length === 0) {
            toastService.warn("No employee details to save.");
            return;
        }

        const missingStatusRows = employeeDetails.filter((row) => !row.trackingStatus);
        if (missingStatusRows.length > 0) {
            toastService.warn("Please select action for all employees.");
            return;
        }

        setLoading(true);
        try {
            const promises = employeeDetails.map((row) => {
                const hh = parseInt(row.ActETAhh, 10) || "";
                const mm = parseInt(row.ActETAmm, 10) || "";
                return HelpDeskService.UpdateTrackingStatus({
                    RouteID: routeId,
                    EmployeeID:
                        row.id ||
                        row.ID ||
                        row.EmployeeID ||
                        row.employeeID ||
                        row.EmpID ||
                        row.EmpCode ||
                        "",
                    ActTripStartDate: formattedDate,
                    TrackingAction: row.trackingStatus || "",
                    ActETAhh: hh,
                    ActETAmm: mm,
                    TrackingRemark: row.remark || row.Remark || row.TripRemark || "",
                    UpdateBy: UserId || ""
                });
            });
            await Promise.all(promises);
            toastService.success("Route details updated successfully.");
        } catch (error) {
            console.error("Error saving expanded route details:", error);
            toastService.error("Error while saving route employee details.");
        } finally {
            setLoading(false);
        }
    };

    const handleRouteSubmit = async () => {
        try {
            if (!routeDate || !selectedFacility || !tripType || !selectedShiftTime) {
                toastService.warn("Please fill all required fields");
                return;
            }
            setLoading(true);
            const params = {
                sDate: formatDate(routeDate),
                eDate: formatDate(routeDate),
                FacilityID: selectedFacility,
                TripType: tripType,
                Shifttimes: selectedShiftTime?.name || selectedShiftTime,
                OrderBy: "",
                Direction: "ASC",
                TripStatus: 1,
            };
            console.log("Route Search Params:", params)
            const res = await HelpDeskService.GetRoutesHelpDesk(params);
            console.log("GetRoutesHelpDesk Raw Response:", res);
            let data = [];
            if (typeof res === "string") {
                data = JSON.parse(res);
            } else if (Array.isArray(res)) {
                data = res;
            } else if (typeof res === "object") {
                data = res.data || [];
            }
            setRouteList(data);
            setHasRouteSearched(true);
            // Call GetRouteCountHelpDesk for stats
            const countParams = {
                sDate: formatDate(routeDate),
                eDate: formatDate(routeDate),
                FacilityID: selectedFacility,
                TripType: tripType,
                Shifttimes: selectedShiftTime?.name || selectedShiftTime,
            };
            let countRes = await HelpDeskService.GetRouteCountHelpDesk(countParams);
            //console.log("GetRouteCountHelpDesk Raw Response:", countRes);
            //console.log("Response Type:", typeof countRes);
            //console.log("Is Array:", Array.isArray(countRes));
            // Parse response with multiple fallbacks
            let countData = {};
            if (typeof countRes === "string") {
                try {
                    const parsed = JSON.parse(countRes);
                    countData = Array.isArray(parsed) ? parsed[0] : parsed;
                } catch (e) {
                    console.error("Failed to parse string response:", e);
                    countData = {};
                }
            } else if (Array.isArray(countRes)) {
                // Response is directly an array - extract first element
                countData = countRes[0] || {};
                //console.log("Extracted from array:", countData);
            } else if (typeof countRes === "object" && countRes !== null) {
                // Check if wrapped in a data property
                if (countRes.data) {
                    countData = Array.isArray(countRes.data) ? countRes.data[0] : countRes.data;
                } else {
                    countData = countRes;
                }
            }
            //console.log("Final Parsed Count Data:", countData);
            // Ensure all values are numbers, default to 0 if missing or invalid
            const safeValue = (val) => {
                if (val === null || val === undefined) return 0;
                const num = Number(val);
                return isNaN(num) ? 0 : num;
            };
            // Update routeStats with correct keys and safe value extraction
            const finalStats = {
                AllTripCount: safeValue(countData.AllTripCount),
                TripNotStartedCount: safeValue(countData.TripNotStartedCount),
                TripStartedCount: safeValue(countData.TripStartedCount),
                TripCompletedCount: safeValue(countData.TripCompletedCount),
                TripClosedCount: safeValue(countData.TripClosedCount),
            };
            //console.log("Final Stats to be Set:", finalStats);
            setRouteStats(finalStats);
            setShowStats(true);
        } catch (error) {
            console.log("Route API Error:", error);
            toastService.error("Error fetching route data");
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <Loader isVisible={loading} fullScreen={true} />
            <Header pageTitle="Online Tracking" mainTitle="HelpDesk" />
            <SidebarMenu />
            <div className="middle">
                <div className="">
                    <TabSwitcher
                        tabs={[
                            { label: "Employee", value: "open" },
                            { label: "Route", value: "closed" },
                        ]}
                        activeTab={activeTab}
                        onTabChange={handleTabChange} />
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="card_tb p-3">
                            {activeTab === "open" && (
                                <div className="row g-2">
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                                        <label htmlFor="startDate" className="form-label">
                                            Date <span>*</span>
                                        </label>
                                        <div className="custom-calendar-wrapper">
                                            <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                            <Calendar
                                                id="startDate"
                                                className="w-100 custom-calendar-input"
                                                value={employeeDate}
                                                onChange={(e) => setEmployeeDate(e.value)}
                                                dateFormat="mm/dd/yy"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                                        <label htmlFor="employeeSearch" className="form-label">
                                            Enter ID,Name or email <span>*</span>
                                        </label>
                                        <InputText
                                            className="form-control"
                                            placeholder="Enter value"
                                            value={empSearchText}
                                            onChange={(e) => setEmpSearchText(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-flex align-items-end">
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
                                            `}
                                        </style>
                                        <ReportButton
                                            label="Search"
                                            onClick={handleEmpSearch}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                                        <label htmlFor="enterRouteId" className="form-label">
                                            Enter Route Id : <span>*</span>
                                        </label>
                                        <InputText
                                            className="form-control"
                                            placeholder="Enter route ID"
                                            value={routeId}
                                            onChange={(e) => setRouteId(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2 d-flex align-items-end">
                                        <ReportButton
                                            label="Search"
                                            onClick={() => handleRouteSearch(routeId)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}
                            {activeTab === "closed" && (
                                <div className="row g-3">

                                    {/* Shift Date */}
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                                        <label className="form-label">Trips</label>
                                        <Dropdown className="w-100" placeholder="Select"
                                            value={tripFilter}
                                            options={tripOptions}
                                            onChange={(e) => setTripFilter(e.value)}
                                        ></Dropdown>
                                    </div>
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                                        <label htmlFor="shiftDate" className="form-label">
                                            Date <span>*</span>
                                        </label>
                                        <div className="custom-calendar-wrapper">
                                            <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                            <Calendar
                                                id="shiftDate"
                                                className="w-100 custom-calendar-input"
                                                value={routeDate}
                                                onChange={(e) => setRouteDate(e.value)}
                                                dateFormat="mm/dd/yy"
                                            />
                                        </div>
                                    </div>

                                    {/* Facility */}
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                                        <label className="form-label">Facility Name<span>*</span></label>
                                        <Dropdown className="w-100" placeholder="Select Facility"
                                            id="facility"
                                            value={selectedFacility}
                                            options={facility}
                                            onChange={(e) => setSelectedFacility(e.value)}
                                            filter
                                        >
                                        </Dropdown>
                                    </div>

                                    {/* Trip Type */}
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                                        <label className="form-label">Trip Type <span>*</span></label>
                                        <Dropdown className="w-100" placeholder="Select Trip "
                                            value={tripType}
                                            options={tripTypeOptions}
                                            onChange={(e) => setTripType(e.value)}
                                        >
                                        </Dropdown>
                                    </div>

                                    {/* Shift */}
                                    <div className="col-12 col-sm-6 col-md-3 col-lg-2">
                                        <label className="form-label">Shift Time<span>*</span></label>
                                        <Dropdown className="w-100" placeholder="Select Shift"
                                            options={shiftTimeOptions}
                                            optionLabel="name"
                                            onChange={(e) => setSelectedShiftTime(e.value)}
                                            value={selectedShiftTime}
                                            filter
                                        >
                                        </Dropdown>

                                    </div>

                                    {/* Submit Button */}
                                    <div className="col-md-2 d-flex align-items-end">
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
                                            `}
                                        </style>
                                        <ReportButton label="Submit" onClick={handleRouteSubmit}
                                            disabled={loading} />
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                    {showStats && (
                        <div className="row mt-3">
                            <div className="col">
                                <div className="cardNew p-4 bg-white">
                                    <h3 className="text-info">
                                        <AnimatedCounter value={routeStats.AllTripCount} />
                                    </h3>
                                    <span>All Trips</span>
                                </div>
                            </div>
                            <div className="col">
                                <div className="cardNew p-4 bg-white">
                                    <h3 className="text-dark">
                                        <AnimatedCounter value={routeStats.TripNotStartedCount} />
                                    </h3>
                                    <span>Trips Not Started</span>
                                </div>
                            </div>

                            <div className="col">
                                <div className="cardNew p-4 bg-white">
                                    <h3 className="text-warning">
                                        <AnimatedCounter value={routeStats.TripStartedCount} />
                                    </h3>
                                    <span>Trips Started</span>
                                </div>
                            </div>

                            <div className="col">
                                <div className="cardNew p-4 bg-white">
                                    <h3 className="text-primary">
                                        <AnimatedCounter value={routeStats.TripCompletedCount} />
                                    </h3>
                                    <span>Tracking Completed</span>
                                </div>
                            </div>

                            <div className="col">
                                <div className="cardNew p-4 bg-white">
                                    <h3 className="text-success">
                                        <AnimatedCounter value={routeStats.TripClosedCount} />
                                    </h3>
                                    <span>Trip Closed</span>
                                </div>
                            </div>


                        </div>
                    )}
                </div>
                {/* 🔹 EMPLOYEE TABLE */}
                {activeTab === "open" && (
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
                                            {getNoDataMessage()}
                                        </p>
                                    </div>
                                )}
                                {hasSearched && employeeData.length === 0 && (
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
                                            {getEmptyResultMessage()}
                                        </p>
                                    </div>
                                )}
                                {hasSearched && employeeData.length > 0 && (
                                    <div className="p-3">
                                        <CustomDataTable
                                            value={employeeData.slice(first, first + rowsPerPage)}
                                            className="p-datatable-sm"
                                            emptyMessage="No employee data"
                                            expandedRows={expandedRows}
                                            onRowToggle={(e) => setExpandedRows(e.data)}
                                            dataKey="empCode"
                                            rowExpansionTemplate={(rowData) => {
                                                const empCode = rowData.empCode;
                                                const loading = loadingRows[empCode];
                                                const details = employeeDetailsMap[empCode] || [];

                                                return (
                                                    <div style={{ padding: "1rem", background: "#f8f9fa" }}>
                                                        {loading ? (
                                                            <div className="text-center p-2">Loading...</div>
                                                        ) : details.length > 0 ? (
                                                            <CustomDataTable
                                                                value={details}
                                                                className="p-datatable-sm nested-table"
                                                                emptyMessage="No details found"
                                                            >
                                                                <Column field="ShiftDate" header="Shift Date" />
                                                                <Column
                                                                    field="Shifts"
                                                                    header="Shift Time"
                                                                    body={(detailRowData) => {
                                                                        return (
                                                                            <span
                                                                                style={{ color: "blue", cursor: "pointer" }}
                                                                                onClick={() => handleShiftClick(detailRowData, rowData)}
                                                                            >
                                                                                {detailRowData.Shifts}
                                                                            </span>
                                                                        );
                                                                    }}
                                                                />

                                                                <Column
                                                                    field="pickRouteID"
                                                                    header="PickUp RouteID"
                                                                    body={(rowData) => (
                                                                        <span
                                                                            style={{ color: "blue", cursor: "pointer" }}
                                                                            onClick={() => handleRouteClick(rowData.pickRouteID)}
                                                                        >
                                                                            {rowData.pickRouteID}
                                                                        </span>
                                                                    )}
                                                                />
                                                                <Column field="PickTrackingStatus" header="PickUp Tracking Status" />
                                                                <Column
                                                                    field="dropRouteID"
                                                                    header="Drop Route ID"
                                                                    body={(rowData) => (
                                                                        <span
                                                                            style={{ color: "blue", cursor: "pointer" }}
                                                                            onClick={() => handleDropRouteClick(rowData.dropRouteID)}
                                                                        >
                                                                            {rowData.dropRouteID}
                                                                        </span>
                                                                    )}
                                                                />
                                                                <Column field="DropTrackingStatus" header="	Drop Tracking Status" />
                                                            </CustomDataTable>
                                                        ) : (
                                                            <div className="text-center p-2">No details found</div>
                                                        )}
                                                    </div>
                                                );
                                            }}
                                        >
                                            <Column
                                                expander
                                                style={{ width: "50px", textAlign: "center" }}
                                                body={(rowData) => (
                                                    <span
                                                        className="material-icons"
                                                        style={{ cursor: "pointer", color: "#0d6efd" }}
                                                        onClick={() => handleRowExpand(rowData)}
                                                    >
                                                        {expandedRows.some((r) => r.empCode === rowData.empCode)
                                                            ? "remove_circle"
                                                            : "add_circle"}
                                                    </span>
                                                )}
                                            />
                                            <Column field="empCode" header="Employee Id" body={(rowData) => (
                                                <span
                                                    style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
                                                    onClick={() => handleEmpClick(rowData)}
                                                >
                                                    {rowData.empCode}
                                                </span>
                                            )} />
                                            <Column field="empName" header="Employee Name" />
                                            <Column field="processName" header="Process" />
                                            <Column field="facilityName" header="Facility" />
                                            <Column field="email" header="E-mail" />
                                            {/* Expanded Row Details
                                        {employeeData.slice(first, first + rowsPerPage).map((row) =>
                                            expandedRows.some((r) => r.empCode === row.empCode) ? (
                                                <tr key={`detail-${row.empCode}`}>
                                                    <td colSpan={6} style={{ padding: 0, border: 0 }}>
                                                        {loading[row.empCode] ? (
                                                            <div className="p-2 text-center">Loading...</div>
                                                        ) : (
                                                            <CustomDataTable
                                                                value={employeeDetailsMap[row.empCode] || []}
                                                                className="p-datatable-sm nested-table"
                                                                emptyMessage="No details found"
                                                            >
                                                                <Column field="ShiftDate" header="Shift Date" />
                                                                <Column field="Shifts" header="Shift Route" />
                                                                <Column field="pickRouteID" header="Pick Route ID" />
                                                                <Column field="PickTrackingStatus" header="Pick Status" />
                                                                <Column field="dropRouteID" header="Drop Route ID" />
                                                                <Column field="DropTrackingStatus" header="Drop Status" />

                                                            </CustomDataTable>
                                                        )}
                                                    </td>
                                                </tr>
                                            ) : null
                                        )} */}
                                        </CustomDataTable>
                                        <CustomPaginator
                                            first={first}
                                            rows={rowsPerPage}
                                            totalRecords={employeeData.length}
                                            onPageChange={onPageChange}
                                            rowsPerPageOptions={[50, 100, 150, 200]}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* 🔹 ROUTE TABLE WITH EXPANDABLE EMPLOYEE DETAILS */}
                {activeTab === "closed" && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card_tb">
                                {!hasRouteSearched && (
                                    <div
                                        className="d-flex flex-column align-items-center justify-content-center p-5"
                                        style={{ minHeight: "50vh" }}
                                    >
                                        <img
                                            src={noReportImage}
                                            alt="No Route Data"
                                            style={{
                                                maxWidth: "100px",
                                                opacity: 0.5,
                                                marginBottom: "1rem",
                                            }}
                                        />
                                        <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                            {getNoDataMessage()}
                                        </p>
                                    </div>
                                )}
                                {hasRouteSearched && routeList.length === 0 && (
                                    <div
                                        className="d-flex flex-column align-items-center justify-content-center p-5"
                                        style={{ minHeight: "50vh" }}
                                    >
                                        <img
                                            src={noReportImage}
                                            alt="No Route Data"
                                            style={{
                                                maxWidth: "100px",
                                                opacity: 0.5,
                                                marginBottom: "1rem",
                                            }}
                                        />
                                        <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                            No route data found for the selected criteria
                                        </p>
                                    </div>
                                )}
                                {hasRouteSearched && routeList.length > 0 && (
                                    <div className="p-3">
                                        <CustomDataTable
                                            value={routeList}
                                            className="p-datatable-sm"
                                            emptyMessage="No route data"
                                            expandedRows={expandedRoutes}
                                            onRowToggle={(e) => setExpandedRoutes(e.data)}
                                            dataKey="RouteID"
                                            rowExpansionTemplate={(rowData) => {
                                                const routeId = rowData.RouteID;
                                                const loading = loadingRoutes[routeId];
                                                const empDetails = routeEmployeeDetailsMap[routeId] || [];

                                                return (
                                                    <div style={{ padding: "1rem", background: "#f8f9fa" }}>
                                                        {loading ? (
                                                            <div className="text-center p-2">Loading employee details...</div>
                                                        ) : empDetails.length > 0 ? (
                                                            <>
                                                                <div style={{ overflowX: "auto" }}>
                                                                    <table className="table table-sm mb-0" style={{ width: "100%", tableLayout: "fixed" }}>
                                                                        <thead>
                                                                            <tr style={{ backgroundColor: "#e9ecef" }}>
                                                                                <th>Stop No</th>
                                                                                <th>Employee Detail</th>
                                                                                <th>Address</th>
                                                                                <th>Location</th>
                                                                                <th>Mobile</th>
                                                                                <th>Shift</th>
                                                                                <th>ETA</th>
                                                                                <th>Action</th>
                                                                                <th>Time(HH:MM)</th>
                                                                                <th>Remark</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {empDetails.map((emp, idx) => (
                                                                                <tr key={idx}>
                                                                                    <td style={{ width: "80px" }}>{emp.stopNo || emp.StopNo || "-"}</td>
                                                                                    <td style={{ width: "170px", whiteSpace: "normal", wordBreak: "break-word" }}>
                                                                                        <div>
                                                                                            <strong>{emp.empCode || emp.EmpCode || "-"}</strong>
                                                                                            <br />
                                                                                            <span>{emp.empName || emp.EmpName || "-"}</span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td style={{ width: "260px", whiteSpace: "normal", wordBreak: "break-word" }}>
                                                                                        {emp.address || emp.Address || "-"}
                                                                                    </td>
                                                                                    <td style={{ width: "180px", whiteSpace: "normal", wordBreak: "break-word" }}>
                                                                                        {emp.location || emp.Location || "-"}
                                                                                    </td>
                                                                                    <td style={{ width: "140px", whiteSpace: "normal", wordBreak: "break-word" }}>
                                                                                        {emp.mobile || emp.Mobile || emp.helpdeskMobile || "-"}
                                                                                    </td>
                                                                                    <td style={{ width: "100px" }}>{emp.shift || emp.Shift || "-"}</td>
                                                                                    <td style={{ width: "110px" }}>{emp.eta || emp.ETA || emp.PickUpTime || "-"}</td>
                                                                                    <td>
                                                                                        <Dropdown
                                                                                            placeholder="Select"
                                                                                            className="w-100"
                                                                                            value={emp.trackingStatus || ""}
                                                                                            options={actionOptions}
                                                                                            optionLabel="label"
                                                                                            optionValue="value"
                                                                                            onChange={(e) => {
                                                                                                const updatedEmpDetails = [...empDetails];
                                                                                                updatedEmpDetails[idx] = {
                                                                                                    ...updatedEmpDetails[idx],
                                                                                                    trackingStatus: e.value
                                                                                                };
                                                                                                setRouteEmployeeDetailsMap({
                                                                                                    ...routeEmployeeDetailsMap,
                                                                                                    [routeId]: updatedEmpDetails
                                                                                                });
                                                                                            }}
                                                                                        />
                                                                                    </td>
                                                                                    <td style={{ minWidth: "120px" }}>
                                                                                        <div className="d-flex align-items-center gap-1">
                                                                                            <InputText
                                                                                                placeholder="HH"
                                                                                                className="form-control text-center"
                                                                                                value={emp.ActETAhh ?? ""}
                                                                                                style={{ width: "50px", padding: "5px" }}
                                                                                                maxLength={2}
                                                                                                onChange={(e) => {
                                                                                                    let value = e.target.value.replace(/\D/g, "");

                                                                                                    setRouteEmployeeDetailsMap((prev) => {
                                                                                                        const updated = { ...prev };
                                                                                                        updated[rowData.RouteID] = updated[rowData.RouteID].map((item, i) =>
                                                                                                            i === idx ? { ...item, ActETAhh: value } : item
                                                                                                        );
                                                                                                        return updated;
                                                                                                    });
                                                                                                }}
                                                                                            />

                                                                                            <span>:</span>

                                                                                            <InputText
                                                                                                placeholder="MM"
                                                                                                className="form-control text-center"
                                                                                                value={emp.ActETAmm ?? ""}
                                                                                                style={{ width: "50px", padding: "5px" }}
                                                                                                maxLength={2}
                                                                                                onChange={(e) => {
                                                                                                    let value = e.target.value.replace(/\D/g, "");

                                                                                                    setRouteEmployeeDetailsMap((prev) => {
                                                                                                        const updated = { ...prev };
                                                                                                        updated[rowData.RouteID] = updated[rowData.RouteID].map((item, i) =>
                                                                                                            i === idx ? { ...item, ActETAmm: value } : item
                                                                                                        );
                                                                                                        return updated;
                                                                                                    });
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </td>
                                                                                    <td>
                                                                                        <InputText
                                                                                            value={emp.remark || emp.Remark || emp.TripRemark || ""}
                                                                                            onChange={(e) => {
                                                                                                const updatedEmpDetails = [...empDetails];
                                                                                                updatedEmpDetails[idx] = {
                                                                                                    ...updatedEmpDetails[idx],
                                                                                                    remark: e.target.value
                                                                                                };
                                                                                                setRouteEmployeeDetailsMap({
                                                                                                    ...routeEmployeeDetailsMap,
                                                                                                    [routeId]: updatedEmpDetails
                                                                                                });
                                                                                            }}
                                                                                            className="form-control"
                                                                                        />
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                <div className="d-flex justify-content-end gap-2 mt-3">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-secondary btn-sm"
                                                                        onClick={() => handleExpandedRouteCancel(routeId)}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-success btn-sm"
                                                                        onClick={() => handleSaveExpandedRouteDetails(routeId)}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-center p-2 text-muted">No employee details found for this route</div>
                                                        )}
                                                    </div>
                                                );
                                            }}
                                        >
                                            <Column
                                                expander
                                                style={{ width: "50px", textAlign: "center" }}
                                                body={(rowData) => (
                                                    <span
                                                        className="material-icons"
                                                        style={{ cursor: "pointer", color: "#0d6efd" }}
                                                        onClick={() => handleRouteRowExpand(rowData)}
                                                    >
                                                        {expandedRoutes.some((r) => r.RouteID === rowData.RouteID)
                                                            ? "remove_circle"
                                                            : "add_circle"}
                                                    </span>
                                                )}
                                            />
                                            <Column field="RouteID" header="Route ID" />
                                            <Column field="bshift" header="Shift" />
                                            <Column field="Location" header="Location" />
                                            <Column field="vendorname" header="Vendor" />
                                            <Column field="vehicleNo" header="Vehicle No." />
                                            <Column field="DriverName" header="Driver Name" />
                                            <Column
                                                field="DriverContact"
                                                header="Driver Cont."
                                                body={(rowData, options) => (
                                                    <InputText
                                                        value={rowData.DriverContact ?? ""}
                                                        className="form-control p-1 text-sm"
                                                        style={{ width: "120px", height: "30px" }}
                                                        maxLength={10}
                                                        onChange={(e) => {
                                                            let value = e.target.value.replace(/\D/g, "");

                                                            setRouteList((prev) =>
                                                                prev.map((item) =>
                                                                    item.RouteID === rowData.RouteID
                                                                        ? { ...item, DriverContact: value }
                                                                        : item
                                                                )
                                                            );
                                                        }}
                                                    />
                                                )}
                                            />
                                            <Column
                                                field="TripStatus"
                                                header="Status"
                                                body={(rowData) => (
                                                    <Dropdown
                                                        placeholder="Select Status"
                                                        className="w-100"
                                                        // style={{ width: "120px", height: "30px" }}
                                                        value={rowData.TripStatus ?? null}
                                                        options={incidentMaster.map(item => ({
                                                            label: item.Incident_type || item.name || item.Name || item.IncidentName || 'Unknown',
                                                            value: item.id || item.ID || item.IncidentID || ''
                                                        }))}
                                                        optionLabel="label"
                                                        optionValue="value"
                                                        onChange={(e) => {
                                                            const value = e.value;

                                                            setRouteList((prev) =>
                                                                prev.map((item) =>
                                                                    item.RouteID === rowData.RouteID
                                                                        ? { ...item, TripStatus: value }
                                                                        : item
                                                                )
                                                            );
                                                        }}
                                                    />
                                                )}
                                            />
                                            <Column
                                                field="DelayReason"
                                                header="Delay (Min)"
                                                body={(rowData) => (
                                                    <InputText
                                                        placeholder="MM"
                                                        className="form-control text-center"
                                                        style={{ width: "60px", padding: "5px" }}
                                                        //maxLength={}
                                                        value={rowData.DelayReason || ""}
                                                        onChange={(e) => {
                                                            let value = e.target.value.replace(/\D/g, "");

                                                            // Optional: max 59 minutes
                                                            //if (parseInt(value) > 59) return;

                                                            setRouteList((prev) =>
                                                                prev.map((item) =>
                                                                    item.RouteID === rowData.RouteID
                                                                        ? { ...item, DelayReason: value }
                                                                        : item
                                                                )
                                                            );
                                                        }}
                                                    />
                                                )}
                                            />                                            <Column field="totalStop" header="Stop" />
                                            <Column field="totaldist" header="KM" />
                                            <Column field="stickerno2" header="PSlot" />
                                            <Column
                                                header=""
                                                body={(rowData) => (
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        style={{ padding: "4px 10px", fontSize: "12px" }}
                                                        onClick={() => handleRowSave(rowData)}
                                                    >
                                                        Save
                                                    </button>
                                                )}
                                            />
                                        </CustomDataTable>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <MasterSidebar
                show={showSidebar}
                onClose={() => {
                    setShowSidebar(false);
                }}
                title={`Transportation Details of:- ${selectedRow?.empName}`}
                width="50%"
                className="sidebar-responsive"
                backdropOpacity={0.5}
                backdropBlur="10px"
                headerBgColor="bg-secondary"
                headerTextColor="text-white"
            >
                <div className="trip-card p-3">
                    <div className="row">

                        {/* Employee ID */}
                        <div className="col-4 mb-3">
                            <div className="label">Employee ID</div>
                            <div className="value">{employeeDetails?.empCode}</div>
                        </div>

                        {/* Employee Name */}
                        <div className="col-4 mb-3">
                            <div className="label">Employee Name</div>
                            <div className="value">{employeeDetails?.empName}</div>
                        </div>

                        {/* Facility */}
                        <div className="col-4 mb-3">
                            <div className="label">Facility</div>
                            <div className="value">{employeeDetails?.facilityName}</div>
                        </div>

                        {/* Address FULL */}
                        <div className="col-12 mb-3">
                            <div className="label">Address</div>
                            <div className="value">
                                {employeeDetails?.address || "-"}
                            </div>
                        </div>

                        {/* Project */}
                        <div className="col-6 mb-3">
                            <div className="label">Project</div>
                            <div className="value">{employeeDetails?.processName}</div>
                        </div>

                        {/* Location */}
                        <div className="col-6 mb-3">
                            <div className="label">Location</div>
                            <div className="value">{employeeDetails?.Location}</div>
                        </div>

                        {/* Mobile */}
                        <div className="col-6 mb-3">
                            <div className="label">Mobile Number</div>
                            <div className="value">{employeeDetails?.mobile}</div>
                        </div>

                        {/* Other */}
                        <div className="col-6 mb-3">
                            <div className="label">Other Number</div>
                            <div className="value">{employeeDetails?.phone}</div>
                        </div>

                        {/* Email */}
                        <div className="col-6 mb-3">
                            <div className="label">Email</div>
                            <div className="value">{employeeDetails?.email}</div>
                        </div>

                        {/* LAN */}
                        <div className="col-6 mb-3">
                            <div className="label">LAN ID</div>
                            <div className="value">{employeeDetails?.userName}</div>
                        </div>

                        {/* Manager */}
                        <div className="col-6 mb-3">
                            <div className="label">Manager</div>
                            <div className="value">{employeeDetails?.ManagerDetail}</div>
                        </div>

                        {/* Manager Mobile */}
                        <div className="col-6 mb-3">
                            <div className="label">Manager Contact</div>
                            <div className="value">{employeeDetails?.mgrMobile}</div>
                        </div>

                        {/* Geo */}
                        <div className="col-6 mb-3">
                            <div className="label">Is Point Assigned</div>
                            <div className="value">
                                {employeeDetails?.geoCode === "Y" ? (
                                    <img
                                        src="/images/geoCode.png"
                                        alt="GeoCode"

                                        style={{ width: "24px", height: "24px" }}
                                    />
                                ) : (
                                    <img
                                        src="/images/NoGeoode.png"
                                        alt="No GeoCode"
                                        style={{ width: "24px", height: "24px" }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Transport */}
                        <div className="col-6 mb-3">
                            <div className="label">Transport Required</div>
                            <div className="value">
                                {employeeDetails?.tptReq === "Y" ? (
                                    <img
                                        src="/images/motorable.png"
                                        alt="Motrable"
                                        style={{ width: "24px", height: "24px" }}
                                    />
                                ) : (
                                    <img
                                        src="/images/Non motorable.png"
                                        alt="Non Motrable"
                                        style={{ width: "24px", height: "24px" }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Cost */}
                        <div className="col-6 mb-3">
                            <div className="label">Cost Center</div>
                            <div className="value">{employeeDetails?.Costcenter || "-"}</div>
                        </div>

                        {/* Emergency */}
                        <div className="col-6 mb-3">
                            <div className="label">Emergency Contact</div>
                            <div className="value">{employeeDetails?.EmergencyContact || "-"}</div>
                        </div>

                        {/* Medical */}
                        <div className="col-6 mb-3">
                            <div className="label">Medical Case</div>
                            <div className="value">{employeeDetails?.MedicalRemark || "-"}</div>
                        </div>
                        <div className="col-6 mb-3">
                            <div className="label">Medical ExpiryDate</div>
                            <div className="value">{formatDate(employeeDetails?.MedicalExpiryDate) || "-"}</div>
                        </div>

                    </div>
                </div>
            </MasterSidebar>
            <MasterSidebar
                show={showScheduleSidebar}
                onClose={() => setShowScheduleSidebar(false)}
                title="Employee Schedule Audit Trail"
                className="sidebar-responsive"
                backdropOpacity={0.5}
                backdropBlur="10px"
                headerBgColor="bg-secondary"
                headerTextColor="text-white"
            >
                <div className="trip-card p-3">
                    <div className="row">

                        <div className="col-6 mb-3">
                            <div className="label">Associate ID</div>
                            <div className="value">{scheduleLogData?.empCode}</div>
                        </div>

                        <div className="col-6 mb-3">
                            <div className="label">Associate Name</div>
                            <div className="value">{scheduleLogData?.empName}</div>
                        </div>

                        <div className="col-6 mb-3">
                            <div className="label">Department</div>
                            <div className="value">{scheduleLogData?.processName}</div>
                        </div>

                        <div className="col-6 mb-3">
                            <div className="label">Schedule Date</div>
                            <div className="value">{scheduleLogData?.startDate}</div>
                        </div>

                        <div className="col-6 mb-3">
                            <div className="label">Updated By</div>
                            <div className="value">{scheduleLogData?.updatedByName}</div>
                        </div>

                        <div className="col-6 mb-3">
                            <div className="label">Updated On</div>
                            <div className="value">
                                {scheduleLogData?.updationStime
                                    ? new Date(scheduleLogData.updationStime).toLocaleString()
                                    : "-"}
                            </div>
                        </div>

                    </div>
                </div>
            </MasterSidebar>
            <MasterSidebar
                show={showRouteSidebar}
                onClose={() => setShowRouteSidebar(false)}
                title="Route Detail"
                headerRight={
                    <div className="form-check form-switch me-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={showMap}
                            onChange={() => setShowMap(!showMap)}
                        />
                        <label className="form-check-label text-white ms-2">
                            Show Map
                        </label>
                    </div>
                }
                className="sidebar-responsive"
                backdropOpacity={0.5}
                width="90%"
                backdropBlur="10px"
                headerBgColor="bg-secondary"
                headerTextColor="text-white"
                footer={
                    <div className="offcanvas-footer">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setShowRouteSidebar(false);
                            }}
                        />
                        <Button
                            label="Save"
                            className="btn btn-success btn-sm ms-3"
                            loading={loading}
                            onClick={handleSaveTracking}
                        />
                    </div>
                }
            >
                {!routeSummary ? (
                    <div className="text-center">No Data Found</div>
                ) : (
                    <div className="badge_success rounded-3 p-2 mb-3 border" style={{ margin: '15px' }}>
                        <table className="table mb-0 fs-13 bg-transparent" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Trip ID</th>
                                    <th>Placard No</th>
                                    <th>Vendor</th>
                                    <th>Facility</th>
                                    <th>Remark</th>
                                    <th>Planned Vehicle</th>
                                    <th>Route No</th>
                                    <th>Arrival/Departure</th>
                                    <th>Scanned Vehicle</th>
                                    <th>Driver</th>
                                    <th>OTA / Delay Min.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{routeSummary?.RouteID || 'N/A'}</td>
                                    <td>{cleanText(routeSummary?.Placard) || 'NA'}</td>
                                    <td>{routeSummary?.VendorName || 'NA'}</td>
                                    <td>{routeSummary?.facility || 'N/A'}</td>
                                    <td>{routeSummary?.remark || 'N/A'}</td>
                                    <td>{routeSummary?.PlannedVehicle || 'N/A'}</td>
                                    <td>{routeSummary?.VehicleNo || 'N/A'}</td>
                                    <td>{cleanText(routeSummary?.ArrivalDeparture) || 'N/A'}</td>
                                    <td>{routeSummary?.ScannedVehicle || 'N/A'}</td>
                                    <td>{routeSummary?.Driver || 'N/A'}</td>
                                    <td>{routeSummary?.OnTime_DelayMinute || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                {/* 🔹 ROUTE DETAILS TABLE */}
                <div className="badge_success rounded-3 p-2 mb-3 border" style={{ margin: '15px' }}>
                    {routeDetails && routeDetails.length > 0 ? (
                        <table className="table tb_raiseAdhoc mb-0 table-hover" id="example">
                            <thead>
                                <tr>
                                    <th>Stop No</th>
                                    <th>Employee</th>
                                    {/* <th>Employee Name</th> */}
                                    {/* <th>Gender</th> */}
                                    <th>Address</th>
                                    <th>Location</th>
                                    <th>Mobile</th>
                                    <th>Shift</th>
                                    {/* <th>Trip Type</th> */}
                                    <th>PickUp Time</th>
                                    <th>Action</th>
                                    <th>Date</th>
                                    <th>Time (HH : MM)</th>
                                    <th>Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routeDetails.map((rowData, index) => (
                                    <tr key={index}>
                                        <td>
                                            {rowData.stopNo}
                                        </td>
                                        <td>
                                            <span className="fw-semibold">
                                                {rowData.empCode}
                                            </span>
                                            {" - "}
                                            <span>
                                                {rowData.empName}
                                            </span>
                                            <div className="mt-1">
                                                <span
                                                    className="badge rounded-pill text-white"
                                                    style={{
                                                        backgroundColor:
                                                            rowData.Gender === "F" ? "#FF61F6" : "#3377FF"
                                                    }}
                                                >
                                                    {rowData.Gender}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: "200px" }}>
                                            <div className="address-cell">
                                                {rowData.address}
                                            </div>
                                        </td>
                                        <td>
                                            {rowData.Location}
                                        </td>
                                        <td>
                                            {rowData.helpdeskMobile}
                                        </td>
                                        <td>
                                            {rowData.Shift}
                                            <br />
                                            <span
                                                className="badge rounded-pill text-uppercase text-white"
                                                style={{
                                                    backgroundColor:
                                                        rowData.tripType === "P" ? "#3377FF" : "#dc3545"
                                                }}
                                            >
                                                {rowData.tripType === "P" ? "PICK" : "DROP"}
                                            </span>
                                        </td>

                                        <td>
                                            {rowData.ETA}
                                        </td>
                                        <td>
                                            <Dropdown
                                                optionLabel="label"
                                                optionValue="value"
                                                placeholder="Select"
                                                className="w-100"
                                                value={rowData.trackingStatus || ""}
                                                options={actionOptions}
                                                onChange={(e) => {
                                                    const updatedData = [...routeDetails];
                                                    updatedData[index].trackingStatus = e.value;
                                                    setRouteDetails(updatedData);
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <div className="custom-calendar-wrapper">
                                                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                                <Calendar
                                                    className="w-100 custom-calendar-input"
                                                    value={rowData.actEta ? new Date(rowData.actEta) : null}
                                                    onChange={(e) => {
                                                        const updatedValue = e.value;
                                                        const updatedData = [...routeDetails];
                                                        updatedData[index].actEta = updatedValue;
                                                        setRouteDetails(updatedData);
                                                    }}
                                                    hourFormat="12"
                                                    dateFormat="mm/dd/yy"
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <InputText
                                                    value={rowData.ActETAhh || ""}
                                                    maxLength={2}
                                                    className="form-control text-center"
                                                    style={{ width: "60px" }}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, "");
                                                        if (value > 23) value = 23;
                                                        const updatedData = [...routeDetails];
                                                        updatedData[index].ActETAhh = value;
                                                        setRouteDetails(updatedData);
                                                    }}
                                                />
                                                <span>:</span>
                                                <InputText
                                                    value={rowData.ActETAmm || ""}
                                                    maxLength={2}
                                                    className="form-control text-center"
                                                    style={{ width: "60px" }}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, "");
                                                        if (value > 59) value = 59;
                                                        const updatedData = [...routeDetails];
                                                        updatedData[index].ActETAmm = value;
                                                        setRouteDetails(updatedData);
                                                    }}
                                                />
                                            </div>
                                            {/* Validation Message */}
                                            {(rowData.ActETAhh > 23 || rowData.ActETAmm > 59) && (
                                                <small className="text-danger">
                                                    Enter valid time (HH: 0-23, MM: 0-59)
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <InputText value={rowData.remark} className="form-control" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center text-muted">No Stop Details</div>
                    )}
                </div>

            </MasterSidebar >
            <MasterSidebar
                show={showDropRouteSidebar}
                onClose={() => setShowDropRouteSidebar(false)}
                title="Drop Route Detail"
                headerRight={
                    <div className="form-check form-switch me-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={showMap}
                            onChange={() => setShowMap(!showMap)}
                        />
                        <label className="form-check-label text-white ms-2">
                            Show Map
                        </label>
                    </div>
                }
                className="sidebar-responsive"
                backdropOpacity={0.5}
                width="90%"
                backdropBlur="10px"
                headerBgColor="bg-secondary"
                headerTextColor="text-white"
                footer={
                    <div className="offcanvas-footer">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setShowDropRouteSidebar(false);
                            }}
                        />
                        <Button
                            label="Save"
                            className="btn btn-success btn-sm ms-3"
                            loading={loading}
                            onClick={handleSaveTracking}
                        />
                    </div>
                }
            >
                {!dropRouteSummary ? (
                    <div className="text-center">No Data Found</div>
                ) : (
                    <div className="badge_success rounded-3 p-2 mb-3 border" style={{ margin: '15px' }}>
                        <table className="table mb-0 fs-13 bg-transparent" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Trip ID</th>
                                    <th>Placard No</th>
                                    <th>Vendor</th>
                                    <th>Facility</th>
                                    <th>Remark</th>
                                    <th>Planned Vehicle</th>
                                    <th>Route No</th>
                                    <th>Arrival/Departure</th>
                                    <th>Scanned Vehicle</th>
                                    <th>Driver</th>
                                    <th>OTA / Delay Min.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{dropRouteSummary?.RouteID || 'N/A'}</td>
                                    <td>{cleanText(dropRouteSummary?.Placard) || 'NA'}</td>
                                    <td>{dropRouteSummary?.VendorName || 'NA'}</td>
                                    <td>{dropRouteSummary?.facility || 'N/A'}</td>
                                    <td>{dropRouteSummary?.remark || 'N/A'}</td>
                                    <td>{dropRouteSummary?.PlannedVehicle || 'N/A'}</td>
                                    <td>{dropRouteSummary?.VehicleNo || 'N/A'}</td>
                                    <td>{cleanText(dropRouteSummary?.ArrivalDeparture) || 'N/A'}</td>
                                    <td>{dropRouteSummary?.ScannedVehicle || 'N/A'}</td>
                                    <td>{dropRouteSummary?.Driver || 'N/A'}</td>
                                    <td>{dropRouteSummary?.OnTime_DelayMinute || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                {/* 🔹 DROP ROUTE DETAILS TABLE */}
                <div className="badge_success rounded-3 p-2 mb-3 border" style={{ margin: '15px' }}>
                    {dropRouteDetails && dropRouteDetails.length > 0 ? (
                        <table className="table tb_raiseAdhoc mb-0 table-hover" id="example">
                            <thead>
                                <tr>
                                    <th>Stop No</th>
                                    <th>Employee</th>
                                    {/* <th>Employee Name</th> */}
                                    {/* <th>Gender</th> */}
                                    <th>Address</th>
                                    <th>Location</th>
                                    <th>Mobile</th>
                                    <th>Shift</th>
                                    {/* <th>Trip Type</th> */}
                                    <th>PickUp Time</th>
                                    <th>Action</th>
                                    <th>Date</th>
                                    <th>Time (HH : MM)</th>
                                    <th>Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dropRouteDetails.map((rowData, index) => (
                                    <tr key={index}>
                                        <td>
                                            {rowData.stopNo}
                                        </td>
                                        <td>
                                            <span className="fw-semibold">
                                                {rowData.empCode}
                                            </span>
                                            {" - "}
                                            <span>
                                                {rowData.empName}
                                            </span>
                                            <div className="mt-1">
                                                <span
                                                    className="badge rounded-pill text-white"
                                                    style={{
                                                        backgroundColor:
                                                            rowData.Gender === "F" ? "#FF61F6" : "#3377FF"
                                                    }}
                                                >
                                                    {rowData.Gender}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: "200px" }}>
                                            <div className="address-cell">
                                                {rowData.address}
                                            </div>
                                        </td>
                                        <td>
                                            {rowData.Location}
                                        </td>
                                        <td>
                                            {rowData.helpdeskMobile}
                                        </td>
                                        <td>
                                            {rowData.Shift}
                                            <br />
                                            <span
                                                className="badge rounded-pill text-uppercase text-white"
                                                style={{
                                                    backgroundColor:
                                                        rowData.tripType === "P" ? "#3377FF" : "#dc3545"
                                                }}
                                            >
                                                {rowData.tripType === "P" ? "PICK" : "DROP"}
                                            </span>
                                        </td>

                                        <td>
                                            {rowData.ETA}
                                        </td>
                                        <td>
                                            <Dropdown
                                                optionLabel="label"
                                                optionValue="value"
                                                placeholder="Select"
                                                className="w-100"
                                                value={rowData.trackingStatus || ""}
                                                options={actionOptions}
                                                onChange={(e) => {
                                                    const updatedData = [...dropRouteDetails];
                                                    updatedData[index].trackingStatus = e.value;
                                                    setDropRouteDetails(updatedData);
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <div className="custom-calendar-wrapper">
                                                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                                <Calendar
                                                    className="w-100 custom-calendar-input"
                                                    value={rowData.actEta ? new Date(rowData.actEta) : null}
                                                    onChange={(e) => {
                                                        const updatedValue = e.value;
                                                        const updatedData = [...dropRouteDetails];
                                                        updatedData[index].actEta = updatedValue;
                                                        setDropRouteDetails(updatedData);
                                                    }}
                                                    hourFormat="12"
                                                    dateFormat="mm/dd/yy"
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <InputText
                                                    value={rowData.ActETAhh || ""}
                                                    maxLength={2}
                                                    className="form-control text-center"
                                                    style={{ width: "60px" }}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, "");
                                                        if (value > 23) value = 23;
                                                        const updatedData = [...dropRouteDetails];
                                                        updatedData[index].ActETAhh = value;
                                                        setDropRouteDetails(updatedData);
                                                    }}
                                                />
                                                <span>:</span>
                                                <InputText
                                                    value={rowData.ActETAmm || ""}
                                                    maxLength={2}
                                                    className="form-control text-center"
                                                    style={{ width: "60px" }}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, "");
                                                        if (value > 59) value = 59;
                                                        const updatedData = [...dropRouteDetails];
                                                        updatedData[index].ActETAmm = value;
                                                        setDropRouteDetails(updatedData);
                                                    }}
                                                />
                                            </div>
                                            {/* Validation Message */}
                                            {(rowData.ActETAhh > 23 || rowData.ActETAmm > 59) && (
                                                <small className="text-danger">
                                                    Enter valid time (HH: 0-23, MM: 0-59)
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <InputText value={rowData.remark} className="form-control" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center text-muted">No Stop Details</div>
                    )}
                </div>
            </MasterSidebar >
            <MasterSidebar
                show={showRouteIdSidebar}
                onClose={() => setShowRouteIdSidebar(false)}
                title="Drop Route ID Detail"
                headerRight={
                    <div className="form-check form-switch me-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={showMap}
                            onChange={() => setShowMap(!showMap)}
                        />
                        <label className="form-check-label text-white ms-2">
                            Show Map
                        </label>
                    </div>
                }
                className="sidebar-responsive"
                backdropOpacity={0.5}
                width="90%"
                backdropBlur="10px"
                headerBgColor="bg-secondary"
                headerTextColor="text-white"
                footer={
                    <div className="offcanvas-footer">
                        <Button
                            label="Cancel"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setShowRouteIdSidebar(false);
                            }}
                        />
                        <Button
                            label="Save"
                            className="btn btn-success btn-sm ms-3"
                            loading={loading}
                            onClick={handleSaveTracking}
                        />
                    </div>
                }
            >
                {!routeIdSummary ? (
                    <div className="text-center">No Data Found</div>
                ) : (
                    <div className="badge_success rounded-3 p-2 mb-3 border" style={{ margin: '15px' }}>
                        <table className="table mb-0 fs-13 bg-transparent" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Trip ID</th>
                                    <th>Placard No</th>
                                    <th>Vendor</th>
                                    <th>Facility</th>
                                    <th>Remark</th>
                                    <th>Planned Vehicle</th>
                                    <th>Route No</th>
                                    <th>Arrival/Departure</th>
                                    <th>Scanned Vehicle</th>
                                    <th>Driver</th>
                                    <th>OTA / Delay Min.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{routeIdSummary?.RouteID || 'N/A'}</td>
                                    <td>{cleanText(routeIdSummary?.Placard) || 'NA'}</td>
                                    <td>{routeIdSummary?.VendorName || 'NA'}</td>
                                    <td>{routeIdSummary?.facility || 'N/A'}</td>
                                    <td>{routeIdSummary?.remark || 'N/A'}</td>
                                    <td>{routeIdSummary?.PlannedVehicle || 'N/A'}</td>
                                    <td>{routeIdSummary?.VehicleNo || 'N/A'}</td>
                                    <td>{cleanText(routeIdSummary?.ArrivalDeparture) || 'N/A'}</td>
                                    <td>{routeIdSummary?.ScannedVehicle || 'N/A'}</td>
                                    <td>{routeIdSummary?.Driver || 'N/A'}</td>
                                    <td>{routeIdSummary?.OnTime_DelayMinute || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                {/* 🔹 DROP ROUTE DETAILS TABLE */}
                <div className="badge_success rounded-3 p-2 mb-3 border" style={{ margin: '15px' }}>
                    {routeIdDetails && routeIdDetails.length > 0 ? (
                        <table className="table tb_raiseAdhoc mb-0 table-hover" id="example">
                            <thead>
                                <tr>
                                    <th>Stop No</th>
                                    <th>Employee</th>
                                    {/* <th>Employee Name</th> */}
                                    {/* <th>Gender</th> */}
                                    <th>Address</th>
                                    <th>Location</th>
                                    <th>Mobile</th>
                                    <th>Shift</th>
                                    {/* <th>Trip Type</th> */}
                                    <th>PickUp Time</th>
                                    <th>Action</th>
                                    <th>Date</th>
                                    <th>Time (HH : MM)</th>
                                    <th>Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routeIdDetails.map((rowData, index) => (
                                    <tr key={index}>
                                        <td>
                                            {rowData.stopNo}
                                        </td>
                                        <td>
                                            <span className="fw-semibold">
                                                {rowData.empCode}
                                            </span>
                                            {" - "}
                                            <span>
                                                {rowData.empName}
                                            </span>
                                            <div className="mt-1">
                                                <span
                                                    className="badge rounded-pill text-white"
                                                    style={{
                                                        backgroundColor:
                                                            rowData.Gender === "F" ? "#FF61F6" : "#3377FF"
                                                    }}
                                                >
                                                    {rowData.Gender}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: "200px" }}>
                                            <div className="address-cell">
                                                {rowData.address}
                                            </div>
                                        </td>
                                        <td>
                                            {rowData.Location}
                                        </td>
                                        <td>
                                            {rowData.helpdeskMobile}
                                        </td>
                                        <td>
                                            {rowData.Shift}
                                            <br />
                                            <span
                                                className="badge rounded-pill text-uppercase text-white"
                                                style={{
                                                    backgroundColor:
                                                        rowData.tripType === "P" ? "#3377FF" : "#dc3545"
                                                }}
                                            >
                                                {rowData.tripType === "P" ? "PICK" : "DROP"}
                                            </span>
                                        </td>

                                        <td>
                                            {rowData.ETA}
                                        </td>
                                        <td>
                                            <Dropdown
                                                optionLabel="label"
                                                optionValue="value"
                                                placeholder="Select"
                                                className="w-100"
                                                value={rowData.trackingStatus || ""}
                                                options={actionOptions}
                                                onChange={(e) => {
                                                    const updatedData = [...routeIdDetails];
                                                    updatedData[index].trackingStatus = e.value;
                                                    setRouteIdDetails(updatedData);
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <div className="custom-calendar-wrapper">
                                                <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                                <Calendar
                                                    className="w-100 custom-calendar-input"
                                                    value={rowData.actEta ? new Date(rowData.actEta) : null}
                                                    onChange={(e) => {
                                                        const updatedValue = e.value;
                                                        const updatedData = [...routeIdDetails];
                                                        updatedData[index].actEta = updatedValue;
                                                        setRouteIdDetails(updatedData);
                                                    }}
                                                    hourFormat="12"
                                                    dateFormat="mm/dd/yy"
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <InputText
                                                    value={rowData.ActETAhh || ""}
                                                    maxLength={2}
                                                    className="form-control text-center"
                                                    style={{ width: "60px" }}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, "");
                                                        if (value > 23) value = 23;
                                                        const updatedData = [...routeIdDetails];
                                                        updatedData[index].ActETAhh = value;
                                                        setRouteIdDetails(updatedData);
                                                    }}
                                                />
                                                <span>:</span>
                                                <InputText
                                                    value={rowData.ActETAmm || ""}
                                                    maxLength={2}
                                                    className="form-control text-center"
                                                    style={{ width: "60px" }}
                                                    onChange={(e) => {
                                                        let value = e.target.value.replace(/\D/g, "");
                                                        if (value > 59) value = 59;
                                                        const updatedData = [...routeIdDetails];
                                                        updatedData[index].ActETAmm = value;
                                                        setRouteIdDetails(updatedData);
                                                    }}
                                                />
                                            </div>
                                            {/* Validation Message */}
                                            {(rowData.ActETAhh > 23 || rowData.ActETAmm > 59) && (
                                                <small className="text-danger">
                                                    Enter valid time (HH: 0-23, MM: 0-59)
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <InputText value={rowData.remark} className="form-control" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center text-muted">No Stop Details</div>
                    )}
                </div>
            </MasterSidebar >
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
                    .trip-card {
                        background: #f1f3f5;
                        border-radius: 10px;
                        border: 1px solid #ddd;
                        padding: 1rem; /* optional, for spacing inside card */
                        margin:2rem;
                    }

                    /* label (light grey text) */
                    .label {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        font-weight: 500; /* Medium */
                        font-style: normal; /* Medium is normal style, SemiBold is separate weight */
                        font-size: 13px;
                        line-height: 19px;
                        letter-spacing: 3%;
                        color: #6c757d;
                        margin-bottom: 4px;
                        vertical-align: middle;
                    }

                    /* value (bold dark text) */
                    .value {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                        font-weight: 600; /* SemiBold */
                        font-style: normal; /* SemiBold is weight, style normal */
                        font-size: 16px;
                        line-height: 24px;
                        letter-spacing: -1%;
                        color: #212529;
                    }

                    /* icons */
                    .yes {
                        color: #28a745;
                        font-size: 18px;
                    }

                    .no {
                        color: #dc3545;
                        font-size: 18px;
                    }
                `}
            </style>
        </>
    )
}
export default HelpDesk;
import React, { useEffect, useState, useMemo } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import RepScheduleSummeryService from "../services/compliance/RepScheduleSummeryService";
import sessionManager from "../utils/SessionManager";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { toastService } from "../services/toastService";

const RepScheduleSummery = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const today = new Date().toISOString().split("T")[0];
    const userId = sessionManager.getUserSession().ID;
    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);
    const reportTypeOptions = useMemo(
        () => [
            { label: "Vendor Wise Billing Report", value: "VENDOR" },
            { label: "Detailed Billing Report", value: "DETAILED" },
        ],
        []
    );
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [appliedReportType, setAppliedReportType] = useState(null); // used by UI after Run Report

    const [facilities, setFacilities] = useState([]);
    const [selFacility, setSelFacility] = useState(null);
    const [showTable, setShowTable] = useState(false);
    // parent expansion state (for vendor rows)
    const [vendorExpandedId, setVendorExpandedId] = useState(null);    // cache child data keyed by vendorId
    const [vendorChildData, setVendorChildData] = useState({});


    useEffect(() => {
        fetchFacilities();
    }, []);
    const fetchFacilities = async () => {
        try {
            setLoading(true);
            const response = await RepScheduleSummeryService.SelectFacility({ Userid: userId });
            const parsed = typeof response === "string" ? JSON.parse(response) : response;
            const formatted = Array.isArray(parsed)
                ? parsed.map((f) => ({ label: f.facility || f.facilityName, value: f.Id }))
                : [];
            setFacilities(formatted);
        } catch (err) {
            console.error("Error fetching facilities:", err);
            toastService.error("Failed to load facilities");
        } finally {
            setLoading(false);
        }
    };
    // Extract VendorID / VID from any parent row
    const extractVendorId = (row) => {
        if (!row) return null;
        return row?.VID ?? row?.vid ?? row?.vendorId ?? row?.VendorId ?? row?.VendorID ?? row?.vendor ?? row?.id ?? row?.ID ?? null;
    };

    const vendorColumns = [
        { field: "vendorName", header: "Vendor Name" },
        // { field: "ZoneName", header: "Zone Name" },
        // { field: "VehicleType", header: "Vehicle Type" },
        { field: "ScRoute", header: "Sc Route" },
        // { field: "ScheduleRate", header: "Schedule Rate" },
        { field: "ScheduleAmount", header: "Schedule Amount" },
        { field: "GuardCount", header: "Guard Count" },
        { field: "RouteGuardCost", header: "Guard Amount" },
        { field: "UnSchedule", header: "UnSchedule" },
        // { field: "UnscheduleAmount", header: "Unschedule Amount" },
        { field: "TollCost", header: "Toll Cost" },
        // { field: "GrandTotal", header: "Grand Total" },
    ];

    const detailedColumns = [
        { field: "ShiftDate", header: "Shift Date" },
        { field: "PlanVendorName", header: "Plan Vendor Name" },
        { field: "ActVendorName", header: "Act Vendor Name" },
        { field: "VehicleNo", header: "Vehicle No" },
        { field: "TripType", header: "Trip Type" },
        { field: "RouteId", header: "Route Id" },
        { field: "RouteNo", header: "Route No" },
        { field: "Location", header: "Location" },
        { field: "BillingZone", header: "Billing Zone" },
        { field: "RouteZone", header: "Route Zone" },
        { field: "LogInOut", header: "Log In Out" },
        { field: "ActLogInOut", header: "Act Log In Out" },
        { field: "VehicleType", header: "Deployed Vehicle Type" },
        { field: "BillingVehicleType", header: "Billing Vehicle Type" },
        { field: "TotCapacity", header: "Tot Capacity" },
        { field: "SchedulePax", header: "Schedule Pax" },
        { field: "ActPax", header: "Act Pax" },
        { field: "NoShowPax", header: "No Show Pax" },
        { field: "FuleType", header: "Fuel Type" },
        { field: "FuleRate", header: "Fuel Rate" },
        { field: "Cost", header: "Cost" },
        { field: "TollName", header: "Toll Name" },
        { field: "TollCost", header: "Toll Cost" },
        { field: "GuardCost", header: "Guard Cost" },
        { field: "TotalCost", header: "Total Cost" },
        { field: "TripSheetUpdated", header: "Trip Sheet" },
    ];

    // Render columns: prefer expected list; fallback to dynamic keys if response differs
    const renderColumns = (forVendor = false) => {
        if (!data || data.length === 0) return null;
        const first = data[0];
        const hasField = (f) => Object.prototype.hasOwnProperty.call(first, f);

        const preferred = forVendor ? vendorColumns : detailedColumns;
        const anyPreferredPresent = preferred.some((c) => hasField(c.field));
        if (!anyPreferredPresent) {
            const keys = Object.keys(first);
            return keys.map((k) => <Column key={k} field={k} header={k} />);
        }
        return preferred.map((c) => <Column key={c.field} field={c.field} header={c.header} />);
    };

    const handleRunReport = async () => {
        if (!selectedReportType) {
            toastService.warn("Please select report type");
            return;
        }
        if (!selFacility) {
            toastService.warn("Please select facility");
            return;
        }

        setAppliedReportType(selectedReportType);
        setShowTable(true);
        setVendorExpandedId(null);
        setVendorChildData({});

        const params = {
            sDate: fromDate,
            eDate: toDate,
            facilityid: selFacility,
        };

        try {
            setLoading(true);
            let response;
            if (selectedReportType === "VENDOR") {
                response = await RepScheduleSummeryService.RepVendorWiseBill_parent(params);
            } else {
                response = await RepScheduleSummeryService.RepScheduleMISSummery(params);
            }

            const parsed = typeof response === "string" ? JSON.parse(response) : response;
            const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            setData(arr);
            if (!arr.length) toastService.error("No records found");
        } catch (err) {
            console.error("Error running schedule summary:", err);
            toastService.error("Failed to fetch report data");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Custom expander click handler — expands single row and fetches child for that vendor id
    const handleExpanderClick = async (e, rowData) => {
        e.stopPropagation();
        const vid = extractVendorId(rowData);
        if (!vid) return;

        // If same id currently expanded -> collapse
        if (vendorExpandedId === vid) {
            setVendorExpandedId(null);
            return;
        }

        // expand this id
        setVendorExpandedId(vid);

        // fetch child if not cached
        if (vendorChildData[vid]) return;

        try {
            setLoading(true);
            const params = {
                sDate: fromDate,
                eDate: toDate,
                facilityid: selFacility,
                vendorid: vid,
            };
            const resp = await RepScheduleSummeryService.RepVendorWiseBill_child(params);
            const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
            const childArr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
            setVendorChildData(prev => ({ ...prev, [vid]: childArr }));
        } catch (err) {
            console.error("Error fetching vendor child data:", err);
            toastService.error("Failed to load vendor child data");
        } finally {
            setLoading(false);
        }
    };

    const parentRowExpansionTemplate = (parentRow) => {
        const vid = extractVendorId(parentRow);
        const child = vendorChildData[vid] || [];
        const childPreferred = [
            { field: "vendorName", header: "Vendor Name" },
            { field: "VehicleType", header: "Vehicle Type" },
            { field: "ScRoute", header: "Sc Route" },
            { field: "Cost", header: "Schedule Rate" },
            { field: "ScheduleAmount", header: "Schedule Amount" },
            { field: "GuardCount", header: "Guard Count" },
            { field: "RouteGuardCost", header: "Guard Amount" },
            { field: "UnSchedule", header: "UnSchedule" },
            { field: "UnscheduleAmount", header: "Unschedule Amount" },
            { field: "TollCost", header: "Toll Cost" },
            { field: "GrandTotal", header: "Grand Total" },
        ];

        const renderChildColumns = () => {
            if (!child || child.length === 0) return childPreferred.map(c => <Column key={c.field} field={c.field} header={c.header} />);
            const first = child[0];
            const hasField = (f) => Object.prototype.hasOwnProperty.call(first, f);
            const anyPreferredPresent = childPreferred.some(c => hasField(c.field));
            if (!anyPreferredPresent) {
                const keys = Object.keys(first);
                return keys.map(k => <Column key={k} field={k} header={k} />);
            }
            return childPreferred.map(c => <Column key={c.field} field={c.field} header={c.header} />);
        };

        return (
            <div className="p-2">
                <DataTable
                    value={child}
                    size="small"
                    tableStyle={{ minWidth: "60rem", textAlign: "center" }}
                    emptyMessage="No details found"
                    stripedRows
                >
                    {renderChildColumns()}
                </DataTable>
            </div>
        );
    };

    const onInputChangeHideTable = (setter) => (e) => {
        setter(e.target ? e.target.value : e.value);
        setShowTable(false);
    };

    return (
        <div>
            <Loader isVisible={loading} fullScreen={true} />
            <Header pageTitle={"Detailed & Vendor Billing Report"} />
            <Sidebar />
            <div className="middle">
                <div className="card_tb p-3">
                    <div className="row">
                        <div className="field col-2 mb-3">
                            <label>From Date</label>
                            <InputText
                                type="date"
                                className="w-100"
                                value={fromDate}
                                onChange={onInputChangeHideTable(setFromDate)}
                                placeholder="Trips for the Day"

                            />
                        </div>
                        <div className="field col-2 mb-3">
                            <label>To Date</label>
                            <InputText
                                type="date"
                                className="w-100"
                                value={toDate}
                                onChange={onInputChangeHideTable(setToDate)}
                                placeholder="Trips for the Day"

                            />
                        </div>
                        <div className="field col-3 mb-3">
                            <label>Report Type</label>
                            <Dropdown
                                options={reportTypeOptions}
                                value={selectedReportType}
                                onChange={(e) => setSelectedReportType(e.value)}
                                optionLabel="label"
                                placeholder="Select Report Type"
                                className="w-100"
                                filter
                            />
                        </div>
                        <div className="field col-2 mb-3">
                            <label>Facility Name</label>
                            <Dropdown

                                options={facilities}
                                value={selFacility}
                                onChange={onInputChangeHideTable(setSelFacility)}
                                optionLabel="label"
                                placeholder="Select Facility"
                                className="w-100"
                                filter
                            />
                        </div>

                        {/* <div className="field col-2 mb-3">
                                                <label>Shift Time</label>
                                                <Dropdown
                                                    optionLabel="name" // Assuming shiftTime is the field you want to display
                                                    placeholder="Select Shift"
                                                    className="w-100"
                                                    filter
                                                />
                                            </div> */}
                        <div className="field col-2 mb-3 no-label">
                            <Button
                                label="Run Report"
                                className="btn btn-primary"
                                onClick={handleRunReport}
                            />
                        </div>
                    </div>
                </div>
                {showTable && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card_tb">
                                {appliedReportType === "VENDOR" ? (
                                    <DataTable
                                        value={data}
                                        paginator
                                        rows={100}
                                        tableStyle={{ minWidth: "50rem" }}
                                        size="small"
                                        loading={loading}
                                        emptyMessage={error ? `Error: ${error}` : "No records found"}
                                        stripedRows
                                        className="p-datatable-gridlines process-datatable"
                                        rowsPerPageOptions={[50, 100, 200, 300]}
                                        // control expansion via vendorExpandedId and dataKey "vid"
                                        expandedRows={vendorExpandedId ? { [vendorExpandedId]: true } : null}
                                        rowExpansionTemplate={parentRowExpansionTemplate}
                                        dataKey="vid"
                                    >
                                        <Column
                                            expander
                                            body={(rowData) => {
                                                const id = extractVendorId(rowData);
                                                const isExpanded = vendorExpandedId === id;
                                                return (
                                                    <span
                                                        className="material-icons"
                                                        style={{
                                                            fontSize: "20px",
                                                            cursor: "pointer",
                                                            color: isExpanded ? "red" : "blue",
                                                        }}
                                                        onClick={(e) => handleExpanderClick(e, rowData)}
                                                    >
                                                        {isExpanded ? "remove_circle" : "add_circle"}
                                                    </span>
                                                );
                                            }}
                                            style={{ width: "3rem" }}
                                        />
                                        {renderColumns(true)}
                                    </DataTable>
                                ) : (
                                    <DataTable
                                        value={data}
                                        paginator
                                        rows={100}
                                        tableStyle={{ minWidth: "50rem" }}
                                        size="small"
                                        loading={loading}
                                        emptyMessage={error ? `Error: ${error}` : "No records found"}
                                        stripedRows
                                        className="p-datatable-gridlines process-datatable"
                                        rowsPerPageOptions={[50, 100, 200, 300]}
                                    >
                                        {renderColumns(false)}
                                    </DataTable>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

}
export default RepScheduleSummery;
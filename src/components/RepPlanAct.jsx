import React, { useEffect, useState, useMemo } from "react";
import RepPlanActService from "../services/compliance/RepPlanActService";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import Loader from "./common/Loader";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Row } from "react-bootstrap";
import { ColumnGroup } from "primereact/columngroup";
import sessionManager from "../utils/SessionManager";
import { toastService } from "../services/toastService";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
const RepPlanAct = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const userId = sessionManager.getUserSession().ID;
    const [facilities, setFacilities] = useState([]);
    const [selFacility, setSelFacility] = useState(null);
    const [selectedTripType, setSelectedTripType] = useState(null);
    const [data, setData] = useState([]);
    const [expandedRows, setExpandedRows] = useState(null);
    // shiftData: shift summary per date
    const [shiftData, setShiftData] = useState({});
    // detailedShiftData: detailed rows per date_shift key
    const [detailedShiftData, setDetailedShiftData] = useState({});
    // innerExpandedRows: controlled expanded rows for inner (shift) tables per date
    const [innerExpandedRows, setInnerExpandedRows] = useState({});
    const tripTypeOptions = useMemo(
        () => [
            { label: "Pick", value: "P" },
            { label: "Drop", value: "D" },
        ],
        []
    );
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const [fromDate, setFromDate] = useState(today);
    const [toDate, setToDate] = useState(today);
    const exportToExcel = () => {
        try {
            if (!data || data.length === 0) {
                toastService.error("No data available to export!");
                return;
            }

            // Excel worksheet बनाओ
            const worksheet = XLSX.utils.json_to_sheet(data);

            // Header bold styling
            const headerCells = Object.keys(data[0]);
            headerCells.forEach((col, index) => {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
                if (!worksheet[cellRef]) return;
                worksheet[cellRef].s = {
                    font: { bold: true },
                    alignment: { horizontal: "center" },
                    border: {
                        top: { style: "thin" },
                        bottom: { style: "thin" },
                        left: { style: "thin" },
                        right: { style: "thin" }
                    }
                };
            });

            // Wrap columns (for address or bigger text)
            const range = XLSX.utils.decode_range(worksheet["!ref"]);
            for (let R = 1; R <= range.e.r; R++) {
                for (let C = 0; C <= range.e.c; C++) {
                    const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!worksheet[cellRef]) continue;
                    worksheet[cellRef].s = {
                        alignment: { wrapText: true },
                        border: {
                            top: { style: "thin" },
                            bottom: { style: "thin" },
                            left: { style: "thin" },
                            right: { style: "thin" }
                        }
                    };
                }
            }

            // Workbook बनाओ
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "PlanVsActual");

            // File Download
            XLSX.writeFile(workbook, `PlanVsActual_${fromDate}_to_${toDate}.xlsx`);
        } catch (error) {
            console.error("Excel Export Error:", error);
            toastService.error("Failed to export Excel.");
        }
    };


    const fetchFacilities = async () => {
        try {
            setLoading(true);
            const response = await RepPlanActService.SelectFacility({ Userid: userId });
            const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
            const formattedData = parsedResponse.map(item => ({
                label: item.facility || item.facilityName, // Using facility or facilityName from your API response
                value: item.Id, // Using Id from your API response
            }));
            setFacilities(formattedData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching facilities:", error);
            setLoading(false);
        }
    }
    const handleRunReport = async () => {
        try {
            setLoading(true);
            setData([]); // Clear previous data
            const params = {
                sDate: fromDate,
                eDate: toDate,
                triptype: selectedTripType,
                facilityid: selFacility,
            }
            const response = await RepPlanActService.RptPlanAct(params);

            // Parse if response is string
            const parsedResponse = typeof response === "string" ? JSON.parse(response) : response;

            // Ensure data is always an array
            const dataArray = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];

            console.log("Report DateWiseData:", dataArray);
            if (dataArray.length === 0) {
                toastService.error("No data found for the selected criteria.");
            } else {
                toastService.success("Report generated successfully.");
            }
            setData(dataArray);
            setExpandedRows(null); // Reset expanded rows when data changes
            setShiftData({}); // Reset shift data
        } catch (error) {
            console.error("Error running report:", error);
            toastService.error("Error fetching report data");
            setData([]);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchFacilities();
    }, []);

    const headerGroup = (
        <ColumnGroup>
            <Row>
                <Column header="" rowSpan={1} />
                <Column header="Date" rowSpan={2} headerStyle={{ textAlign: "left" }} />
                <Column header="Routes" colSpan={4} headerClassName="text-center header-group" />
                <Column header="Total KMs" colSpan={3} headerClassName="text-center header-group" />
                <Column header="Employees" colSpan={5} headerClassName="text-center header-group" />
            </Row>
            <Row>
                <Column header="" rowSpan={1} />
                <Column header="Planned" headerClassName="header-box" />
                <Column header="Recorded" headerClassName="header-box" />
                <Column header="Pending" headerClassName="header-box" />
                <Column header="Cancelled" headerClassName="header-box" />
                <Column header="Planned" headerClassName="header-box" />
                <Column header="Actual" headerClassName="header-box" />
                <Column header="Approved" headerClassName="header-box" />
                <Column header="Rostered" headerClassName="header-box" />
                <Column header="Boarded" headerClassName="header-box" />
                <Column header="UnRostered" headerClassName="header-box" />
                <Column header="No-Show" headerClassName="header-box" />
                <Column header="OTBYTPT" headerClassName="header-box" />
            </Row>
        </ColumnGroup>
    );


    // ✅ Expand/Collapse Handler
    const handleRowToggle = async (e, rowData) => {
        e.stopPropagation();
        const isExpanded = expandedRows?.some((r) => r.Shiftdate === rowData.Shiftdate);

        if (isExpanded) {
            // collapse outer row: remove from expandedRows and clear inner expansions for that date
            setExpandedRows(expandedRows.filter((r) => r.Shiftdate !== rowData.Shiftdate));
            setInnerExpandedRows((prev) => {
                const next = { ...prev };
                delete next[rowData.Shiftdate];
                return next;
            });
            return;
        }

        try {
            setLoading(true);

            const params = {
                sDate: rowData.Shiftdate,
                eDate: rowData.Shiftdate,
                facilityid: selFacility,
                triptype: selectedTripType,
            };
            const response = await RepPlanActService.RptPlanActShiftWise(params);
            const parsed = typeof response === "string" ? JSON.parse(response) : response;

            console.log("✅ ShiftWise Data:", parsed);

            setShiftData((prev) => ({
                ...prev,
                [rowData.Shiftdate]: parsed || [],
            }));

            setExpandedRows([...(expandedRows || []), rowData]);
        } catch (error) {
            console.error("❌ Error fetching shift-wise data:", error);
            toastService.error("Failed to load shift-wise data.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ ROW EXPANSION TEMPLATE (Shift Table)
    const rowExpansionTemplate = (rowData) => {
        const shifts = shiftData[rowData.Shiftdate] || [];

        const headerGroup = (
            <ColumnGroup>
                <Row>
                    <Column header="Shift" rowSpan={2} headerStyle={{ textAlign: 'center', verticalAlign: 'middle' }} />
                    <Column header="Routes" colSpan={4} headerStyle={{ textAlign: 'center' }} />
                    <Column header="Total KMs" colSpan={3} headerStyle={{ textAlign: 'center' }} />
                    <Column header="Employees" colSpan={5} headerStyle={{ textAlign: 'center' }} />
                </Row>
                <Row>
                    <Column header="Planned" />
                    <Column header="Recorded" />
                    <Column header="Pending" />
                    <Column header="Cancelled" />
                    <Column header="Planned" />
                    <Column header="Actual" />
                    <Column header="Approved" />
                    <Column header="Rostered" />
                    <Column header="Boarded" />
                    <Column header="UnRostered" />
                    <Column header="No-Show" />
                    <Column header="Cancelled" />
                </Row>
            </ColumnGroup>
        );

        // Convert expanded rows object for this date
        // const innerExpanded =
        //     Object.keys(detailedShiftData)
        //         .filter((k) => k.startsWith(rowData.Shiftdate))
        //         .reduce((acc, k) => {
        //             const shift = k.split("_")[1];
        //             acc[shift] = { shifttime: shift };
        //             return acc;
        //         }, {});
        const innerExpanded = innerExpandedRows[rowData.Shiftdate] || {};

        return (
            <div className="p-3">
                <DataTable
                    value={shifts}
                    headerColumnGroup={headerGroup}
                    size="small"
                    className="mt-2"
                    tableStyle={{ minWidth: "60rem", textAlign: "center" }}
                    dataKey="shifttime"
                    expandedRows={innerExpanded}
                    rowExpansionTemplate={(shiftRow) => shiftRowExpansionTemplate(shiftRow, rowData)}
                    // e.data will be the new expandedRows object for this inner table
                    onRowToggle={(e) => handleShiftRowToggle(e, rowData)}
                >
                    <Column expander style={{ width: "3rem" }} />
                    <Column field="shifttime" header="Shift Time" />
                    <Column field="PlanedRoutes" header="Planned Routes" />
                    <Column field="RecordedRoutes" header="Recorded Routes" />
                    <Column field="PendingRoutes" header="Pending Routes" />
                    <Column field="CancelledRoutes" header="Cancelled Routes" />
                    <Column field="PlanedKm" header="Planned Km" />
                    <Column field="ActualKm" header="Actual Km" />
                    <Column field="AprKm" header="Approved Km" />
                    <Column field="PlanedEmployee" header="Planned Emp" />
                    <Column field="BoardedEmployee" header="Boarded Emp" />
                    <Column field="UnRosteredEmp" header="UnRostered" />
                    <Column field="NoShowEmp" header="No Show" />
                    <Column field="CancelledEmployee" header="Cancelled Emp" />
                </DataTable>
            </div>
        );
    };
    // ✅ DETAILED SHIFT ROW EXPANSION TEMPLATE
    const shiftRowExpansionTemplate = (shiftRow, parentRow) => {
        const key = `${parentRow.Shiftdate}_${shiftRow.shifttime}`;
        const detail = detailedShiftData[key]?.data || [];

        return (
            <div className="p-2 mt-2">
                <DataTable
                    value={detail}
                    size="small"
                    stripedRows
                    className="p-datatable-gridlines process-datatable"
                    tableStyle={{ minWidth: "80rem", textAlign: "center" }}
                >
                    <Column field="RouteID" header="Route ID" />
                    <Column field="PlanVendor" header="Plan Vendor" />
                    <Column field="vendorName" header="Act Vendor" />
                    <Column field="vehicle" header="Vehicle Type" />
                    <Column field="vehicleNo" header="Vehicle No" />
                    <Column field="shiftTime" header="Shift" />
                    <Column field="tripType" header="Trip Type" />
                    <Column field="approvedKm" header="Planned Kms." />
                    <Column field="actTotalKm" header="Actual Kms." />
                    <Column field="approvedKm" header="Approved Kms." />
                    <Column field="totalStop" header="Planned Stops" />
                    <Column field="actTotalStop" header="Actual Stops" />
                </DataTable>
            </div>
        );
    };

    // ✅ Shift Row Expand Handler (Inner Table)
    const handleShiftRowToggle = async (e, parentRow) => {
        const expandedObj = e.data || {}; // new expandedRows object for this inner table
        const dateKey = parentRow.Shiftdate;
        const prevExpanded = innerExpandedRows[dateKey] || {};

        // determine added and removed shift keys
        const added = Object.keys(expandedObj).filter((k) => !prevExpanded[k]);
        const removed = Object.keys(prevExpanded).filter((k) => !expandedObj[k]);

        // if only collapse action occurred, just update state (no fetch)
        if (added.length === 0 && removed.length > 0) {
            setInnerExpandedRows((prev) => ({ ...prev, [dateKey]: expandedObj }));
            return;
        }

        try {
            setLoading(true);

            // fetch details for newly expanded shifts (if not already loaded)
            const fetches = added.map(async (shiftKey) => {
                const key = `${dateKey}_${shiftKey}`;
                if (detailedShiftData[key]) return null; // already present

                const params = {
                    sDate: dateKey,
                    facilityid: selFacility,
                    triptype: selectedTripType,
                    shift: shiftKey,
                };
                const resp = await RepPlanActService.RptPlanActDetailed(params);
                const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
                return { key, parsed };
            });

            const results = await Promise.all(fetches);

            // merge fetched details into state
            setDetailedShiftData((prev) => {
                const next = { ...prev };
                results.forEach((r) => {
                    if (r && r.key) next[r.key] = { data: r.parsed || [] };
                });
                return next;
            });

            // update controlled inner-expanded rows for this date
            setInnerExpandedRows((prev) => ({ ...prev, [dateKey]: expandedObj }));
        } catch (err) {
            console.error("❌ Error fetching detailed shift data:", err);
            toastService.error("Failed to load detailed data.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div>
            <Loader isVisible={loading} fullScreen={true} />
            <Header pageTitle={"Plan Vs Actual Information"} />
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
                                onChange={(e) => setFromDate(e.target.value)}
                                placeholder="Trips for the Day"

                            />
                        </div>
                        <div className="field col-2 mb-3">
                            <label>To Date</label>
                            <InputText
                                type="date"
                                className="w-100"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                placeholder="Trips for the Day"

                            />
                        </div>
                        <div className="field col-2 mb-3">
                            <label>Facility Name</label>
                            <Dropdown
                                options={facilities}
                                value={selFacility}
                                onChange={(e) => {
                                    setSelFacility(e.value);
                                    setData([]); // Clear existing data when facility changes
                                    setExpandedRows(null); // Reset expanded rows
                                    setShiftData({}); // Reset shift data
                                    setDetailedShiftData({});
                                    setInnerExpandedRows({});
                                }}
                                optionLabel="label"
                                placeholder="Select Facility"
                                className="w-100"
                                filter
                            />
                        </div>
                        <div className="field col-2 mb-3">
                            <label>Trip Type</label>
                            <Dropdown
                                options={tripTypeOptions}
                                optionLabel="label"
                                value={selectedTripType}
                                onChange={(e) => setSelectedTripType(e.value)}
                                placeholder="Select Trip Type"
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
                <div className="row">
                    <div className="col-12">
                        <div className="card_tb">
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                                <i
                                    className="pi pi-download"
                                    style={{
                                        fontSize: "1.5rem",
                                        cursor: "pointer",
                                        color: "#000",        // Black color
                                        padding: "8px"
                                    }}
                                    onClick={exportToExcel}
                                    title="Download Excel"    // Tooltip
                                ></i>
                            </div>
                            <DataTable
                                value={data}
                                headerColumnGroup={headerGroup}
                                paginator
                                rows={100}
                                tableStyle={{ minWidth: "50rem" }}
                                className="p-datatable-gridlines process-datatable"
                                size="small"
                                loading={loading}
                                emptyMessage={error ? `Error: ${error}` : "No records found"}
                                stripedRows
                                expandedRows={expandedRows}
                                onRowToggle={(e) => setExpandedRows(e.data)}
                                rowExpansionTemplate={rowExpansionTemplate}
                                // currentPageReportTemplate="Showing {first} to {last} of {totalRecords} employees"
                                // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"

                                rowsPerPageOptions={[50, 100, 200, 300]}
                            >
                                <Column
                                    expander
                                    body={(rowData) => (
                                        <span
                                            className="material-icons"
                                            style={{
                                                fontSize: "20px",
                                                cursor: "pointer",
                                                color: expandedRows?.some((r) => r === rowData) ? "red" : "blue",
                                            }}
                                            onClick={(e) => handleRowToggle(e, rowData)}
                                        >
                                            {expandedRows?.some((r) => r === rowData)
                                                ? "remove_circle"
                                                : "add_circle"}
                                        </span>
                                    )}
                                    style={{ width: "3rem" }}
                                />
                                <Column field="Shiftdate" />
                                <Column field="PlanedRoutes" className="text-center" />
                                <Column field="RecordedRoutes" className="text-center" />
                                <Column field="PendingRoutes" className="text-center" />
                                <Column field="CancelledRoutes" className="text-center" />
                                <Column field="PlanedKm" className="text-center" />
                                <Column field="ActualKm" className="text-center" />
                                <Column field="AprKm" className="text-center" />
                                <Column field="PlanedEmployee" className="text-center" />
                                <Column field="BoardedEmployee" className="text-center" />
                                <Column field="UnRosteredEmp" className="text-center" />
                                <Column field="NoShowEmp" className="text-center" />
                                <Column field="CancelledEmployee" className="text-center" />
                            </DataTable>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default RepPlanAct;
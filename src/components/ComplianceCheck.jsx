import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Column } from "primereact/column";
import { CustomDataTable } from "./common/CustomDataTable";
import ReportButton from "./common/ReportButton";
import Loader from "./common/Loader";
import { toastService } from "../services/toastService";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";
import sessionManager from "../utils/SessionManager";
import { useQueryClient } from "@tanstack/react-query";
import {
    useFacilitiesQuery,
    useVendorsQuery,
    useVehiclesQuery,
    useCompCheckDataQuery,
    useSaveComplianceMutation,
    complianceCheckKeys,
} from "../hooks/compliance/useComplianceCheckQueries";


const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
};

const ComplianceCheck = () => {
    const userId = sessionManager.getUserSession()?.ID;
    const userFacilityId = sessionManager.getUserSession()?.FacilityID;

    // Filter state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);

    // Submitted params — only updated on Submit click to drive data query
    const [submittedParams, setSubmittedParams] = useState(null);
    const [searchTriggered, setSearchTriggered] = useState(false);

    // Per-row inline edit state keyed by HeadID
    const [rowStatuses, setRowStatuses] = useState({});

    // "Other" section
    const [isOther, setIsOther] = useState(false);
    const [otherRemark, setOtherRemark] = useState("");
    const [otherPenalty, setOtherPenalty] = useState(null);

    // --- TanStack Queries ---
    const queryClient = useQueryClient();
    const { data: facilities = [], isLoading: loadingFacilities } = useFacilitiesQuery(userId);
    const { data: vendors = [], isLoading: loadingVendors } = useVendorsQuery(selectedFacility);
    const { data: vehicles = [], isLoading: loadingVehicles } = useVehiclesQuery(selectedFacility, selectedVendor);
    const {
        data: complianceResult,
        isLoading: loadingData,
        isFetching: fetchingData,
    } = useCompCheckDataQuery(submittedParams, !!submittedParams);
    const saveMutation = useSaveComplianceMutation();

    // Auto-select user's facility on first load
    useEffect(() => {
        if (facilities.length > 0 && !selectedFacility) {
            const match = facilities.find((f) => String(f.Id) === String(userFacilityId));
            setSelectedFacility((match || facilities[0]).Id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facilities]);

    // Reset dependent dropdowns when facility changes — grid stays visible until Submit
    useEffect(() => {
        setSelectedVendor(null);
        setSelectedVehicleId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFacility]);

    // Reset vehicle when vendor changes — grid stays visible until Submit
    useEffect(() => {
        setSelectedVehicleId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVendor]);

    // Sync grid + "other" section whenever fresh data arrives from server
    // (initial load, post-save invalidation, window-focus refetch)
    useEffect(() => {
        if (!complianceResult) return;
        setRowStatuses({});
        const other = (complianceResult.otherData || [])[0];
        if (other && Number(other.IsOther) === 1) {
            setIsOther(true);
            setOtherRemark(other.OtherRemark || "");
            setOtherPenalty(other.OtherPenalty != null ? Number(other.OtherPenalty) : null);
        } else {
            setIsOther(false);
            setOtherRemark("");
            setOtherPenalty(null);
        }
    }, [complianceResult]);

    const clearGrid = () => {
        setSearchTriggered(false);
        setSubmittedParams(null);
        setRowStatuses({});
        setIsOther(false);
        setOtherRemark("");
        setOtherPenalty(null);
    };

    // Embed editable state into the row objects so PrimeReact DataTable sees
    // new row references whenever the user edits, guaranteeing cell re-renders.
    // rowStatuses holds only user overrides; API data fills the defaults.
    const enrichedCheckData = useMemo(() => {
        return (complianceResult?.checkData || []).map((row) => ({
            ...row,
            _status: rowStatuses[row.HeadID]?.status ?? (row.Status || "OK"),
            _remark: rowStatuses[row.HeadID]?.remark ?? (row.Remark || ""),
        }));
    }, [complianceResult, rowStatuses]);

    const selectedVehicle = vehicles.find((v) => v.Id === selectedVehicleId);

    const handleSubmit = useCallback(() => {
        if (!selectedDate) { toastService.warn("Please select a Shift Date"); return; }
        if (!selectedFacility) { toastService.warn("Please select a Facility"); return; }
        if (!selectedVendor) { toastService.warn("Please select a Vendor"); return; }
        if (!selectedVehicleId) { toastService.warn("Please select a Vehicle"); return; }

        const cabId = selectedVehicle?.vehicleRegistrationNo || String(selectedVehicleId);
        const newParams = {
            CabId: cabId,
            SelDate: formatDate(selectedDate),
            FacilityID: selectedFacility,
            VendorID: selectedVendor,
            TripType: "",
            ShiftTime: "",
        };
        setSearchTriggered(true);
        setSubmittedParams(newParams);
        // Invalidate so re-submitting the same params always hits the API
        queryClient.invalidateQueries({ queryKey: complianceCheckKeys.checkData(newParams) });
    }, [selectedDate, selectedFacility, selectedVendor, selectedVehicleId, selectedVehicle, queryClient]);

    // Receive current values as parameters so handlers have no closure dependencies
    const handleStatusChange = (headId, newStatus, currentRemark) => {
        setRowStatuses((prev) => ({
            ...prev,
            [headId]: { status: newStatus, remark: newStatus === "N/A" ? "" : currentRemark },
        }));
    };

    const handleRemarkChange = (headId, newRemark, currentStatus) => {
        setRowStatuses((prev) => ({
            ...prev,
            [headId]: { status: currentStatus, remark: newRemark },
        }));
    };

    const handleSave = async () => {
        if (isOther) {
            if (!otherRemark?.trim()) { toastService.warn("Please enter a Description for Other"); return; }
            if (otherPenalty === null || otherPenalty === undefined) {
                toastService.warn("Please enter a Penalty for Other");
                return;
            }
        }

        const cabId = selectedVehicle?.vehicleRegistrationNo || String(selectedVehicleId);

        // Replicate legacy logic: if every row has N/A status AND no "other" → signal deletion
        const naCount = enrichedCheckData.filter((row) => row._status === "N/A").length;
        const updatedBy = naCount === enrichedCheckData.length && !isOther ? "Delete" : String(userId);

        const mainParams = {
            SelDate: formatDate(selectedDate),
            CabId: cabId,
            UpdatedBy: updatedBy,
            IsOther: isOther ? 1 : 0,
            OtherRemark: isOther ? otherRemark : "",
            OtherPenalty: isOther ? (otherPenalty ?? 0) : 0,
            FacilityID: selectedFacility,
            VendorID: selectedVendor,
            TripType: "",
            ShiftTime: "",
        };

        try {
            const refID = await saveMutation.mutateAsync({ mainParams, enrichedRows: enrichedCheckData });
            if (refID === 0) {
                toastService.warn("Record not saved. You didn't select any option.");
            } else {
                toastService.success("Record Saved Successfully!");
                // Reset user overrides and refetch — grid stays visible with fresh DB data
                setRowStatuses({});
                queryClient.invalidateQueries({ queryKey: complianceCheckKeys.checkData(submittedParams) });
            }
        } catch {
            toastService.error("Error saving compliance data. Please try again.");
        }
    };

    const handleCancel = () => {
        clearGrid();
        setSelectedVehicleId(null);
    };

    const isBusy = loadingData || fetchingData || saveMutation.isPending;

    // ── Column body templates — read directly from rowData, no external closures ──
    const rowClassName = (rowData) =>
        rowData._status === "NOT OK" ? "compliance-row-notok" : "";

    const statusBody = (rowData) => (
        <div className="d-flex gap-1">
            <button
                className={`compliance-toggle-btn ${rowData._status === "OK" ? "active-ok" : ""}`}
                onClick={() => handleStatusChange(rowData.HeadID, "OK", rowData._remark)}
            >
                ✓ OK
            </button>
            <button
                className={`compliance-toggle-btn ${rowData._status === "NOT OK" ? "active-notok" : ""}`}
                onClick={() => handleStatusChange(rowData.HeadID, "NOT OK", rowData._remark)}
            >
                ✗ NOT OK
            </button>
        </div>
    );

    const remarkBody = (rowData) => (
        <InputText
            value={rowData._remark}
            onChange={(e) => handleRemarkChange(rowData.HeadID, e.target.value, rowData._status)}
            className="w-100"
            placeholder="—"
        />
    );

    const penaltyBody = (rowData) => {
        if (rowData._status === "NOT OK" && rowData.Penalty) {
            return (
                <span
                    className="badge"
                    style={{ background: "#ef4444", color: "#fff", fontSize: "12px", padding: "4px 8px" }}
                >
                    ₹{rowData.Penalty}
                </span>
            );
        }
        return <span className="text-muted">—</span>;
    };
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <>
            <style>{`
                .compliance-page .p-datatable .p-datatable-tbody > tr > td {
                    padding: 10px 12px;
                    font-size: 13px;
                    vertical-align: middle;
                }
                .compliance-page .p-datatable .p-datatable-thead > tr > th {
                    font-size: 12px;
                    padding: 10px 12px;
                }
                .compliance-page .p-dropdown.w-100 .p-dropdown-label {
                    font-size: 13px;
                }
                .compliance-page .penalty-col-header .p-column-header-content {
                    justify-content: center;
                }
                /* NOT OK row tint */
                .compliance-page .p-datatable .p-datatable-tbody > tr.compliance-row-notok > td {
                    background: #fff5f5 !important;
                }
                /* Status toggle buttons */
                .compliance-toggle-btn {
                    border: 1.5px solid #dee2e6;
                    background: transparent;
                    color: #6c757d;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 500;
                    padding: 3px 11px;
                    cursor: pointer;
                    transition: background 0.15s, border-color 0.15s, color 0.15s;
                    white-space: nowrap;
                    line-height: 1.6;
                }
                .compliance-toggle-btn:hover {
                    border-color: #adb5bd;
                    background: #f8f9fa;
                }
                .compliance-toggle-btn.active-ok {
                    background: #dcfce7;
                    border-color: #22c55e;
                    color: #16a34a;
                    font-weight: 600;
                }
                .compliance-toggle-btn.active-notok {
                    background: #fee2e2;
                    border-color: #ef4444;
                    color: #dc2626;
                    font-weight: 600;
                }
            `}</style>

            <Loader isVisible={loadingFacilities || isBusy} fullScreen />
            <Header pageTitle="Compliance Check" />
            <Sidebar />

            <div className="middle compliance-page">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Compliance Check / Penalty Sheet</h6>
                    </div>

                    {/* ── Filter Card ─────────────────────────────────────── */}
                    <div className="col-12">
                        <div className="card_tb p-3 mb-3">
                            <div className="row align-items-end g-3">
                                {/* Shift Date */}
                                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                                    <label className="form-label">
                                        Shift Date <span className="text-danger">*</span>
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <img
                                            src={calendarIcon}
                                            alt=""
                                            style={{
                                                position: "absolute", left: 10, top: "50%",
                                                transform: "translateY(-50%)", width: 18, height: 18,
                                                zIndex: 1, pointerEvents: "none",
                                            }}
                                        />
                                        <Calendar
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.value)}
                                            dateFormat="mm/dd/yy"
                                            className="w-100"
                                            inputStyle={{ paddingLeft: "35px" }}
                                            placeholder="Select Date"
                                        />
                                    </div>
                                </div>

                                {/* Facility */}
                                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                                    <label className="form-label">
                                        Facility <span className="text-danger">*</span>
                                    </label>
                                    <Dropdown
                                        value={selectedFacility}
                                        options={facilities}
                                        optionLabel="facilityName"
                                        optionValue="Id"
                                        onChange={(e) => setSelectedFacility(e.value)}
                                        placeholder="Select Facility"
                                        className="w-100"
                                        filter
                                    />
                                </div>

                                {/* Vendor */}
                                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                                    <label className="form-label">
                                        Vendor <span className="text-danger">*</span>
                                    </label>
                                    <Dropdown
                                        value={selectedVendor}
                                        options={vendors}
                                        optionLabel="vendorName"
                                        optionValue="Id"
                                        onChange={(e) => setSelectedVendor(e.value)}
                                        placeholder="Select Vendor"
                                        className="w-100"
                                        disabled={!selectedFacility}
                                        loading={loadingVendors}
                                        filter
                                    />
                                </div>

                                {/* Vehicle */}
                                <div className="col-12 col-sm-6 col-md-4 col-lg-2">
                                    <label className="form-label">
                                        Vehicle Reg. No. <span className="text-danger">*</span>
                                    </label>
                                    <Dropdown
                                        value={selectedVehicleId}
                                        options={vehicles}
                                        optionLabel="vehicleRegistrationNo"
                                        optionValue="Id"
                                        onChange={(e) => setSelectedVehicleId(e.value)}
                                        placeholder="Select Vehicle"
                                        className="w-100"
                                        disabled={!selectedVendor}
                                        loading={loadingVehicles}
                                        filter
                                    />
                                </div>

                                {/* Submit */}
                                <div className="col-12 col-sm-6 col-md-4 col-lg-2 d-flex align-items-end">
                                    <ReportButton
                                        label="Submit"
                                        onClick={handleSubmit}
                                        disabled={loadingData || fetchingData}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Grid / Empty State ───────────────────────────────── */}
                    <div className="col-12">
                        <div className="card_tb">
                            {!searchTriggered ? (
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center p-5"
                                    style={{ minHeight: "60vh" }}
                                >
                                    <img
                                        src={noReportImage}
                                        alt="No data"
                                        style={{ maxWidth: "100px", opacity: 0.5, marginBottom: "1rem" }}
                                    />
                                    <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                                        Select the criteria above and click Submit to view compliance data.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3">
                                    {/* Compliance heads table */}
                                    <CustomDataTable
                                        value={enrichedCheckData}
                                        emptyMessage="No compliance heads found!"
                                        size="small"
                                        rowClassName={rowClassName}
                                    >
                                        <Column
                                            field="HeadName"
                                            header="Compliance Head"
                                            style={{ width: "30%" }}
                                        />
                                        <Column
                                            header="Status"
                                            body={statusBody}
                                            style={{ width: "22%" }}
                                        />
                                        <Column
                                            header="Remark"
                                            body={remarkBody}
                                            style={{ width: "33%" }}
                                        />
                                        <Column
                                            header="Penalty"
                                            body={penaltyBody}
                                            style={{ width: "15%" }}
                                            headerClassName="penalty-col-header"
                                            bodyClassName="text-center"
                                        />
                                    </CustomDataTable>

                                    {/* ── Other violation ────────────────────── */}
                                    <div className="mt-3">
                                        {!isOther ? (
                                            <button
                                                className="btn btn-sm d-inline-flex align-items-center gap-1"
                                                style={{
                                                    border: "1.5px dashed #adb5bd",
                                                    color: "#6c757d",
                                                    background: "transparent",
                                                    borderRadius: "6px",
                                                    fontSize: "0.8125rem",
                                                    padding: "6px 14px",
                                                }}
                                                onClick={() => setIsOther(true)}
                                            >
                                                <i className="pi pi-plus" style={{ fontSize: "0.7rem" }} />
                                                Add Other Violation
                                            </button>
                                        ) : (
                                            <div
                                                className="rounded p-3"
                                                style={{
                                                    borderLeft: "4px solid #f59e0b",
                                                    background: "#fffbeb",
                                                    border: "1px solid #fde68a",
                                                    borderLeftWidth: "4px",
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="pi pi-exclamation-triangle" style={{ color: "#d97706", fontSize: "0.9rem" }} />
                                                        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#92400e" }}>
                                                            Other Violation
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="btn btn-link p-0 d-flex align-items-center gap-1"
                                                        style={{ color: "#ef4444", fontSize: "0.8rem", textDecoration: "none" }}
                                                        onClick={() => { setIsOther(false); setOtherRemark(""); setOtherPenalty(null); }}
                                                    >
                                                        <i className="pi pi-times" style={{ fontSize: "0.7rem" }} />
                                                        Remove
                                                    </button>
                                                </div>
                                                <div className="row g-3">
                                                    <div className="col-12 col-md-6 col-lg-5">
                                                        <label className="form-label">
                                                            Description <span className="text-danger">*</span>
                                                        </label>
                                                        <InputText
                                                            value={otherRemark}
                                                            onChange={(e) => setOtherRemark(e.target.value)}
                                                            className="w-100"
                                                            placeholder="Describe the violation…"
                                                        />
                                                    </div>
                                                    <div className="col-12 col-md-4 col-lg-2">
                                                        <label className="form-label">
                                                            Penalty (₹) <span className="text-danger">*</span>
                                                        </label>
                                                        <InputNumber
                                                            value={otherPenalty}
                                                            onValueChange={(e) => setOtherPenalty(e.value)}
                                                            min={0}
                                                            max={100000}
                                                            className="w-100"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Action footer ──────────────────────── */}
                                    <div
                                        className="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3"
                                        style={{ borderTop: "1px solid #e9ecef" }}
                                    >
                                        <button
                                            className="btn btn-outline-secondary px-4"
                                            onClick={handleCancel}
                                            disabled={saveMutation.isPending}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-success px-4 d-flex align-items-center gap-2"
                                            onClick={handleSave}
                                            disabled={saveMutation.isPending}
                                            style={{ minWidth: "130px" }}
                                        >
                                            {saveMutation.isPending ? (
                                                <span className="spinner-border spinner-border-sm" />
                                            ) : (
                                                <i className="pi pi-save" />
                                            )}
                                            Save Changes
                                        </button>
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

export default ComplianceCheck;

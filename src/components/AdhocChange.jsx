import React, { useState, useEffect, useMemo } from "react";
import { CustomDataTable } from "./common/CustomDataTable";
import ResponsiveDataTable from "./common/ResponsiveDataTable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import noReportImage from "../assets/no_report.png";
import AdhocchangeService from "../services/compliance/AdhocchangeService";
import "react-toastify/dist/ReactToastify.css";
import Header from "./Master/Header";
import Loader from "./common/Loader";
import { toastService } from "../services/toastService";
import SidebarMenu from "./Master/SidebarMenu";
import sessionManager from "../utils/SessionManager";
import AppConfirmDialog from "./common/AppConfirmDialog";

const AdhocChange = () => {
    const [loading, setLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [first, setFirst] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const UserId = sessionManager.getUserSession().ID;
    const [confirmState, setConfirmState] = useState({ visible: false, title: '', message: '', variant: 'warning', confirmLabel: 'Confirm', onConfirm: null });
    const closeConfirm = () => setConfirmState(s => ({ ...s, visible: false, onConfirm: null }));

    const paginatedData = useMemo(
        () => employeeData.slice(first, first + rowsPerPage),
        [employeeData, first, rowsPerPage]
    );
    const formatShiftTime = (rowData) => {
        const time = rowData.ShiftTime;
        if (!time) return "-";
        return `${time.slice(0, 2)}:${time.slice(2)}`;
    };

    const fetchAdhocChange = async () => {
        setLoading(true);
        try {
            const params = {
                MgrId: UserId,
            };

            const response = await AdhocchangeService.SelectChangeAdhoc(params);

            const parsedData = typeof response === "string" ? JSON.parse(response) : response;

            setEmployeeData(parsedData || []);
            setHasSearched(true);
        } catch (error) {
            console.error("Error fetching adhoc change:", error);
            toastService.error("Failed to load adhoc change data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdhocChange();
    }, []);

    const getNoDataMessage = () => {
        return "Please load adhoc change requests to display the table.";
    };

    const getEmptyResultMessage = () => {
        return "No adhoc change records were found for your account.";
    };

    const handlePageChange = (event) => {
        setFirst(event.first);
        setRowsPerPage(event.rows);
    };

    const handleApprove = (rowData) => {
        setConfirmState({
            visible: true,
            title: 'Confirm Approval',
            message: 'Are you sure you want to approve this request?',
            variant: 'success',
            confirmLabel: 'Approve',
            onConfirm: async () => {
                closeConfirm();
                try {
                    setLoading(true);
                    await AdhocchangeService.UpdateAdhocStatus({
                        Id: rowData.id,
                        Status: "Approved",
                        ApprovedBy: UserId,
                        CallFrom: "Manager",
                    });
                    toastService.success("Request Approved Successfully");
                    fetchAdhocChange();
                } catch (error) {
                    console.error("Approve error:", error);
                    toastService.error("Failed to approve request");
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    
    const handleReject = (rowData) => {
        setConfirmState({
            visible: true,
            title: 'Confirm Rejection',
            message: 'Are you sure you want to reject this request?',
            variant: 'delete',
            confirmLabel: 'Reject',
            onConfirm: async () => {
                closeConfirm();
                try {
                    setLoading(true);
                    await AdhocchangeService.UpdateAdhocStatus({
                        Id: rowData.id,
                        Status: "Rejected",
                        ApprovedBy: UserId,
                        CallFrom: "Manager",
                    });
                    toastService.success("Request Rejected Successfully");
                    fetchAdhocChange();
                } catch (error) {
                    console.error("Reject error:", error);
                    toastService.error("Failed to reject request");
                } finally {
                    setLoading(false);
                }
            },
        });
    };
    return (
        <>
            <Loader isVisible={loading} fullScreen={true} />
            <Header pageTitle="Adhoc Change" mainTitle="Admin" />
            <SidebarMenu />
            <AppConfirmDialog
                visible={confirmState.visible}
                onHide={closeConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmLabel={confirmState.confirmLabel}
                onConfirm={confirmState.onConfirm}
            />
            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        {hasSearched && employeeData.length === 0 ? (
                            <div className="row">
                                <div className="col-12">
                                    <div className="card_tb">
                                        <div
                                            className="d-flex flex-column align-items-center justify-content-center p-5"
                                            style={{ minHeight: "90vh" }}
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
                                    </div>
                                </div>
                            </div>
                        ) : !hasSearched ? (
                            <div className="row">
                                <div className="col-12">
                                    <div className="card_tb">
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
                                            <Button
                                                label="Reload Adhoc Requests"
                                                className="p-button-sm p-mt-3"
                                                onClick={fetchAdhocChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card_tb">
                                <ResponsiveDataTable
                                    value={paginatedData}
                                    dataKey="id"
                                    paginator
                                    rows={rowsPerPage}
                                    first={first}
                                    onPage={handlePageChange}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                >
                                    <Column field="id" header="Adhoc ID" mobile={{ hidden: true }} sortable />
                                    <Column field="empName" header="Employee" mobile={{ primary: true }} />
                                    <Column field="AdhocDate" header="Shift Date" mobile={{ subtitle: true }} />
                                    <Column field="ShiftTime" header="Shift" body={formatShiftTime} />
                                    <Column field="TripType" header="Trip Type" />
                                    <Column field="facilityName" header="Facility" />
                                    <Column field="Status" header="Status" mobile={{ badge: true }} />
                                    <Column field="RaisedBy" header="Raised By" mobile={{ hidden: true }} />
                                    <Column field="adhocreason" header="Reason" mobile={{ hidden: true }} />
                                    <Column
                                        header="Action"
                                        mobile={{ action: true }}
                                        body={(rowData) => (
                                            <div className="d-flex gap-2">
                                                <span
                                                    style={{ color: "green", cursor: "pointer", fontWeight: "500" }}
                                                    onClick={() => handleApprove(rowData)}
                                                >
                                                    Approve
                                                </span>
                                                <span
                                                    style={{ color: "red", cursor: "pointer", fontWeight: "500" }}
                                                    onClick={() => handleReject(rowData)}
                                                >
                                                    Reject
                                                </span>
                                            </div>
                                        )}
                                    />
                                </ResponsiveDataTable>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdhocChange;
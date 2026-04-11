import React, { useState, useMemo, useEffect } from "react";
import Header from "./Master/Header";
import SidebarMenu from "./Master/SidebarMenu";
import MasterSidebar from "./Master/MasterSidebar";
import { CustomDataTable } from "./common/CustomDataTable";
import { Column } from "primereact/column";
import CustomPaginator from "./common/CustomPaginator";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { toastService } from "../services/toastService";
import { ToastContainer } from "react-toastify";
import DummyTripSheetEntrySidebar from "./DummyTripSheetEntrySidebar";
import DummyTripSheetEntryService from "../services/compliance/DummyTripSheetEntryService";
import noReportImage from "../assets/no_report.png";
import calendarIcon from "../assets/calendar.png";
import sessionManager from "../utils/SessionManager";
import Loader from "./common/Loader";
import ReportButton from "./common/ReportButton";
import StatusBadge from "./common/StatusBadge";
import "./DummyTripSheet.css";

const DummyTripSheetEntryDesktop = ({
    shiftDate,
    setShiftDate,
    tripId,
    setTripId,
    handleSearch,
    data,
    isLoading,
    actions,
    searchRouteId,
    isSidebarOpen,
    setIsSidebarOpen,
    routePrefix
}) => {
    const userSession = sessionManager.getUserSession();
    const userId = userSession?.ID || 1;
    const locationId = userSession?.LocationId || 1;
    const isAdmin = userSession?.IsAdmin || "1";
    const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isSidebarLoading, setIsSidebarLoading] = useState(false);

    // Add Employee Modal State
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedStopNo, setSelectedStopNo] = useState(null);
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);
    const [sidebarConfig, setSidebarConfig] = useState(null);

    const handleSidebarConfigChange = React.useCallback((nextConfig) => {
        setSidebarConfig((currentConfig) => {
            if (currentConfig === nextConfig) {
                return currentConfig;
            }

            if (!currentConfig || !nextConfig) {
                return nextConfig;
            }

            if (
                currentConfig.isSaving === nextConfig.isSaving &&
                currentConfig.saveLabel === nextConfig.saveLabel &&
                currentConfig.onSave === nextConfig.onSave
            ) {
                return currentConfig;
            }

            return nextConfig;
        });
    }, []);

    const employees = data?.employees || [];
    const routeInfo = data?.routeInfo?.[0] || null;

    const currentEmployees = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return employees.slice(startIndex, startIndex + rowsPerPage);
    }, [employees, currentPage, rowsPerPage]);

    useEffect(() => {
        if (!isSidebarOpen) {
            setSidebarConfig(null);
        }
    }, [isSidebarOpen]);

    const handleEmployeeIdClick = (employee) => {
        setSelectedEmployeeForEdit(employee);
        setIsSidebarOpen(true);
    };

    const handleOpenAddEmployee = () => {
        setSelectedEmployeeForEdit(null); // Clear selected employee to denote Add mode if we wanted to use sidebar
        // But the user requested the modal
        setShowAddEmployeeModal(true);
    };

    const handleSearchEmployees = async () => {
        if (!employeeSearchQuery) {
            toastService.warn("Please enter an employee ID or name.");
            return;
        }

        setIsSearching(true);
        try {
            const res = await DummyTripSheetEntryService.EmpSearch({
                locationid: locationId,
                empidname: employeeSearchQuery,
                IsAdmin: isAdmin
            });
            if (res && res.length > 0) {
                setSearchResults(res);
            } else {
                setSearchResults([]);
                toastService.warn("No Employee Found!!!");
            }
        } catch (error) {
            toastService.error("Failed to search employees");
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectEmployee = (employee) => {
        setSelectedEmployee(employee);
    };

    const handleAddEmployeeToRoute = async () => {
        if (!selectedEmployee || !selectedStopNo || !searchRouteId) return;

        setIsAddingEmployee(true);
        try {
            await actions.addEmpToRoute({
                empid: selectedEmployee.id || selectedEmployee.empID || selectedEmployee.empId,
                stopNo: selectedStopNo,
                UserID: userId,
                addresstype: "1", // Defaults to primary or let the user choose, assuming 1 based on legacy
                routeId: searchRouteId
            });
            toastService.success(`Employee ${selectedEmployee.empName} added to route ${searchRouteId}`);
            handleCloseAddEmployeeModal();
        } catch (error) {
            toastService.error(error?.message || "Failed to add employee to route.");
            console.error(error);
        } finally {
            setIsAddingEmployee(false);
        }
    };

    const handleCloseAddEmployeeModal = () => {
        setShowAddEmployeeModal(false);
        setEmployeeSearchQuery("");
        setSearchResults([]);
        setSelectedEmployee(null);
        setSelectedStopNo(null);
    };

    const availableStopNumbers = useMemo(() => {
        if (!employees) return [];
        const stops = employees.map(e => e.stopNo).filter(Boolean);
        const maxStop = Math.max(0, ...stops);
        
        const options = [];
        for (let i = 1; i <= maxStop + 1; i++) {
            // Find existing employee at this stop
            const existingAtStop = employees.find(e => e.stopNo === i);
            
            options.push({
                label: `Stop ${i} ${existingAtStop ? `(Before ${existingAtStop.empName})` : '(End of Route)'}`,
                value: i
            });
        }
        return options;
    }, [employees]);

    const columns = [
        {
            field: "stopNo",
            header: "Sno",
            body: (rowData) => <span className="fw-medium">{rowData.stopNo}</span>,
            sortable: true
        },
        {
            field: "empCode",
            header: "Emp Id",
            body: (rowData) => (
                <span 
                    onClick={() => handleEmployeeIdClick(rowData)}
                    style={{ cursor: "pointer", textDecoration: "none" }}
                    className="fw-bold text-primary"
                >
                    {rowData.empCode}
                </span>
            ),
            sortable: true
        },
        { field: "empName", header: "Emp Name", sortable: true },
        { field: "locationName", header: "Location" },
        {
            field: "trackingStatus",
            header: "Status",
            align: "center",
            body: (rowData) => {
                const statusMap = {
                    "B": "Boarded",
                    "C": "Cancelled",
                    "N": "No Show"
                };
                const label = statusMap[rowData.trackingStatus];
                return label ? <StatusBadge status={label} /> : <span>{rowData.trackingStatus}</span>;
            }
        },
        { field: "trackingRemark", header: "Remark" }
    ];

    return (
        <>
            <Loader isVisible={isLoading || isSearching || isAddingEmployee} fullScreen={true} />
            <ToastContainer position="top-right" autoClose={3000} />
            <Header pageTitle="Dummy TripSheet Entry" />
            <SidebarMenu />
            
            <div className="middle">
                <div className="row">
                    <div className="col-12">
                        <h6 className="pageTitle">Dummy TripSheet Entry</h6>
                    </div>
                    
                    {/* Search Header Form */}
                    <div className="col-12">
                        <div className="card_tb p-3 dummy-trip-entry-search">
                            <div className="row g-2 align-items-end">
                                <div className="field col-12 col-sm-6 col-md-3 col-lg-2 mb-0">
                                    <label htmlFor="shiftDate" className="form-label">Shift Date <span className="text-danger">*</span></label>
                                    <div className="custom-calendar-wrapper">
                                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                                        <Calendar
                                            className="w-100 custom-calendar-input"
                                            name="shiftDate"
                                            placeholder="Shift Date"
                                            dateFormat="dd-mm-yy"
                                            onChange={(e) => setShiftDate(e.value ? new Date(e.value) : null)}
                                            value={shiftDate}
                                        />
                                    </div>
                                </div>
                                <div className="field col-12 col-sm-6 col-md-3 col-lg-2 mb-0">
                                    <label htmlFor="tripId" className="form-label">Trip Id <span className="text-danger">*</span></label>
                                    <div className="p-inputgroup dummy-trip-id-group">
                                        {routePrefix && (
                                            <span className="p-inputgroup-addon dummy-trip-id-prefix bg-light text-secondary fw-semibold border-secondary-subtle px-2">
                                                {routePrefix}
                                            </span>
                                        )}
                                        <InputText 
                                            className="dummy-trip-id-input"
                                            value={tripId}
                                            onChange={(e) => setTripId(e.target.value.toUpperCase())}
                                            maxLength={5}
                                            placeholder="Enter ID..."
                                            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                                        />
                                    </div>
                                </div>
                                <div className="field col-12 col-sm-4 col-md-2 col-lg-2 mb-0 d-flex align-items-end dummy-trip-search-col">
                                    <ReportButton
                                        label="Search"
                                        onClick={handleSearch}
                                        disabled={isLoading}
                                        className="dummy-trip-search-button"
                                    />
                                </div>
                                <div className="col-12 col-sm-8 col-md-4 col-lg-4 mb-0 d-flex align-items-end dummy-trip-action-col">
                                    {routeInfo && (
                                        <div className="dummy-trip-action-group d-flex gap-2 w-100 justify-content-lg-end">
                                            <button
                                                className="btn btn-outline-dark d-flex align-items-center"
                                                type="button"
                                                title="Edit Trip Form"
                                                aria-label="Edit Trip Form"
                                                onClick={() => {
                                                    setSelectedEmployeeForEdit(null);
                                                    setIsSidebarOpen(true);
                                                }}
                                            >
                                                <i className="pi pi-pencil dummy-trip-action-icon me-2"></i>
                                                <span className="dummy-trip-action-text">Edit Trip Form</span>
                                            </button>
                                            <button
                                                className="btn btn-success d-flex align-items-center text-white border-0"
                                                type="button"
                                                title="Add Employee"
                                                aria-label="Add Employee"
                                                onClick={handleOpenAddEmployee}
                                            >
                                                <i className="material-icons dummy-trip-action-icon me-2">person_add</i>
                                                <span className="dummy-trip-action-text">Add Employee</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Section */}
                    {!routeInfo && !isLoading ? (
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
                                        Please select above parameters to show data
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="col-12">
                            <div className="card_tb">
                                <div className="p-3">
                                    <div className="table-responsive">
                                        <CustomDataTable
                                            value={currentEmployees}
                                            emptyMessage="No employees mapped to this route"
                                            stripedRows
                                            className="p-datatable-sm"
                                            responsiveLayout="scroll"
                                        >
                                            {columns.map((col, idx) => (
                                                        <Column 
                                                            key={idx} 
                                                            field={col.field} 
                                                            header={col.header} 
                                                            body={col.body} 
                                                            align={col.align}
                                                            sortable={col.sortable} 
                                                        />
                                                    ))}
                                        </CustomDataTable>
                                    </div>
                                    {employees.length > 0 && (
                                        <CustomPaginator
                                            totalRecords={employees.length}
                                            rows={rowsPerPage}
                                            first={(currentPage - 1) * rowsPerPage}
                                            onPageChange={(e) => {
                                                setCurrentPage(e.page + 1);
                                                setRowsPerPage(e.rows);
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar for Main Form Edit (or Employee detail edit) */}
            <MasterSidebar
                show={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                title={selectedEmployeeForEdit ? `Edit Employee ${selectedEmployeeForEdit.empCode}` : "Trip Details"}
                width="56%"
                className="dummy-trip-sidebar"
                bodyClassName="dummy-trip-sidebar-body"
                footer={
                    sidebarConfig ? (
                        <div className="offcanvas-footer">
                            <Button
                                label="Cancel"
                                className="btn btn-outline-secondary"
                                onClick={() => setIsSidebarOpen(false)}
                                disabled={sidebarConfig.isSaving}
                            />
                            <Button
                                label={sidebarConfig.saveLabel || "Update"}
                                className="btn btn-success ms-3"
                                onClick={sidebarConfig.onSave}
                                disabled={sidebarConfig.isSaving}
                            />
                        </div>
                    ) : null
                }
            >
                <DummyTripSheetEntrySidebar 
                    routeInfo={routeInfo} 
                    employee={selectedEmployeeForEdit}
                    actions={actions}
                    searchRouteId={searchRouteId}
                    onClose={() => setIsSidebarOpen(false)}
                    onSidebarConfigChange={isSidebarOpen ? handleSidebarConfigChange : undefined}
                />
            </MasterSidebar>

            {/* Add Employee Modal using exact ManageRouteDesktop styling */}
            <Dialog
                visible={showAddEmployeeModal}
                onHide={handleCloseAddEmployeeModal}
                header={
                    <div className="d-flex align-items-center">
                        <span>Add Employee to Route</span>
                    </div>
                }
                style={{ width: "800px", maxWidth: "95vw" }}
                className="modern-modal"
                footer={
                    <div className="d-flex justify-content-end">
                        <Button
                            label="Cancel"
                            onClick={handleCloseAddEmployeeModal}
                            className="btn btn-outline-secondary me-2"
                            disabled={isAddingEmployee || isSearching}
                        />
                        <Button
                            label={isAddingEmployee ? "Adding..." : "Add Employee"}
                            onClick={handleAddEmployeeToRoute}
                            className="btn btn-dark"
                            disabled={!selectedEmployee || !selectedStopNo || isAddingEmployee || isSearching}
                        />
                    </div>
                }
            >
                <div className="p-3">
                    {searchRouteId && (
                        <div
                            className="mb-3 p-2 rounded"
                            style={{
                                backgroundColor: "#e3f2fd",
                                border: "1px solid #bbdefb",
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i
                                        className="material-icons me-2"
                                        style={{ color: "#1976d2", fontSize: "18px" }}
                                    >
                                        route
                                    </i>
                                    <span className="fw-bold">{searchRouteId}</span>
                                </div>
                                {employees && employees.length > 0 && (
                                    <span className="fw-bold text-primary">
                                        {employees.length} employee
                                        {employees.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <span className="fw-semibold" style={{ fontSize: "14px" }}>
                            Search Employee
                        </span>
                        <div className="input-group">
                            <InputText
                                value={employeeSearchQuery}
                                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                placeholder="Enter employee ID or name..."
                                className="form-control"
                                style={{ fontSize: "14px" }}
                                onKeyPress={(e) => e.key === "Enter" && handleSearchEmployees()}
                            />
                            <Button
                                label="Search"
                                onClick={handleSearchEmployees}
                                className="btn btn-dark"
                                icon="pi pi-search"
                                disabled={isSearching || isAddingEmployee}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-8">
                            {searchResults.length > 0 && (
                                <div>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <span className="fw-semibold" style={{ fontSize: "14px" }}>
                                            Search Results
                                        </span>
                                        <span className="badge bg-primary">
                                            {searchResults.length} &nbsp; Found
                                        </span>
                                    </div>
                                    <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        <table className="table table-hover table-bordered">
                                            <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Name</th>
                                                    <th>Address</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {searchResults.map((employee) => (
                                                    <tr
                                                        key={employee.id}
                                                        onClick={() => handleSelectEmployee(employee)}
                                                        style={{
                                                            cursor: 'pointer',
                                                            background: selectedEmployee?.id === employee.id ? '#d1ecf1' : 'transparent'
                                                        }}
                                                    >
                                                        <td>
                                                            <strong>{employee.empCode}</strong>
                                                        </td>
                                                        <td>{employee.empName}</td>
                                                        <td
                                                            style={{
                                                                maxWidth: "150px",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                            title={employee.PrimaryLocation || employee.address}
                                                        >
                                                            {employee.PrimaryLocation || employee.address}
                                                        </td>
                                                        <td>
                                                            <Button
                                                                label={selectedEmployee?.id === employee.id ? "Selected" : "Select"}
                                                                className={`btn ${selectedEmployee?.id === employee.id ? 'btn-success' : 'btn-outline-secondary'}`}
                                                                style={{ fontSize: "12px", padding: "4px 8px" }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectEmployee(employee);
                                                                }}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="col-md-4">
                            {selectedEmployee && availableStopNumbers.length > 0 && (
                                <div className="mb-3">
                                    <span className="fw-semibold" style={{ fontSize: "14px" }}>
                                        Select Stop Position
                                    </span>
                                    <Dropdown
                                        value={selectedStopNo}
                                        onChange={(e) => setSelectedStopNo(e.value)}
                                        options={availableStopNumbers}
                                        placeholder="Choose stop number..."
                                        className="w-100"
                                        optionLabel="label"
                                        optionValue="value"
                                        style={{ fontSize: "14px" }}
                                    />
                                    <div className="text-muted mt-2" style={{ fontSize: "11px" }}>
                                        <i className="material-icons me-1" style={{ fontSize: "12px", verticalAlign: 'middle' }}>
                                            info
                                        </i>
                                        Insert at this position in the route.
                                    </div>

                                    {selectedStopNo && (
                                        <div
                                            className="alert alert-success py-2 mt-3"
                                            style={{ fontSize: "13px" }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <i className="material-icons me-2" style={{ fontSize: "16px" }}>
                                                    check_circle
                                                </i>
                                                <span>
                                                    Ready to add <strong>{selectedEmployee.empName}</strong> at stop{" "}
                                                    <strong>
                                                        {selectedStopNo}
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default DummyTripSheetEntryDesktop;

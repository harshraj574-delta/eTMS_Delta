import React, { useState, useMemo } from "react";
import MobileHeader from "./common/mobile/MobileHeader";
import MobileCardList from "./common/mobile/MobileCardList";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import MasterSidebar from "./Master/MasterSidebar";
import DummyTripSheetEntrySidebar from "./DummyTripSheetEntrySidebar";
import DummyTripSheetEntryService from "../services/compliance/DummyTripSheetEntryService";
import { toastService } from "../services/toastService";
import sessionManager from "../utils/SessionManager";
import Loader from "./common/Loader";
import "./DummyTripSheet.css";

const DummyTripSheetEntryMobile = ({
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
    const [isSidebarLoading, setIsSidebarLoading] = useState(false);

    // Add Employee Modal State
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedStopNo, setSelectedStopNo] = useState(null);
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);

    const employees = data?.employees || [];
    const routeInfo = data?.routeInfo?.[0] || null;

    const handleEmployeeIdClick = (employee) => {
        setSelectedEmployeeForEdit(employee);
        setIsSidebarOpen(true);
    };

    const handleOpenAddEmployee = () => {
        setSelectedEmployeeForEdit(null);
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
                addresstype: "1",
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
            const existingAtStop = employees.find(e => e.stopNo === i);
            options.push({
                label: `Stop ${i} ${existingAtStop ? `(Before ${existingAtStop.empName})` : '(End of Route)'}`,
                value: i
            });
        }
        return options;
    }, [employees]);

    const employeeCardTemplate = (item) => {
        const getStatusBadge = (status) => {
            const statusMap = {
                "B": { label: "Boarded", class: "bg-success" },
                "C": { label: "Cancelled", class: "bg-danger" },
                "N": { label: "No Show", class: "bg-warning text-dark" }
            };
            const mapped = statusMap[status];
            if (mapped) {
                return <span className={`badge ${mapped.class} rounded-pill`}>{mapped.label}</span>;
            }
            return <span className="badge bg-secondary rounded-pill">{status}</span>;
        };

        return (
            <div className="card shadow-sm mb-3 border-0 rounded-4 overflow-hidden" onClick={() => handleEmployeeIdClick(item)}>
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="fw-bold fs-6 text-primary">{item.empCode}</div>
                        {getStatusBadge(item.trackingStatus)}
                    </div>
                    <div className="fw-semibold mb-1 text-dark">{item.empName}</div>
                    <div className="text-muted small d-flex align-items-start mb-2">
                        <i className="material-icons me-1 position-relative" style={{ fontSize: '14px', top: '2px' }}>location_on</i>
                        <span className="text-truncate">{item.locationName}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-2 border-top pt-2">
                        <span className="badge bg-light text-dark border">Stop: {item.stopNo}</span>
                        {item.trackingRemark && <span className="small text-muted fst-italic">"{item.trackingRemark}"</span>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-light min-vh-100 d-flex flex-column">
            <Loader isVisible={isLoading || isSearching || isAddingEmployee} fullScreen={true} />
            <MobileHeader title="Dummy TripSheet" showBack={false} rightContent={
                routeInfo ? (
                    <div className="d-flex gap-2">
                        <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-text p-button-secondary"
                            onClick={() => {
                                setSelectedEmployeeForEdit(null);
                                setIsSidebarOpen(true);
                            }}
                        />
                        <Button
                            icon="pi pi-plus"
                            className="p-button-rounded p-button-success"
                            onClick={handleOpenAddEmployee}
                        />
                    </div>
                ) : null
            } />
            
            <div className="flex-grow-1 overflow-auto d-flex flex-column p-3">
                {/* Search Card */}
                <div className="card shadow-sm border-0 rounded-4 mb-3">
                    <div className="card-body p-3">
                        <h6 className="fw-bold mb-3 d-flex align-items-center">
                            <i className="material-icons text-primary me-2 fs-5">search</i>
                            Search Route
                        </h6>
                        <div className="mb-3">
                            <label className="form-label text-muted small fw-semibold mb-1">Shift Date:</label>
                            <Calendar
                                value={shiftDate}
                                onChange={(e) => setShiftDate(e.value ? new Date(e.value) : null)}
                                showIcon
                                dateFormat="mm/dd/yy"
                                className="w-100"
                                inputClassName="shadow-none border-secondary-subtle"
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label text-muted small fw-semibold mb-1">Trip Id:</label>
                            <div className="p-inputgroup">
                                {routePrefix && (
                                    <span className="p-inputgroup-addon bg-light text-secondary fw-semibold border-secondary-subtle px-2" style={{ fontSize: "14px" }}>
                                        {routePrefix}
                                    </span>
                                )}
                                <InputText 
                                    value={tripId}
                                    onChange={(e) => setTripId(e.target.value.toUpperCase())}
                                    className="shadow-none border-secondary-subtle font-monospace"
                                    maxLength={5}
                                    placeholder="Enter ID..."
                                />
                                <Button 
                                    icon="pi pi-search" 
                                    className="p-button-primary" 
                                    onClick={handleSearch}
                                    disabled={isLoading || isSearching || isAddingEmployee}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {routeInfo ? (
                    <div className="flex-grow-1 d-flex flex-column">
                        <h6 className="fw-bold mb-2 text-dark px-1">Route Details: {searchRouteId}</h6>
                        <MobileCardList 
                            data={employees}
                            itemTemplate={employeeCardTemplate}
                            emptyMessage="No employees mapped to this route"
                            onRefresh={async () => {
                                await actions.refetchAll();
                            }}
                        />
                    </div>
                ) : (
                    <div className="text-center py-5">
                        <h6 className="text-muted fw-normal">No route selected.</h6>
                    </div>
                )}
            </div>

            {/* Sidebar Edit Flow */}
            <MasterSidebar
                show={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                title={selectedEmployeeForEdit ? `Edit Employee ${selectedEmployeeForEdit.empCode}` : "Trip Details"}
            >
                <DummyTripSheetEntrySidebar 
                    routeInfo={routeInfo} 
                    employee={selectedEmployeeForEdit}
                    actions={actions}
                    searchRouteId={searchRouteId}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </MasterSidebar>

            {/* Add Employee Modal using ManagedRouteDesktop styling adapted for mobile */}
            <Dialog
                visible={showAddEmployeeModal}
                onHide={handleCloseAddEmployeeModal}
                header={<span className="fw-bold">Add Employee</span>}
                style={{ width: "95vw", maxWidth: "95vw", marginLeft: "auto", marginRight: "auto", margin: "10px" }}
                className="modern-modal"
                modal
                footer={
                    <div className="d-flex justify-content-end gap-2 w-100">
                        <Button
                            label="Cancel"
                            onClick={handleCloseAddEmployeeModal}
                            className="btn btn-outline-secondary flex-grow-1"
                            disabled={isAddingEmployee || isSearching}
                        />
                        <Button
                            label={isAddingEmployee ? "Adding..." : "Add"}
                            onClick={handleAddEmployeeToRoute}
                            className="btn btn-dark flex-grow-1"
                            disabled={!selectedEmployee || !selectedStopNo || isAddingEmployee || isSearching}
                        />
                    </div>
                }
            >
                <div className="p-0 mt-2">
                    {searchRouteId && (
                        <div className="mb-3 p-2 rounded" style={{ backgroundColor: "#e3f2fd", border: "1px solid #bbdefb", fontSize: "14px" }}>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <i className="material-icons me-2" style={{ color: "#1976d2", fontSize: "16px" }}>route</i>
                                    <span className="fw-bold">{searchRouteId}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <span className="fw-semibold d-block mb-1" style={{ fontSize: "14px" }}>
                            Search Employee
                        </span>
                        <div className="p-inputgroup">
                            <InputText
                                value={employeeSearchQuery}
                                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                                placeholder="Enter ID or name..."
                                className="form-control"
                                style={{ fontSize: "14px" }}
                                onKeyPress={(e) => e.key === "Enter" && handleSearchEmployees()}
                            />
                            <Button
                                icon="pi pi-search"
                                onClick={handleSearchEmployees}
                                className="p-button-dark"
                                disabled={isSearching || isAddingEmployee}
                            />
                        </div>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mb-3">
                            <span className="fw-semibold d-block mb-2" style={{ fontSize: "14px" }}>
                                Results ({searchResults.length})
                            </span>
                            <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {searchResults.map((employee) => (
                                    <div 
                                        key={employee.id}
                                        className={`p-2 border rounded ${selectedEmployee?.id === employee.id ? 'border-success bg-light' : 'border-secondary-subtle'}`}
                                        onClick={() => handleSelectEmployee(employee)}
                                    >
                                        <div className="d-flex justify-content-between align-items-start pb-1">
                                            <span className="fw-bold small">{employee.empCode}</span>
                                            <i className={`material-icons ${selectedEmployee?.id === employee.id ? 'text-success' : 'text-muted'}`} style={{ fontSize: "18px" }}>
                                                {selectedEmployee?.id === employee.id ? 'check_circle' : 'radio_button_unchecked'}
                                            </i>
                                        </div>
                                        <div className="fw-medium small">{employee.empName}</div>
                                        <div className="text-muted" style={{ fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{employee.address || employee.PrimaryLocation}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedEmployee && availableStopNumbers.length > 0 && (
                        <div className="mb-3">
                            <span className="fw-semibold d-block mb-1" style={{ fontSize: "14px" }}>
                                Select Stop Position
                            </span>
                            <Dropdown
                                value={selectedStopNo}
                                onChange={(e) => setSelectedStopNo(e.value)}
                                options={availableStopNumbers}
                                placeholder="Choose stop number..."
                                className="w-100 p-dropdown-sm"
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export default DummyTripSheetEntryMobile;

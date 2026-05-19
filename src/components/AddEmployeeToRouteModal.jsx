import React, { useState, useCallback, useEffect } from 'react';
import AppDialog from './common/AppDialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import ManageRouteService from '../services/compliance/ManageRouteService';
import { toastService } from '../services/toastService';

/**
 * AddEmployeeToRouteModal - Mobile-friendly modal to add employees to a route
 * 
 * Shows a searchable list of unassigned employees that can be added to the selected route.
 */
const AddEmployeeToRouteModal = ({
    visible,
    onHide,
    routeId,
    routeInfo,
    filters,
    onSuccess
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(null); // empId being added
    const userID = sessionStorage.getItem('ID');

    // Fetch unassigned employees when modal opens
    useEffect(() => {
        if (!visible || !filters?.facilityId) return;
        
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                // Get employees available for this shift
                const response = await ManageRouteService.EmpSearch({
                    facilityID: filters.facilityId,
                    tripType: filters.tripType,
                    shiftname: filters.shifts,
                    sDate: filters.sDate,
                    searchemp: ''
                });
                
                let data = typeof response === 'string' ? JSON.parse(response) : response;
                if (typeof data === 'string') data = JSON.parse(data);
                
                // Filter out employees already assigned to routes
                const unassigned = Array.isArray(data) ? data.filter(emp => !emp.RouteID || emp.RouteID === '') : [];
                setEmployees(unassigned);
                setFilteredEmployees(unassigned);
            } catch (error) {
                console.error('Error fetching employees:', error);
                toastService.error('Failed to load employees');
                setEmployees([]);
                setFilteredEmployees([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchEmployees();
    }, [visible, filters]);

    // Filter employees based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredEmployees(employees);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredEmployees(
                employees.filter(emp => 
                    (emp.empName?.toLowerCase().includes(term)) ||
                    (emp.empCode?.toLowerCase().includes(term)) ||
                    (emp.Address?.toLowerCase().includes(term))
                )
            );
        }
    }, [searchTerm, employees]);

    // Add employee to route
    const handleAddEmployee = useCallback(async (employee) => {
        if (adding) return;
        
        setAdding(employee.empId || employee.EmpID);
        try {
            await ManageRouteService.AddEmpToRoute({
                empId: employee.empId || employee.EmpID,
                stopNo: 1, // Will be reordered by recalculate
                routeId: routeId,
                isDelete: 0,
                IsNewAdded: 1,
                updatedby: userID
            });
            
            toastService.success(`${employee.empName || employee.EmpName} added to route`);
            
            // Remove from list
            setEmployees(prev => prev.filter(e => (e.empId || e.EmpID) !== (employee.empId || employee.EmpID)));
            
            // Notify parent
            onSuccess?.();
        } catch (error) {
            console.error('Error adding employee:', error);
            toastService.error(`Failed to add employee: ${error.message}`);
        } finally {
            setAdding(null);
        }
    }, [adding, routeId, userID, onSuccess]);

    return (
        <AppDialog
            visible={visible}
            onHide={onHide}
            title={`Add Employees — ${routeId}`}
            icon="pi pi-user-plus"
            iconColor="#3b82f6"
            size="md"
            footer={null}
        >
            {/* Search Input */}
            <div className="mb-3">
                <span className="p-input-icon-left w-100">
                    <i className="pi pi-search" />
                    <InputText
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name or code..."
                        className="w-100"
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </span>
            </div>

            {/* Employee List */}
            <div 
                style={{ 
                    maxHeight: '50vh', 
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                }}
            >
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <ProgressSpinner style={{ width: '40px', height: '40px' }} />
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="pi pi-users" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }} />
                        {searchTerm ? 'No employees match your search' : 'No unassigned employees available'}
                    </div>
                ) : (
                    filteredEmployees.map((emp, index) => (
                        <div 
                            key={emp.empId || emp.EmpID || index}
                            className="d-flex align-items-center justify-content-between p-3"
                            style={{ 
                                borderBottom: index < filteredEmployees.length - 1 ? '1px solid #e5e7eb' : 'none',
                                background: index % 2 === 0 ? '#f9fafb' : '#fff'
                            }}
                        >
                            <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                                    {emp.empName || emp.EmpName || 'Unknown'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    {emp.empCode || emp.EmpCode} • {emp.Address || emp.Colony || 'No address'}
                                </div>
                            </div>
                            <Button
                                icon={adding === (emp.empId || emp.EmpID) ? "pi pi-spin pi-spinner" : "pi pi-plus"}
                                className="p-button-rounded p-button-success p-button-sm"
                                onClick={() => handleAddEmployee(emp)}
                                disabled={adding !== null}
                                style={{ width: '36px', height: '36px' }}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Footer Info */}
            <div className="mt-3 text-center" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} available
            </div>
        </AppDialog>
    );
};

export default AddEmployeeToRouteModal;

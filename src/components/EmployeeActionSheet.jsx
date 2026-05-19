import React, { useState, useCallback } from 'react';
import AppDialog from './common/AppDialog';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import ManageRouteService from '../services/compliance/ManageRouteService';
import { toastService } from '../services/toastService';

/**
 * EmployeeActionSheet - Bottom sheet for employee actions (Move, Remove)
 */
const EmployeeActionSheet = ({
    visible,
    onHide,
    employee,
    currentRouteId,
    routes = [],
    onSuccess
}) => {
    const [showRoutePicker, setShowRoutePicker] = useState(false);
    const [moving, setMoving] = useState(false);
    const userID = sessionStorage.getItem('ID');

    // Filter out current route from available destinations
    const destinationRoutes = routes.filter(r => r.RouteID !== currentRouteId);

    // Move employee to another route
    const handleMoveToRoute = useCallback(async (targetRoute) => {
        if (moving) return;

        setMoving(true);
        try {
            // Use UpdateCutPaste API to move employee
            await ManageRouteService.UpdateCutPaste({
                empid: employee.empId || employee.EmpID,
                sNo: employee.stopNo || 1,
                fromRouteId: currentRouteId,
                toRouteId: targetRoute.RouteID,
                toStopNo: 1, // Will be reordered
                updatedby: userID
            });

            toastService.success(`${employee.empName} moved to ${targetRoute.RouteID}`);
            setShowRoutePicker(false);
            onHide();
            onSuccess?.();
        } catch (error) {
            console.error('Move employee error:', error);
            toastService.error(`Failed to move employee: ${error.message}`);
        } finally {
            setMoving(false);
        }
    }, [moving, employee, currentRouteId, userID, onHide, onSuccess]);

    // Remove employee from route
    const handleRemove = useCallback(async () => {
        if (moving) return;

        setMoving(true);
        try {
            await ManageRouteService.DeleteEmployeeFromRoute({
                routeid: currentRouteId,
                empId: employee.empId || employee.EmpID,
                isDelete: 1,
                updatedby: userID
            });

            toastService.success(`${employee.empName} removed from route`);
            onHide();
            onSuccess?.();
        } catch (error) {
            console.error('Remove employee error:', error);
            toastService.error(`Failed to remove employee: ${error.message}`);
        } finally {
            setMoving(false);
        }
    }, [moving, employee, currentRouteId, userID, onHide, onSuccess]);

    // Reset state when hiding
    const handleHide = useCallback(() => {
        setShowRoutePicker(false);
        onHide();
    }, [onHide]);

    if (!visible || !employee) return null;

    return (
        <>
            {/* Main Action Sheet */}
            <AppDialog
                visible={visible && !showRoutePicker}
                onHide={handleHide}
                title={employee.empName || 'Employee'}
                icon="pi pi-user"
                iconColor="#3b82f6"
                size="sm"
                footer={null}
                position="bottom"
            >
                <div className="d-flex flex-column gap-2">
                    <Button
                        label="Move to Another Route"
                        icon="pi pi-arrows-alt"
                        className="p-button-outlined w-100"
                        onClick={() => setShowRoutePicker(true)}
                        disabled={destinationRoutes.length === 0}
                    />
                    <Button
                        label="Remove from Route"
                        icon="pi pi-trash"
                        className="p-button-outlined p-button-danger w-100"
                        onClick={handleRemove}
                        disabled={moving}
                    />
                    <Button
                        label="Cancel"
                        className="p-button-text w-100"
                        onClick={handleHide}
                    />
                </div>
                {destinationRoutes.length === 0 && (
                    <div className="text-muted text-center mt-2" style={{ fontSize: '0.8rem' }}>
                        No other routes available to move to
                    </div>
                )}
            </AppDialog>

            {/* Route Picker Dialog */}
            <AppDialog
                visible={showRoutePicker}
                onHide={() => setShowRoutePicker(false)}
                title="Select Destination Route"
                icon="pi pi-map"
                iconColor="#3b82f6"
                size="sm"
                footer={null}
                position="bottom"
            >
                <div
                    style={{
                        maxHeight: '50vh',
                        overflowY: 'auto',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                    }}
                >
                    {destinationRoutes.map((route, index) => (
                        <div
                            key={route.RouteID}
                            className="d-flex align-items-center justify-content-between p-3"
                            style={{
                                borderBottom: index < destinationRoutes.length - 1 ? '1px solid #e5e7eb' : 'none',
                                background: index % 2 === 0 ? '#f9fafb' : '#fff',
                                cursor: 'pointer'
                            }}
                            onClick={() => !moving && handleMoveToRoute(route)}
                        >
                            <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                                    {route.RouteID}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    {route.totalStop || 0} stops • {route.totaldist ? parseFloat(route.totaldist).toFixed(1) : 0} km
                                </div>
                            </div>
                            {moving ? (
                                <ProgressSpinner style={{ width: '24px', height: '24px' }} strokeWidth="4" />
                            ) : (
                                <i className="pi pi-chevron-right" style={{ color: '#94a3b8' }} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-3">
                    <Button
                        label="Cancel"
                        className="p-button-text w-100"
                        onClick={() => setShowRoutePicker(false)}
                    />
                </div>
            </AppDialog>
        </>
    );
};

export default EmployeeActionSheet;

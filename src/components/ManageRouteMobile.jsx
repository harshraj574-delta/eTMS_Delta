import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouteDetailsQuery, manageRouteKeys } from '../hooks/compliance/useManageRouteQueries';

// PrimeReact Components
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ToastContainer } from 'react-toastify';

// DnD Kit
import {
    DndContext,
    useSensor,
    useSensors,
    TouchSensor,
    MouseSensor,
    useDraggable,
    useDroppable,
    closestCenter,
    DragOverlay
} from '@dnd-kit/core';

// App Layout Components (same as Desktop)
import Header from './Master/Header';
import Sidebar from './Master/SidebarMenu';
import MasterSidebar from './Master/MasterSidebar';

// Common Mobile Components
import MobileCardList from './common/mobile/MobileCardList';

// Route Details Component (shared with Desktop)
import OffcanvasRouteDetails from './OffcanvasRouteDetails';

// Add Employee Modal
import AddEmployeeToRouteModal from './AddEmployeeToRouteModal';



// Services
import ManageRouteService from '../services/compliance/ManageRouteService';
import { toastService } from '../services/toastService';

// Assets
import calendarIcon from '../assets/calendar.png';

// ============================================================================
// STYLES (embedded for animation keyframes)
// ============================================================================
const mobileStyles = `
@keyframes slideDown {
    from {
        opacity: 0;
        max-height: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        max-height: 1000px;
        transform: translateY(0);
    }
}
.p-badge {
    min-width: 1.5rem;
    height: 1.5rem;
    line-height: 1.5rem;
    padding: 0 6px;
    font-size: 0.75rem;
}
.custom-calendar-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}
.custom-calendar-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    z-index: 2;
    pointer-events: none;
}
.custom-calendar-input .p-inputtext {
    padding-left: 36px !important;
}
`;

// Inject styles once on module load
if (typeof document !== 'undefined' && !document.getElementById('manage-route-mobile-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'manage-route-mobile-styles';
    styleEl.textContent = mobileStyles;
    document.head.appendChild(styleEl);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * StatsBar - Horizontal scrollable stats display
 */
const StatsBar = React.memo(({ stats }) => {
    const safeStats = stats?.[0] || {};
    
    return (
        <div 
            className="d-flex gap-2 px-3 py-2 overflow-auto align-items-center"
            style={{ 
                background: '#fff',
                whiteSpace: 'nowrap',
                borderBottom: '1px solid #f1f5f9'
            }}
        >
            <div className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 border flex-fill" style={{ background: '#f8fafc', borderColor: '#e2e8f0', minWidth: '110px' }}>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '36px', height: '36px', background: '#eff6ff' }}>
                    <i className="pi pi-map-marker text-primary" style={{ fontSize: '1rem' }} />
                </div>
                <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{safeStats.TotalRoutes || 0}</div>
                    <small className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Routes</small>
                </div>
            </div>
            
            <div className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 border flex-fill" style={{ background: '#f8fafc', borderColor: '#e2e8f0', minWidth: '130px' }}>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '36px', height: '36px', background: '#f0fdf4' }}>
                    <i className="pi pi-users text-success" style={{ fontSize: '1rem' }} />
                </div>
                <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{safeStats.TotalEmps || 0}</div>
                    <small className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Employees</small>
                </div>
            </div>
            
            <div className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 border flex-fill" style={{ background: '#f8fafc', borderColor: '#e2e8f0', minWidth: '140px' }}>
                <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '36px', height: '36px', background: '#fff7ed' }}>
                    <i className="pi pi-chart-pie text-warning" style={{ fontSize: '1rem' }} />
                </div>
                <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{safeStats.AvgOccupancy?.toFixed(1) || 0}</div>
                    <small className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Avg Occupancy</small>
                </div>
            </div>
        </div>
    );
});
StatsBar.displayName = 'StatsBar';

/**
 * FilterSidebar - Slide-in filter panel
 */
const FilterSidebar = React.memo(({ 
    visible, 
    onHide, 
    filters, 
    facilities, 
    shifts, 
    onFilterChange, 
    onSearch,
    isLoading 
}) => {
    const tripTypes = [
        { label: 'Pick', value: 'P' },
        { label: 'Drop', value: 'D' }
    ];

    const handleSearch = () => {
        onSearch();
        onHide();
    };

    return (
        <MasterSidebar 
            show={visible} 
            onClose={onHide} 
            title="Filters"
            width="320px"
            backdrop="dynamic"
            footerButtons={[
                {
                    label: 'Cancel',
                    className: 'btn btn-outline-secondary',
                    onClick: onHide
                },
                {
                    label: isLoading ? 'Searching...' : 'Search Routes',
                    icon: isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-search',
                    className: 'btn btn-success',
                    onClick: handleSearch,
                    disabled: !filters.facilityId || !filters.shifts || isLoading
                }
            ]}
        >
            <div className="d-flex flex-column gap-3 p-3">
                {/* Facility */}
                <div>
                    <label className="form-label small fw-semibold text-muted mb-1">Facility</label>
                    <Dropdown
                        value={filters.facilityId}
                        options={facilities}
                        onChange={(e) => onFilterChange('facilityId', e.value)}
                        placeholder="Select Facility"
                        className="w-100"
                        filter
                        showClear
                    />
                </div>

                {/* Trip Type - Compact pill buttons */}
                <div>
                    <label className="form-label small fw-semibold text-muted mb-1">Trip Type</label>
                    <div className="d-flex gap-2">
                        {tripTypes.map(t => (
                            <button
                                key={t.value}
                                type="button"
                                className={`btn btn-sm flex-grow-1 d-flex align-items-center justify-content-center ${
                                    filters.tripType === t.value 
                                        ? 'btn-primary' 
                                        : 'btn-outline-secondary'
                                }`}
                                style={{ 
                                    borderRadius: '20px',
                                    padding: '6px 16px',
                                    fontSize: '0.85rem',
                                    fontWeight: 500
                                }}
                                onClick={() => onFilterChange('tripType', t.value)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shift - Single select Dropdown (not MultiSelect) */}
                <div>
                    <label className="form-label small fw-semibold text-muted mb-1">Shift</label>
                    <Dropdown
                        value={filters.shifts}
                        options={shifts}
                        onChange={(e) => onFilterChange('shifts', e.value)}
                        placeholder="Select Shift"
                        className="w-100"
                        filter
                    />
                </div>

                {/* Date - with custom calendar wrapper matching desktop */}
                <div>
                    <label className="form-label small fw-semibold text-muted mb-1">Date</label>
                    <div className="custom-calendar-wrapper">
                        <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                        <Calendar
                            value={filters.sDate ? new Date(filters.sDate) : null}
                            onChange={(e) => {
                                if (e.value) {
                                    const year = e.value.getFullYear();
                                    const month = String(e.value.getMonth() + 1).padStart(2, '0');
                                    const day = String(e.value.getDate()).padStart(2, '0');
                                    onFilterChange('sDate', `${year}-${month}-${day}`);
                                }
                            }}
                            dateFormat="dd/mm/yy"
                            className="w-100 custom-calendar-input"
                            placeholder="Select Date"
                        />
                    </div>
                </div>
            </div>
        </MasterSidebar>
    );
});
FilterSidebar.displayName = 'FilterSidebar';

/**
 * EmployeeRow - Single employee in expanded route with long-press support
 */
/**
 * EmployeeRow - Draggable employee row for mobile
 */
const EmployeeRow = React.memo(({ employee, routeId, onDelete, isEditable, index }) => {
    // Unique ID for draggable item: specific to this route instance
    // Append index to ensure absolute uniqueness even if data is consistent
    const draggableId = `emp-${routeId}-${employee.empId || employee.EmpID || 'noid'}-${index}`;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useDraggable({
        id: draggableId,
        data: {
            employee,
            sourceRouteId: routeId,
            type: 'employee'
        },
        disabled: !isEditable
    });

    const style = {
        // If dragging, we don't move the original element (it stays as placeholder), 
        // the DragOverlay handles the moving visual.
        // We just fade it out.
        transform: isDragging ? undefined : (transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined),
        background: isDragging ? '#f1f5f9' : '#fff',
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none' // Important for touch dragging
    };

    return (
        <div 
            ref={setNodeRef}
            style={style}
            className="d-flex align-items-center py-3 px-3 border-bottom"
        >
            {/* Drag Handle - Only editable rows can be dragged */}
            {isEditable ? (
                <div 
                    {...listeners} 
                    {...attributes}
                    className="me-3 p-2 text-muted"
                    style={{ cursor: 'grab', touchAction: 'none' }}
                >
                    <i className="pi pi-bars" style={{ fontSize: '1.2rem', color: '#94a3b8' }} />
                </div>
            ) : (
                <div className="me-3 p-2" style={{ width: '40px' }} /> // Spacer
            )}

            {/* Stop Number Indicator */}
            <div 
                className="d-flex align-items-center justify-content-center flex-shrink-0 me-3 shadow-sm"
                style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    border: '1px solid #dbeafe'
                }}
            >
                {employee.stopNo || '-'}
            </div>

            <div className="flex-grow-1 overflow-hidden me-2">
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem', marginBottom: '2px' }}>
                    {employee.empName}
                </div>
                <div className="text-muted text-truncate d-flex align-items-center" style={{ fontSize: '0.75rem' }}>
                    <span className="me-2">{employee.empCode}</span>
                    <span className="text-truncate">• {employee.Location || employee.address || 'N/A'}</span>
                </div>
            </div>
            
            {isEditable && (
                <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    className="flex-shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(employee, routeId);
                    }}
                    style={{ width: '36px', height: '36px' }}
                />
            )}
        </div>
    );
});
EmployeeRow.displayName = 'EmployeeRow';

/**
 * RouteEmployeeList - Fetches and displays employees for a route
 */
/**
 * DropZoneIndicator - Visual target for precise dropping
 */
const DropZoneIndicator = React.memo(({ routeId, position }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `dropzone-${routeId}-${position}`,
        data: {
            targetRouteId: routeId,
            targetPosition: position,
            type: 'position'
        }
    });

    const style = {
        height: isOver ? '40px' : '12px',
        backgroundColor: isOver ? '#e3f2fd' : 'transparent',
        border: isOver ? '2px dashed #2196F3' : '1px dashed transparent',
        borderRadius: '4px',
        margin: '2px 0',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: '#2196F3',
        fontWeight: 'bold',
    };

    return (
        <div ref={setNodeRef} style={style}>
            {isOver && `Drop at position ${position}`}
        </div>
    );
});
DropZoneIndicator.displayName = 'DropZoneIndicator';

/**
 * RouteEmployeeList - Fetches and displays employees for a route
 */
const RouteEmployeeList = React.memo(({ routeId, onDeleteEmployee, isEditable, onLongPress, activeDragId }) => {
    const { data: employees = [], isLoading, isError } = useRouteDetailsQuery(routeId);

    if (isLoading) {
        return (
            <div className="text-center py-3">
                <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-3 text-danger">
                <i className="pi pi-exclamation-triangle me-2" />
                Failed to load employees
            </div>
        );
    }

    if (employees.length === 0) {
        return (
            <div>
                 {/* Zone 1 for empty route */}
                 {isEditable && (
                    <DropZoneIndicator 
                        routeId={routeId} 
                        position={1} 
                    />
                )}
                <div className="text-center py-3 text-muted" style={{ fontSize: '0.85rem' }}>
                    <i className="pi pi-inbox me-2" />
                    No employees in this route
                </div>
            </div>
        );
    }

    return (
        <div>
             {/* Zone 1 */}
             {isEditable && (
                <DropZoneIndicator routeId={routeId} position={1} />
            )}
            
            {employees.map((emp, idx) => (
                <React.Fragment key={emp.id || emp.empID || idx}>
                    <EmployeeRow
                        employee={emp}
                        routeId={routeId}
                        onDelete={onDeleteEmployee}
                        isEditable={isEditable}
                        onLongPress={onLongPress}
                        index={idx}
                    />
                    {/* Zone after employee */}
                    {isEditable && (
                        <DropZoneIndicator routeId={routeId} position={idx + 2} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
});
RouteEmployeeList.displayName = 'RouteEmployeeList';

/**
 * RouteCard - Bottom-sheet style expandable card (Uber/Ola inspired)
 */
const RouteCard = React.memo(({ 
    route, 
    isExpanded, 
    onToggleExpand, 
    onDeleteEmployee,
    onViewMap,
    onAssignEmployees,
    onRecalculate,
    isRecalculating,

    onEmployeeLongPress,
    activeDragId
}) => {
    const isFinalized = route.IsRouteGenerated === 1 || !!route.isRouteFinalized;
    // Drop target for the route
    const { setNodeRef, isOver } = useDroppable({
        id: `route-${route.RouteID}`,
        data: {
            routeId: route.RouteID,
            type: 'route'
        },
        disabled: isFinalized
    });
    const tripLabel = route.TripType === 'P' ? 'Pick' : 'Drop';
    
    // Employee count = totalStop (each stop = 1 employee typically)
    const empCount = route.totalStop || 0;
    const stopCount = route.totalStop || 0;
    const distKm = route.totaldist ? parseFloat(route.totaldist).toFixed(1) : '0';
    
    return (
        <div 
            ref={setNodeRef}
            className="bg-white rounded-3 overflow-hidden mb-3"
            style={{ 
                border: isOver ? '2px dashed #3b82f6' : '1px solid #e5e7eb',
                boxShadow: isExpanded ? '0 8px 25px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.25s ease',
                background: isOver ? '#eff6ff' : '#fff'
            }}
        >
            {/* Collapsed Header - Entire area clickable */}
            <div 
                className="px-3 py-3"
                onClick={() => onToggleExpand(route.RouteID)}
                style={{ 
                    cursor: 'pointer',
                    background: isExpanded ? '#f8fafc' : '#fff'
                }}
            >
                {/* Top Row: RouteID + Chevron */}
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold" style={{ fontSize: '1rem', color: '#1e293b' }}>
                            {route.RouteID}
                        </span>
                        {isFinalized && (
                            <span 
                                className="badge"
                                style={{ 
                                    background: '#dcfce7', 
                                    color: '#15803d',
                                    fontSize: '0.65rem',
                                    fontWeight: 500,
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                }}
                            >
                                Locked
                            </span>
                        )}
                    </div>
                    <i 
                        className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'}`}
                        style={{ 
                            fontSize: '1rem', 
                            color: '#94a3b8',
                            transition: 'transform 0.2s ease'
                        }}
                    />
                </div>
                
                {/* Subtitle: Trip Type + Location */}
                <div 
                    className="text-truncate mb-2" 
                    style={{ fontSize: '0.82rem', color: '#64748b' }}
                >
                    {tripLabel} • {route.shiftTime || 'N/A'} • {route.Location || 'Unknown Location'}
                </div>
                
                {/* Stats Row: emp • stops • km */}
                <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    <span>{empCount} emp</span>
                    <span>•</span>
                    <span>{stopCount} stops</span>
                    <span>•</span>
                    <span>{distKm} km</span>
                </div>
            </div>

            {/* Expanded Bottom-Sheet Section */}
            {isExpanded && (
                <div 
                    style={{ 
                        borderTop: '1px solid #e5e7eb',
                        animation: 'slideDown 0.2s ease-out'
                    }}
                >
                    {/* Route Details with Emoji Icons */}
                    <div className="px-3 py-3" style={{ background: '#fafbfc' }}>
                        <div className="d-flex flex-column gap-2" style={{ fontSize: '0.88rem' }}>
                            <div className="d-flex align-items-center gap-2">
                                <span style={{ width: '20px', textAlign: 'center' }}>📍</span>
                                <span className="text-muted">Stops:</span>
                                <span className="fw-semibold">{stopCount}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <span style={{ width: '20px', textAlign: 'center' }}>👥</span>
                                <span className="text-muted">Employees:</span>
                                <span className="fw-semibold">{empCount}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <span style={{ width: '20px', textAlign: 'center' }}>🚗</span>
                                <span className="text-muted">Distance:</span>
                                <span className="fw-semibold">{distKm} km</span>
                            </div>
                            {route.vendorname && (
                                <div className="d-flex align-items-center gap-2">
                                    <span style={{ width: '20px', textAlign: 'center' }}>🏢</span>
                                    <span className="text-muted">Vendor:</span>
                                    <span className="fw-semibold">{route.vendorname}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons - Uber/Ola style */}
                    <div 
                        className="px-3 py-3"
                        style={{ 
                            borderTop: '1px solid #e5e7eb',
                            background: '#fff',
                            display: 'grid',
                            gridTemplateColumns: isFinalized ? '1fr' : '1fr 1fr',
                            gap: '12px'
                        }}
                    >
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            style={{ 
                                borderRadius: '12px',
                                padding: '12px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                border: '1.5px solid #3b82f6',
                                gridColumn: isFinalized ? 'span 1' : 'span 2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewMap?.(route);
                            }}
                        >
                            <i className="pi pi-map me-2" style={{ fontSize: '1rem' }} />
                            View Map
                        </button>
                        {!isFinalized && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ 
                                        borderRadius: '12px',
                                        padding: '12px',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        background: '#3b82f6',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAssignEmployees?.(route);
                                    }}
                                >
                                    <i className="pi pi-user-plus me-2" style={{ fontSize: '1rem' }} />
                                    Assign
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-success"
                                    style={{ 
                                        borderRadius: '12px',
                                        padding: '12px',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        border: '1.5px solid #22c55e',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRecalculate?.(route);
                                    }}
                                    disabled={isRecalculating}
                                >
                                    <i className={`pi ${isRecalculating ? 'pi-spin pi-spinner' : 'pi-refresh'} me-2`} style={{ fontSize: '1rem' }} />
                                    {isRecalculating ? '...' : 'Recalculate'}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Employee List */}
                    <div style={{ borderTop: '1px solid #e5e7eb' }}>
                        <div 
                            className="px-3 py-2 d-flex align-items-center justify-content-between"
                            style={{ background: '#f1f5f9' }}
                        >
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                                EMPLOYEES
                            </span>
                            <span 
                                className="badge"
                                style={{ 
                                    background: '#e2e8f0', 
                                    color: '#475569',
                                    fontSize: '0.7rem',
                                    padding: '3px 8px',
                                    borderRadius: '10px'
                                }}
                            >
                                {empCount}
                            </span>
                        </div>
                        <RouteEmployeeList 
                            routeId={route.RouteID} 
                            onDeleteEmployee={onDeleteEmployee}
                            isEditable={!isFinalized}
                            onLongPress={onEmployeeLongPress}
                            activeDragId={activeDragId}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});
RouteCard.displayName = 'RouteCard';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ManageRouteMobile
 * 
 * Mobile view for the Manage Route page.
 * Follows the Container/Presenter pattern - receives all data as props.
 */
const ManageRouteMobile = ({
    // Data
    routes = [],
    facilities = [],
    shifts = [],
    stats = [],
    isLoading = false,
    
    // Filters
    filters = {},
    onFilterChange,
    onSearch,
    
    // Actions
    onDeleteEmployee,
    
    // Full logic object (for advanced operations)
    logic
}) => {
    // Local State
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);
    const [expandedRoutes, setExpandedRoutes] = useState(new Set());
    const [deleteDialog, setDeleteDialog] = useState({ visible: false, employee: null, routeId: null });
    
    // View Map (Offcanvas) State
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [selectedRouteId, setSelectedRouteId] = useState(null);
    
    // Recalculate State
    const [recalculatingRouteId, setRecalculatingRouteId] = useState(null);
    
    // Add Employee Modal State
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [targetRouteForAssign, setTargetRouteForAssign] = useState(null);
    

    
    // Drag and Drop Logic
    const [activeDragId, setActiveDragId] = useState(null);
    const [draggedItem, setDraggedItem] = useState(null);
    const [pendingDragOperation, setPendingDragOperation] = useState(null);
    
    // Action Buttons State
    const [isRouteSelectMode, setIsRouteSelectMode] = useState(false);
    const [selectedRoutes, setSelectedRoutes] = useState(new Set());
    const [routeSelectionOrder, setRouteSelectionOrder] = useState([]);
    const [isUnlockMode, setIsUnlockMode] = useState(false);
    const [routesToUnlock, setRoutesToUnlock] = useState(new Set());
    const [showUnlockConfirmDialog, setShowUnlockConfirmDialog] = useState(false);
    const [pendingUnlock, setPendingUnlock] = useState(null);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [isAllocating, setIsAllocating] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [showRecalcBeforeFinalizeDialog, setShowRecalcBeforeFinalizeDialog] = useState(false);
    const [isRecalcBeforeFinalize, setIsRecalcBeforeFinalize] = useState(false);
    const [showAutoVendorAllocationDialog, setShowAutoVendorAllocationDialog] = useState(false);
    const [isShiftLocked, setIsShiftLocked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Configure sensors
    const sensors = useSensors(
        useSensor(TouchSensor, {
            // Press delay of 100ms, tolerance of 5px of movement
            activationConstraint: {
                delay: 100,
                tolerance: 5,
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    );


    const toast = useRef(null);
    const queryClient = useQueryClient();
    const userID = sessionStorage.getItem('ID');

    // Effect for checking if shift is locked
    useEffect(() => {
        if (routes && routes.length > 0) {
            const hasFinalizedRoutes = routes.some((route) => route.isRouteFinalized === 1);
            setIsShiftLocked(hasFinalizedRoutes);

            if (!hasFinalizedRoutes && isUnlockMode) {
                setIsUnlockMode(false);
                setRoutesToUnlock(new Set());
            }
        } else {
            setIsShiftLocked(false);
        }
    }, [routes, isUnlockMode]);

    // Handlers
    const handleClearRouteSelection = useCallback(() => {
        setSelectedRoutes(new Set());
        setRouteSelectionOrder([]);
        setIsRouteSelectMode(false);
    }, []);

    const handleUnlockShift = useCallback(() => {
        const finalizedRoutes = routes
            .filter((route) => route.isRouteFinalized === 1)
            .map((route) => route.RouteID);

        if (finalizedRoutes.length === 0) {
            toastService.info("No finalized routes to unlock in this shift.");
            return;
        }

        setPendingUnlock({
            routeIds: finalizedRoutes,
            type: "shift",
        });
        setShowUnlockConfirmDialog(true);
    }, [routes]);

    const handleUnlockSelectedRoutes = useCallback(() => {
        if (routesToUnlock.size === 0) {
            toastService.warn("Please select routes to unlock.");
            return;
        }
        setPendingUnlock({
            routeIds: Array.from(routesToUnlock),
            type: "routes",
        });
        setShowUnlockConfirmDialog(true);
    }, [routesToUnlock]);

    const confirmUnlockOperation = useCallback(async () => {
        if (!pendingUnlock) return;

        setIsSubmitting(true);
        setShowUnlockConfirmDialog(false);

        try {
            const response = await ManageRouteService.BlockTransport({
                RouteIDs: pendingUnlock.routeIds.join(","),
                userid: userID,
            });

            const parsedResponse =
                typeof response === "string" ? JSON.parse(response) : response;
            if (parsedResponse && parsedResponse.length > 0 && parsedResponse[0].res) {
                toastService.success(parsedResponse[0].res);
            } else {
                toastService.success("Routes unlocked successfully!");
            }

            setRoutesToUnlock(new Set());
            setIsUnlockMode(false);
            if(onSearch) await onSearch(); // Refresh the list
        } catch (error) {
            console.error("Error unlocking routes:", error);
            toastService.error("Failed to unlock routes.");
        } finally {
            setIsSubmitting(false);
            setPendingUnlock(null);
        }
    }, [pendingUnlock, userID, onSearch]);

    const checkIfRecalculationNeeded = useCallback(async () => {
        try {
            const inputJsonResponse = await ManageRouteService.GetInputJsonRecalculate({
                shiftdate: filters.sDate,
                shifttime: filters.shifts,
                facilityid: filters.facilityId,
                triptype: filters.tripType,
            });

            const inputJsonData =
                typeof inputJsonResponse === "string"
                    ? JSON.parse(inputJsonResponse)
                    : inputJsonResponse;

            return !!(
                inputJsonData &&
                inputJsonData.routes &&
                inputJsonData.routes.length > 0
            );
        } catch (error) {
            console.error("Error checking recalculation status:", error);
            return true;
        }
    }, [filters]);

    const proceedWithFinalization = useCallback(async () => {
        setIsSubmitting(true);
        setIsFinalizing(true);
        try {
            const params = {
                sDate: filters.sDate,
                eDate: filters.sDate,
                facilityid: filters.facilityId,
                triptype: filters.tripType,
                shifttimes: filters.shifts,
            };

            const bulkRouteData = await ManageRouteService.PushRouteToDashbaord(params);

            if (bulkRouteData && bulkRouteData.length > 0) {
                toastService.success("Route finalization completed successfully.");
                if(onSearch) await onSearch();
            } else {
                toastService.warn("No route data available to finalize.");
            }
        } catch (error) {
            console.error("Error finalizing routes:", error);
            toastService.error("Finalization failed. Please try again.");
        } finally {
            setIsFinalizing(false);
            setIsSubmitting(false);
        }
    }, [filters, onSearch]);

    const handleFinalizeRoute = useCallback(async () => {
        const needsRecalculation = await checkIfRecalculationNeeded();
        if (needsRecalculation) {
            setShowRecalcBeforeFinalizeDialog(true);
            return;
        }
        await proceedWithFinalization();
    }, [checkIfRecalculationNeeded, proceedWithFinalization]);

    const handleRecalculateAndFinalize = useCallback(async () => {
        setIsRecalcBeforeFinalize(true);
        setShowRecalcBeforeFinalizeDialog(false);

        try {
            toastService.info("Recalculating routes before finalization...");

            const inputJsonResponse = await ManageRouteService.GetInputJsonRecalculate({
                shiftdate: filters.sDate,
                shifttime: filters.shifts,
                facilityid: filters.facilityId,
                triptype: filters.tripType,
            });

            const inputJsonData =
                typeof inputJsonResponse === "string"
                    ? JSON.parse(inputJsonResponse)
                    : inputJsonResponse;

            if (!inputJsonData || !inputJsonData.routes || inputJsonData.routes.length === 0) {
                toastService.info("No routes need recalculation. Proceeding with finalization...");
                await proceedWithFinalization();
                return;
            }

            const recalculatedRouteJson = await ManageRouteService.recalculateRoutes(inputJsonData);

            await ManageRouteService.updateRouteMapbased({
                facilityid: filters.facilityId,
                sDate: filters.sDate,
                triptype: filters.tripType,
                shifttime: filters.shifts,
                jsonstring: JSON.stringify(recalculatedRouteJson),
                updatedBy: userID,
            });

            toastService.success("Routes recalculated successfully! Now finalizing...");
            if(onSearch) await onSearch();
            await proceedWithFinalization();
        } catch (error) {
            console.error("Error during recalculation before finalize:", error);
            toastService.error(`Failed to recalculate routes: ${error.message}`);
        } finally {
            setIsRecalcBeforeFinalize(false);
        }
    }, [filters, userID, onSearch, proceedWithFinalization]);

    const handleAutoVendorAllocation = useCallback(() => {
        setShowAutoVendorAllocationDialog(true);
    }, []);

    const confirmAutoVendorAllocation = useCallback(async () => {
        setIsSubmitting(true);
        setIsAllocating(true);
        try {
            setShowAutoVendorAllocationDialog(false);

            const params = {
                facid: filters.facilityId,
                sDate: filters.sDate,
                uname: userID,
                triptype: filters.tripType,
                shifttime: filters.shifts,
            };

            await ManageRouteService.AutoVendorAllocationNew(params);
            toastService.success("Vendor allocation process completed successfully.");
            if(onSearch) await onSearch();
        } catch (error) {
            console.error("Error during auto vendor allocation:", error);
            toastService.error("Vendor allocation process failed to complete.");
        } finally {
            setIsSubmitting(false);
            setIsAllocating(false);
        }
    }, [filters, userID, onSearch]);

    const handleRecalculateModifiedRoutes = useCallback(async () => {
        setIsSubmitting(true);
        setIsRecalculating(true);
        toastService.info("Fetching data for all modified routes...");

        try {
            const inputJsonResponse = await ManageRouteService.GetInputJsonRecalculate({
                shiftdate: filters.sDate,
                shifttime: filters.shifts,
                facilityid: filters.facilityId,
                triptype: filters.tripType,
            });

            const inputJsonData =
                typeof inputJsonResponse === "string"
                    ? JSON.parse(inputJsonResponse)
                    : inputJsonResponse;

            if (!inputJsonData || !inputJsonData.routes || inputJsonData.routes.length === 0) {
                toastService.info("No routes to be recalculated.");
                setIsSubmitting(false);
                setIsRecalculating(false);
                return;
            }

            toastService.info("Sending data for recalculation...");

            const recalculatedRouteJson = await ManageRouteService.recalculateRoutes(inputJsonData);
            await ManageRouteService.updateRouteMapbased({
                facilityid: filters.facilityId,
                sDate: filters.sDate,
                triptype: filters.tripType,
                shifttime: filters.shifts,
                jsonstring: JSON.stringify(recalculatedRouteJson),
                updatedBy: userID,
            });

            toastService.success("Modified routes recalculated successfully!");
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.routes(filters) });
            if(onSearch) await onSearch();
        } catch (error) {
            console.error("Error recalculating routes:", error);
            toastService.error(`Recalculation failed: ${error.message}`);
        } finally {
            setIsRecalculating(false);
            setIsSubmitting(false);
        }
    }, [filters, userID, queryClient, onSearch]);

    // Original Handlers
    const handleToggleExpand = useCallback((routeId) => {
        setExpandedRoutes(prev => {
            const next = new Set(prev);
            if (next.has(routeId)) {
                next.delete(routeId);
            } else {
                next.add(routeId);
            }
            return next;
        });
    }, []);

    const handleDeleteRequest = useCallback((employee, routeId) => {
        setDeleteDialog({ visible: true, employee, routeId });
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        const { employee, routeId } = deleteDialog;
        if (!employee || !routeId) return;

        try {
            const response = await ManageRouteService.DeleteEmployeeFromRoute({
                sDate: filters.sDate,
                FacilityID: filters.facilityId,
                TripType: filters.tripType,
                Shifttimes: filters.shifts,
                RouteID: routeId,
                EmpID: employee.id || employee.empID,
                uname: userID,
            });

            let parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
            if (Array.isArray(parsedResponse)) parsedResponse = parsedResponse[0];

            if (parsedResponse?.RESULT === 1) {
                toastService.success(`Employee ${employee.empName} removed from route`);
                
                // Invalidate queries to refresh data
                await queryClient.invalidateQueries({ queryKey: manageRouteKeys.routeDetails(routeId) });
                await queryClient.invalidateQueries({ queryKey: ['manageRoute', 'routes'] });
                await queryClient.invalidateQueries({ queryKey: ['manageRoute', 'statistics'] });
            } else {
                toastService.error('Failed to remove employee');
            }
        } catch (error) {
            console.error('Delete employee error:', error);
            toastService.error('An error occurred');
        } finally {
            setDeleteDialog({ visible: false, employee: null, routeId: null });
        }
    }, [deleteDialog, filters, userID, queryClient]);

    // Route card template for MobileCardList
    const handleViewMap = useCallback((route) => {
        setSelectedRouteId(route.RouteID);
        setShowOffcanvas(true);
    }, []);

    const handleAssignEmployees = useCallback((route) => {
        // Open AddEmployee modal for this route
        setTargetRouteForAssign(route);
        setShowAddEmployeeModal(true);
    }, []);

    // Handle successful employee addition
    const handleEmployeeAdded = useCallback(() => {
        // Refresh route data
        queryClient.invalidateQueries({ queryKey: ['routes'] });
        queryClient.invalidateQueries({ queryKey: ['routeDetails', targetRouteForAssign?.RouteID] });
    }, [queryClient, targetRouteForAssign]);

    // Recalculate route handler
    const handleRecalculate = useCallback(async (route) => {
        if (recalculatingRouteId) return; // Prevent multiple simultaneous recalculations
        
        setRecalculatingRouteId(route.RouteID);
        try {
            // Get recalculation input JSON using RouteID directly
            const inputJson = await ManageRouteService.getInputJsonByrouteids({
                routeids: route.RouteID
            });

            // Parse and call recalculate
            let parsedInput = typeof inputJson === 'string' ? JSON.parse(inputJson) : inputJson;
            if (typeof parsedInput === 'string') parsedInput = JSON.parse(parsedInput);

            // Call recalculate API
            const recalculatedRouteJson = await ManageRouteService.recalculateRoutes(parsedInput);
            
            // Save recalculated ETAs back to backend
            await ManageRouteService.updateRouteMapbased({
                facilityid: filters.facilityId,
                sDate: filters.sDate,
                triptype: filters.tripType,
                shifttime: route.shiftTime || filters.shifts,
                jsonstring: JSON.stringify(recalculatedRouteJson),
                updatedBy: userID,
            });

            // Refresh routes data
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.routes(filters) });
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.routeDetails(route.RouteID) });
            
            toastService.success(`Route ${route.RouteID} recalculated successfully!`);
        } catch (error) {
            console.error('Recalculate error:', error);
            toastService.error(`Failed to recalculate route: ${error.message}`);
        } finally {
            setRecalculatingRouteId(null);
        }
    }, [recalculatingRouteId, filters, queryClient, userID]);

    // Handle employee long-press for move/remove actions
    const handleEmployeeLongPress = useCallback((employee, routeId) => {
        setActionSheetEmployee(employee);
        setActionSheetRouteId(routeId);
        setShowActionSheet(true);
    }, []);

    // Handle action sheet success (move/remove)
    const handleActionSheetSuccess = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: manageRouteKeys.all });
    }, [queryClient]);

    const routeItemTemplate = useCallback((route) => (
        <RouteCard
            route={route}
            isExpanded={expandedRoutes.has(route.RouteID)}
            onToggleExpand={handleToggleExpand}
            onDeleteEmployee={handleDeleteRequest}
            onViewMap={handleViewMap}
            onAssignEmployees={handleAssignEmployees}
            onRecalculate={handleRecalculate}
            isRecalculating={recalculatingRouteId === route.RouteID}
            onEmployeeLongPress={handleEmployeeLongPress}
            activeDragId={activeDragId} // Pass activeDragId
        />
    ), [expandedRoutes, handleToggleExpand, handleDeleteRequest, handleViewMap, handleAssignEmployees, handleRecalculate, recalculatingRouteId, handleEmployeeLongPress, activeDragId]);

    // Handle Drag End with Confirmation
    const handleDragEnd = useCallback(async (event) => {
        const { active, over } = event;
        setActiveDragId(null);
        setDraggedItem(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || !overData) return;

        if (activeData.type === 'employee' && (overData.type === 'route' || overData.type === 'position')) {
            const employee = activeData.employee;
            const sourceRouteId = activeData.sourceRouteId;
            // Determine target route and position
            let targetRouteId, targetPosition;
            if (overData.type === 'route') {
                 targetRouteId = overData.routeId;
                 targetPosition = 0; 
            } else {
                 targetRouteId = overData.targetRouteId;
                 targetPosition = overData.targetPosition;
            }

            // Don't do anything if dropped on same route AND same position
            if (sourceRouteId === targetRouteId && activeData.employee.stopNo === targetPosition) return;
            
            // Set pending operation for confirmation
            setPendingDragOperation({
                employee,
                sourceRouteId,
                targetRouteId,
                targetPosition
            });
        }
    }, []);

    const handleConfirmDrag = useCallback(async () => {
        if (!pendingDragOperation) return;
        
        const { employee, sourceRouteId, targetRouteId, targetPosition } = pendingDragOperation;
        setPendingDragOperation(null); // Close dialog

        try {
            const sNo = employee.stopNo || 0; 
            const empid = employee.empId || employee.EmpID || employee.id;

            await ManageRouteService.UpdateCutPaste({
                oldemployeeid: empid,
                OldRouteid: sourceRouteId,
                newrouteid: targetRouteId,
                stopno: targetPosition,
                userid: userID
            });

            toastService.success(`Moved ${employee.empName} to Route ${targetRouteId} at pos ${targetPosition}`);
            
            // Refresh data correctly using query factory manager
            queryClient.invalidateQueries({ queryKey: manageRouteKeys.all });

        } catch (error) {
            console.error('Drag end error:', error);
            toastService.error('Failed to move employee');
        }
    }, [pendingDragOperation, queryClient, userID]);

    const handleCancelDrag = useCallback(() => {
        setPendingDragOperation(null);
    }, []);

    const handleDragStart = useCallback((event) => {
        setActiveDragId(event.active.id);
        setDraggedItem(event.active.data.current?.employee);
        // Vibrate on start
        if (navigator.vibrate) navigator.vibrate(50);
    }, []);

    // Handle Drag Over - Auto Expand Logic
    const handleDragOver = useCallback((event) => {
        const { over } = event;
        if (!over) return;

        const overData = over.data.current;
        
        // If hovering over a route card (not inside it, but the card itself or its drop zone)
        if (overData && (overData.type === 'route' || overData.type === 'position')) {
            const targetRouteId = overData.type === 'route' ? overData.routeId : overData.targetRouteId;
            
            // If we have a target route and it's not expanded, expand it
            if (targetRouteId) {
                setExpandedRoutes(prev => {
                    // Only update if not already expanded to avoid infinite re-renders/flicker
                    if (!prev.has(targetRouteId)) {
                        const next = new Set(prev);
                        next.add(targetRouteId);
                        return next;
                    }
                    return prev;
                });
            }
        }
    }, []);

    // Check if search criteria is set
    const hasSearchCriteria = filters.facilityId && filters.shifts;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <>
                <Header
                    mainTitle="Transport"
                    pageTitle="Manage Route"
                    showNewButton={false}
                />
                
                <div style={{ paddingBottom: '80px' }}> {/* Bottom padding for floating elements */}
            <Sidebar />
            <ToastContainer position="top-right" autoClose={3000} />
            <Toast ref={toast} position="top-center" />
            
            <div className="middle">
                {/* Mobile Filter Bar */}
                <div className="card_tb p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 className="mb-1 fw-bold">Manage Routes</h6>
                            <small className="text-muted">{filters.sDate || 'Select date'}</small>
                        </div>
                        <Button
                            className="p-button-outlined p-button-sm d-flex align-items-center gap-2"
                            style={{ borderRadius: '8px', color: '#64748b', borderColor: '#e2e8f0' }}
                            onClick={() => setShowFilterSidebar(true)}
                        >
                            <i className="pi pi-filter" />
                            <span>Filters</span>
                            {hasSearchCriteria && (
                                <span 
                                    className="d-flex align-items-center justify-content-center text-white"
                                    style={{ 
                                        background: '#ef4444', // Red-500
                                        borderRadius: '12px',
                                        padding: '0 8px',
                                        height: '20px',
                                        minWidth: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        marginLeft: '4px'
                                    }}
                                >
                                    {routes.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Stats Bar */}
                {routes.length > 0 && <StatsBar stats={stats} />}

                {/* Mobile Action Bar */}
                {routes.length > 0 && (
                    <div className="px-3 py-2 bg-white border-bottom shadow-sm">
                        <div 
                            className="d-flex gap-2 overflow-auto" 
                            style={{ 
                                paddingBottom: '8px', 
                                scrollbarWidth: 'none', 
                                msOverflowStyle: 'none' 
                            }}
                        >
                            <Button
                                label="Merge Mode"
                                icon="pi pi-share-alt"
                                className={`p-button-sm rounded-pill flex-shrink-0 ${isRouteSelectMode ? 'p-button-warning' : 'p-button-outlined p-button-secondary'}`}
                                onClick={() => {
                                    setIsRouteSelectMode(!isRouteSelectMode);
                                    if (isRouteSelectMode) handleClearRouteSelection();
                                    setIsUnlockMode(false);
                                }}
                            />

                            {(() => {
                                const isDateCurrentOrFuture = (() => {
                                    if (!filters.sDate) return false;
                                    const searchDate = new Date(filters.sDate);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (isNaN(searchDate.getTime())) return false;
                                    return searchDate >= today;
                                })();

                                if (isShiftLocked && isDateCurrentOrFuture) {
                                    return (
                                        <>
                                            <Button
                                                label="Unlock Shift"
                                                icon="pi pi-lock-open"
                                                className="p-button-sm p-button-danger rounded-pill flex-shrink-0"
                                                onClick={handleUnlockShift}
                                            />
                                            <Button
                                                label={isUnlockMode ? "Cancel Unlock" : "Unlock Routes"}
                                                icon="pi pi-key"
                                                className="p-button-sm p-button-danger rounded-pill flex-shrink-0"
                                                onClick={() => {
                                                    setIsUnlockMode(!isUnlockMode);
                                                    if (isUnlockMode) setRoutesToUnlock(new Set());
                                                    setIsRouteSelectMode(false);
                                                }}
                                            />
                                            {isUnlockMode && routesToUnlock.size > 0 && (
                                                <Button
                                                    label={`Confirm (${routesToUnlock.size})`}
                                                    icon="pi pi-check"
                                                    className="p-button-sm p-button-success rounded-pill flex-shrink-0"
                                                    onClick={handleUnlockSelectedRoutes}
                                                />
                                            )}
                                        </>
                                    );
                                }
                                return null;
                            })()}

                            <Button
                                label={isRecalculating ? "Recalculating..." : "Recalculate"}
                                icon={isRecalculating ? "pi pi-spin pi-spinner" : "pi pi-sync"}
                                className="p-button-sm p-button-warning rounded-pill flex-shrink-0"
                                onClick={handleRecalculateModifiedRoutes}
                                disabled={isRecalculating || isSubmitting}
                            />

                            <Button
                                label={isAllocating ? "Allocating..." : "Auto Vendor"}
                                icon={isAllocating ? "pi pi-spin pi-spinner" : "pi pi-cog"}
                                className="p-button-sm p-button-info rounded-pill flex-shrink-0"
                                onClick={handleAutoVendorAllocation}
                                disabled={isAllocating || isSubmitting}
                            />

                            <Button
                                label={
                                    isRecalcBeforeFinalize ? "Wait..." : 
                                    isFinalizing ? "Finalizing..." : "Finalize"
                                }
                                icon={
                                    isRecalcBeforeFinalize || isFinalizing ? "pi pi-spin pi-spinner" : "pi pi-check"
                                }
                                className="p-button-sm p-button-success rounded-pill flex-shrink-0"
                                onClick={handleFinalizeRoute}
                                disabled={isFinalizing || isRecalcBeforeFinalize || isSubmitting}
                            />
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="mt-3">
                    {!hasSearchCriteria ? (
                        // No search criteria - show prompt
                        <div className="text-center p-5 bg-white rounded-3 shadow-sm">
                            <i className="pi pi-filter text-muted mb-3" style={{ fontSize: '3rem' }} />
                            <h6 className="text-muted">Set Filters to Search</h6>
                            <p className="text-muted small mb-4">
                                Tap the Filters button to select facility, shifts, and date.
                            </p>
                            <Button
                                label="Open Filters"
                                icon="pi pi-filter"
                                outlined
                                onClick={() => setShowFilterSidebar(true)}
                            />
                        </div>
                    ) : routes.length === 0 && !isLoading ? (
                        // Search done but no routes
                        <div className="text-center p-5 bg-white rounded-3 shadow-sm">
                            <i className="pi pi-inbox text-muted mb-3" style={{ fontSize: '3rem' }} />
                            <h6 className="text-muted">No Routes Found</h6>
                            <p className="text-muted small mb-4">
                                No routes found for the selected criteria.
                            </p>
                            <Button
                                label="Modify Filters"
                                icon="pi pi-filter"
                                outlined
                                onClick={() => setShowFilterSidebar(true)}
                            />
                        </div>
                    ) : (
                        // Show routes
                        <MobileCardList
                            data={routes}
                            itemTemplate={routeItemTemplate}
                            isLoading={isLoading}
                            onRefresh={onSearch}
                            emptyMessage="No routes found for the selected criteria"
                            title={`${routes.length} Route${routes.length !== 1 ? 's' : ''}`}
                        />
                    )}
                </div>
            </div>
            </div>

            {/* Filter Sidebar */}
            <FilterSidebar
                visible={showFilterSidebar}
                onHide={() => setShowFilterSidebar(false)}
                filters={filters}
                facilities={facilities}
                shifts={shifts}
                onFilterChange={onFilterChange}
                onSearch={onSearch}
                isLoading={isLoading}
            />

            {/* Route Details Offcanvas (View Map) */}
            <OffcanvasRouteDetails
                show={showOffcanvas}
                onClose={() => setShowOffcanvas(false)}
                routeId={selectedRouteId}
            />

            {/* Add Employee Modal */}
            <AddEmployeeToRouteModal
                visible={showAddEmployeeModal}
                onHide={() => {
                    setShowAddEmployeeModal(false);
                    setTargetRouteForAssign(null);
                }}
                routeId={targetRouteForAssign?.RouteID}
                routeInfo={targetRouteForAssign}
                filters={filters}
                onSuccess={handleEmployeeAdded}
            />



            {/* Delete Confirmation Dialog */}
            <Dialog
                visible={deleteDialog.visible}
                onHide={() => setDeleteDialog({ visible: false, employee: null, routeId: null })}
                header="Confirm Removal"
                footer={
                    <div className="d-flex gap-2">
                        <Button
                            label="Cancel"
                            outlined
                            onClick={() => setDeleteDialog({ visible: false, employee: null, routeId: null })}
                        />
                        <Button
                            label="Remove"
                            severity="danger"
                            onClick={handleConfirmDelete}
                        />
                    </div>
                }
                style={{ width: '90vw', maxWidth: '400px' }}
            >
                <p className="m-0">
                    Are you sure you want to remove <strong>{deleteDialog.employee?.empName}</strong> from route <strong>{deleteDialog.routeId}</strong>?
                </p>
            </Dialog>

            {/* Auto Vendor Confirmation Dialog */}
            <Dialog
                visible={showAutoVendorAllocationDialog}
                onHide={() => setShowAutoVendorAllocationDialog(false)}
                header="Confirm Auto Vendor Allocation"
                footer={
                    <div className="d-flex gap-2 justify-content-end">
                        <Button label="No" outlined onClick={() => setShowAutoVendorAllocationDialog(false)} disabled={isSubmitting} />
                        <Button label="Yes" onClick={confirmAutoVendorAllocation} disabled={isSubmitting} />
                    </div>
                }
                style={{ width: '90vw', maxWidth: '400px' }}
            >
                <div>Are you sure you want to perform Auto Vendor Allocation?</div>
            </Dialog>

            {/* Recalculate Before Finalize Dialog */}
            <Dialog
                visible={showRecalcBeforeFinalizeDialog}
                onHide={() => setShowRecalcBeforeFinalizeDialog(false)}
                header="Finalize Route"
                footer={
                    <div className="d-flex gap-2 justify-content-end mt-3 flex-wrap">
                        <Button label="No, Finalize Directly" outlined onClick={() => {
                            setShowRecalcBeforeFinalizeDialog(false);
                            proceedWithFinalization();
                        }} disabled={isSubmitting} style={{ fontSize: '0.8rem' }} />
                        <Button label="Yes, Recalculate" onClick={handleRecalculateAndFinalize} disabled={isSubmitting} style={{ fontSize: '0.8rem' }} />
                    </div>
                }
                style={{ width: '90vw', maxWidth: '400px' }}
            >
                <div className="mb-3 d-flex align-items-start">
                    <i className="pi pi-exclamation-triangle" style={{ color: 'orange', fontSize: '1.5rem', marginRight: '10px' }}></i>
                    <div>Routes have been modified. It is highly recommended to recalculate routes before finalization to update ETA and distance.</div>
                </div>
                <div>Do you want to recalculate before finalizing?</div>
            </Dialog>

            {/* Unlock Confirmation Dialog */}
            <Dialog
                visible={showUnlockConfirmDialog}
                onHide={() => setShowUnlockConfirmDialog(false)}
                header="Confirm Unlock"
                footer={
                    <div className="d-flex gap-2 justify-content-end">
                        <Button label="Cancel" outlined onClick={() => setShowUnlockConfirmDialog(false)} disabled={isSubmitting} />
                        <Button label="Unlock" severity="danger" onClick={confirmUnlockOperation} disabled={isSubmitting} />
                    </div>
                }
                style={{ width: '90vw', maxWidth: '400px' }}
            >
                <p>Are you sure you want to unlock {pendingUnlock?.type === 'shift' ? 'all finalized routes in this shift' : `${pendingUnlock?.routeIds?.length || 0} selected routes`}?</p>
                <p className="text-muted small">Unlocked routes can be modified and must be finalized again.</p>
            </Dialog>

            {/* Drag Drop Confirmation Dialog */}
            <Dialog
                visible={!!pendingDragOperation}
                onHide={handleCancelDrag}
                header="Confirm Move"
                footer={
                    <div className="d-flex gap-2 justify-content-end">
                        <Button label="Cancel" outlined onClick={handleCancelDrag} />
                        <Button label="Confirm" onClick={handleConfirmDrag} />
                    </div>
                }
                style={{ width: '90vw', maxWidth: '400px' }}
            >
                <div>
                     Are you sure you want to move <strong>{pendingDragOperation?.employee?.empName}</strong> to Route <strong>{pendingDragOperation?.targetRouteId}</strong> at position <strong>{pendingDragOperation?.targetPosition}</strong>?
                </div>
            </Dialog>

             {/* Drag Overlay for Visual Feedback */}
            <DragOverlay dropAnimation={null}>
                {draggedItem ? (
                    <div className="bg-white p-3 rounded-3 shadow-lg border border-primary" style={{ width: '300px' }}>
                        <div className="d-flex align-items-center gap-3">
                             <div 
                                className="d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    fontWeight: '700',
                                    border: '1px solid #dbeafe'
                                }}
                            >
                                {draggedItem?.stopNo || '-'}
                            </div>
                            <div>
                                <div className="fw-bold text-dark">{draggedItem?.empName}</div>
                                <div className="text-muted small">{draggedItem?.empCode}</div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </>
        </DndContext>
    );
};

export default ManageRouteMobile;

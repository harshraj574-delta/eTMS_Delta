import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Header from "../Master/Header";
import Sidebar from "../Master/SidebarMenu";
import MasterSidebar from "../Master/MasterSidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import calendarIcon from "../../assets/calendar.png";
import noReportImage from "../../assets/no_report.png";
import ManageRouteService from "../../services/compliance/ManageRouteService";
import { toastService } from "../../services/toastService";
import OffcanvasRouteDetails from "../OffcanvasRouteDetails";
import { ProgressBar } from "primereact/progressbar";
import { Dialog as PrimeDialog } from "primereact/dialog";
import AppDialog from '../common/AppDialog';
import AppConfirmDialog from '../common/AppConfirmDialog';
import axios from "axios";
import { Tooltip } from "primereact/tooltip";
import { Badge } from "primereact/badge";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import useEmployeeSelection from "./hooks/useEmployeeSelection";
import useUnlockRoutes from "./hooks/useUnlockRoutes";
import useDragDropRoutes from "./hooks/useDragDropRoutes";
import useFinalizeWorkflow from "./hooks/useFinalizeWorkflow";
import useRouteMergeSelection from "./hooks/useRouteMergeSelection";
import sessionManager from "../../utils/SessionManager";
import {
  useRouteJobStatusQuery,
  recalculateModifiedRoutes,
  manageRouteKeys,
  useMoveEmployeeMutation,
  useMergeRouteMutation,
  useSplitRouteMutation,
  useUnlockRoutesMutation,
  useAutoVendorAllocationMutation,
  useDeleteEmployeeMutation,
  useAddEmployeeMutation,
} from "./hooks/useManageRouteQueries";

import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
} from "@dnd-kit/core";
import ReportButton from "../common/ReportButton";
import CustomPaginator from "../common/CustomPaginator";
import FloatingSelectionPanel from "./FloatingSelectionPanel";
import FloatingRouteSelectionPanel from "./FloatingRouteSelectionPanel";
import RouteExpansionDetails from "./RouteExpansionDetails";
import AddressColumnTemplate from "./AddressColumnTemplate";
import "../css/ManageRoute.css";

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (num) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
};

const ManageRouteDesktop = ({
  routes,
  facilities,
  shifts,
  isLoading,
  filters,
  onFilterChange,
  onSearch,
  onDeleteEmployee,
  stats,
  vendorSummary,
  logic
}) => {
  // Constants
  const SWIPE_DELETE_THRESHOLD = 150;
  const userID = sessionManager.getUserSession().ID;
  const queryClient = useQueryClient(); // Initialize Query Client

  // Server mutations — cache invalidation is centralized in these hooks
  const moveEmployeeMutation = useMoveEmployeeMutation();
  const mergeRouteMutation = useMergeRouteMutation();
  const splitRouteMutation = useSplitRouteMutation();
  const unlockRoutesMutation = useUnlockRoutesMutation();
  const autoVendorAllocationMutation = useAutoVendorAllocationMutation();
  const deleteEmployeeMutation = useDeleteEmployeeMutation();
  const addEmployeeMutation = useAddEmployeeMutation();

  // Refs
  const fileInputRef = useRef(null);
  const selectedRouteForSplitRef = useRef(null);
  const prevInProgressJobIdRef = useRef(null);

  // Async route-generation job being polled (null = not polling).
  // useRouteJobStatusQuery refetches every 5s while this is set.
  const [pollingJobId, setPollingJobId] = useState(null);

  // Prop Mappings (Aliasing props to match legacy state names)
  const tableData = routes || [];
  const selectedFacility = filters.facilityId;
  const selectedTripType = filters.tripType;
  const selectedShifts = filters.shifts;
  const shiftDate = filters.sDate; // Map sDate to shiftDate

  // Setter Wrappers (Mapping state setters to onFilterChange)
  const setSelectedFacility = (val) => onFilterChange('facilityId', val);
  const setSelectedTripType = (val) => onFilterChange('tripType', val);
  const setSelectedShifts = (val) => onFilterChange('shifts', val);
  const setShiftDate = (val) => {
      // Handle Date object or string
      const dateStr = val instanceof Date ? val.toISOString().split('T')[0] : val;
      onFilterChange('sDate', dateStr);
  };
  // setTableData, setFacilities, setShifts are removed as they are now derived from props.

  // Core states
  // Sort state removed (mapped to aliases)
  const sortField = filters.orderBy;
  const sortOrder = filters.direction === 'ASC' ? 1 : -1;
  const [expandedRows, setExpandedRows] = useState(null);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  // Facilities, Shifts, Data states removed (come from props)

  // const [routeDetails, setRouteDetails] = useState({}); // Removed for TanStack Query migration
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  // statsDetails state removed (using prop `stats`)
  const statsDetails = stats;
  const [viewMap, setViewMap] = useState(false);
  // const [isLoading, setIsLoading] = useState(false); // Removed, comes from props
  const [showGenerateRouteDialog, setShowGenerateRouteDialog] = useState(false);
  // Initialize based on routes data (in case switching back from mobile view)
  // Derived state for buttons visibility
  const showButtons = routes?.length > 0;
  const [showAutoVendorAllocationDialog, setShowAutoVendorAllocationDialog] = useState(false);
  const [vendorAllocated, setVendorAllocated] = useState(false);
  // vendorSummary state removed (using prop `vendorSummary`)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);

  // Employee selection state + handlers (see useEmployeeSelection)
  const {
    selectedEmployees,
    setSelectedEmployees,
    selectedAction,
    setSelectedAction,
    selectionStartRoute,
    setSelectionStartRoute,
    isSelectionHeld,
    setIsSelectionHeld,
    showFloatingPanel,
    setShowFloatingPanel,
    crossPageDropMode,
    setCrossPageDropMode,
    handleEmployeeSelection,
    handleActionChange,
    handleToggleHold,
    handleClearSelection,
    handleCleanupStaleSelections,
  } = useEmployeeSelection();

  // Route-merge selection state + handlers (see useRouteMergeSelection)
  const {
    selectedRoutes,
    isRouteSelectMode,
    setIsRouteSelectMode,
    showFloatingRoutePanel,
    showRouteMergeDialog,
    setShowRouteMergeDialog,
    pendingMergeOperation,
    setPendingMergeOperation,
    routeSelectionOrder,
    handleClearRouteSelection,
    handleRouteSelectionChange,
    toggleRouteSelectMode,
    handleMergeRoutes,
    cancelMergeOperation,
  } = useRouteMergeSelection();

  // Split operation states (simplified)
  const [showSplitConfirmDialog, setShowSplitConfirmDialog] = useState(false);
  const [pendingSplitOperation, setPendingSplitOperation] = useState(null);

  // Drag and drop states
  const [showDragDropConfirmDialog, setShowDragDropConfirmDialog] = useState(false);
  const [pendingDragOperation, setPendingDragOperation] = useState(null);

  // Employee management states
  const [showDeleteEmployeeDialog, setShowDeleteEmployeeDialog] = useState(false);
  const [pendingDeleteEmployee, setPendingDeleteEmployee] = useState(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedStopNo, setSelectedStopNo] = useState(null);
  const [availableStopNumbers, setAvailableStopNumbers] = useState([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // Bridge drag-and-drop outcomes into the existing confirm dialogs
  const requestDeleteEmployee = useCallback((employee, routeId) => {
    setPendingDeleteEmployee({ employee, routeId });
    setShowDeleteEmployeeDialog(true);
  }, []);

  const requestMoveEmployees = useCallback((operation) => {
    setPendingDragOperation(operation);
    setShowDragDropConfirmDialog(true);
  }, []);

  // Drag-and-drop mechanics (see useDragDropRoutes)
  const {
    activeId,
    draggedEmployee,
    hoveredDropZone,
    hoveredRouteId,
    sensors,
    customCollisionDetection,
    throttledHandleDragOver,
    handleDragStart,
    handleDragEnd,
    handleRouteRowEnter,
    handleRouteRowLeave,
  } = useDragDropRoutes({
    selectedEmployees,
    selectedAction,
    selectionStartRoute,
    setSelectedEmployees,
    setSelectionStartRoute,
    expandedRows,
    setExpandedRows,
    swipeDeleteThreshold: SWIPE_DELETE_THRESHOLD,
    onRequestDelete: requestDeleteEmployee,
    onRequestMove: requestMoveEmployees,
  });

  const [scrolled, setScrolled] = useState(false);

  // Lock/unlock state machine for finalized routes (see useUnlockRoutes)
  const {
    isShiftLocked,
    setIsShiftLocked,
    isUnlockMode,
    setIsUnlockMode,
    routesToUnlock,
    setRoutesToUnlock,
    showUnlockConfirmDialog,
    setShowUnlockConfirmDialog,
    pendingUnlock,
    setPendingUnlock,
    handleSelectRouteToUnlock,
    handleUnlockShift,
    handleUnlockSelectedRoutes,
  } = useUnlockRoutes(tableData);

  // New state for initial no data report
  // Initialize based on routes data (in case switching back from mobile view)
  const hasSearched = logic?.state?.isSearchEnabled ?? (routes?.length > 0);
  // Track the date that was actually searched (for unlock buttons visibility)
  const [searchedShiftDate, setSearchedShiftDate] = useState(routes?.length > 0 ? shiftDate : null);

  // Pagination state
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(50);
  
  const onPageChange = (event) => {
      setFirst(event.first);
      setRows(event.rows);
  };


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Sync state with parent logic
  useEffect(() => {
    if (logic?.state?.ui?.showGenerateDialog !== undefined) {
      setShowGenerateRouteDialog(logic.state.ui.showGenerateDialog);
    }
  }, [logic?.state?.ui?.showGenerateDialog]);

  // Show progress modal whenever the logic hook signals an in-progress job.
  // Triggers both for same-admin resume and cross-admin visibility.
  // Guards against re-triggering for the same jobId.
  useEffect(() => {
    const job = logic?.state?.inProgressJob;
    if (!job?.jobId) return;
    if (job.jobId === prevInProgressJobIdRef.current) return;

    prevInProgressJobIdRef.current = job.jobId;

    setShowProgressDialog(true);
    setProgressStatus({
      step: 0, totalSteps: 4,
      message: job.progressMessage || 'Route generation in progress...',
      progress: job.progressPercent ?? 10,
      isError: false,
      errorMessage: ''
    });

    setPollingJobId(job.jobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logic?.state?.inProgressJob]);

  // Date state
  // ShiftDate state removed (mapped to props)

  // Progress dialog states
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressStatus, setProgressStatus] = useState({
    step: 0,
    totalSteps: 4,
    message: "",
    progress: 0,
    isError: false,
    errorMessage: "",
  });

  // Additional states
  // routeStats state removed (using prop `stats`)
  const routeStats = (stats && stats.length > 0) ? {
    TotalEmps: stats[0].TotalEmps || 0,
    TotalRoutes: stats[0].TotalRoutes || 0,
    AvgOccupancy: stats[0].AvgOccupancy || 0,
  } : {
    TotalEmps: 0,
    TotalRoutes: 0,
    AvgOccupancy: 0,
  };
  const [selectedFile, setSelectedFile] = useState(null);
  const [offcanvasRefreshKey, setOffcanvasRefreshKey] = useState(0);

  // Finalization workflow: cutoff validation, recalc-first check, dialogs,
  // and the finalize server pipeline (see useFinalizeWorkflow)
  const {
    isFinalizing,
    isRecalcBeforeFinalize,
    showRecalcBeforeFinalizeDialog,
    setShowRecalcBeforeFinalizeDialog,
    showFinalizeConfirmDialog,
    setShowFinalizeConfirmDialog,
    handleFinalizeRoute,
    proceedWithFinalization,
    handleRecalculateAndFinalize,
  } = useFinalizeWorkflow({
    shiftDate,
    selectedShifts,
    selectedFacility,
    selectedTripType,
    userId: userID,
    onSearch,
    setIsSubmitting,
  });
  // Memoized values
  const queryParams = useMemo(() => {
    return new URLSearchParams({
      sDate: shiftDate,
      FacilityID: selectedFacility || "",
      TripType: selectedTripType,
      Shifttimes: selectedShifts || "",
      Direction: "ASC",
      Routeid: "",
    }).toString();
  }, [shiftDate, selectedFacility, selectedTripType, selectedShifts]);

  const tripTypeOptions = useMemo(
    () => [
      { label: "Pick", value: "P" },
      { label: "Drop", value: "D" },
    ],
    []
  );

  // Include unlock selection state in table data to force re-render when selection changes
  const memoizedTableData = useMemo(() => {
    if (isUnlockMode) {
      return tableData.map(row => ({
        ...row,
        isSelectedForUnlock: routesToUnlock.has(row.RouteID)
      }));
    }
    return tableData;
  }, [tableData, isUnlockMode, routesToUnlock]);

  // Handle split route with updated logic
  const handleSplitRoute = useCallback(() => {
    if (selectedEmployees.size === 0) {
      toastService.warn("Please select employees to split");
      return;
    }

    // Get route ID from first selected employee
    const firstEmployeeKey = Array.from(selectedEmployees)[0];
    const routeId = firstEmployeeKey.split("-")[0];

    // Check if all employees are from the same route
    const allFromSameRoute = Array.from(selectedEmployees).every(
      employeeKey => employeeKey.startsWith(`${routeId}-`)
    );

    if (!allFromSameRoute) {
      toastService.warn("All selected employees must be from the same route to split");
      return;
    }

    // Check if trying to split all employees
    const routeEmployees = queryClient.getQueryData(manageRouteKeys.routeDetails(routeId)) || [];
    if (selectedEmployees.size >= routeEmployees.length) {
      toastService.warn(
        "Cannot split all employees. At least one employee must remain in the original route."
      );
      return;
    }

    // Prepare employee IDs for the API
    const employeeIds = Array.from(selectedEmployees).map((employeeKey) => {
      const [, employeeId] = employeeKey.split("-");
      return employeeId;
    });

    // Get employee details for confirmation dialog
    const selectedEmployeeDetails = [];
    employeeIds.forEach((employeeId) => {
      const employee = routeEmployees.find(
        (emp) => String(emp.id || emp.empID || emp.empId) === employeeId
      );
      if (employee) {
        selectedEmployeeDetails.push(employee);
      }
    });

    setPendingSplitOperation({
      routeId: routeId,
      employeeIds: employeeIds,
      employeeDetails: selectedEmployeeDetails,
      newRouteId: routeId + "S",
    });

    setShowSplitConfirmDialog(true);
  }, [selectedEmployees, queryClient]);

  // Cross-page drop handler
  const handleCrossPageDrop = useCallback(
    async (targetRouteId, targetPosition) => {
      if (!isSelectionHeld || selectedEmployees.size === 0) return;

      const employeeData = [];
      const routeIds = [];
      const selectedEmployeeDetails = [];

      for (const employeeKey of selectedEmployees) {
        const [routeId, employeeId] = employeeKey.split("-");
        employeeData.push(employeeId);
        routeIds.push(routeId);

        const routeEmployees = queryClient.getQueryData(manageRouteKeys.routeDetails(routeId)) || [];
        const emp = routeEmployees.find(
          (e) => (e.id || e.empID || e.empId) === employeeId
        );
        if (emp) {
          selectedEmployeeDetails.push(emp);
        }
      }

      const mockActiveData = {
        employee: selectedEmployeeDetails[0],
        sourceRouteId: routeIds[0],
        type: "employee",
        isMultiSelect: selectedEmployees.size > 1,
        selectedCount: selectedEmployees.size,
      };

      const mockOverData = {
        targetRouteId: targetRouteId,
        targetPosition: targetPosition,
        type: "position",
      };

      setPendingDragOperation({
        employeeKeys: Array.from(selectedEmployees),
        targetRouteId: targetRouteId,
        targetPosition: targetPosition,
        activeData: mockActiveData,
        overData: mockOverData,
        isCrossPageDrop: true,
      });

      setShowDragDropConfirmDialog(true);
    },
    [isSelectionHeld, selectedEmployees, queryClient]
  );

  // Fetch functions
  // fetchFacilities and fetchShifts removed (data provided via props)

  const refreshRouteDetails = useCallback(async (routeId) => {
    // RouteDetails is managed by React Query; invalidate the specific route's cache
    queryClient.invalidateQueries({ queryKey: manageRouteKeys.routeDetails(routeId) });
  }, [queryClient]);

  const getRowClassName = useCallback(
    (rowData) => {
      let className = "";
      if (rowData.isRouteFinalized === 1) {
        className += "route-is-finalized ";
      }
      if (isUnlockMode && routesToUnlock.has(rowData.RouteID)) {
        className += "route-selected-for-unlock ";
      }
      if (isUnlockMode && rowData.isRouteFinalized === 1) {
        className += "unlock-mode-selectable ";
      }
      if (activeId && hoveredRouteId === rowData.RouteID) {
        className += "route-hover-drag ";
      }
      if (activeId) {
        className += "drag-in-progress ";
      }
      if (crossPageDropMode) {
        className += "cross-page-mode ";
      }
      if (isSelectionHeld) {
        className += "held-selection-active ";
      }
      if (selectedRoutes.some(route => route.RouteID === rowData.RouteID)) {
        className += "route-selected ";
        if (
          routeSelectionOrder.length > 0 &&
          routeSelectionOrder[0] === rowData.RouteID
        ) {
          className += "first-selected ";
        }
      }
      if (isRouteSelectMode) {
        className += "route-merge-mode ";
      }


      return className;
    },
    [
      activeId,
      hoveredRouteId,
      crossPageDropMode,
      isSelectionHeld,
      selectedRoutes,
      routeSelectionOrder,
      isRouteSelectMode,
      isUnlockMode,
      routesToUnlock,
    ]
  );

  // Effects
  // Initial data fetch effects removed

  // handleSortChange and sort useEffect removed (auto-handled by hook)
  
  const handleSort = useCallback((e) => {
    onFilterChange('orderBy', e.sortField);
    onFilterChange('direction', e.sortOrder === 1 ? 'ASC' : 'DESC');
  }, [onFilterChange]);


  // Template functions

  // Main submit handler
  // Main submit handler (Simplified)
  const handleSubmit = useCallback(() => {
      // Validation Logic
      if (!selectedFacility) {
        toastService.warn("Please select Facility");
        return;
      }

      if (!selectedShifts || (Array.isArray(selectedShifts) && selectedShifts.length === 0)) {
        toastService.warn("Please select Shift");
        return;
      }

      // Basic UI cleanup
      setSearchedShiftDate(shiftDate);
      setIsShiftLocked(false);
      setIsUnlockMode(false);
      setRoutesToUnlock(new Set());
      
      // Clear expansion and details on search (User Request)
      setExpandedRows(null);
      setIsAllExpanded(false);
      // Clear all cached route details when performing a new search
      queryClient.removeQueries({ queryKey: ['manageRoute', 'routeDetails'] });

      // Trigger Search via Container
      onSearch();
      
  }, [onSearch, shiftDate, queryClient, selectedFacility, selectedShifts]);

  // Route click handler
  const handleRouteIdClick = useCallback(
    async (clickedRouteId) => {
      setIsSubmitting(true);


      try {
        const inputJsonResponse =
          await ManageRouteService.getInputJsonByrouteids({
            routeids: clickedRouteId,
          });

        const inputJsonForRecalc =
          typeof inputJsonResponse === "string"
            ? JSON.parse(inputJsonResponse)
            : inputJsonResponse;

        if (
          inputJsonForRecalc &&
          inputJsonForRecalc.routes &&
          inputJsonForRecalc.routes.length > 0
        ) {
          toastService.info(
            "Recalculating Modified Route - Fetching latest ETA and distance..."
          );

          const recalculatedRouteJson = await ManageRouteService.recalculateRoutes(inputJsonForRecalc);

          await ManageRouteService.updateRouteMapbased({
            facilityid: selectedFacility,
            sDate: shiftDate,
            triptype: selectedTripType,
            shifttime: selectedShifts,
            jsonstring: JSON.stringify(recalculatedRouteJson),
            updatedBy: userID,
          });

          await refreshRouteDetails(clickedRouteId);

          try {
             // Refresh main table using onSearch (container refresh)
             await onSearch();
          } catch (refreshError) {
            console.error("Error refreshing table data:", refreshError);
          }

          toastService.success(
            "Route updated with latest ETAs. Opening map..."
          );
        }

        setOffcanvasRefreshKey((prevKey) => prevKey + 1);
        setSelectedRouteId(clickedRouteId);
        setShowOffcanvas(true);
      } catch (error) {
        console.error("Error processing route click:", error);
        toastService.error(`Failed to open route details: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedFacility, shiftDate, selectedTripType, selectedShifts, userID, onSearch, refreshRouteDetails]
  );

  // Template functions
  const routeIdTemplate = useCallback(
    (rowData) => {
      return (
        <span
          className="cursor-pointer text-primary mr-route-link"
          onClick={() => handleRouteIdClick(rowData.RouteID)}
        >
          {rowData.RouteID}
        </span>
      );
    },
    [handleRouteIdClick]
  );

  const durationTemplate = useCallback((rowData) => {
    const minutes = parseInt(rowData.duration);
    if (isNaN(minutes)) return "";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = remainingMinutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}`;
  }, []);

  // Handle Expand/Collapse All
  const handleExpandCollapseAll = useCallback(() => {
    if (isAllExpanded) {
      setExpandedRows(null);
      setIsAllExpanded(false);
    } else {
      const _expandedRows = {};
      if (memoizedTableData) {
        memoizedTableData.forEach((r) => (_expandedRows[r.RouteID] = true));
      }
      setExpandedRows(_expandedRows);
      setIsAllExpanded(true);
    }
  }, [isAllExpanded, memoizedTableData]);

  // Moved here to avoid hoisting issue with rowExpansionTemplate
  const handleOpenAddEmployeeModal = useCallback((routeId) => {
    setSelectedRouteId(routeId);
    setShowAddEmployeeModal(true);
    setEmployeeSearchQuery("");
    setSearchResults([]);
    setSelectedEmployee(null);
    setSelectedStopNo(null);
    setAvailableStopNumbers([]);
  }, []);

  // [MODIFIED] rowExpansionTemplate now uses RouteExpansionDetails component
  const rowExpansionTemplate = useCallback(
    (rowData) => {
      return (
        <RouteExpansionDetails
          routeId={rowData.RouteID}
          isEditable={rowData.isRouteFinalized !== 1}
          crossPageDropMode={crossPageDropMode}
          selectedEmployees={selectedEmployees}
          selectedAction={selectedAction}
          activeId={activeId}
          hoveredDropZone={hoveredDropZone}
          onCrossPageDrop={handleCrossPageDrop}
          onEmployeeSelection={handleEmployeeSelection}
          onAddEmployee={handleOpenAddEmployeeModal}
          onDeleteEmployee={(employee, routeId) => {
            setPendingDeleteEmployee({ employee, routeId });
            setShowDeleteEmployeeDialog(true);
          }}
        />
      );
    },
    [
      crossPageDropMode,
      activeId,
      hoveredDropZone,
      selectedEmployees,
      handleEmployeeSelection,
      handleCrossPageDrop,
      handleOpenAddEmployeeModal,
      selectedAction
    ]
  );
  // Confirmation handlers
  const confirmDragDropOperation = useCallback(async () => {
    if (!pendingDragOperation) return;

    try {
      setShowDragDropConfirmDialog(false);
      setIsSubmitting(true);

      const employeeData = [];
      const routeIds = [];
      const employeeNames = [];

      for (const employeeKey of pendingDragOperation.employeeKeys) {
        const [routeId, employeeId] = employeeKey.split("-");
        employeeData.push(employeeId);
        routeIds.push(routeId);

        const routeEmployees = queryClient.getQueryData(manageRouteKeys.routeDetails(routeId)) || [];
        const emp = routeEmployees.find(
          (e) => (e.id || e.empID || e.empId) === employeeId
        );
        if (emp) {
          employeeNames.push(emp.empCode);
        }
      }

      const requestPayload = {
        OldRouteid: routeIds.join(","),
        oldemployeeid: employeeData.join(","),
        newrouteid: String(pendingDragOperation.targetRouteId),
        stopno: Number(pendingDragOperation.targetPosition),
        userid: Number(parseInt(userID) || 0),
      };

      await moveEmployeeMutation.mutateAsync(requestPayload);

      let moveMessage;
      if (pendingDragOperation.isSameRouteReorder) {
        moveMessage =
          employeeData.length === 1
            ? `Employee ${employeeNames[0]} reordered to position ${pendingDragOperation.targetPosition} in Route ${pendingDragOperation.targetRouteId}`
            : `${employeeData.length} employees reordered to position ${pendingDragOperation.targetPosition} in Route ${pendingDragOperation.targetRouteId}`;
      } else {
        moveMessage =
          employeeData.length === 1
            ? `Employee ${employeeNames[0]} moved to Route ${pendingDragOperation.targetRouteId} at position ${pendingDragOperation.targetPosition}`
            : `${employeeData.length} employees moved to Route ${pendingDragOperation.targetRouteId} at position ${pendingDragOperation.targetPosition}`;
      }

      toastService.success(moveMessage);

      // Clear selections
      handleClearSelection();

      // Refresh affected routes AND entire table without collapsing state
      const affectedRoutes = [
        ...new Set([...routeIds, pendingDragOperation.targetRouteId]),
      ];
      for (const routeId of affectedRoutes) {
        await refreshRouteDetails(routeId);
      }

      // Invalidate the routes query so the main table reflects the new counts without resetting expansion state
      queryClient.invalidateQueries({ queryKey: manageRouteKeys.all });

    } catch (error) {
      console.error("Error moving employees:", error);
      toastService.error(`Failed to move employees: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setPendingDragOperation(null);
    }
  }, [pendingDragOperation, userID, queryClient, handleClearSelection, handleSubmit, moveEmployeeMutation]);

  const cancelDragDropOperation = useCallback(() => {
    setShowDragDropConfirmDialog(false);
    setPendingDragOperation(null);
  }, []);

  // Merge server workflow (selection state lives in useRouteMergeSelection)
  const confirmMergeOperation = useCallback(async () => {
    if (!pendingMergeOperation) return;

    try {
      setShowRouteMergeDialog(false);
      setIsSubmitting(true);

      const requestPayload = {
        RouteIDs: pendingMergeOperation.routeArray.join(","),
        userid: Number(parseInt(userID) || 0),
      };

      await mergeRouteMutation.mutateAsync(requestPayload);

      toastService.success(
        `Routes merged successfully! All routes merged into Route ${pendingMergeOperation.targetRoute} (first selected)`
      );

      handleClearRouteSelection();
      await handleSubmit();
    } catch (error) {
      console.error("Error merging routes:", error);
      toastService.error(`Failed to merge routes: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setPendingMergeOperation(null);
    }
  }, [pendingMergeOperation, userID, handleClearRouteSelection, handleSubmit, mergeRouteMutation]);

  // Split operation handlers
  const confirmSplitOperation = useCallback(async () => {
    if (!pendingSplitOperation) return;

    try {
      setShowSplitConfirmDialog(false);
      setIsSubmitting(true);

      const requestPayload = {
        RouteIDs: pendingSplitOperation.routeId,
        empIDs: pendingSplitOperation.employeeIds.join(","),
      };

      const response = await splitRouteMutation.mutateAsync(requestPayload);

      let result;
      if (typeof response === "string") {
        const parsedResponse = JSON.parse(response);
        result = parsedResponse[0]?.result;
      } else if (Array.isArray(response)) {
        result = response[0]?.result;
      } else {
        result = response?.result;
      }

      switch (result) {
        case 1:
          toastService.success(
            `Route split successful! ${pendingSplitOperation.employeeIds.length} employees moved to Route ${pendingSplitOperation.newRouteId}`
          );
          handleClearSelection();
          await handleSubmit();
          break;
        case 0:
          toastService.error(
            `Split route ${pendingSplitOperation.newRouteId} already exists. Cannot split again.`
          );
          break;
        case -1:
          toastService.error('Cannot split a route that already ends with "S"');
          break;
        default:
          toastService.error("Unexpected response from split operation");
          break;
      }
    } catch (error) {
      console.error("Error splitting route:", error);
      toastService.error(`Failed to split route: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setPendingSplitOperation(null);
    }
  }, [pendingSplitOperation, handleClearSelection, handleSubmit, splitRouteMutation]);

  const cancelSplitOperation = useCallback(() => {
    setShowSplitConfirmDialog(false);
    setPendingSplitOperation(null);
  }, []);

  const handleRecalculateModifiedRoutes = useCallback(async () => {
    setIsSubmitting(true);
    setIsRecalculating(true); // Start specific loading
    toastService.info("Fetching data for all modified routes...");

    try {
      const updated = await recalculateModifiedRoutes(
        {
          shiftDate,
          shifts: selectedShifts,
          facilityId: selectedFacility,
          tripType: selectedTripType,
          userId: userID,
        },
        { onBeforeRecalc: () => toastService.info("Sending data for recalculation...") }
      );

      if (!updated) {
        toastService.info("No routes to be recalculated.");
        return;
      }

      toastService.success("Modified routes recalculated! Refreshing table...");
      
      // 1. Refresh main table without collapsing
      await onSearch();

      // 2. Refresh details for any currently expanded routes
      if (expandedRows && Object.keys(expandedRows).length > 0) {
        const expandedRouteIds = Object.keys(expandedRows);
        for (const routeId of expandedRouteIds) {
             await refreshRouteDetails(routeId);
        }
      }

    } catch (error) {
      console.error("Error recalculating modified routes:", error);
      toastService.error(`Failed to recalculate routes: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      setIsRecalculating(false); // Stop specific loading
    }
  }, [
    selectedFacility,
    shiftDate,
    selectedTripType,
    selectedShifts,
    userID,
    handleSubmit,
    onSearch,
    expandedRows,
    refreshRouteDetails // Added dependency
  ]);

  // Unlock server workflow (selection state lives in useUnlockRoutes)
  const confirmUnlockOperation = async () => {
    if (!pendingUnlock) return;

    setIsSubmitting(true);
    setShowUnlockConfirmDialog(false);

    try {
      const response = await unlockRoutesMutation.mutateAsync({
        RouteIDs: pendingUnlock.routeIds.join(','),
        userid: userID,
      });

      const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
      if (parsedResponse && parsedResponse.length > 0 && parsedResponse[0].res) {
        toastService.success(parsedResponse[0].res);
      } else {
        toastService.success("Routes unlocked successfully!");
      }

      // Reset states and refresh data
      setRoutesToUnlock(new Set());
      setIsUnlockMode(false);
      await handleSubmit();

    } catch (error) {
      console.error("Error unlocking routes:", error);
      toastService.error("Failed to unlock routes.");
    } finally {
      setIsSubmitting(false);
      setPendingUnlock(null);
    }
  };


  // Additional handlers for file operations, employee management, etc.
  const handleFileUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(fileExtension)) {
        toastService.warn("Please upload only Excel or CSV files.");
        return;
      }

      setSelectedFile(file);
      toastService.success("The file was selected successfully.");
    } catch (error) {
      console.error("Error selecting file:", error);
      toastService.error("There was an error during file selection.");
      setSelectedFile(null);
    }
  };

  const pushDataToUpdateTripsheetDetail = async (data) => {
    try {
      // Change the URL to use the new proxy path
      const pushUrl = "/dataPushApi/UpdateTripsheetDetail"; // Use the new proxy route
      const response = await axios.post(pushUrl, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 201) {
        console.error(
          "Failed to push data:",
          response.status,
          response.statusText
        );
        toastService.error(
          `Failed to push data. Status: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error pushing data to UpdateTripsheetDetail:", error);
      toastService.error("Data push failed.");
    }
  };

  const handleAutoVendorAllocation = async () => {
    setShowAutoVendorAllocationDialog(true);
  };

  const confirmAutoVendorAllocation = async () => {
    setIsSubmitting(true);
    setIsAllocating(true); // Start specific loading
    try {
      setShowAutoVendorAllocationDialog(false);

      const params = {
        facid: selectedFacility,
        sDate: shiftDate,
        uname: userID,
        triptype: selectedTripType,
        shifttime: selectedShifts,
      };

      await autoVendorAllocationMutation.mutateAsync(params);
      toastService.success("Vendor allocation process completed successfully.");
      setVendorAllocated(true);
      await onSearch();
    } catch (error) {
      console.error("Error during auto vendor allocation:", error);
      toastService.error("Vendor allocation process failed to complete.");
      setVendorAllocated(false);
    } finally {

      setIsSubmitting(false);
      setIsAllocating(false); // Stop specific loading
    }
  };

  const handleExportExcel = async (e) => {
    e.preventDefault();
    try {
      const response = await ManageRouteService.GetRoutesExportExcel({
        sDate: shiftDate,
        eDate: shiftDate,
        facilityid: selectedFacility,
        triptype: selectedTripType,
        shifttimes: selectedShifts,
      });

      const data = typeof response === "string" ? JSON.parse(response) : response;

      const processedData = data.map((row) => {
        const div = document.createElement("div");
        div.innerHTML = row.mobile;

        const mobileText = div.textContent || div.innerText;
        const hasRedColor = div.querySelector('font[color="Red"]') !== null;

        return {
          ...row,
          mobile: mobileText,
        };
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(processedData);

      const headers = Object.keys(processedData[0]);
      const range = XLSX.utils.decode_range(worksheet["!ref"]);

      headers.forEach((header, index) => {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: index });
        worksheet[headerCell].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "E0E0E0" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      });

      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const gender =
          worksheet[
            XLSX.utils.encode_cell({ r: row, c: headers.indexOf("Gender") })
          ]?.v;

        headers.forEach((header, col) => {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!worksheet[cellRef]) {
            worksheet[cellRef] = { v: "" };
          }

          const baseStyle = {
            alignment: {
              horizontal: "left",
              vertical: "center",
              wrapText: true,
            },
            border: {
              top: { style: "thin" },
              bottom: { style: "thin" },
              left: { style: "thin" },
              right: { style: "thin" },
            },
          };

          if (gender === "Female") {
            if (header === "mobile") {
              worksheet[cellRef].s = {
                ...baseStyle,
                font: { color: { rgb: "FF0000" }, bold: true },
                fill: { fgColor: { rgb: "FFB6C1" } },
              };
            } else {
              worksheet[cellRef].s = {
                ...baseStyle,
                fill: { fgColor: { rgb: "FFC0CB" } },
              };
            }
          } else {
            worksheet[cellRef].s = baseStyle;
          }
        });
      }

      const columnWidths = headers.map((header) => {
        const maxLength = Math.max(
          header.length,
          ...processedData.map((row) => String(row[header] || "").length)
        );
        return { wch: maxLength + 2 };
      });
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Routes");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true,
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Routes_${shiftDate}.xlsx`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toastService.success("Download of Excel file completed successfully.");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toastService.error("Excel export failed. Please try again.");
    }
  };

  // Employee management handlers
  const handleDeleteEmployee = async () => {
    if (!pendingDeleteEmployee) return;

    try {
      const { employee, routeId } = pendingDeleteEmployee;

      const response = await deleteEmployeeMutation.mutateAsync({
        sDate: shiftDate,
        FacilityID: selectedFacility,
        TripType: selectedTripType,
        Shifttimes: selectedShifts,
        RouteID: routeId,
        EmpID: employee.id || employee.empID,
        uname: userID,
      });

      let parsedResponse;
      try {
        parsedResponse =
          typeof response === "string" ? JSON.parse(response) : response;
        if (Array.isArray(parsedResponse)) {
          parsedResponse = parsedResponse[0];
        }
      } catch (parseError) {
        console.error("Error parsing delete response:", parseError);
        toastService.error("Invalid response format from server.");
        return;
      }

      if (parsedResponse && parsedResponse.RESULT === 1) {
        toastService.success(
          `Employee ${employee.empName} has been removed from route ${routeId}`
        );

        // Remove the deleted employee from selection FIRST (before refresh)
        const employeeKey = `${routeId}-${employee.id || employee.empID}`;
        setSelectedEmployees((prev) => {
          const newSelection = new Set(prev);
          newSelection.delete(employeeKey);
          
          // If all selections are gone, hide the panel
          if (newSelection.size === 0) {
            setShowFloatingPanel(false);
            setIsSelectionHeld(false);
            setCrossPageDropMode(false);
          }
          
          return newSelection;
        });

        // Use targeted cache invalidation instead of handleSubmit()
        // This preserves row expansion state while refreshing the data
        try {
          // Invalidate and refetch the specific route's details
          await queryClient.invalidateQueries({ 
            queryKey: manageRouteKeys.routeDetails(routeId) 
          });
          
          // Invalidate and refetch the main routes table
          await queryClient.invalidateQueries({ 
            queryKey: ['manageRoute', 'routes'] 
          });
          
          // Invalidate statistics as well
          await queryClient.invalidateQueries({ 
            queryKey: ['manageRoute', 'statistics'] 
          });
        } catch (refreshError) {
          console.error("Error refreshing route data:", refreshError);
        }
      } else {
        toastService.error(
          "Failed to delete employee from route. Please try again."
        );
      }
    } catch (error) {
      console.error("Error deleting employee from route:", error);
      toastService.error(
        "An error occurred while deleting the employee from the route."
      );
    } finally {
      setShowDeleteEmployeeDialog(false);
      setPendingDeleteEmployee(null);
    }
  };

  const handleDeleteFromPanel = useCallback((employee, routeId) => {
    setPendingDeleteEmployee({ employee, routeId });
    setShowDeleteEmployeeDialog(true);
  }, []);

  const handleCloseAddEmployeeModal = useCallback(() => {
    setShowAddEmployeeModal(false);
    setEmployeeSearchQuery("");
    setSearchResults([]);
    setSelectedEmployee(null);
    setSelectedStopNo(null);
    setAvailableStopNumbers([]);
  }, []);

  const handleSearchEmployees = useCallback(async () => {
    if (!employeeSearchQuery.trim()) {
      toastService.warning("Please enter an employee ID or name to search.");
      return;
    }

    setIsSearching(true);
    try {
      const locationId = sessionStorage.getItem("locationid") || "2";
      const response = await ManageRouteService.EmpSearch({
        locationid: locationId,
        empidname: employeeSearchQuery.trim(),
        IsAdmin: "N",
      });

      let parsedResponse;
      try {
        parsedResponse =
          typeof response === "string" ? JSON.parse(response) : response;
      } catch (parseError) {
        console.error("Error parsing employee search response:", parseError);
        toastService.error("Invalid response format from server.");
        return;
      }

      if (Array.isArray(parsedResponse)) {
        setSearchResults(parsedResponse);
        if (parsedResponse.length === 0) {
          toastService.info(
            "No employees found matching your search criteria."
          );
        }
      } else {
        setSearchResults([]);
        toastService.error("Invalid response format from server.");
      }
    } catch (error) {
      console.error("Error searching employees:", error);
      toastService.error("An error occurred while searching for employees.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [employeeSearchQuery]);

  const handleSelectEmployee = useCallback(
    (employee) => {
      setSelectedEmployee(employee);

      const currentRouteEmployees = queryClient.getQueryData(manageRouteKeys.routeDetails(selectedRouteId));
      if (currentRouteEmployees && Array.isArray(currentRouteEmployees)) {
        const currentEmployeeCount = currentRouteEmployees.length;
        const stopNumbers = [];
        for (let i = 1; i <= currentEmployeeCount + 1; i++) {
          stopNumbers.push({
            label: `${i}${getOrdinalSuffix(i)} Stop`,
            value: i,
          });
        }
        setAvailableStopNumbers(stopNumbers);
        setSelectedStopNo(null);
      }
    },
    [queryClient, selectedRouteId]
  );

  const handleAddEmployeeToRoute = useCallback(async () => {
    if (!selectedEmployee || !selectedStopNo || !selectedRouteId) {
      toastService.warning("Please select an employee and stop number.");
      return;
    }

    setIsAddingEmployee(true);
    try {
      const response = await addEmployeeMutation.mutateAsync({
        empId: selectedEmployee.id,
        stopNo: selectedStopNo,
        routeId: selectedRouteId,
        isDelete: 0,
        IsNewAdded: 0,
        updatedby: 0,
      });

      let parsedResponse;
      try {
        parsedResponse =
          typeof response === "string" ? JSON.parse(response) : response;
        if (Array.isArray(parsedResponse)) {
          parsedResponse = parsedResponse[0];
        }
      } catch (parseError) {
        console.error("Error parsing add employee response:", parseError);
        toastService.error("Invalid response format from server.");
        return;
      }

      if (parsedResponse && parsedResponse.RESULT === 1) {
        toastService.success(
          `Employee ${selectedEmployee.empName} has been added to route ${selectedRouteId} at stop ${selectedStopNo}`
        );

        try {
          // Refresh data via container
          // await handleSubmit(); // Replaced with onSearch to avoid collapsing
          await onSearch();
        } catch (refreshError) {
          console.error("Error refreshing route data:", refreshError);
        }

        try {
          await refreshRouteDetails(selectedRouteId);
        } catch (refreshError) {
          console.error("Error refreshing route details:", refreshError);
        }

        handleCloseAddEmployeeModal();
      } else {
        toastService.error(
          "Failed to add employee to route. Please try again."
        );
      }
    } catch (error) {
      console.error("Error adding employee to route:", error);
      toastService.error(
        "An error occurred while adding the employee to the route."
      );
    } finally {
      setIsAddingEmployee(false);
    }
  }, [
    selectedEmployee,
    selectedStopNo,
    selectedRouteId,
    userID,
    shiftDate,
    selectedFacility,
    selectedTripType,
    selectedShifts,
    handleCloseAddEmployeeModal,
    onSearch, // Added dependency
    refreshRouteDetails, // Already available in scope
    addEmployeeMutation
  ]);

  const handleSaveFile = async () => {
    try {
      if (!selectedFile) {
        toastService.warn("Please select a file first");
        return;
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("facilityId", selectedFacility);
      formData.append("tripType", selectedTripType);
      formData.append("shiftDate", shiftDate);

      toastService.success("File uploaded successfully");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toastService.error("An error occurred during file upload.");
    }
  };

  // Declarative job polling: the query refetches every 5s while pollingJobId
  // is set and stops itself on unmount. This effect reacts to status changes.
  const { data: jobStatus } = useRouteJobStatusQuery(pollingJobId);

  useEffect(() => {
    if (!jobStatus || !pollingJobId) return;

    setProgressStatus((prev) => ({
      ...prev,
      message: jobStatus.progressMessage || prev.message,
      progress: jobStatus.progressPercent ?? prev.progress,
      isError: false,
      errorMessage: ''
    }));

    if (jobStatus.status === 'completed') {
      setPollingJobId(null);
      prevInProgressJobIdRef.current = null;
      logic?.actions?.clearInProgressJob?.();

      setProgressStatus((prev) => ({ ...prev, message: 'Routes generated successfully!', progress: 100 }));
      setTimeout(async () => {
        setShowProgressDialog(false);
        await onSearch();
        toastService.success('Route generation completed successfully.');
      }, 1500);
    } else if (jobStatus.status === 'failed') {
      setPollingJobId(null);
      prevInProgressJobIdRef.current = null;
      logic?.actions?.clearInProgressJob?.();

      setProgressStatus((prev) => ({
        ...prev,
        isError: true,
        errorMessage: jobStatus.errorMessage || 'Route generation failed. Please try again.'
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobStatus, pollingJobId]);

  const handleGenerateRoute = async () => {
    // Close confirm dialog
    if (logic && logic.actions && logic.actions.setUiState) {
      logic.actions.setUiState({ showGenerateDialog: false });
    } else {
      setShowGenerateRouteDialog(false);
    }

    setShowProgressDialog(true);
    setProgressStatus({
      step: 0,
      totalSteps: 4,
      message: 'Starting route generation...',
      progress: 5,
      isError: false,
      errorMessage: ''
    });

    try {
      const { jobId } = await ManageRouteService.startAsyncRouteGeneration({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
        updatedBy: userID,
        mainBackendUrl: '' // App Runner uses MAIN_BACKEND_URL env var; pass empty string
      });

      setProgressStatus((prev) => ({ ...prev, message: 'Job queued. Generating routes...', progress: 10 }));
      setPollingJobId(jobId);
    } catch (error) {
      console.error('Error starting route generation:', error);
      setProgressStatus((prev) => ({
        ...prev,
        isError: true,
        errorMessage: error.message || 'Failed to start route generation. Please try again.'
      }));
    }
  };
  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={throttledHandleDragOver}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.BeforeDragging,
          },
        }}
      >
        {isSubmitting && (
          <div className="mr-busy-overlay">
            <div
              className="spinner-border text-primary mr-busy-spinner"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        <Header
          mainTitle="Transport"
          pageTitle="Manage Route"
          showNewButton={false}
        />
        <Sidebar />
        <div className="middle mr-page">
          <div className="row">
            <div className="col-12 col-lg-8 mb-3 mb-lg-0">
              <div className="card_tb p-3">
                <div className="row g-2 g-md-3">
                  <div className="col-6 col-md">
                    <label htmlFor="shiftDate" className="form-label">Shift Date <span className="text-danger">*</span></label>
                    <div className="custom-calendar-wrapper">
                      <img src={calendarIcon} alt="calendar" className="custom-calendar-icon" />
                      <Calendar
                        id="shiftDate"
                        className="w-100 custom-calendar-input"
                        value={new Date(shiftDate)}
                        onChange={(e) => {
                          const date = e.value;
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, "0");
                            const day = String(date.getDate()).padStart(2, "0");
                            setShiftDate(`${year}-${month}-${day}`);
                          }
                        }}
                        dateFormat="mm/dd/yy"
                        placeholder="Trips for the Day"
                      />
                    </div>
                  </div>
                  <div className="col-6 col-md">
                    <label htmlFor="facility" className="form-label">Facility Name <span className="text-danger">*</span></label>
                    <Dropdown
                      id="facility"
                      placeholder="Select"
                      className="w-100"
                      filter
                      value={selectedFacility || null}
                      onChange={(e) => setSelectedFacility(e.value)}
                      options={facilities}
                      optionLabel="label"
                      optionValue="value"
                    />
                  </div>
                  <div className="col-6 col-md">
                    <label htmlFor="tripType" className="form-label">Trip Type <span className="text-danger">*</span></label>
                    <Dropdown
                      id="tripType"
                      value={selectedTripType || "P"}
                      options={tripTypeOptions}
                      onChange={(e) => setSelectedTripType(e.value)}
                      placeholder="Select Trip Type"
                      className="w-100"
                      filter
                    />
                  </div>
                  <div className="col-6 col-md">
                    <label htmlFor="shift" className="form-label">Shift <span className="text-danger">*</span></label>
                    <Dropdown
                      filter
                      id="shift"
                      value={selectedShifts || []}
                      options={shifts}
                      onChange={(e) => setSelectedShifts(e.value)}
                      optionLabel="label"
                      placeholder="Select"
                      className="w-full md:w-20rem w-100"
                    />
                  </div>
                  <div className="col-6 col-md no-label d-flex align-items-end">
                    <ReportButton
                      label="Search"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card_tb">
                <div className="cardNew1 w-100">
                  <ul className="d-flex justify-content-between">
                    <li>
                      <h3>
                        <strong>{routeStats.TotalEmps}</strong>
                      </h3>
                      <span className="subtitle_sm text-danger">Employees</span>
                    </li>
                    <li>
                      <div>
                        <h3>
                          <strong>{routeStats.AvgOccupancy}</strong>
                        </h3>
                        <span className="subtitle_sm text-warning text-nowrap">
                          Avg. Occupancy
                        </span>
                      </div>
                    </li>
                    <li className="d-flex justify-content-between align-items-center">
                      <div>
                        <h3>
                          <strong>{routeStats.TotalRoutes}</strong>
                        </h3>
                        <span className="subtitle_sm text-primary">
                          Routes <br />
                        </span>
                      </div>
                      <div>
                        <a
                          href={`/RouteMap?${queryParams}`}
                          target="_blank"
                          // Same-origin page: "opener" keeps sessionStorage (user ID, routing
                          // engine version) in the new tab, which RouteMap editing needs.
                          rel="opener"
                          className=""
                          data-pr-tooltip="View All Routes"
                          data-pr-position="left"
                        >
                          <Tooltip target="[data-pr-tooltip]" />
                          <img src="/images/icons/fold_map.png" alt="Map" />
                        </a>
                        <a
                          className="subtitle_sm text-primary d-block mr-stats-link"
                          onClick={() => setShowDetailsSidebar(true)}
                          data-pr-tooltip="View Route Statistics"
                          data-pr-position="left"
                        >
                          <img
                            src="/images/icons/analysis.png"
                            alt="Analysis"
                          />
                        </a>
                        <Tooltip target="[data-pr-tooltip]" />
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {showButtons && (
            <div className={scrolled ? "buttonFix shadow" : "hidden"}>
              <div className="row mt-3">
                <div className="col-12 d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2 mb-lg-0">
                    <Button
                      label="Route Merge Mode"
                      icon="pi pi-share-alt"
                      className="btn btn-outline-secondary route-merge-toggle-btn"
                      severity={isRouteSelectMode ? "warning" : "secondary"}
                      raised
                      rounded
                      onClick={() => {
                        toggleRouteSelectMode();
                        setIsUnlockMode(false);
                      }}
                    />
                    {(() => {
                      // Improved Date Comparison (Senior Developer Best Practice)
                      // Handles various formats (YYYY-MM-DD, MM/DD/YYYY) robustly
                      const isDateCurrentOrFuture = (() => {
                        if (!searchedShiftDate) return false;
                        
                        const searchDate = new Date(searchedShiftDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Reset time to start of day

                        // Check validity
                        if (isNaN(searchDate.getTime())) return false;

                        return searchDate >= today;
                      })();

                      // The buttons will only render if the shift is locked AND the date is not in the past
                      if (isShiftLocked && isDateCurrentOrFuture) {
                        return (
                          <div className="d-flex align-items-center">
                            <Button
                              label="Unlock Shift"
                              icon="pi pi-lock-open"
                              className="btn btn-danger"
                              raised
                              rounded
                              onClick={handleUnlockShift}
                            />
                            <Button
                              label={isUnlockMode ? "Cancel Unlock" : "Unlock Routes"}
                              icon="pi pi-key"
                              className="btn btn-danger ms-2"
                              raised
                              rounded
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
                                className="btn btn-success ms-2"
                                severity="success"
                                raised
                                rounded
                                size="small"
                                onClick={handleUnlockSelectedRoutes}
                              />
                            )}
                          </div>
                        );
                      }
                      return null; // Return nothing if conditions aren't met
                    })()}
                  </div>


                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <Button
                      label={isRecalculating ? "Recalculating..." : "Recalculate"}
                      icon={isRecalculating ? "pi pi-spin pi-spinner" : "pi pi-sync"}
                      className="btn btn-primary"
                      severity="warning"
                      raised
                      rounded
                      onClick={handleRecalculateModifiedRoutes}
                      disabled={isRecalculating || isSubmitting}
                      tooltip="Recalculates ETA and distance for all modified routes in this shift"
                      tooltipOptions={{ position: "top" }}
                    />

                    <Button
                      label={
                        isAllocating ? "Allocating..." : "Auto Vendor Allocation"
                      }
                      icon={isAllocating ? "pi pi-spin pi-spinner" : "pi pi-cog"}
                      className="btn btn-primary"
                      raised
                      rounded
                      onClick={handleAutoVendorAllocation}
                      disabled={isAllocating || isSubmitting}
                    />

                    <Button
                      label={
                        isRecalcBeforeFinalize
                          ? "Recalculating..."
                          : isFinalizing
                            ? "Finalizing..."
                            : "Finalize Route"
                      }
                      icon={
                        isRecalcBeforeFinalize
                          ? "pi pi-spin pi-spinner"
                          : isFinalizing
                            ? "pi pi-spin pi-spinner"
                            : "pi pi-check"
                      }
                      className="btn btn-primary"
                      severity="success"
                      raised
                      rounded
                      onClick={handleFinalizeRoute}
                      disabled={isFinalizing || isRecalcBeforeFinalize}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row">
            <div className="col-12">
              <div className="card_tb">
                {!hasSearched ? (
                  <div className="d-flex flex-column align-items-center justify-content-center p-5 mr-empty-state">
                    <img
                      src={noReportImage}
                      alt="No Report Selected"
                      className="mr-empty-img"
                    />
                    <p className="text-muted mb-0 mr-empty-text">
                      Please select above parameters to Generate Routes
                    </p>
                  </div>
                ) : (
                  <>

                <div className="row">
                  <div className="col-12 text-end d-flex justify-content-end align-items-center">
                    <a
                        href="#!"
                        className="me-3 mt-3 d-block text-dark mb-1"
                        onClick={handleExpandCollapseAll}
                        data-pr-tooltip={isAllExpanded ? "Collapse All" : "Expand All"}
                        data-pr-position="left"
                    >
                         <i className={`pi mr-expand-icon ${isAllExpanded ? "pi-angle-double-up" : "pi-angle-double-down"}`}></i>
                    </a>
                    <a
                      href="#!"
                      className="me-3 mt-3 d-block text-dark mb-1"
                      onClick={handleExportExcel}
                      data-pr-tooltip="Export to Excel"
                      data-pr-position="left"
                    >
                      <img src="images/icons/download.png" alt="" />
                    </a>
                    <Tooltip target="[data-pr-tooltip]" />
                  </div>
                </div>
                <DataTable
                  value={memoizedTableData.slice(first, first + rows)}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  dataKey="RouteID"
                  selectionMode={isRouteSelectMode ? "checkbox" : null}
                  selection={selectedRoutes}
                  onSelectionChange={(e) => handleRouteSelectionChange(e.value)}
                  onRowExpand={(e) =>
                    console.log("Expanded RouteID:", e.data.RouteID)
                  }
                  onRowMouseEnter={handleRouteRowEnter}
                  onRowMouseLeave={handleRouteRowLeave}
                  emptyMessage="No Record Found."
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  className={`p-datatable-sm ${isRouteSelectMode ? "route-merge-table-active" : ""
                    }`}
                  rowClassName={getRowClassName}
                  onRowClick={
                    isUnlockMode
                      ? (e) => {
                        if (e.data.isRouteFinalized === 1) {
                          e.preventDefault();
                          handleSelectRouteToUnlock(e.data.RouteID);
                        }
                      }
                      : undefined
                  }
                >
                  <Column expander style={{ width: "3rem" }} />

                  {isRouteSelectMode && (
                    <Column 
                      selectionMode="multiple" 
                      style={{ width: '4rem' }} 
                      header="" 
                    />
                  )}

                  {isUnlockMode && (
                    <Column
                      header="Unlock"
                      style={{ width: "4rem" }}
                      body={(rowData) =>
                        rowData.isRouteFinalized === 1 ? (
                          <Checkbox
                            checked={rowData.isSelectedForUnlock === true}
                            onChange={() => handleSelectRouteToUnlock(rowData.RouteID)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : null
                      }
                    />
                  )}


                  <Column
                    field=""
                    header=""
                    body={(rowData) => (
                      <div className="d-flex gap-2">
                        {rowData.isPWDRoute === true && (
                          <img
                            src="images/icons/pwd.png"
                            alt="PWD"
                            className="mr-icon-20"
                            title="PWD"
                          />
                        )}
                        {rowData.isOOBRoute === true && (
                          <img
                            src="images/icons/oob.png"
                            alt="OOB"
                            className="mr-icon-20"
                            title="OOB"
                          />
                        )}
                        {rowData.isNMTRoute === true && (
                          <img
                            src="images/icons/non-motorable.png"
                            alt="NMT"
                            className="mr-icon-20"
                            title="Non Motorable"
                          />
                        )}
                        {rowData.PlannedGuard === 1 && (
                          <img
                            src="images/icons/add_guard.png"
                            alt="Guard"
                            className="mr-icon-20"
                            title="Guard Required"
                          />
                        )}
                        {rowData.isMedicalRoute === true && (
                          <img
                            src="images/icons/medical.png"
                            alt="Medical"
                            className="mr-icon-20"
                            title="Medical Required"
                          />
                        )}
                        {rowData.swapped === true && (
                          <img
                            src="images/icons/swap.png"
                            alt="Swap"
                            className="mr-icon-20"
                            title="Swap"
                          />
                        )}
                        {rowData.afterFleetExhaustion === true && (
                          <img
                            src="images/icons/transport.png"
                            alt="Fleet Exhausted"
                            className="mr-icon-20"
                            title="Created after fleet exhausted"
                          />
                        )}
                      </div>
                    )}
                  />
                  <Column
                    field="RouteID"
                    header="Route ID"
                    body={routeIdTemplate}
                    sortable
                  />
                  <Column field="shiftTime" header="Shift" />
                  <Column
                    field="Address"
                    header="Address"
                    body={(rowData) => <AddressColumnTemplate {...rowData} />}
                    sortable
                  />
                  <Column
                    field="Location"
                    header="Location"
                    sortable
                    body={(rowData) => (
                      <AddressColumnTemplate Address={rowData.Location} />
                    )}
                  />
                  <Column field="totalStop" header="Stops" sortable />
                  <Column field="totaldist" header="Total Dist.(Km)" sortable />
                  <Column
                    field="farthestEmployeeDistance"
                    header="Farthest Employee Dist.(Km)"
                    sortable
                  />
                  <Column
                    field="duration"
                    header="Total Time(HH:MM)"
                    body={durationTemplate}
                    sortable
                  />
                  <Column field="vendorname" header="Vendor" sortable />
                  <Column
                    field=""
                    header="Vehicle"
                    sortable
                    body={(rowData) => (
                      <div className="d-flex gap-2">
                        {rowData.varvehicleType === "s" && (
                          <img
                            src="images/icons/letter-s.png"
                            alt="Small"
                            className="mr-icon-20"
                            title="Small"
                          />
                        )}
                        {rowData.varvehicleType === "m" && (
                          <img
                            src="images/icons/letter-m.png"
                            alt="Medium"
                            className="mr-icon-20"
                            title="Medium"
                          />
                        )}
                        {rowData.varvehicleType === "l" && (
                          <img
                            src="images/icons/letter-l.png"
                            alt="Large"
                            className="mr-icon-20"
                            title="Large"
                          />
                        )}
                      </div>
                    )}
                  />
                  {selectedTripType === "D" && (
                    <Column field="stickerno2" header="PF" sortable />
                  )}
                </DataTable>
                <CustomPaginator
                    first={first}
                    rows={rows}
                    totalRecords={memoizedTableData.length}
                    onPageChange={onPageChange}
                    rowsPerPageOptions={[50, 100, 150, 200, 250]}
                />
                <Tooltip target="[data-pr-tooltip]" />
                </>
                )}
              </div>
            </div>
          </div>
        </div>

        <FloatingSelectionPanel
          selectedEmployees={selectedEmployees}
          queryClient={queryClient}
          onClearSelection={handleClearSelection}
          onToggleHold={handleToggleHold}
          isHeld={isSelectionHeld}
          isVisible={showFloatingPanel}
          selectedAction={selectedAction}
          onActionChange={handleActionChange}
          onSplitRoute={handleSplitRoute}
          onDeleteEmployee={handleDeleteFromPanel}
          onCleanupStaleSelections={handleCleanupStaleSelections}
        />

        <FloatingRouteSelectionPanel
          selectedRoutes={new Set(selectedRoutes.map(r => r.RouteID))}
          tableData={memoizedTableData}
          onClearSelection={handleClearRouteSelection}
          onMergeRoutes={handleMergeRoutes}
          isVisible={showFloatingRoutePanel}
          routeSelectionOrder={routeSelectionOrder}
        />

        <OffcanvasRouteDetails
          show={showOffcanvas}
          onClose={() => setShowOffcanvas(false)}
          routeId={selectedRouteId}
        />
        <PrimeDialog
          visible={showProgressDialog}
          onHide={() => { }}
          closable={false}
          draggable={false}
          resizable={false}
          header={
            <div className="mr-progress-header">
              <div className="mr-progress-brand">
                <img src="/images/logo.svg" alt="eTMS" className="mr-progress-logo" />
                <div className="mr-progress-brand-text">
                  <div className="mr-progress-title">OPTIMAR</div>
                  <div className="mr-progress-sub">Routing Engine</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setPollingJobId(null); // stops the job-status polling query
                  prevInProgressJobIdRef.current = null;
                  logic?.actions?.clearInProgressJob?.();
                  setShowProgressDialog(false);
                }}
                className="mr-progress-close"
                title="Close"
                aria-label="Close"
              >
                <i className="pi pi-times" />
              </button>
            </div>
          }
          style={{ width: '420px' }}
          className="p-2 rounded-5 bg-white"
        >
          {/* Running state */}
          {!progressStatus.isError && (
            <div className="mr-progress-body">
              <div className="mr-progress-icon">
                <i className="pi pi-spin pi-spinner" />
              </div>
              <h5 className="mr-progress-h">Generating Routes</h5>
              <p className="mr-progress-msg">{progressStatus.message}</p>
              <ProgressBar value={progressStatus.progress} showValue={false} />
              <p className="mr-progress-note">
                Generation continues in the background — you can close this dialog and work on other shifts.
              </p>
            </div>
          )}

          {/* Error state */}
          {progressStatus.isError && (
            <div className="mr-progress-body">
              <div className="mr-progress-icon mr-progress-icon--error">
                <i className="pi pi-times" />
              </div>
              <h5 className="mr-progress-h">Route Generation Failed</h5>
              <p className="mr-progress-msg mr-progress-msg--tight">{progressStatus.message}</p>
              {progressStatus.errorMessage && (
                <div className="mr-progress-errbox">
                  <p className="mr-progress-errtext">{progressStatus.errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </PrimeDialog>

        <AppConfirmDialog
          visible={showGenerateRouteDialog}
          onHide={() => {
            if (logic?.actions?.setUiState) {
              logic.actions.setUiState({ showGenerateDialog: false });
            } else {
              setShowGenerateRouteDialog(false);
            }
          }}
          title="Generate Routes"
          message={<>This will generate routes for <strong className="mr-accent">{shiftDate}</strong>.</>}
          variant="info"
          confirmLabel="Generate"
          onConfirm={handleGenerateRoute}
        />

        <AppDialog
          visible={showDragDropConfirmDialog}
          onHide={cancelDragDropOperation}
          title={
            pendingDragOperation?.isCrossPageDrop
              ? 'Confirm Cross-Page Move'
              : pendingDragOperation?.isSameRouteReorder
                ? 'Confirm Employee Reorder'
                : 'Confirm Employee Move'
          }
          icon="pi pi-arrows-alt"
          iconColor="#3b82f6"
          size="md"
          variant="info"
          onCancel={cancelDragDropOperation}
          onConfirm={confirmDragDropOperation}
          confirmLabel={pendingDragOperation?.isSameRouteReorder ? 'Confirm Reorder' : 'Confirm Move'}
          isLoading={isLoading}
        >
          {pendingDragOperation && (
            <div className="p-2">
              {pendingDragOperation.employeeKeys.length === 1 ? (
                <p className="mb-3">
                  Are you sure you want to{" "}
                  {pendingDragOperation.isSameRouteReorder ? "reorder" : "move"}{" "}
                  employee{" "}
                  <strong className="text-primary fw-bold">
                    {(() => {
                      const emp = pendingDragOperation.activeData?.employee;
                      if (emp) {
                        const code =
                          emp.empCode || emp.empID || emp.empId || "";
                        const name = emp.empName || emp.name || "";
                        return `${code}${name ? " - " + name : ""}`;
                      }
                      const key = pendingDragOperation.employeeKeys?.[0] || "";
                      const id =
                        typeof key === "string" && key.includes("-")
                          ? key.split("-")[1]
                          : String(key || "");
                      return id || "Selected employee";
                    })()}
                  </strong>{" "}
                  {pendingDragOperation.isCrossPageDrop
                    ? "from held selection"
                    : pendingDragOperation.isSameRouteReorder
                      ? `within Route ${pendingDragOperation.targetRouteId}`
                      : `from Route ${pendingDragOperation.activeData.sourceRouteId}`}{" "}
                  {!pendingDragOperation.isSameRouteReorder && (
                    <>
                      to Route{" "}
                      <strong className="text-primary fw-bold">
                        {pendingDragOperation.targetRouteId}
                      </strong>{" "}
                    </>
                  )}
                  to position{" "}
                  <strong className="text-primary fw-bold">
                    {pendingDragOperation.targetPosition}
                  </strong>{" "}
                  ?
                </p>
              ) : (
                <div>
                  <p className="mb-3">
                    Are you sure you want to{" "}
                    {pendingDragOperation.isSameRouteReorder
                      ? "reorder"
                      : "move"}{" "}
                    <strong className="text-primary fw-bold">
                      {pendingDragOperation.employeeKeys.length} employees
                    </strong>{" "}
                    {pendingDragOperation.isCrossPageDrop
                      ? "from held selection"
                      : pendingDragOperation.isSameRouteReorder
                        ? `within Route ${pendingDragOperation.targetRouteId}`
                        : ""}
                    {!pendingDragOperation.isSameRouteReorder && (
                      <>
                        {" "}
                        to Route{" "}
                        <strong className="text-primary fw-bold">
                          {pendingDragOperation.targetRouteId}
                        </strong>
                      </>
                    )}{" "}
                    to position{" "}
                    <strong className="text-primary fw-bold">
                      {pendingDragOperation.targetPosition}
                    </strong>
                    ?
                  </p>
                  <div className="">
                    <p className="">
                      Selected employees:{" "}
                      <span className="text-primary fw-bold">
                        {" "}
                        {pendingDragOperation.employeeKeys.length}
                        {pendingDragOperation.isCrossPageDrop &&
                          " (from held selection)"}
                        {pendingDragOperation.isSameRouteReorder &&
                          " (reordering within same route)"}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </AppDialog>

        <AppDialog
          visible={showRouteMergeDialog}
          onHide={cancelMergeOperation}
          title="Confirm Route Merge"
          icon="pi pi-share-alt"
          iconColor="#3b82f6"
          size="md"
          variant="info"
          onCancel={cancelMergeOperation}
          onConfirm={confirmMergeOperation}
          confirmLabel="Merge Routes"
          isLoading={isLoading}
        >
          {pendingMergeOperation && (
            <div>
              <p className="app-dialog-body-message mb-3">
                Merge <strong>{pendingMergeOperation.sourceRoutes.length}</strong> route(s) into Route <strong className="text-primary">{pendingMergeOperation.targetRoute}</strong>?
              </p>
              <div className="bg-light p-3 rounded">
                <h6 className="fw-bold mb-2">Warning</h6>
                <ul className="mb-0 ps-3 text-muted mr-fs-13">
                  <li><strong>Route {pendingMergeOperation.targetRoute}</strong> will receive all employees.</li>
                  <li>Source routes ({pendingMergeOperation.sourceRoutes.join(', ')}) will be deleted.</li>
                  <li className="text-danger">This action cannot be undone.</li>
                </ul>
              </div>
            </div>
          )}
        </AppDialog>

        <AppDialog
          visible={showSplitConfirmDialog}
          onHide={cancelSplitOperation}
          title="Confirm Route Split"
          icon="pi pi-sitemap"
          iconColor="#f59e0b"
          size="lg"
          variant="warning"
          onCancel={cancelSplitOperation}
          onConfirm={confirmSplitOperation}
          confirmLabel="Confirm Split"
          isLoading={isLoading}
        >
          {pendingSplitOperation && (
            <div className="p-0">
              <div className="alert alert-info mb-3">
                <strong>Information:</strong> This will create a new route and
                move selected employees.
              </div>

              <p className="mb-3">
                You are about to split{" "}
                <strong>{pendingSplitOperation.employeeIds.length}</strong>{" "}
                employee(s) from Route{" "}
                <strong className="text-primary">
                  {pendingSplitOperation.routeId}
                </strong>
                to a new Route{" "}
                <strong className="text-primary">
                  {pendingSplitOperation.newRouteId}
                </strong>
                .
              </p>

              <div className="row">
                <div className="col-6">
                  <div className="card border-primary">
                    <div className="card-header bg-primary text-white">
                      <strong className="mb-0">
                        Original Route (Remaining):
                      </strong>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <span className="badge bg-primary me-2">KEEP</span>
                        <strong>Route {pendingSplitOperation.routeId}</strong>
                      </div>
                      <small className="d-block mt-1">
                        Remaining employees will stay in this route
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card border-dark">
                    <div className="card-header bg-dark text-white">
                      <strong className="mb-0">New Split Route:</strong>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <span className="badge bg-dark me-2">NEW</span>
                        <strong>
                          Route {pendingSplitOperation.newRouteId}
                        </strong>
                      </div>
                      <small className="d-block mt-1">
                        Selected employees will be moved <br /> here
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AppDialog>

        <MasterSidebar
          show={showDetailsSidebar}
          onClose={() => setShowDetailsSidebar(false)}
          title="Route Statistics"
          width="30%"
        >
          <div className="sidebarBody p-3">
            <div className="statistics-container">
              <div className="row">
                <div className="col-6">
                  <ol className="list-group shadow">
                    <li className="list-group-item d-flex justify-content-between align-items-center fw-bold text-dark bg-tb-head">
                      Vehicles
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/letter-s.png"
                            className="img20"
                            alt="Small Vehicle"
                          />{" "}
                          Small
                        </div>
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.smallVehicleCount || 0}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/letter-m.png"
                            className="img20"
                            alt="Medium Vehicle"
                          />{" "}
                          Medium
                        </div>{" "}
                      </div>
                      <span className="fw-bold">
                        {(statsDetails?.[0]?.mediumVehicleCount || 0)}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/letter-l.png"
                            className="img20"
                            alt="Large Vehicle"
                          />{" "}
                          Large
                        </div>{" "}
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.largeVehicleCount || 0}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/transport.png"
                            className="img20"
                            alt="Unallocated Vehicle"
                          />{" "}
                          Unallocated
                        </div>
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.FleetExhaustionCount || 0}
                      </span>
                    </li>
                  </ol>

                  <ol className="list-group shadow mt-4">
                    <li className="list-group-item d-flex justify-content-between align-items-center fw-bold text-dark bg-tb-head">
                      Employees
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <span className="badge bg-danger-subtle rounded-pill text-dark me-2">
                            F
                          </span>{" "}
                          Female
                        </div>
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.femalecount || 0}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <span className="badge bg-primary-subtle rounded-pill text-dark me-2">
                            M
                          </span>{" "}
                          Male
                        </div>{" "}
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.malecount || 0}
                      </span>
                    </li>
                  </ol>
                </div>
                <div className="col-6">
                  <ol className="list-group shadow">
                    <li className="list-group-item d-flex justify-content-between align-items-center fw-bold text-dark bg-tb-head">
                      Route Types
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/add_guard.png"
                            className="img20"
                            alt="Escort Route"
                          />{" "}
                          Escort
                        </div>
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.guardCount || 0}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/swap.png"
                            className="img20"
                            alt="Swapped Route"
                          />{" "}
                          Swapped
                        </div>
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.swappedCount || 0}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/medical.png"
                            className="img20"
                            alt="Medical Route"
                          />{" "}
                          Medical
                        </div>
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.MedicalCount || 0}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/pwd.png"
                            className="img20"
                            alt="PWD Route"
                          />{" "}
                          PWD
                        </div>
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.PWDCount || 0}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/non-motorable.png"
                            className="img20"
                            alt="NMT Route"
                          />{" "}
                          NMT
                        </div>{" "}
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.NMTCount || 0}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div className="ms-2 me-auto">
                        <div className="fw">
                          <img
                            src="images/icons/oob.png"
                            className="img20"
                            alt="OOB Route"
                          />{" "}
                          OOB
                        </div>{" "}
                      </div>
                      <span className="fw-bold">
                        {statsDetails?.[0]?.OOBCount || 0}
                      </span>
                    </li>
                  </ol>
                </div>
                <div className="col-12 mr-vendor-scroll">
                  <table className="table table-bordered mt-4 shadow">
                    <thead>
                      <tr>
                        <th colSpan="5" className="text-center">
                          Vendor Summary
                        </th>
                      </tr>
                      <tr>
                        <th>Name</th>
                        <th>S</th>
                        <th>M</th>
                        <th>L</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorSummary.length === 0 ? (
                        <tr>
                          <td className="text-center">-</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                          <td className="text-center">0</td>
                        </tr>
                      ) : (
                        vendorSummary.map((vendor, index) => (
                          <tr key={index}>
                            <td>{vendor.vendorname}</td>
                            <td>{vendor.smallvehiclecount}</td>
                            <td>{vendor.mediumvehiclecount}</td>
                            <td>{vendor.largevehiclecount}</td>
                            <td>{vendor.totaltrip}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </MasterSidebar>

        <AppConfirmDialog
          visible={showAutoVendorAllocationDialog}
          onHide={() => setShowAutoVendorAllocationDialog(false)}
          title="Auto Vendor Allocation"
          message="Are you sure you want to automatically allocate the vendor?"
          variant="warning"
          confirmLabel="Allocate"
          onConfirm={confirmAutoVendorAllocation}
          isLoading={isLoading}
        />

        <AppConfirmDialog
          visible={showDeleteEmployeeDialog}
          onHide={() => setShowDeleteEmployeeDialog(false)}
          title="Remove Employee"
          variant="delete"
          confirmLabel="Delete"
          onConfirm={handleDeleteEmployee}
          isLoading={isLoading}
        >
          {pendingDeleteEmployee && (
            <>
              <p className="app-dialog-body-message mb-2">
                Delete <strong className="text-primary">{pendingDeleteEmployee.employee.empName}</strong> from route <strong className="text-primary">{pendingDeleteEmployee.routeId}</strong>?
              </p>
              <p className="app-dialog-body-detail">This action cannot be undone.</p>
            </>
          )}
        </AppConfirmDialog>


        <AppDialog
          visible={showAddEmployeeModal}
          onHide={handleCloseAddEmployeeModal}
          title="Add Employee to Route"
          icon="pi pi-user-plus"
          iconColor="#3b82f6"
          size="lg"
          footer={
            <div className="d-flex gap-2 justify-content-end w-100">
              <Button
                label="Cancel"
                outlined
                onClick={handleCloseAddEmployeeModal}
                disabled={isAddingEmployee}
              />
              <Button
                label={isAddingEmployee ? 'Adding…' : 'Add Employee'}
                onClick={handleAddEmployeeToRoute}
                disabled={!selectedEmployee || !selectedStopNo || isAddingEmployee}
                icon={isAddingEmployee ? 'pi pi-spin pi-spinner' : undefined}
              />
            </div>
          }
        >
          <div className="p-3">
            {selectedRouteId && (
              <div className="mb-3 p-2 rounded mr-route-banner">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <i className="material-icons me-2 mr-route-banner-icon">
                      route
                    </i>
                    <span className="fw-bold">{selectedRouteId}</span>
                  </div>
                  {(() => {
                    const routeEmployees = queryClient.getQueryData(manageRouteKeys.routeDetails(selectedRouteId)) || [];
                    return Array.isArray(routeEmployees) && routeEmployees.length > 0 && (
                      <span className="fw-bold text-primary">
                        {routeEmployees.length} employee
                        {routeEmployees.length !== 1 ? "s" : ""}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="mb-3">
              <span className="fw-semibold mr-fs-14">
                Search Employee
              </span>
              <div className="input-group">
                <InputText
                  value={employeeSearchQuery}
                  onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                  placeholder="Enter employee ID or name..."
                  className="form-control mr-fs-14"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleSearchEmployees()
                  }
                />
                <Button
                  label={isSearching ? "" : "Search"}
                  onClick={handleSearchEmployees}
                  className="btn btn-dark"
                  icon={isSearching ? "pi pi-spinner pi-spin" : "pi pi-search"}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-8">
                {searchResults.length > 0 && (
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-semibold mr-fs-14">
                        Search Results
                      </span>
                      <span className="badge bg-primary">
                        {searchResults.length} &nbsp; Found
                      </span>
                    </div>
                    <div className="table-responsive mr-results-scroll">
                      <table className="table table-hover table-bordered">
                        <thead className="table-dark mr-thead-sticky">
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
                              className={`mr-row-selectable ${selectedEmployee?.id === employee.id ? "mr-row-selected" : ""}`}
                            >
                              <td>
                                <strong>{employee.empCode}</strong>
                              </td>
                              <td>{employee.empName}</td>
                              <td
                                className="mr-ellipsis-150"
                                title={employee.address}
                              >
                                {employee.address}
                              </td>
                              <td>
                                <Button
                                  label={selectedEmployee?.id === employee.id ? "Selected" : "Select"}
                                  className={`btn mr-btn-xs ${selectedEmployee?.id === employee.id ? 'btn-success' : 'btn-outline-secondary'}`}
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
                    <span className="fw-semibold mr-fs-14">
                      Select Stop Position
                    </span>
                    <Dropdown
                      value={selectedStopNo}
                      onChange={(e) => setSelectedStopNo(e.value)}
                      options={availableStopNumbers}
                      placeholder="Choose stop number..."
                      className="w-100 mr-fs-14"
                      optionLabel="label"
                      optionValue="value"
                    />
                    <div className="text-muted mt-2 mr-fs-11">
                      <i className="material-icons me-1 mr-icon-12">
                        info
                      </i>
                      Insert at this position in the route.
                    </div>

                    {selectedStopNo && (
                      <div className="alert alert-success py-2 mt-3 mr-fs-13">
                        <div className="d-flex align-items-center">
                          <i className="material-icons me-2 mr-icon-16">
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
        </AppDialog>

        <AppConfirmDialog
          visible={showUnlockConfirmDialog}
          onHide={() => setShowUnlockConfirmDialog(false)}
          title="Confirm Unlock"
          variant="unlock"
          confirmLabel="Unlock"
          onConfirm={confirmUnlockOperation}
        >
          {pendingUnlock && (
            <>
              <p className="app-dialog-body-message">
                {pendingUnlock.type === 'shift'
                  ? `Unlock all ${pendingUnlock.routeIds.length} finalized routes for this shift?`
                  : `Unlock the selected ${pendingUnlock.routeIds.length} route(s)?`}
              </p>
              <p className="app-dialog-body-detail">This will make them editable again.</p>
            </>
          )}
        </AppConfirmDialog>


        <DragOverlay
          dropAnimation={{
            duration: 400,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeId && draggedEmployee ? (
            <div className="multi-drag-container">
              {selectedEmployees.size > 1 ? (
                <div className="multi-employee-stack">
                  {Array.from({
                    length: Math.min(selectedEmployees.size, 3),
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="employee-card-stack mr-drag-card"
                      style={{
                        // Per-card offsets/rotation are index-derived — stay inline
                        top: -index * 4,
                        left: -index * 4,
                        boxShadow: `0 ${4 + index * 2}px ${16 + index * 4
                          }px rgba(0,0,0,${0.1 + index * 0.05})`,
                        transform: `rotate(${3 + index * 1}deg)`,
                        zIndex: 10 - index,
                        opacity: 1 - index * 0.15,
                      }}
                    >
                      {index === 0 && (
                        <>
                          {draggedEmployee.empCode} - {draggedEmployee.empName}
                          {selectedEmployees.size > 1 && (
                            <div className="employee-count-badge">
                              +{selectedEmployees.size - 1}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="single-employee-drag mr-drag-single">
                  {draggedEmployee.empCode} - {draggedEmployee.empName}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>

        <AppDialog
          visible={showRecalcBeforeFinalizeDialog}
          onHide={() => setShowRecalcBeforeFinalizeDialog(false)}
          title="Recalculation Required"
          icon="pi pi-exclamation-triangle"
          iconColor="#f59e0b"
          size="md"
          variant="warning"
          footer={
            <div className="d-flex gap-2 justify-content-end w-100">
              <Button
                label="Cancel Finalization"
                outlined
                onClick={() => setShowRecalcBeforeFinalizeDialog(false)}
                disabled={isRecalcBeforeFinalize}
              />
              <Button
                label={isRecalcBeforeFinalize ? 'Recalculating…' : 'Recalculate & Finalize'}
                severity="warning"
                onClick={handleRecalculateAndFinalize}
                disabled={isRecalcBeforeFinalize}
                icon={isRecalcBeforeFinalize ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'}
              />
            </div>
          }
        >
          <div className="alert alert-warning mb-3">
            <strong>Routes Need Recalculation!</strong>
          </div>
          <p className="mb-3">
            Some routes have been modified and need to be recalculated before finalization.
            This ensures that all ETAs and distances are up-to-date.
          </p>
          <div className="bg-light p-3 rounded mb-3">
            <h6 className="fw-bold mb-2">What will happen:</h6>
            <ol className="mb-0 ps-3">
              <li>All modified routes will be recalculated with latest ETAs</li>
              <li>Route data will be updated in the system</li>
            </ol>
          </div>
          <p className="text-muted mb-0 small">
            This process may take a few moments depending on the number of routes.
          </p>
        </AppDialog>

        {/* Finalize Confirmation Dialog */}
        <AppConfirmDialog
          visible={showFinalizeConfirmDialog}
          onHide={() => setShowFinalizeConfirmDialog(false)}
          title="Confirm Finalization"
          variant="success"
          confirmLabel={isFinalizing ? 'Finalizing…' : 'Finalize Routes'}
          onConfirm={() => { setShowFinalizeConfirmDialog(false); proceedWithFinalization(); }}
          isLoading={isFinalizing}
        >
          <p className="app-dialog-body-message mb-2">Are you sure you want to finalize the current routes?</p>
          <p className="app-dialog-body-detail">Finalized routes are locked against further changes unless unlocked.</p>
        </AppConfirmDialog>
      </DndContext>
    </>
  );
};

export default ManageRouteDesktop;
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Header from "./Master/Header";
import Sidebar from "./Master/SidebarMenu";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import calendarIcon from "../assets/calendar.png";
import noReportImage from "../assets/no_report.png";
import ManageRouteService from "../services/compliance/ManageRouteService";
import { toastService } from "../services/toastService";
import OffcanvasRouteDetails from "./OffcanvasRouteDetails";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { ProgressBar } from "primereact/progressbar";
import { Dialog as PrimeDialog } from "primereact/dialog";
import { point, Point } from "leaflet";
import axios from "axios";
import { OverlayPanel } from "primereact/overlaypanel";
import { Tooltip } from "primereact/tooltip";
import { DataView } from "primereact/dataview";
import { DataScroller } from 'primereact/datascroller';
import { Badge } from "primereact/badge";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import { useRouteDetailsQuery, manageRouteKeys } from "../hooks/compliance/useManageRouteQueries";
import { set, throttle } from "lodash";
import { ToastContainer } from "react-toastify";

import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  MeasuringStrategy,
} from "@dnd-kit/core";
import SwipeToDeleteBackground from "./SwipeToDeleteBackground";
import Draggable from 'react-draggable';
import ReportButton from "./common/ReportButton";
import CustomPaginator from "./common/CustomPaginator";

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

const PanelContent = React.memo(function PanelContent({
  selectedEmployees,
  selectedEmployeeDetails,
  onClearSelection,
  onToggleHold,
  isHeld,
  onSplitRoute,
  onDeleteEmployee,
  allFromSameRoute,
}) {
  const employeeItemTemplate = useCallback(
    (employee) => {
      const key = `${employee.sourceRouteId}-${employee.id || employee.empID}`;
      return (
        <div
          key={key}
          className="d-flex align-items-center p-2 border-bottom"
          style={{ background: "white" }}
        >
          <div className="flex-grow-1 d-flex align-items-center justify-content-between">
            <div>
              <p className="fw-bold mb-0">
                {employee.empCode} - {employee.empName}
              </p>
              <p className="mb-0" style={{ fontSize: "11px", color: "#666" }}>
                {employee.Location}
              </p>
            </div>
            <div className="d-flex align-items-center">
              <p
                className="ms-3 mb-0"
                style={{ fontSize: "11px", color: "#555" }}
              >
                {employee.routeid}
              </p>
              <Button
                icon="pi pi-trash"
                className="p-button-sm p-button-danger p-button-text ms-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEmployee(employee, employee.sourceRouteId);
                }}
                tooltip="Remove from Route"
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>
        </div>
      );
    },
    [onDeleteEmployee]
  );

  return (
    <>
      {/* Sticky Header */}
      <div
        className="draggable-panel-header"
        style={{
          background: "linear-gradient(90deg, #f5f7fa, #e4e7ec)",
          padding: "12px 16px",
          borderBottom: "1px solid #ddd",
          cursor: "move",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky", // 👈 makes it sticky
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`btn btn-sm ${isHeld ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center gap-2`}
            onClick={onToggleHold}
            disabled={selectedEmployees.size === 0}
          >
            <i className={isHeld ? "pi pi-lock" : "pi pi-arrows-alt"}></i>
            Move Employees
          </button>
          <button
            className="btn btn-sm btn-primary d-flex align-items-center gap-2"
            onClick={onSplitRoute}
            disabled={!allFromSameRoute || selectedEmployees.size === 0}
          >
            <i className="pi pi-sitemap"></i>
            Split Route
          </button>
        </div>

        <button
          className="btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
          onClick={onClearSelection}
          title="Close"
          style={{ width: '30px', height: '30px' }}
        >
          <i className="pi pi-times"></i>
        </button>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "#fafafa",
          padding: "8px 12px",
        }}
      >
        <DataScroller
          value={selectedEmployeeDetails}
          itemTemplate={employeeItemTemplate}
          emptyMessage="No employees selected."
          rows={100}
          buffer={0.4}
          inline
          scrollHeight="100%"
        />
      </div>
    </>
  );
});

const FloatingSelectionPanel = React.memo(
  ({
    selectedEmployees,
    queryClient,
    onClearSelection,
    onToggleHold,
    isHeld,
    isVisible,
    selectedAction,
    onSplitRoute,
    onDeleteEmployee,
    onCleanupStaleSelections,
  }) => {
    // ✅ Move ALL hooks to the top - before any early returns
    const [position, setPosition] = useState({ x: 100, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const elementRef = useRef(null);

    // ✅ Move useMemo here too - always call it
    // Note: We don't do automatic stale cleanup here - it's handled explicitly by delete handlers
    const selectedEmployeeDetails = useMemo(() => {
      const details = [];
      
      if (selectedEmployees) {
        selectedEmployees.forEach((employeeKey) => {
          const lastHyphenIndex = employeeKey.lastIndexOf("-");
          if (lastHyphenIndex === -1) return;

          const routeId = employeeKey.slice(0, lastHyphenIndex);
          const employeeId = employeeKey.slice(lastHyphenIndex + 1);

          const routeEmployees = queryClient.getQueryData(manageRouteKeys.routeDetails(routeId)) || [];
          const employee = routeEmployees.find(
            (e) => String(e.id || e.empID || e.empId) === employeeId
          );

          if (employee) {
            details.push({ ...employee, sourceRouteId: routeId });
          }
        });
      }
      return details;
    }, [selectedEmployees, queryClient]);

    const allFromSameRoute = useMemo(() => {
      const routeIds = selectedEmployeeDetails.map((emp) => emp.sourceRouteId);
      return routeIds.length > 0 && new Set(routeIds).size === 1;
    }, [selectedEmployeeDetails]);

    // ✅ Custom drag handlers - define these always too
    const handleMouseDown = (e) => {
      // Only drag if clicked on the header
      if (e.target.closest('.draggable-panel-header')) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y
        });
      }
    };

    const handleMouseMove = React.useCallback((e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }, [isDragging, dragStart]);

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(false);
    }, []);

    // ✅ useEffect must also always be called
    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // ✅ NOW do the early return - after all hooks
    if (!isVisible) return null;

    return (
      <div
        ref={elementRef}
        onMouseDown={handleMouseDown}
        style={{
          position: "fixed",
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: "520px",
          height: "30vh", // 👈 fixed height
          zIndex: 1101,
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "white",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
          willChange: "transform",
          transition: "box-shadow 0.2s ease-in-out",
          userSelect: 'none', // ✅ Prevent text selection while dragging
          cursor: isDragging ? "grabbing" : "default"
        }}
      >
        <PanelContent
          selectedEmployees={selectedEmployees}
          selectedEmployeeDetails={selectedEmployeeDetails}
          onClearSelection={onClearSelection}
          onToggleHold={onToggleHold}
          isHeld={isHeld}
          onSplitRoute={onSplitRoute}
          onDeleteEmployee={onDeleteEmployee}
          allFromSameRoute={allFromSameRoute}
        />
      </div>
    );
  }
);

// Route Selection Panel Component (This component was not part of the request and remains unchanged)
const FloatingRouteSelectionPanel = React.memo(
  ({
    selectedRoutes,
    tableData,
    onClearSelection,
    onMergeRoutes,
    isVisible,
    routeSelectionOrder,
  }) => {
    // ✅ Move ALL hooks to the top - before any early returns
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const elementRef = useRef(null);

    // ✅ Move useMemo here too - always call it
    const selectedRouteDetails = useMemo(() => {
      return routeSelectionOrder.map((routeId) => {
        const route = tableData.find((r) => r.RouteID === routeId);
        return route || { RouteID: routeId };
      });
    }, [routeSelectionOrder, tableData]);

    // ✅ Custom drag handlers - define these always too
    const handleMouseDown = (e) => {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    };

    const handleMouseMove = React.useCallback((e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }, [isDragging, dragStart]);

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(false);
    }, []);

    // ✅ useEffect must also always be called
    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Route item template - matching employee item template structure
    const routeItemTemplate = useCallback((route, index) => {
      const isTarget = index === 0 && selectedRoutes.size >= 2;
      return (
        <div
          key={route.RouteID}
          className="d-flex align-items-center p-2 border-bottom"
          style={{ background: "white" }}
        >
          <div className="flex-grow-1 d-flex align-items-center justify-content-between">
            <div>
              <p className="fw-bold mb-0">
                Route {route.RouteID} {isTarget && <span className="badge bg-success ms-2">TARGET</span>}
                {!isTarget && selectedRoutes.size >= 2 && <span className="badge bg-danger ms-2">SOURCE</span>}
              </p>
              <p className="mb-0" style={{ fontSize: "11px", color: "#666" }}>
                {route.totalStop || 0} stops • {route.vendorname || "No vendor"}
                {route.totaldist && <span> • {route.totaldist}km</span>}
              </p>
            </div>
            <div className="d-flex align-items-center">
              <div className="d-flex gap-1">
                {route.isPWDRoute && (
                  <img
                    src="images/icons/pwd.png"
                    alt="PWD"
                    style={{ width: "12px", height: "12px" }}
                  />
                )}
                {route.isOOBRoute && (
                  <img
                    src="images/icons/oob.png"
                    alt="OOB"
                    style={{ width: "12px", height: "12px" }}
                  />
                )}
                {route.isNMTRoute && (
                  <img
                    src="images/icons/non-motorable.png"
                    alt="NMT"
                    style={{ width: "12px", height: "12px" }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }, [selectedRoutes.size]);

    // ✅ NOW do the early return - after all hooks
    if (!isVisible || selectedRoutes.size === 0) {
      return null;
    }

    return (
      <div
        ref={elementRef}
        style={{
          position: "fixed",
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: "520px",
          height: "30vh", // 👈 fixed height same as FloatingSelectionPanel
          zIndex: 1101,
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "white",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
          willChange: "transform",
          transition: "box-shadow 0.2s ease-in-out",
          userSelect: 'none'
        }}
      >
        {/* Sticky Header - Same styling as FloatingSelectionPanel */}
        <div
          className="draggable-panel-header"
          onMouseDown={handleMouseDown}
          style={{
            background: "linear-gradient(90deg, #f5f7fa, #e4e7ec)",
            padding: "12px 16px",
            borderBottom: "1px solid #ddd",
            cursor: isDragging ? "grabbing" : "move",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky", // 👈 makes it sticky
            top: 0,
            zIndex: 5,
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn btn-sm btn-success d-flex align-items-center gap-2"
              onClick={onMergeRoutes}
              disabled={selectedRoutes.size < 2}
            >
              <i className="pi pi-sitemap"></i>
              Merge Routes
            </button>
          </div>

          <button
            className="btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
            onClick={onClearSelection}
            title="Close"
            style={{ width: '30px', height: '30px' }}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* Scrollable Content - Same styling as FloatingSelectionPanel */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#fafafa",
            padding: "8px 12px",
          }}
        >
          <DataView
            value={selectedRouteDetails}
            itemTemplate={(route, index) => routeItemTemplate(route, index)}
            emptyMessage="No routes selected."
            rows={100}
            scrollHeight="100%"
          />
          
          {selectedRoutes.size === 1 && (
            <div className="text-center text-muted py-3">
              <small>Select at least one more route to enable merging</small>
            </div>
          )}
        </div>
      </div>
    );
  }
);

// Enhanced Drop Zone Component for cross-page drops
const CrossPageDropZone = React.memo(
  ({ routeId, position, isActive, onDrop, selectedEmployees }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = useCallback(() => {
      if (isActive) {
        onDrop(routeId, position);
      }
    }, [isActive, onDrop, routeId, position]);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    const style = useMemo(
      () => ({
        height: isHovered ? "50px" : "12px",
        backgroundColor: isActive
          ? isHovered
            ? "#bbdefb"
            : "#e3f2fd"
          : "transparent",
        border: isActive ? "3px dashed #2196F3" : "2px dashed transparent",
        borderRadius: "6px",
        margin: "4px 0",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        color: "#2196F3",
        fontWeight: "bold",
        cursor: isActive ? "pointer" : "default",
        animation: isActive ? "pulseGlow 1.5s ease-in-out infinite" : "none",
      }),
      [isActive, isHovered]
    );

    if (!isActive) return null;

    return (
      <div
        className="cross-page-drop-zone"
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {isHovered &&
          `Click to drop ${selectedEmployees?.size || 0
          } employee(s) at position ${position}`}
      </div>
    );
  }
);

// Optimized Drop Zone Indicator Component
const DropZoneIndicator = React.memo(({ routeId, position, isOver }) => {
  const { setNodeRef } = useDroppable({
    id: `dropzone-${routeId}-${position}`,
    data: {
      targetRouteId: routeId,
      targetPosition: position,
      type: "position",
    },
  });

  const style = useMemo(
    () => ({
      height: isOver ? "40px" : "8px",
      backgroundColor: isOver ? "#e3f2fd" : "transparent",
      border: isOver ? "2px dashed #2196F3" : "2px dashed transparent",
      borderRadius: "4px",
      margin: "2px 0",
      transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      color: "#2196F3",
      fontWeight: "bold",
      willChange: "height, background-color, border-color",
      transform: "translateZ(0)",
    }),
    [isOver]
  );

  return (
    <div
      ref={setNodeRef}
      className={`drop-zone ${isOver ? "drop-zone-active" : ""}`}
      style={style}
    >
      {isOver && `Drop here at position ${position}`}
    </div>
  );
});

// [MODIFIED] DraggableEmployeeRow now returns a DIV instead of a TR
const DraggableEmployeeRow = React.memo(
  ({
    employee,
    routeId,
    index,
    isSelected,
    onSelectionChange,
    selectedCount,
    activeId,
    selectedEmployees,
    isDragInProgress,
    selectedAction,
    onDeleteEmployee,
    isEditable,
  }) => {
    const employeeKey = `${routeId}-${employee.id || employee.empID}`;

    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: `employee-${routeId}-${employee.id || employee.empID}-${index}`,
        data: {
          employee: {
            ...employee,
            id: employee.id || employee.empID || employee.empId,
          },
          sourceRouteId: routeId,
          type: "employee",
          isMultiSelect: isSelected && selectedCount > 1,
          selectedCount: isSelected ? selectedCount : 1,
        },
        disabled: !isEditable || selectedAction === 'split',
      });

    const shouldAppearDragged =
      isDragging ||
      (isDragInProgress && isSelected && selectedEmployees.size > 1);

    const swipeTranslateX = transform ? transform.x : 0;

    const foregroundStyle = useMemo(
      () => ({
        transform: `translateX(${swipeTranslateX}px)`,
        backgroundColor: employee.isNewAdded
          ? "#e8f5e9" // Light green for newly added employees
          : isSelected
            ? selectedAction === 'split'
              ? "#d1ecf1"
              : "#e3f2fd"
            : "#fff",
        position: "relative",
        zIndex: 2,
        transition: isDragging ? "none" : "transform 0.3s ease",
        willChange: "transform",
        borderLeft: employee.isNewAdded ? "4px solid #4caf50" : "none",
      }),
      [swipeTranslateX, isSelected, selectedAction, isDragging, employee.isNewAdded]
    );

    const rowStyle = useMemo(
      () => ({
        position: "relative",
        opacity: shouldAppearDragged ? 0.3 : 1,
        cursor: "default",
        border: isSelected
          ? selectedAction === 'split'
            ? "2px solid #17a2b8"
            : "2px solid #2196F3"
          : "1px solid transparent",
        transition: shouldAppearDragged
          ? "none"
          : "opacity 0.2s ease-out, border-color 0.2s ease-out",
        boxShadow: isSelected
          ? selectedAction === 'split'
            ? "0 2px 8px rgba(23, 162, 184, 0.3)"
            : "0 2px 8px rgba(33, 150, 243, 0.3)"
          : "none",
      }),
      [isDragging, isSelected, shouldAppearDragged, selectedAction]
    );

    const handleCheckboxChange = useCallback(
      (e) => {
        e.stopPropagation();
        onSelectionChange(employeeKey, routeId);
      },
      [onSelectionChange, employeeKey, routeId]
    );

    return (
      <div
        style={rowStyle}
        className={`draggable-row ${shouldAppearDragged ? "dragging-multi" : ""
          } ${isSelected ? "selected" : ""}`}
      >
        <SwipeToDeleteBackground
          isActive={isDragging}
          swipeProgress={swipeTranslateX}
        />
        <div
          ref={setNodeRef}
          style={foregroundStyle}
          className="row d-flex align-items-center justify-content-start py-2"
        >
          {/* Column 1: Actions - Always show checkbox */}
          <div className="col-1">
            <div className="d-flex align-items-center">
              {/* Always show checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                className="form-check-input me-2"
                onClick={(e) => e.stopPropagation()}
                style={{ cursor: isEditable ? 'pointer' : 'not-allowed' }}
                disabled={!isEditable}
              />

              {/* Show drag handle only when not in split mode */}
              {selectedAction !== 'split' && (
                <span
                  className="material-icons drag-handle"
                  style={{ fontSize: "20px", cursor: isEditable ? "grab" : "not-allowed" }}
                  {...attributes}
                  {...listeners}
                >
                  drag_indicator
                </span>
              )}

              {/* Icons */}
              <div className="d-flex gap-1">
                {employee.isPWD && (
                  <img
                    src="images/icons/pwd.png"
                    alt="PWD"
                    style={{ width: "16px", height: "16px" }}
                    title="PWD"
                  />
                )}
                {employee.isOOB && (
                  <img
                    src="images/icons/oob.png"
                    alt="OOB"
                    style={{ width: "16px", height: "16px" }}
                    title="OOB"
                  />
                )}
                {employee.isNMT && (
                  <img
                    src="images/icons/non-motorable.png"
                    alt="NMT"
                    style={{ width: "16px", height: "16px" }}
                    title="Non Motorable"
                  />
                )}
                {employee.isMedical && (
                  <img
                    src="images/icons/medical.png"
                    alt="Medical"
                    style={{ width: "16px", height: "16px" }}
                    title="Medical Required"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Employee */}
          <div className="col-2">
            {`${employee.empCode} - ${employee.empName}`}
            {employee.isNewAdded && (
              <span 
                className="badge ms-2" 
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                data-pr-tooltip="Added via Replication Exception"
                data-pr-position="top"
              >
                NEW
              </span>
            )}
          </div>

          {/* Column 3: Gender */}
          <div className="col-1">
            <span className="me-2">
              {employee.Gender === "M" ? (
                <span className="badge bg-primary-subtle rounded-pill text-dark">
                  M
                </span>
              ) : employee.Gender === "F" ? (
                <span className="badge bg-danger-subtle rounded-pill text-dark">
                  F
                </span>
              ) : null}
            </span>
          </div>

          {/* Column 4 & 5: Address & Location */}
          <div className="col-2">
            <span 
              data-pr-tooltip={employee.address || ""} 
              data-pr-position="top"
              style={{
                width: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
                cursor: "pointer",
              }}>
              {employee.address || ""}
            </span>
          </div>
          <div className="col-2">
            <span 
              data-pr-tooltip={employee.Location || ""} 
              data-pr-position="top"
              style={{
                width: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "inline-block",
                cursor: "pointer",
              }}>
              {employee.Location || ""}
            </span>
          </div>

          {/* Column 6 & 7: Shift & Trip */}
          <div className="col-1">{employee.Shift}</div>
          <div className="col-1">{employee.tripType}</div>

          {/* Column 8: Stop */}
          <div className="col-1">
            <InputText
              value={employee.stopNo} className="w-100"
              readOnly
            />
          </div>

          {/* Column 9: ETA */}
          <div className="col-1">
            <InputText
              value={`${employee.ETAhh || "00"}:${employee.ETAmm || "00"}`}
              style={{ width: "85px" }}
              readOnly
            />
          </div>
        </div>
      </div>
    );
  }
);

// Memoize template functions outside the component
const AddressColumnTemplate = React.memo((rowData) => {
  const maxLength = 40;
  const fullText = rowData.Address || "";
  const trimmedText =
    fullText.length > maxLength
      ? fullText.slice(0, maxLength) + "..."
      : fullText;

  return (
    <span
      data-pr-tooltip={fullText}
      data-pr-position="top"
      style={{
        cursor: "pointer",
        display: "inline-block",
        maxWidth: 200,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      {trimmedText}
    </span>
  );
});

const addressColumnTemplate = React.memo((rowData) => {
  const maxLength = 40;
  const fullText = rowData.address || "";
  const trimmedText =
    fullText.length > maxLength
      ? fullText.slice(0, maxLength) + "..."
      : fullText;

  return (
    <span
      data-pr-tooltip={fullText}
      data-pr-position="top"
      style={{
        cursor: "pointer",
        display: "inline-block",
        maxWidth: 200,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      {trimmedText}
    </span>
  );
});
const RouteExpansionDetails = React.memo(({
  routeId,
  isEditable,
  crossPageDropMode,
  selectedEmployees,
  selectedAction,
  activeId,
  hoveredDropZone,
  onCrossPageDrop,
  onEmployeeSelection,
  onDeleteEmployee,
  onAddEmployee,
}) => {
  const { data: employees = [], isLoading, isError } = useRouteDetailsQuery(routeId);

  // Memoize empty check to prevent flickering
  const hasEmployees = employees && employees.length > 0;

  if (isLoading) {
      return (
        <div className="bg-custom">
          <div className="p-4 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading route details...</p>
          </div>
        </div>
      );
  }

  if (isError) {
      return (
        <div className="bg-custom p-3">
          <div className="alert alert-danger">Failed to load route details.</div>
        </div>
      );
  }
    
  return (
        <div className="bg-custom">
          {!isEditable && (
            <div className="alert alert-warning text-center small p-2 mb-0">
              This route is finalized and is now view-only. All operations are disabled.
            </div>
          )}
          <div className="p-0">
            {/* Flexbox Header - Replaces <thead> */}
            <div className="row" style={{ fontSize: '12px', background: '#f8f9fa', padding: '8px 0', fontWeight: 'bold' }}>
              <div className="col-1">Select/Actions</div>
              <div className="col-2">Employee</div>
              <div className="col-1"></div>
              <div className="col-2">Address</div>
              <div className="col-2">Location</div>
              <div className="col-1">Shift</div>
              <div className="col-1">Trip</div>
              <div className="col-1">Stop</div>
              <div className="col-1">ETA</div>
            </div>

            {/* Body Container - Replaces <tbody> */}
            <div>
              {!hasEmployees ? (
                <>
                  <div>
                    {isEditable && (
                      <CrossPageDropZone
                        routeId={routeId}
                        position={1}
                        isActive={crossPageDropMode}
                        onDrop={onCrossPageDrop}
                        selectedEmployees={selectedEmployees}
                      />
                    )}
                    {isEditable && selectedAction !== 'split' && (
                      <DropZoneIndicator
                        routeId={routeId}
                        position={1}
                        isOver={
                          activeId &&
                          hoveredDropZone ===
                          `dropzone-${routeId}-1`
                        }
                      />
                    )}
                  </div>
                  <div
                    className="text-center p-4"
                    style={{ color: "#666" }}
                  >
                    No employees in this route.
                    {isEditable && crossPageDropMode ? (
                      <span className="text-primary">
                        {" "}
                        Click above to drop employees here.
                      </span>
                    ) : isEditable && selectedAction === 'split' ? (
                      <span>
                        {" "}
                        Select another route with employees to split.
                      </span>
                    ) : isEditable ? (
                      <span>
                        {" "}
                        Drag employees from other routes to add them here.
                      </span>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    {isEditable && (
                      <CrossPageDropZone
                        routeId={routeId}
                        position={1}
                        isActive={crossPageDropMode}
                        onDrop={onCrossPageDrop}
                        selectedEmployees={selectedEmployees}
                      />
                    )}
                    {isEditable && selectedAction !== 'split' && (
                      <DropZoneIndicator
                        routeId={routeId}
                        position={1}
                        isOver={
                          activeId &&
                          hoveredDropZone ===
                          `dropzone-${routeId}-1`
                        }
                      />
                    )}
                  </div>

                  {employees.map((employee, index) => {
                    const employeeKey = `${routeId}-${employee.id || employee.empID}`;
                    const isSelected = selectedEmployees.has(employeeKey);

                    return (
                      <React.Fragment key={employeeKey}>
                        <DraggableEmployeeRow
                          employee={employee}
                          routeId={routeId}
                          index={index}
                          isSelected={isSelected}
                          onSelectionChange={onEmployeeSelection}
                          selectedCount={selectedEmployees.size}
                          activeId={activeId}
                          selectedEmployees={selectedEmployees}
                          isDragInProgress={!!activeId}
                          selectedAction={selectedAction}
                          isEditable={isEditable}
                          onDeleteEmployee={onDeleteEmployee}
                        />
                        {isEditable && selectedAction !== 'split' && (
                          <div>
                            <CrossPageDropZone
                              routeId={routeId}
                              position={index + 2}
                              isActive={crossPageDropMode}
                              onDrop={onCrossPageDrop}
                              selectedEmployees={selectedEmployees}
                            />
                            <DropZoneIndicator
                              routeId={routeId}
                              position={index + 2}
                              isOver={
                                activeId &&
                                hoveredDropZone ===
                                `dropzone-${routeId}-${index + 2}`
                              }
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer with Add Employee Button */}
            <div
              className="d-flex justify-content-between align-items-center p-3 border-top"
              style={{ backgroundColor: "#f8f9fa" }}
            >
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                  onClick={() => onAddEmployee(routeId)}
                  style={{
                    borderRadius: "20px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                  }}
                  disabled={!isEditable}
                >
                  <i className="material-icons" style={{ fontSize: "16px" }}>
                    person_add
                  </i>
                  Add Employee
                </button>
              </div>

              <div className="text-muted" style={{ fontSize: "12px" }}>
                <i className="material-icons me-1" style={{ fontSize: "14px" }}>
                  info
                </i>
                {employees.length} employee{employees.length !== 1 ? "s" : ""}{" "}
                in this route
              </div>
            </div>
          </div>
        </div>
  );
});

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
  const userID = sessionStorage.getItem("ID");
  const queryClient = useQueryClient(); // Initialize Query Client

  // Refs
  const toast = useRef(null);
  const fileInputRef = useRef(null);
  const selectedRouteForSplitRef = useRef(null);

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
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  const [hoveredDropZone, setHoveredDropZone] = useState(null);

  // UPDATED: Employee selection states with action selection
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [selectedAction, setSelectedAction] = useState('multiSelect'); // Default to multiSelect
  const [selectionStartRoute, setSelectionStartRoute] = useState(null);

  // Route selection states
  const [selectedRoutes, setSelectedRoutes] = useState([]); // Use an array for the selection state
  const [isRouteSelectMode, setIsRouteSelectMode] = useState(false);
  const [showFloatingRoutePanel, setShowFloatingRoutePanel] = useState(false);
  const [showRouteMergeDialog, setShowRouteMergeDialog] = useState(false);
  const [pendingMergeOperation, setPendingMergeOperation] = useState(null);
  const [routeSelectionOrder, setRouteSelectionOrder] = useState([]);

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

  // Auto-expand states
  const [autoExpandTimer, setAutoExpandTimer] = useState(null);
  const [hoveredRouteId, setHoveredRouteId] = useState(null);
  const AUTO_EXPAND_DELAY = 800;

  // Cross-page functionality states
  const [isSelectionHeld, setIsSelectionHeld] = useState(false);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [crossPageDropMode, setCrossPageDropMode] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  // Unlock feature states
  const [isShiftLocked, setIsShiftLocked] = useState(false);
  const [isUnlockMode, setIsUnlockMode] = useState(false);
  const [routesToUnlock, setRoutesToUnlock] = useState(new Set());
  const [showUnlockConfirmDialog, setShowUnlockConfirmDialog] = useState(false);
  const [pendingUnlock, setPendingUnlock] = useState(null);

  // New state for initial no data report
  // Initialize based on routes data (in case switching back from mobile view)
  const [hasSearched, setHasSearched] = useState(routes?.length > 0);
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
  const [showRecalcBeforeFinalizeDialog, setShowRecalcBeforeFinalizeDialog] = useState(false);
  const [showFinalizeConfirmDialog, setShowFinalizeConfirmDialog] = useState(false);
  const [isRecalcBeforeFinalize, setIsRecalcBeforeFinalize] = useState(false);
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

  const throttledHandleDragOver = useMemo(
    () =>
      throttle((event) => {
        const { over } = event;
        if (
          over &&
          over.data.current &&
          over.data.current.type === "position"
        ) {
          setHoveredDropZone(over.id);
        } else {
          setHoveredDropZone(null);
        }
      }, 16),
    []
  );

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

  // Optimized sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const customCollisionDetection = useCallback((args) => {
    const pointerIntersections = pointerWithin(args);

    if (pointerIntersections.length > 0) {
      return pointerIntersections;
    }

    return closestCenter(args);
  }, []);

  // [MODIFIED] Employee selection handler to keep panel open
  const handleEmployeeSelection = useCallback(
    (employeeKey, routeId) => {
      setSelectedEmployees((prev) => {
        const newSelection = new Set(prev);

        if (newSelection.has(employeeKey)) {
          newSelection.delete(employeeKey);
          // When selection becomes empty, reset related states but keep panel open
          if (newSelection.size === 0) {
            setSelectionStartRoute(null);
            setIsSelectionHeld(false);
            setCrossPageDropMode(false);
            setSelectedAction('multiSelect'); // Revert to default action
            // NOTE: The line to hide the panel `setShowFloatingPanel(false)` is intentionally removed.
          }
        } else {
          newSelection.add(employeeKey);
          if (!selectionStartRoute) {
            setSelectionStartRoute(routeId);
          }
          // Always ensure the panel is visible when there's a selection
          setShowFloatingPanel(true);
        }

        return newSelection;
      });
    },
    [selectionStartRoute]
  );


  // Action change handler
  const handleActionChange = useCallback((action) => {
    setSelectedAction(action);
    if (action === 'multiSelect') {
      setIsSelectionHeld(false);
      setCrossPageDropMode(false);
    }
  }, []);

  // Toggle hold functionality
  const handleToggleHold = useCallback(() => {
    // This function will now also set the correct action mode.
    setSelectedAction('multiSelect');

    setIsSelectionHeld((prev) => {
      const newHeld = !prev;
      setCrossPageDropMode(newHeld);
      if (newHeld) {
        toastService.info(
          "Selection held - click on any route to drop employees"
        );
      } else {
        toastService.info("Selection released");
      }
      return newHeld;
    });
  }, []);

  // Clear selection handler
  const handleClearSelection = useCallback(() => {
    setSelectedEmployees(new Set());
    setSelectionStartRoute(null);
    setShowFloatingPanel(false);
    setIsSelectionHeld(false);
    setCrossPageDropMode(false);
    setSelectedAction('multiSelect');
  }, []);

  // Cleanup stale selections (called when employees no longer exist in cache)
  const handleCleanupStaleSelections = useCallback((staleKeys) => {
    setSelectedEmployees((prev) => {
      const newSelection = new Set(prev);
      staleKeys.forEach((key) => newSelection.delete(key));
      
      // If all selections were stale, hide the panel
      if (newSelection.size === 0) {
        setShowFloatingPanel(false);
        setIsSelectionHeld(false);
        setCrossPageDropMode(false);
      }
      
      return newSelection;
    });
  }, []);

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
    const routeEmployees = routeDetails[routeId] || [];
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

  const handleClearRouteSelection = useCallback(() => {
    setSelectedRoutes([]); // Clear the array
    setRouteSelectionOrder([]);
  }, []);

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

  // Auto-expand handlers
  const handleRouteRowEnter = useCallback(
    (event) => {
      if (!activeId) return;

      const routeId = event.data.RouteID;
      setHoveredRouteId(routeId);

      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
      }

      if (expandedRows && expandedRows[routeId]) {
        return;
      }

      const timer = setTimeout(() => {
        setExpandedRows((prev) => ({
          ...prev,
          [routeId]: true,
        }));

        toastService.info(`Route ${routeId} expanded for dropping`);
      }, AUTO_EXPAND_DELAY);

      setAutoExpandTimer(timer);
    },
    [activeId, expandedRows, autoExpandTimer]
  );

  const handleRouteRowLeave = useCallback(
    (event) => {
      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
        setAutoExpandTimer(null);
      }
      setHoveredRouteId(null);
    },
    [autoExpandTimer]
  );

  // Fetch functions
  // fetchFacilities and fetchShifts removed (data provided via props)

  const refreshRouteDetails = useCallback(async (routeId) => {
    // Deprecated: RouteDetails now managed by React Query
    queryClient.invalidateQueries(manageRouteKeys.routeDetails(routeId));
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

  useEffect(() => {
    return () => {
      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
      }
    };
  }, [autoExpandTimer]);

  useEffect(() => {
    if (isRouteSelectMode) {
      setShowFloatingRoutePanel(selectedRoutes.length > 0);
    } else {
      setShowFloatingRoutePanel(false);
    }
  }, [selectedRoutes.length, isRouteSelectMode]);

  // Update locked state based on route finalization status
  useEffect(() => {
    if (tableData?.length > 0) {
      const hasFinalizedRoutes = tableData.some((route) => route.isRouteFinalized === 1);
      setIsShiftLocked(hasFinalizedRoutes);

      // Best Practice: Ensure we exit unlock mode if no finalized routes exist
      // to prevents UI from being in an invalid state
      if (!hasFinalizedRoutes && isUnlockMode) {
        setIsUnlockMode(false);
        setRoutesToUnlock(new Set());
      }
    } else {
      setIsShiftLocked(false);
      if (isUnlockMode) {
        setIsUnlockMode(false);
        setRoutesToUnlock(new Set());
      }
    }
  }, [tableData, isUnlockMode]);
  
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
      setHasSearched(true);
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
      setHasSearched(true); // Ensure image is hidden when clicking a route ID


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
          className="cursor-pointer text-primary"
          onClick={() => handleRouteIdClick(rowData.RouteID)}
          style={{ cursor: "pointer", color: "#4285F4", fontWeight: "bold" }}
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
  // Drag and Drop Handlers
  const handleDragStart = useCallback(
    (event) => {
      setActiveId(event.active.id);
      const activeData = event.active.data.current;

      if (activeData && activeData.type === "employee") {
        setDraggedEmployee(activeData.employee);

        const employeeKey = `${activeData.sourceRouteId}-${activeData.employee.id}`;

        if (selectedAction === 'multiSelect') {
          if (!selectedEmployees.has(employeeKey)) {
            setSelectedEmployees((prev) => {
              const newSelection = new Set(prev);
              newSelection.add(employeeKey);
              return newSelection;
            });
            if (!selectionStartRoute) {
              setSelectionStartRoute(activeData.sourceRouteId);
            }
          }
        } else {
          setSelectedEmployees(new Set([employeeKey]));
          setSelectionStartRoute(activeData.sourceRouteId);
        }
      }
    },
    [selectedEmployees, selectedAction, selectionStartRoute]
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over, delta } = event;

      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
        setAutoExpandTimer(null);
      }
      setHoveredRouteId(null);
      setActiveId(null);
      setDraggedEmployee(null);
      setHoveredDropZone(null);

      const activeData = active.data.current;

      // Swipe to delete logic
      if (
        delta.x > SWIPE_DELETE_THRESHOLD &&
        activeData.type === "employee" &&
        selectedAction !== 'split'
      ) {
        const employeeToDelete = activeData.employee;
        const sourceRouteId = activeData.sourceRouteId;

        setPendingDeleteEmployee({
          employee: employeeToDelete,
          routeId: sourceRouteId,
        });
        setShowDeleteEmployeeDialog(true);
        return;
      }

      if (!over) {
        return;
      }

      const overData = over.data.current;

      if (
        activeData &&
        overData &&
        activeData.type === "employee" &&
        overData.type === "position"
      ) {
        const employeesToMove =
          selectedEmployees.size > 0
            ? Array.from(selectedEmployees)
            : [`${activeData.sourceRouteId}-${activeData.employee.id}`];

        const targetRouteId = overData.targetRouteId;
        const targetPosition = overData.targetPosition;
        const sourceRoutes = [
          ...new Set(employeesToMove.map((key) => key.split("-")[0])),
        ];

        let shouldShowConfirmation = false;
        let isSameRouteReorder = false;

        if (sourceRoutes.some((routeId) => routeId !== targetRouteId)) {
          shouldShowConfirmation = true;
        } else if (
          sourceRoutes.length === 1 &&
          sourceRoutes[0] === targetRouteId
        ) {
          const routeEmployees = queryClient.getQueryData(manageRouteKeys.routeDetails(targetRouteId)) || [];
          const currentPositions = employeesToMove.map((employeeKey) => {
            const [, employeeId] = employeeKey.split("-");
            const employeeIndex = routeEmployees.findIndex(
              (emp) => String(emp.id || emp.empID || emp.empId) === employeeId
            );
            return employeeIndex + 1;
          });

          const isSingleEmployee = employeesToMove.length === 1;
          const isSamePosition =
            isSingleEmployee && currentPositions[0] === targetPosition;
          const isNoOp = isSingleEmployee && isSamePosition;

          if (!isNoOp) {
            shouldShowConfirmation = true;
            isSameRouteReorder = true;
          }
        }

        if (shouldShowConfirmation) {
          setPendingDragOperation({
            employeeKeys: employeesToMove,
            targetRouteId: targetRouteId,
            targetPosition: targetPosition,
            activeData,
            overData,
            isCrossPageDrop: false,
            isSameRouteReorder: isSameRouteReorder,
          });
          setShowDragDropConfirmDialog(true);
        }
      }
    },
    [selectedEmployees, autoExpandTimer, queryClient, selectedAction]
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

      const response = await ManageRouteService.UpdateCutPaste(requestPayload);

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
  }, [pendingDragOperation, userID, queryClient, handleClearSelection, handleSubmit]);

  const cancelDragDropOperation = useCallback(() => {
    setShowDragDropConfirmDialog(false);
    setPendingDragOperation(null);
  }, []);

  // Route merge handlers
  const handleMergeRoutes = useCallback(() => {
    if (selectedRoutes.length < 2) {
      toastService.warn("Please select at least 2 routes to merge");
      return;
    }

    const routeArray = Array.from(routeSelectionOrder);
    const targetRoute = routeArray[0];
    const sourceRoutes = routeArray.slice(1);

    setPendingMergeOperation({
      sourceRoutes,
      targetRoute,
      routeArray,
    });

    setShowRouteMergeDialog(true);
  }, [routeSelectionOrder, selectedRoutes.length]);

  const confirmMergeOperation = useCallback(async () => {
    if (!pendingMergeOperation) return;

    try {
      setShowRouteMergeDialog(false);
      setIsSubmitting(true);

      const requestPayload = {
        RouteIDs: pendingMergeOperation.routeArray.join(","),
        userid: Number(parseInt(userID) || 0),
      };

      const response = await ManageRouteService.MergeRoute(requestPayload);

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
  }, [pendingMergeOperation, userID, handleClearRouteSelection, handleSubmit]);

  const cancelMergeOperation = useCallback(() => {
    setShowRouteMergeDialog(false);
    setPendingMergeOperation(null);
  }, []);

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

      const response = await ManageRouteService.SplitRoute(requestPayload);

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
  }, [pendingSplitOperation, handleClearSelection, handleSubmit]);

  const cancelSplitOperation = useCallback(() => {
    setShowSplitConfirmDialog(false);
    setPendingSplitOperation(null);
  }, []);

  // Recalculation handlers
  const checkIfRecalculationNeeded = useCallback(async () => {
    try {
      const inputJsonResponse =
        await ManageRouteService.GetInputJsonRecalculate({
          shiftdate: shiftDate,
          shifttime: selectedShifts,
          facilityid: selectedFacility,
          triptype: selectedTripType,
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
  }, [shiftDate, selectedShifts, selectedFacility, selectedTripType]);

  const handleRecalculateModifiedRoutes = useCallback(async () => {
    setIsSubmitting(true);
    setIsRecalculating(true); // Start specific loading
    toastService.info("Fetching data for all modified routes...");

    try {
      const inputJsonResponse =
        await ManageRouteService.GetInputJsonRecalculate({
          shiftdate: shiftDate,
          shifttime: selectedShifts,
          facilityid: selectedFacility,
          triptype: selectedTripType,
        });

      const inputJsonData =
        typeof inputJsonResponse === "string"
          ? JSON.parse(inputJsonResponse)
          : inputJsonResponse;

      if (
        !inputJsonData ||
        !inputJsonData.routes ||
        inputJsonData.routes.length === 0
      ) {
        toastService.info("No routes to be recalculated.");
        setIsSubmitting(false);
        setIsRecalculating(false); // Stop specific loading
        return;
      }

      toastService.info("Sending data for recalculation...");

      const recalculatedRouteJson = await ManageRouteService.recalculateRoutes(inputJsonData);

      await ManageRouteService.updateRouteMapbased({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
        jsonstring: JSON.stringify(recalculatedRouteJson),
        updatedBy: userID,
      });

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

  // Unlock handlers
  const handleSelectRouteToUnlock = useCallback((routeId) => {
    setRoutesToUnlock((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(routeId)) {
        newSelection.delete(routeId);
      } else {
        newSelection.add(routeId);
      }
      return newSelection;
    });
  }, []);

  const handleUnlockShift = () => {
    const finalizedRoutes = tableData
      .filter(route => route.isRouteFinalized === 1)
      .map(route => route.RouteID);

    if (finalizedRoutes.length === 0) {
      toastService.info("No finalized routes to unlock in this shift.");
      return;
    }

    setPendingUnlock({
      routeIds: finalizedRoutes,
      type: 'shift',
    });
    setShowUnlockConfirmDialog(true);
  };

  const handleUnlockSelectedRoutes = () => {
    if (routesToUnlock.size === 0) {
      toastService.warn("Please select routes to unlock.");
      return;
    }
    setPendingUnlock({
      routeIds: Array.from(routesToUnlock),
      type: 'routes',
    });
    setShowUnlockConfirmDialog(true);
  };

  const confirmUnlockOperation = async () => {
    if (!pendingUnlock) return;

    setIsSubmitting(true);
    setShowUnlockConfirmDialog(false);

    try {
      const response = await ManageRouteService.BlockTransport({
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

  const handleFinalizeRoute = useCallback(async () => {
    const needsRecalculation = await checkIfRecalculationNeeded();

    if (needsRecalculation) {
      setShowRecalcBeforeFinalizeDialog(true);
      return;
    }

    setShowFinalizeConfirmDialog(true);
  }, [checkIfRecalculationNeeded]);

  const proceedWithFinalization = useCallback(async () => {
    setIsSubmitting(true);
    setIsFinalizing(true);
    try {
      const params = {
        sDate: shiftDate,
        eDate: shiftDate,
        facilityid: selectedFacility,
        triptype: selectedTripType,
        shifttimes: selectedShifts,
      };

      const bulkRouteData = await ManageRouteService.PushRouteToDashbaord(
        params
      );

      if (bulkRouteData && bulkRouteData.length > 0) {
        //await pushDataToUpdateTripsheetDetail(bulkRouteData);
        toastService.success(
          "Route finalization  completed successfully."
        );
        await onSearch();
      } else {
        toastService.warn("No route data available to finalize.");
      }
    } catch (error) {
      console.error("Error finalizing routes:", error);
      toastService.error(
        "Finalization  data  failed. Please try again."
      );
    } finally {
      setIsFinalizing(false);
      setIsSubmitting(false);
    }
  }, [shiftDate, selectedFacility, selectedTripType, selectedShifts]);

  const handleRecalculateAndFinalize = useCallback(async () => {
    setIsRecalcBeforeFinalize(true);
    setShowRecalcBeforeFinalizeDialog(false);

    try {
      toastService.info("Recalculating routes before finalization...");

      const inputJsonResponse =
        await ManageRouteService.GetInputJsonRecalculate({
          shiftdate: shiftDate,
          shifttime: selectedShifts,
          facilityid: selectedFacility,
          triptype: selectedTripType,
        });

      const inputJsonData =
        typeof inputJsonResponse === "string"
          ? JSON.parse(inputJsonResponse)
          : inputJsonResponse;

      if (
        !inputJsonData ||
        !inputJsonData.routes ||
        inputJsonData.routes.length === 0
      ) {
        toastService.info(
          "No routes need recalculation. Proceeding with finalization..."
        );
        await proceedWithFinalization();
        return;
      }

      toastService.info("Sending data for recalculation...");

      const recalculatedRouteJson = await ManageRouteService.recalculateRoutes(inputJsonData);

      await ManageRouteService.updateRouteMapbased({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
        jsonstring: JSON.stringify(recalculatedRouteJson),
        updatedBy: userID,
      });

      toastService.success(
        "Routes recalculated successfully! Now finalizing..."
      );

      await onSearch();
      await proceedWithFinalization();
    } catch (error) {
      console.error("Error during recalculation before finalize:", error);
      toastService.error(`Failed to recalculate routes: ${error.message}`);
    } finally {
      setIsRecalcBeforeFinalize(false);
    }
  }, [
    selectedFacility,
    shiftDate,
    selectedTripType,
    selectedShifts,
    userID,
    handleSubmit,
    proceedWithFinalization,
  ]);

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

      const response = await ManageRouteService.AutoVendorAllocationNew(params);
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

      const data = JSON.parse(response);

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

      const response = await ManageRouteService.DeleteEmployeeFromRoute({
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
      const response = await ManageRouteService.AddEmpToRoute({
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
    refreshRouteDetails // Already available in scope
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

  const handleGenerateRoute = async () => {
    try {
      // Sync close state
      if (logic && logic.actions && logic.actions.setUiState) {
        logic.actions.setUiState({ showGenerateDialog: false });
      } else {
        setShowGenerateRouteDialog(false);
      }
      
      setShowProgressDialog(true);
      setProgressStatus({
        step: 1,
        totalSteps: 4,
        message: "Fetching route input data...",
        progress: 25,
        isError: false,
        errorMessage: "",
      });

      const routeInputResponse = await ManageRouteService.GetRouteInputJson({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
        locationID: "",
        updatedBy: userID,
      });

      let routeInputData;
      try {
        routeInputData =
          typeof routeInputResponse === "string"
            ? JSON.parse(routeInputResponse)
            : routeInputResponse;
      } catch (parseError) {
        console.error("Error parsing route input JSON:", parseError);
        throw new Error("Invalid route input data format");
      }
      setProgressStatus((prev) => ({
        ...prev,
        step: 2,
        message: "Route generation in Progress",
        progress: 50,
      }));

      const generatedRouteJson = await ManageRouteService.generateRoutes(routeInputData);
      setProgressStatus((prev) => ({
        ...prev,
        step: 3,
        message: "Saving generated route...",
        progress: 75,
      }));

      const saveResponse = await ManageRouteService.save_routesMapBasedNew({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
        jsonstring: JSON.stringify(generatedRouteJson),
        updatedBy: 0,
        IsNewAdded: 0,
      });

      setProgressStatus((prev) => ({
        ...prev,
        step: 4,
        message: "Finalizing route generation...",
        progress: 100,
      }));

      // REFACTOR: Instead of manually fetching and setting state (which fails), 
      // call onSearch to trigger re-validation and data refetch via the hook.
      await onSearch();

      setProgressStatus((prev) => ({
        ...prev,
        message: "Routes generated successfully!",
        progress: 100,
      }));
      setProgressStatus((prev) => ({
        ...prev,
        message: "Routes generated successfully!",
        progress: 100,
      }));
      // showButtons is now derived, so no need to set it manually
      setTimeout(() => {
        setShowProgressDialog(false);
        toastService.success(
          "Route generation and save completed successfully."
        );
      }, 2000);
    } catch (error) {
      console.error("Error in route generation:", error);
      setVendorSummary([]);
      setProgressStatus((prev) => ({
        ...prev,
        isError: true,
        errorMessage:
          error.message || "Route generation failed. Please try again.",
      }));
      toastService.error(
        error.message || "Route generation failed. Please try again."
      );
    } finally {
      setShowProgressDialog(false);
    }
  };
  return (
    <>
      <style>
        {`

          .p-datatable .p-datatable-thead > tr > th.p-selection-column .p-checkbox {
            display: none !important;
          }

          .route-is-finalized {
            background-color: #f8f9fa !important;
            opacity: 0.7;
            cursor: not-allowed;
          }

          .route-is-finalized > td {
            color: #6c757d !important;
          }

          .route-is-finalized .p-row-toggler {
            cursor: pointer !important;
            opacity: 1 !important;
          }

          .route-is-finalized .p-row-toggler:hover {
            background: rgba(0,0,0,0.05);
          }
          
          .route-selected-for-unlock {
            background-color: #d1ecf1 !important;
            border-left: 4px solid #17a2b8 !important;
          }

          .unlock-mode-selectable {
            cursor: pointer !important;
          }

          .drop-zone {
            position: relative;
            overflow: hidden;
            will-change: transform, background-color, border-color;
            transform: translateZ(0);
            height: 0 !important;
          }

          .drop-zone-active {
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
            animation: pulse 0.8s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% {
              background-color: #e3f2fd;
              transform: scale(1);
            }
            50% {
              background-color: #bbdefb;
              transform: scale(1.02);
            }
          }

          .draggable-row {
            will-change: transform;
            transform: translateZ(0);
            transition: opacity 0.2s ease-out, background-color 0.2s ease-out, border-color 0.2s ease-out;
          }

          .draggable-row.dragging {
            opacity: 0.5;
            transform: translateZ(10px);
          }

          .draggable-row.selected {
            animation: selectPulse 0.3s ease-out;
          }

          .dragging-multi {
            animation: multiDragPulse 0.6s ease-in-out infinite alternate;
          }

          @keyframes multiDragPulse {
            from {
              background-color: #e3f2fd;
              transform: scale(1);
            }
            to {
              background-color: #bbdefb;
              transform: scale(0.98);
            }
          }

          @keyframes selectPulse {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
            }
            50% {
              transform: scale(1.02);
              box-shadow: 0 0 0 10px rgba(33, 150, 243, 0);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
            }
          }

          .route-hover-drag {
            background-color: #f3e5f5 !important;
            border-left: 4px solid #9c27b0 !important;
            transition: all 0.3s ease;
            position: relative;
          }

          .route-hover-drag::after {
            content: "Hover to expand route...";
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: #9c27b0;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 10;
            animation: expandHint 0.8s ease-in-out infinite;
          }

          @keyframes expandHint {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }

          .drag-in-progress .p-datatable-tbody tr:not(.route-is-finalized):hover {
            background-color: rgba(156, 39, 176, 0.1) !important;
            cursor: pointer;
          }

          .floating-selection-panel {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 12px 16px;
          }

          .floating-selection-panel.held {
            border-color: #ff9800;
            box-shadow: 0 8px 32px rgba(255, 152, 0, 0.3);
          }

          .cross-page-drop-zone {
            position: relative;
          }

          @keyframes pulseGlow {
            0%, 100% {
              box-shadow: 0 0 5px rgba(33, 150, 243, 0.5);
              background-color: #e3f2fd;
            }
            50% {
              box-shadow: 0 0 15px rgba(33, 150, 243, 0.8);
              background-color: #bbdefb;
            }
          }

          .cross-page-mode .p-datatable-tbody tr {
            position: relative;
          }

          .cross-page-mode .p-datatable-tbody tr:hover::after {
            content: 'Click to drop employees here';
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: #2196F3;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 10;
            pointer-events: none;
          }

          .held-selection-active {
            background: linear-gradient(45deg, #fff3e0, #ffe0b2);
            border-left: 4px solid #ff9800;
          }

          .route-selected {
            background-color: #fff3e0 !important;
            border-left: 4px solid #ff9800 !important;
          }

          .route-selected:hover {
            background-color: #ffe0b2 !important;
          }

          .route-selected.first-selected {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%) !important;
            border-left: 8px solid #28a745 !important;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
            position: relative;
          }

          .route-selected:not(.first-selected)::after {
            content: 'SOURCE - Will be deleted';
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #dc3545, #e74c3c);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            z-index: 10;
            box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
          }

          .floating-route-panel {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }

          .route-merge-mode .p-datatable-tbody tr:not(.route-is-finalized) {
            cursor: pointer;
            transition: background-color 0.2s ease;
          }

          .route-merge-mode .p-datatable-tbody tr:not(.route-is-finalized):hover {
            background-color: rgba(255, 152, 0, 0.1) !important;
          }

          .bg-success-subtle {
            background: linear-gradient(135deg, #d1edcc 0%, #c3e6ba 100%) !important;
          }

          .bg-danger-subtle {
            background: linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%) !important;
          }

          .bg-info-subtle {
            background: linear-gradient(135deg, #d1ecf1 0%, #b8daff 100%) !important;
          }

          .bg-primary-subtle {
            background: linear-gradient(135deg, #cce7ff 0%, #b3d9ff 100%) !important;
          }

          .route-merge-table-active .p-datatable-thead > tr > th {
            white-space: normal;
            font-size: 12px;
            padding: 0.6rem 0.4rem;
            text-align: center;
            vertical-align: middle;
          }

          .route-merge-table-active .p-datatable-tbody > tr > td {
            padding: 0.6rem 0.4rem;
            font-size: 13px;
          }

          .route-merge-table-active .p-column-header-content {
            justify-content: center;
          }

          .modern-modal .p-dialog-content {
            border-radius: 0 0 8px 8px;
            padding: 0;
            max-height: 70vh;
            overflow-y: auto;
          }

          .modern-modal .p-dialog-footer {
            background: #f8f9fa;
            border-radius: 0 0 8px 8px;
            padding: 0.75rem 1rem;
            border-top: 1px solid #dee2e6;
          }

          .modern-modal .table thead th{ font-size: 12px; }
          .modern-modal .table tbody td{ vertical-align: middle; }

          .modern-modal .card {
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border: 1px solid #e9ecef;
          }

          .modern-modal .alert {
            border-radius: 6px;
            border: none;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 0;
          }

          .modern-modal .form-control {
            border-radius: 6px;
            border: 1px solid #ced4da;
            transition: all 0.2s ease;
            font-size: 14px;
          }

          .modern-modal .form-control:focus {
            border-color: #28a745;
            box-shadow: 0 0 0 0.15rem rgba(40, 167, 69, 0.25);
          }

          .modern-modal .badge {
            font-size: 11px;
            padding: 0.25rem 0.5rem;
          }

          .modern-modal .text-muted {
            color: #6c757d !important;
          }

          .modern-modal .fw-semibold {
            font-weight: 600 !important;
          }
          
          /* --- Style for Active Route Merge Button --- */
          .route-merge-toggle-btn.p-button-warning {
            background: #343a40 !important;
            border-color: #343a40 !important;
            color: #fff !important;
          }

          .route-merge-toggle-btn.p-button-warning:hover {
            background: #495057 !important;
            border-color: #495057 !important;
          }
        `}
      </style>
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
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(255,255,255,0.7)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="spinner-border text-primary"
              style={{ width: 60, height: 60, fontSize: 32 }}
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
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="middle">
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
                        <span
                          className="subtitle_sm text-warning"
                          style={{ whiteSpace: "nowrap" }}
                        >
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
                          rel="noopener noreferrer"
                          className=""
                          data-pr-tooltip="View All Routes"
                          data-pr-position="left"
                        >
                          <Tooltip target="[data-pr-tooltip]" />
                          <img src="/images/icons/fold_map.png" alt="Map" />
                        </a>
                        <a
                          className="subtitle_sm text-primary d-block"
                          style={{ marginTop: "8px", cursor: "pointer" }}
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
                        setIsRouteSelectMode(!isRouteSelectMode);
                        if (isRouteSelectMode) handleClearRouteSelection();
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
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.9rem" }}
                    >
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
                         <i className={`pi ${isAllExpanded ? "pi-angle-double-up" : "pi-angle-double-down"}`} style={{ fontSize: "1.5rem" }}></i>
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
                <Toast ref={toast} />
                <DataTable
                  value={memoizedTableData.slice(first, first + rows)}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  dataKey="RouteID"
                  selectionMode={isRouteSelectMode ? "checkbox" : null}
                  selection={selectedRoutes}
                  onSelectionChange={(e) => {
                    // Only allow selection if the route is not finalized
                    const selectableRoutes = e.value.filter(route => route.isRouteFinalized !== 1);
                    setSelectedRoutes(selectableRoutes);
                    setRouteSelectionOrder(selectableRoutes.map(r => r.RouteID));
                  }}
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
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
                            title="PWD"
                          />
                        )}
                        {rowData.isOOBRoute === true && (
                          <img
                            src="images/icons/oob.png"
                            alt="OOB"
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
                            title="OOB"
                          />
                        )}
                        {rowData.isNMTRoute === true && (
                          <img
                            src="images/icons/non-motorable.png"
                            alt="NMT"
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
                            title="Non Motorable"
                          />
                        )}
                        {rowData.PlannedGuard === 1 && (
                          <img
                            src="images/icons/add_guard.png"
                            alt="Guard"
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
                            title="Guard Required"
                          />
                        )}
                        {rowData.isMedicalRoute === true && (
                          <img
                            src="images/icons/medical.png"
                            alt="Medical"
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
                            title="Medical Required"
                          />
                        )}
                        {rowData.swapped === true && (
                          <img
                            src="images/icons/swap.png"
                            alt="Swap"
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
                            title="Swap"
                          />
                        )}
                        {rowData.afterFleetExhaustion === true && (
                          <img
                            src="images/icons/transport.png"
                            alt="Fleet Exhausted"
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
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
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
                            title="Small"
                          />
                        )}
                        {rowData.varvehicleType === "m" && (
                          <img
                            src="images/icons/letter-m.png"
                            alt="Medium"
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
                            title="Medium"
                          />
                        )}
                        {rowData.varvehicleType === "l" && (
                          <img
                            src="images/icons/letter-l.png"
                            alt="Large"
                            style={{
                              cursor: "pointer",
                              width: "20px",
                              height: "20px",
                            }}
                            title="Large"
                          />
                        )}
                      </div>
                    )}
                  />
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
            <div className="d-flex justify-content-between align-items-center">
              <span>OPTIMAR Routing Engine</span>
              <img src="/images/logo.svg" alt="" />
            </div>
          }
          style={{ width: "550px" }}
          className="p-2 rounded-5 bg-white"
        >
          <div className="p-4">
            <h3 className="text-center mb-4">
              {progressStatus.isError
                ? "Route Generation Failed"
                : "Generating Routes"}
            </h3>

            <div className="mb-4">
              <ProgressBar
                value={progressStatus.progress}
                showValue={false}
                className={progressStatus.isError ? "p-progressbar-error" : ""}
              />
            </div>

            <div className="text-center">
              <p className="mb-2">{progressStatus.message}</p>
              {progressStatus.isError && (
                <p className="text-danger">{progressStatus.errorMessage}</p>
              )}
            </div>
          </div>
        </PrimeDialog>

        <PrimeDialog
          visible={showGenerateRouteDialog}
          onHide={() => {
            if (logic && logic.actions && logic.actions.setUiState) {
              logic.actions.setUiState({ showGenerateDialog: false });
            } else {
              setShowGenerateRouteDialog(false);
            }
          }}
          header="Are you sure?"
          footer={
            <div className="d-flex gap-2 justify-content-end">
              <Button
                label="No"
                onClick={() => {
                  if (logic && logic.actions && logic.actions.setUiState) {
                    logic.actions.setUiState({ showGenerateDialog: false });
                  } else {
                    setShowGenerateRouteDialog(false);
                  }
                }}
                className="btn btn-outline-dark"
              />
              <Button
                label="Yes"
                onClick={handleGenerateRoute}
                className="btn btn-primary"
              />
            </div>
          }
          style={{ width: "auto", height: "auto" }}
        >
          <div className="text-center py-3">
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                color: "#555",
                marginBottom: "0.1rem",
              }}
            >
              This will generate routes for
              <span
                style={{
                  color: "#2196F3",
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                {" "}
                {shiftDate}
              </span>
            </p>
          </div>
        </PrimeDialog>

        <PrimeDialog
          visible={showDragDropConfirmDialog}
          onHide={cancelDragDropOperation}
          style={{ width: "692px", height: "auto" }}
          header={
            <div className="d-flex align-items-center">
              <span>
                {pendingDragOperation?.isCrossPageDrop
                  ? "Confirm Cross-Page Employee Move"
                  : pendingDragOperation?.isSameRouteReorder
                    ? "Confirm Employee Reorder"
                    : "Confirm Employee Move"}
              </span>
            </div>
          }
          modal
          footer={
            <>
              <button
                className="btn btn-outline-dark"
                onClick={cancelDragDropOperation}
              >
                Cancel
              </button>
              <button
                className="btn btn-dark ms-3"
                onClick={confirmDragDropOperation}
                disabled={isLoading}
              >
                {pendingDragOperation?.isSameRouteReorder
                  ? "Confirm Reorder"
                  : "Confirm Move"}
              </button>
            </>
          }
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
        </PrimeDialog>

        <PrimeDialog
          visible={showRouteMergeDialog}
          onHide={cancelMergeOperation}
          header={
            <div className="d-flex align-items-center">
              <i
                className="material-icons me-2"
                style={{ color: "#2196F3", fontSize: "20px" }}
              >
                alt_route
              </i>
              <span style={{ fontSize: "16px", fontWeight: "600" }}>Confirm Route Merge</span>
            </div>
          }
          modal
          footer={
            <>
              <Button
                label="Cancel"
                onClick={cancelMergeOperation}
                className="btn btn-outline-dark"
              />
              <Button
                label="Confirm Merge"
                onClick={confirmMergeOperation}
                disabled={isLoading}
                className="btn btn-primary ms-3"
              />
            </>
          }
          style={{ width: "450px" }}
          className="route-merge-dialog"
        >
          {pendingMergeOperation && (
            <div className="d-flex flex-column" style={{ fontSize: "14px" }}>
              <p className="mb-2">
                Are you sure you want to merge <strong>{pendingMergeOperation.sourceRoutes.length}</strong> route(s) into Route <strong className="text-primary">{pendingMergeOperation.targetRoute}</strong>?
              </p>
              <div className="bg-light p-3 rounded mb-0 mt-2">
                <h6 className="fw-bold mb-2">Warning:</h6>
                <ul className="mb-0 ps-3 text-muted" style={{ fontSize: "13px" }}>
                  <li><strong>Route {pendingMergeOperation.targetRoute}</strong> will receive all employees.</li>
                  <li>Source routes ({pendingMergeOperation.sourceRoutes.join(", ")}) will be deleted.</li>
                  <li className="text-danger">This action cannot be undone.</li>
                </ul>
              </div>
            </div>
          )}
        </PrimeDialog>

        <PrimeDialog
          visible={showSplitConfirmDialog}
          onHide={cancelSplitOperation}
          header="Confirm Route Split"
          modal
          footer={
            <>
              <Button
                label="Cancel"
                onClick={cancelSplitOperation}
                className="btn btn-outline-dark"
              />
              <Button
                label="Confirm Split"
                onClick={confirmSplitOperation}
                disabled={isLoading}
                className="btn btn-dark ms-2"
              />
            </>
          }
          style={{ width: "692px" }}
          className="route-split-dialog"
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
        </PrimeDialog>

        <PrimeSidebar
          visible={showDetailsSidebar}
          position="right"
          width="50%"
          onHide={() => setShowDetailsSidebar(false)}
          showCloseIcon={false}
          dismissable={false}
          style={{ width: "30%", backdropFilter: "blur(8px)" }}
        >
          <div className="sidebarHeader d-flex justify-content-between align-items-center sidebarTitle p-0">
            <h6 className="sidebarTitle">Route Statistics</h6>
            <span
              className="material-icons me-3"
              style={{ cursor: "pointer" }}
              onClick={() => setShowDetailsSidebar(false)}
            >
              close
            </span>
          </div>
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
                <div
                  className="col-12"
                  style={{ maxHeight: "220px", overflowY: "auto" }}
                >
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
        </PrimeSidebar>

        <PrimeDialog
          visible={showAutoVendorAllocationDialog}
          onHide={() => setShowAutoVendorAllocationDialog(false)}
          header="Confirmation"
          modal
          footer={
            <>
              <Button
                label="Cancel"
                onClick={() => setShowAutoVendorAllocationDialog(false)}
                className="btn btn-outline-dark"
              />
              <Button
                label="OK"
                onClick={confirmAutoVendorAllocation}
                disabled={isLoading}
                className="btn btn-primary ms-3"
              />
            </>
          }
        >
          <p>Are you sure you want to automatically allocate the vendor?</p>
        </PrimeDialog>

        <PrimeDialog
          visible={showDeleteEmployeeDialog}
          onHide={() => setShowDeleteEmployeeDialog(false)}
          header={
            <div className="d-flex align-items-center">
              <span>Confirm Employee Deletion</span>
            </div>
          }
          modal
          footer={
            <>
              <Button
                label="Cancel"
                onClick={() => setShowDeleteEmployeeDialog(false)}
                className="btn btn-outline-dark"
              />
              <Button
                label="Delete"
                onClick={handleDeleteEmployee}
                className="btn btn-dark ms-3"
              />
            </>
          }
        >
          {pendingDeleteEmployee && (
            <div className="text-left">
              <p className=" mb-3">
                Are you sure you want to delete{" "}
                <strong className="text-primary fw-bold">
                  {pendingDeleteEmployee.employee.empName}
                </strong>{" "}
                from route{" "}
                <strong className="text-primary fw-bold">
                  {pendingDeleteEmployee.routeId}
                </strong>
                ?
              </p>
              <p className="">
                This action cannot be undone. The employee will be removed from
                this route.
              </p>
            </div>
          )}
        </PrimeDialog>


        <PrimeDialog
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
                disabled={isAddingEmployee}
              />
              <Button
                label={isAddingEmployee ? "Adding..." : "Add Employee"}
                onClick={handleAddEmployeeToRoute}
                className="btn btn-dark"
                disabled={
                  !selectedEmployee || !selectedStopNo || isAddingEmployee
                }
              />
            </div>
          }
        >
          <div className="p-3">
            {selectedRouteId && (
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
                                title={employee.address}
                              >
                                {employee.address}
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
                      <i
                        className="material-icons me-1"
                        style={{ fontSize: "12px", verticalAlign: 'middle' }}
                      >
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
                          <i
                            className="material-icons me-2"
                            style={{ fontSize: "16px" }}
                          >
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
        </PrimeDialog>

        <PrimeDialog
          visible={showUnlockConfirmDialog}
          onHide={() => setShowUnlockConfirmDialog(false)}
          header="Confirm Unlock"
          modal
          footer={
            <>
              <Button label="Cancel" onClick={() => setShowUnlockConfirmDialog(false)} className="p-button-text" />
              <Button label="Confirm" onClick={confirmUnlockOperation} autoFocus />
            </>
          }
        >
          {pendingUnlock && (
            <div>
              {pendingUnlock.type === 'shift' ? (
                <p>Are you sure you want to unlock all {pendingUnlock.routeIds.length} finalized routes for this shift?</p>
              ) : (
                <p>Are you sure you want to unlock the selected {pendingUnlock.routeIds.length} route(s)?</p>
              )}
              <p className="mt-2 small text-muted">This will make them editable again.</p>
            </div>
          )}
        </PrimeDialog>


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
                      className="employee-card-stack"
                      style={{
                        position: "absolute",
                        top: -index * 4,
                        left: -index * 4,
                        padding: "8px 16px",
                        backgroundColor: "#fff",
                        border: "2px solid #2196F3",
                        borderRadius: "8px",
                        boxShadow: `0 ${4 + index * 2}px ${16 + index * 4
                          }px rgba(0,0,0,${0.1 + index * 0.05})`,
                        fontSize: "14px",
                        fontWeight: "bold",
                        transform: `rotate(${3 + index * 1}deg)`,
                        zIndex: 10 - index,
                        opacity: 1 - index * 0.15,
                        willChange: "transform",
                        minWidth: "200px",
                        textAlign: "center",
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
                <div
                  className="single-employee-drag"
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#fff",
                    border: "2px solid #2196F3",
                    borderRadius: "8px",
                    cursor: "grabbing",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    fontSize: "14px",
                    fontWeight: "bold",
                    transform: "rotate(0deg)",
                    willChange: "transform",
                  }}
                >
                  {draggedEmployee.empCode} - {draggedEmployee.empName}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>

        <PrimeDialog
          visible={showRecalcBeforeFinalizeDialog}
          onHide={() => setShowRecalcBeforeFinalizeDialog(false)}
          header={
            <div className="d-flex align-items-center">
              <i
                className="material-icons me-2"
                style={{ color: "#ff9800", fontSize: "20px" }}
              >
                warning
              </i>
              <span>Recalculation Required</span>
            </div>
          }
          modal
          footer={
            <>
              <Button
                label="Cancel Finalization"
                onClick={() => setShowRecalcBeforeFinalizeDialog(false)}
                className="btn btn-outline-secondary"
                disabled={isRecalcBeforeFinalize}
              />
              <Button
                label={
                  isRecalcBeforeFinalize
                    ? "Recalculating..."
                    : "Recalculate & Finalize"
                }
                onClick={handleRecalculateAndFinalize}
                className="btn btn-primary ms-3"
                disabled={isRecalcBeforeFinalize}
                icon={
                  isRecalcBeforeFinalize
                    ? "pi pi-spin pi-spinner"
                    : "pi pi-refresh"
                }
              />
            </>
          }
          style={{ width: "600px" }}
        >
          <div className="p-3">
            <div className="alert alert-warning mb-3">
              <strong>Routes Need Recalculation!</strong>
            </div>

            <p className="mb-3">
              Some routes have been modified and need to be recalculated before
              finalization. This ensures that all ETAs and distances are
              up-to-date.
            </p>

            <div className="bg-light p-3 rounded mb-3">
              <h6 className="fw-bold mb-2">What will happen:</h6>
              <ol className="mb-0 ps-3">
                <li>
                  All modified routes will be recalculated with latest ETAs
                </li>
                <li>Route data will be updated in the system</li>
              </ol>
            </div>

            <p className="text-muted mb-0">
              <small>
                <i className="material-icons me-1" style={{ fontSize: "14px" }}>
                  info
                </i>
                This process may take a few moments depending on the number of
                routes.
              </small>
            </p>
          </div>
        </PrimeDialog>

        {/* Finalize Confirmation Dialog (No Recalculation Needed) */}
        <PrimeDialog
          visible={showFinalizeConfirmDialog}
          onHide={() => setShowFinalizeConfirmDialog(false)}
          header={
            <div className="d-flex align-items-center">
              <i
                className="material-icons me-2"
                style={{ color: "#2196F3", fontSize: "20px" }}
              >
                check_circle
              </i>
              <span style={{ fontSize: "16px", fontWeight: "600" }}>Confirm Finalization</span>
            </div>
          }
          modal
          footer={
            <>
              <Button
                label="Cancel"
                onClick={() => setShowFinalizeConfirmDialog(false)}
                className="btn btn-outline-dark"
                disabled={isFinalizing}
              />
              <Button
                label={isFinalizing ? "Finalizing..." : "Finalize Routes"}
                onClick={() => {
                  setShowFinalizeConfirmDialog(false);
                  proceedWithFinalization();
                }}
                className="btn btn-primary ms-3"
                disabled={isFinalizing}
              />
            </>
          }
          style={{ width: "400px" }}
        >
          <div className="d-flex flex-column" style={{ fontSize: "14px" }}>
            <p className="mb-2">Are you sure you want to finalize the current routes?</p>
            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
              Note: This will commit all current routes. Finalized routes are locked against further changes unless unlocked.
            </p>
          </div>
        </PrimeDialog>
      </DndContext>
      <style>
        {`
          .custom-calendar-wrapper {
            position: relative;
            width: 100%;
          }
          .custom-calendar-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            width: 22px;
            height: 22px;
            z-index: 2;
            pointer-events: none;
          }
          .custom-calendar-input .p-inputtext {
            padding-left: 35px !important;
          }
        `}
      </style>
    </>
  );
};

export default ManageRouteDesktop;
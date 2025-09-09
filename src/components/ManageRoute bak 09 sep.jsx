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
import ManageRouteService from "../services/compliance/ManageRouteService";
import { toastService } from "../services/toastService";
import OffcanvasRouteDetails from "./OffcanvasRouteDetails";
import { Sidebar as PrimeSidebar } from "primereact/sidebar";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { point, Point } from "leaflet";
import axios from "axios";
import { OverlayPanel } from "primereact/overlaypanel";
import { Tooltip } from "primereact/tooltip";
import { DataView } from "primereact/dataview";
import { Badge } from "primereact/badge";
import * as XLSX from "xlsx";
import { set, throttle } from "lodash";
import { useSmoothDraggable } from "./useSmoothDraggable";
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

// New Floating Selection Panel Component
const FloatingSelectionPanel = React.memo(
  ({
    selectedEmployees,
    routeDetails,
    onClearSelection,
    onToggleHold,
    isHeld,
    isVisible,
  }) => {
    // ✅ Smooth draggable hook
    const { position, isDragging, elementRef, handleMouseDown } =
      useSmoothDraggable(100, 150, 350, 400);

    // ✅ Get selected employee details
    const selectedEmployeeDetails = useMemo(() => {
      const details = [];
      if (selectedEmployees) {
        selectedEmployees.forEach((employeeKey) => {
          const lastHyphenIndex = employeeKey.lastIndexOf("-");
          if (lastHyphenIndex === -1) return;

          const routeId = employeeKey.slice(0, lastHyphenIndex);
          const employeeId = employeeKey.slice(lastHyphenIndex + 1);

          const routeEmployees = routeDetails[routeId] || [];
          const employee = routeEmployees.find(
            (e) => String(e.id || e.empID || e.empId) === employeeId
          );

          if (employee) {
            details.push({ ...employee, sourceRouteId: routeId });
          }
        });
      }
      return details;
    }, [selectedEmployees, routeDetails]);

    // ✅ Employee item template
    const employeeItemTemplate = (employee) => {
      const key = `${employee.sourceRouteId}-${employee.id || employee.empID}`;
      return (
        <div key={key} className="d-flex align-items-center p-2 border-bottom">
          <div className="flex-grow-1">
            <p className="fw-bold">
              {employee.empCode} - {employee.empName}
            </p>
            <p className="" style={{ fontSize: "11px" }}>
              {employee.Location}
            </p>
          </div>
        </div>
      );
    };

    if (!isVisible || selectedEmployees.size === 0) return null;

    return (
      <div
        ref={elementRef}
        className={`floating-selection-panel ${isHeld ? "held" : ""}`}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 1100,
          width: "692px",
          maxHeight: "420px",
          backgroundColor: "#fff",
          //border: "2px solid #2196F3",
          //borderRadius: "12px",
          //boxShadow: "0 8px 32px rgba(33, 150, 243, 0.3)",
          cursor: isDragging ? "grabbing" : "grab",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12)",
        }}
        onMouseDown={handleMouseDown}
      >
        {/* --- Header --- */}
        <div
          className="d-flex justify-content-between align-items-center w-100 p-2 draggable-panel-header"
          style={{
            //backgroundColor: "#2196F3",
            color: "#333",
            //borderTopLeftRadius: "10px",
            //borderTopRightRadius: "10px",
          }}
        >
          <div className="d-flex align-items-center">
            {/* <span className="material-icons me-2">people</span> */}
            <span style={{ fontSize: "16px", fontWeight: "600" }}>
              Selected ({selectedEmployees.size})
            </span>
          </div>
          <div className="d-flex gap-2">
            <Tooltip target=".hold-button" />
            <Button
              icon={`pi ${isHeld ? "pi-lock" : "pi-unlock"}`}
              className="p-button-sm hold-button"
              //severity={isHeld ? "warning" : "secondary"}
              onClick={onToggleHold}
              data-pr-tooltip={isHeld ? "Release Hold" : "Hold Selection"}
              data-pr-position="top"
            />
            <Tooltip target=".clear-button" />
            <Button
              icon="pi pi-times"
              className="p-button-sm p-button-danger clear-button"
              onClick={onClearSelection}
              data-pr-tooltip="Clear Selection"
              data-pr-position="top"
            />
          </div>
        </div>

        {/* --- Body --- */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <DataView
            value={selectedEmployeeDetails}
            itemTemplate={employeeItemTemplate}
            emptyMessage="No employees selected."
          />
        </div>

        {/* --- Footer --- */}
        <div
          className="text-center w-100 p-2 bg-light border-top"
          style={{
            borderBottomLeftRadius: "10px",
            borderBottomRightRadius: "10px",
          }}
        >
          <small className="text-muted">
            {isHeld
              ? "Selection held - click on any route to drop"
              : "Drag to move panel, hold to pin"}
          </small>
        </div>
      </div>
    );
  }
);

// Route Selection Panel Component - UPDATED
const FloatingRouteSelectionPanel = React.memo(
  ({
    selectedRoutes,
    tableData,
    onClearSelection,
    onMergeRoutes,
    isVisible,
    routeSelectionOrder,
  }) => {
    // ✅ Smooth draggable hook
    const { position, isDragging, elementRef, handleMouseDown } =
      useSmoothDraggable(20, 100, 350, 420);

    // ✅ Get route details in the order they were selected
    const selectedRouteDetails = useMemo(() => {
      return routeSelectionOrder.map((routeId) => {
        const route = tableData.find((r) => r.RouteID === routeId);
        return route || { RouteID: routeId };
      });
    }, [routeSelectionOrder, tableData]);

    const targetRoute = selectedRouteDetails[0]; // first = target
    const sourceRoutes = selectedRouteDetails.slice(1);

    if (!isVisible || selectedRoutes.size === 0) return null;

    return (
      <div
        ref={elementRef}
        className="floating-route-panel"
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 1100,
          width: "692px",
          maxHeight: "420px",
          backgroundColor: "#fff",
          //border: "2px solid #2196F3", // ✅ unified to same blue tone
          //borderRadius: "12px",
          //boxShadow: "0 8px 32px rgba(33, 150, 243, 0.3)", // ✅ same soft shadow
          cursor: isDragging ? "grabbing" : "grab",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12)",
        }}
        onMouseDown={handleMouseDown}
      >
        {/* --- Header --- */}
        <div
          className="d-flex justify-content-between align-items-center w-100 p-2 draggable-panel-header"
          style={{
            //backgroundColor: "#2196F3", // ✅ unified to blue
            color: "#333",
            //borderTopLeftRadius: "10px",
            //borderTopRightRadius: "10px",
          }}
        >
          <div className="d-flex align-items-center p-3 pb-0">
            {/* <span className="material-icons me-2">merge_type</span> */}
            <span style={{ fontSize: "1.25rem" }}>
              Route Merge ({selectedRoutes.size})
            </span>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-light"
              onClick={onMergeRoutes}
              disabled={selectedRoutes.size < 2}
              title="Merge Routes"
            >
              <span
                className="material-icons text-dark"
                style={{ fontSize: "24px" }}
              >
                call_merge
              </span>
            </button>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={onClearSelection}
              title="Clear Selection"
            >
              <span
                className="material-icons text-dark"
                style={{ fontSize: "24px" }}
              >
                close
              </span>
            </button>
          </div>
        </div>

        {/* --- Content --- */}
        <div className="p-3" style={{ flex: 1, overflowY: "auto" }}>
          {selectedRoutes.size >= 2 && (
            <div className="alert alert-light">
              <div className="mb-2">
                <p className="fw-bold mb-3">
                  Target Route (will receive all employees):
                </p>
                <div className="mt-1">
                  <span className="badge bg-success me-2">Target</span>
                  <strong>{targetRoute?.RouteID}</strong>
                  <span
                    className="badge bg-success ms-2"
                    //style={{ fontSize: "10px" }}
                  >
                    First Selected
                  </span>
                  <div className="small mt-3">
                    {targetRoute?.totalStop || 0} stops •{" "}
                    {targetRoute?.vendorname || "No vendor"}
                  </div>
                </div>
              </div>
              <div>
                <p className="fw-bold">Source Routes (will be deleted):</p>
              </div>
            </div>
          )}

          {selectedRouteDetails.map((route, index) => {
            const isTarget = index === 0 && selectedRoutes.size >= 2;

            return (
              <div
                key={route.RouteID}
                className={`route-item p-2 border-bottom d-flex align-items-center ${
                  isTarget ? "bg-success-subtle" : "bg-danger-subtle"
                }`}
              >
                <div className="flex-grow-1">
                  <div className="fw-bold">
                    Route {route.RouteID}
                    {isTarget && (
                      <span className="text-primary ms-1">
                        (First Selected)
                      </span>
                    )}
                  </div>
                  <div className="text-dark">
                    {route.totalStop || 0} stops •{" "}
                    {route.vendorname || "No vendor"}
                    {route.totaldist && <span> • {route.totaldist}km</span>}
                  </div>
                </div>
                <div className="me-2">
                  <span
                    className={`badge p-2 ${
                      isTarget ? "bg-success" : "bg-danger"
                    }`}
                    // style={{ fontSize: "10px" }}
                  >
                    {isTarget ? "Target" : "Source"}
                  </span>
                </div>
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
            );
          })}
        </div>

        {/* --- Footer --- */}
        <div
          className="text-center w-100 p-2 bg-light border-top"
          style={{
            borderBottomLeftRadius: "10px",
            borderBottomRightRadius: "10px",
          }}
        >
          <small className="text-muted">
            {selectedRoutes.size < 2
              ? "Select at least 2 routes to merge"
              : `Ready to merge ${sourceRoutes.length} route(s) into Route ${targetRoute?.RouteID} (first selected)`}
          </small>
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
          `Click to drop ${
            selectedEmployees?.size || 0
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

  // Memoize styles for better performance
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

// Enhanced Draggable Employee Row Component with Multi-Select
const DraggableEmployeeRow = React.memo(
  ({
    employee,
    routeId,
    index,
    isSelected,
    onSelectionChange,
    isMultiSelectMode,
    selectedCount,
    activeId,
    selectedEmployees,
    isDragInProgress,
    isSplitMode,
    onDeleteEmployee,
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
        disabled: isSplitMode,
      });

    const shouldAppearDragged =
      isDragging ||
      (isDragInProgress && isSelected && selectedEmployees.size > 1);

    // We only care about horizontal movement for the swipe effect
    const swipeTranslateX = transform ? transform.x : 0;

    // Style for the swipeable foreground content
    const foregroundStyle = useMemo(
      () => ({
        transform: `translateX(${swipeTranslateX}px)`, // Only apply horizontal transform for swipe
        backgroundColor: isSelected
          ? isSplitMode
            ? "#d1ecf1"
            : "#e3f2fd"
          : "#fff",
        position: "relative",
        zIndex: 2, // Must be on top of the background
        transition: isDragging ? "none" : "transform 0.3s ease",
        willChange: "transform",
      }),
      [swipeTranslateX, isSelected, isSplitMode, isDragging]
    );

    // Style for the main <tr> container
    const rowStyle = useMemo(
      () => ({
        position: "relative", // Necessary for the absolute positioned background
        opacity: shouldAppearDragged ? 0.3 : 1,
        cursor: isDragging
          ? "grabbing"
          : isMultiSelectMode || isSplitMode
          ? "pointer"
          : "grab",
        border: isSelected
          ? isSplitMode
            ? "2px solid #17a2b8"
            : "2px solid #2196F3"
          : "1px solid transparent",
        transition: shouldAppearDragged
          ? "none"
          : "opacity 0.2s ease-out, border-color 0.2s ease-out",
        boxShadow: isSelected
          ? isSplitMode
            ? "0 2px 8px rgba(23, 162, 184, 0.3)"
            : "0 2px 8px rgba(33, 150, 243, 0.3)"
          : "none",
      }),
      [
        isDragging,
        isSelected,
        isMultiSelectMode,
        shouldAppearDragged,
        isSplitMode,
      ]
    );

    const handleRowClick = useCallback(
      (e) => {
        if (!e.target.closest(".drag-handle")) {
          e.preventDefault();
          e.stopPropagation();
          onSelectionChange(employeeKey, routeId);
        }
      },
      [onSelectionChange, employeeKey, routeId]
    );

    const handleCheckboxChange = useCallback(
      (e) => {
        e.stopPropagation();
        onSelectionChange(employeeKey, routeId);
      },
      [onSelectionChange, employeeKey, routeId]
    );

    return (
      <tr
        style={rowStyle}
        className={`draggable-row ${
          shouldAppearDragged ? "dragging-multi" : ""
        } ${isSelected ? "selected" : ""}`}
        onClick={handleRowClick}
      >
        <td colSpan="9" style={{ padding: 0, overflow: "hidden" }}>
          <SwipeToDeleteBackground
            isActive={isDragging}
            swipeProgress={swipeTranslateX}
          />
          <div
            ref={setNodeRef}
            style={foregroundStyle}
            className="d-flex align-items-center w-100"
          >
            {/* Recreate the table cells using divs with flexbox */}
            {/* Use the same widths as your <thead> in rowExpansionTemplate */}

            {/* Column 1: Actions */}
            <div
              className="p-2"
              style={{
                width: isMultiSelectMode || isSplitMode ? "120px" : "80px",
              }}
            >
              <div className="d-flex gap-2 align-items-center">
                {(isMultiSelectMode || isSplitMode) && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    className="form-check-input me-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                {!isSplitMode && (
                  <span
                    className="material-icons drag-handle"
                    style={{ fontSize: "20px", cursor: "grab" }}
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
            <div className="p-2 flex-grow-1" style={{ minWidth: "150px" }}>
              {`${employee.empCode} - ${employee.empName}`}
            </div>

            {/* Column 3: Gender */}
            <div className="p-2" style={{ width: "50px" }}>
              {employee.Gender === "M" ? (
                <span className="badge bg-primary-subtle rounded-pill text-dark">
                  M
                </span>
              ) : employee.Gender === "F" ? (
                <span className="badge bg-danger-subtle rounded-pill text-dark">
                  F
                </span>
              ) : null}
            </div>

            {/* Column 4 & 5: Address & Location (Combined for simplicity, you can split them) */}
            <div
              className="p-2"
              style={{
                minWidth: "200px",
                maxWidth: "300px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span title={employee.address || ""}>
                {employee.address || ""}
              </span>
            </div>
            <div
              className="p-2"
              style={{
                minWidth: "200px",
                maxWidth: "300px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span title={employee.Location || ""}>
                {employee.Location || ""}
              </span>
            </div>

            {/* Column 6 & 7: Shift & Trip */}
            <div className="p-2">{employee.Shift}</div>
            <div className="p-2">{employee.tripType}</div>

            {/* Column 8: Stop */}
            <div className="p-2" style={{ width: "70px" }}>
              <InputText
                value={employee.stopNo}
                style={{ width: "50px" }}
                readOnly
              />
            </div>

            {/* Column 9: ETA & Original Delete Button (will be removed) */}
            <div className="p-2" style={{ width: "120px" }}>
              <InputText
                value={`${employee.ETAhh || "00"}:${employee.ETAmm || "00"}`}
                style={{ width: "85px" }}
                readOnly
              />
              {/* The original button is now replaced by the swipe gesture */}
            </div>
          </div>
        </td>
      </tr>
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

const ManageRoute = () => {
  // First, add a state for sorting
  const SWIPE_DELETE_THRESHOLD = 150; // Swipe 100px to the left to delete
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [expandedRows, setExpandedRows] = useState(null);
  const toast = useRef(null);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedTripType, setSelectedTripType] = useState("P");
  const [shifts, setShifts] = useState([]);
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [routeDetails, setRouteDetails] = useState({});
  const userID = sessionStorage.getItem("ID");
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [statsDetails, setStatsDetails] = useState(null);
  const [viewMap, setViewMap] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerateRouteDialog, setShowGenerateRouteDialog] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [showAutoVendorAllocationDialog, setShowAutoVendorAllocationDialog] =
    useState(false);
  const [vendorAllocated, setVendorAllocated] = useState(false);
  const [vendorSummary, setVendorSummary] = useState([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [draggedEmployee, setDraggedEmployee] = useState(null);
  const [hoveredDropZone, setHoveredDropZone] = useState(null);

  // Multi-select states
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectionStartRoute, setSelectionStartRoute] = useState(null);

  // Route selection states - UPDATED
  const [selectedRoutes, setSelectedRoutes] = useState(new Set());
  const [isRouteSelectMode, setIsRouteSelectMode] = useState(false);
  const [showFloatingRoutePanel, setShowFloatingRoutePanel] = useState(false);
  const [showRouteMergeDialog, setShowRouteMergeDialog] = useState(false);
  const [pendingMergeOperation, setPendingMergeOperation] = useState(null);
  const [routeSelectionOrder, setRouteSelectionOrder] = useState([]); // NEW: Track selection order

  // NEW: Route Split states
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [selectedRouteForSplit, setSelectedRouteForSplit] = useState(null);
  const [showSplitConfirmDialog, setShowSplitConfirmDialog] = useState(false);
  const [pendingSplitOperation, setPendingSplitOperation] = useState(null);
  const selectedRouteForSplitRef = useRef(null);
  const [splitModeEmployees, setSplitModeEmployees] = useState(new Set());

  // Add new state for drag and drop confirmation
  const [showDragDropConfirmDialog, setShowDragDropConfirmDialog] =
    useState(false);
  const [pendingDragOperation, setPendingDragOperation] = useState(null);

  // Add new state for employee delete functionality
  const [showDeleteEmployeeDialog, setShowDeleteEmployeeDialog] =
    useState(false);
  const [pendingDeleteEmployee, setPendingDeleteEmployee] = useState(null);

  // Add Employee Modal States
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
  const AUTO_EXPAND_DELAY = 800; // 800ms delay before auto-expand

  // New states for cross-page functionality
  const [isSelectionHeld, setIsSelectionHeld] = useState(false);
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [crossPageDropMode, setCrossPageDropMode] = useState(false);

  const [shiftDate, setShiftDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  // Add state for progress dialog
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progressStatus, setProgressStatus] = useState({
    step: 0,
    totalSteps: 4,
    message: "",
    progress: 0,
    isError: false,
    errorMessage: "",
  });

  const [routeStats, setRouteStats] = useState({
    TotalEmps: 0,
    TotalRoutes: 0,
    AvgOccupancy: 0,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [offcanvasRefreshKey, setOffcanvasRefreshKey] = useState(0);
  const [showRecalcBeforeFinalizeDialog, setShowRecalcBeforeFinalizeDialog] =
    useState(false);
  const [isRecalcBeforeFinalize, setIsRecalcBeforeFinalize] = useState(false);

  // ✅ FIX 1: Memoize queryParams to prevent re-renders
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

  // ✅ FIX 2: Create stable throttledHandleDragOver
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
      }, 16), // ~60fps
    []
  );

  // Optimized sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced for more responsive dragging
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

  // Optimized collision detection
  const customCollisionDetection = useCallback((args) => {
    const pointerIntersections = pointerWithin(args);

    if (pointerIntersections.length > 0) {
      return pointerIntersections;
    }

    return closestCenter(args);
  }, []);

  // ✅ FIX 3: Memoize tripTypeOptions
  const tripTypeOptions = useMemo(
    () => [
      { label: "Pick", value: "P" },
      { label: "Drop", value: "D" },
    ],
    []
  );

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setVendorSummary([]);
      setTableData([]);
      setStatsDetails([]);
      setRouteDetails({});
      setRouteStats({
        TotalEmps: 0,
        TotalRoutes: 0,
        AvgOccupancy: 0,
      });
      setShowButtons(false);
      // Clear all selections when submitting new data
      setSelectedEmployees(new Set());
      setSelectionStartRoute(null);
      setIsMultiSelectMode(false);
      setShowFloatingPanel(false);
      setIsSelectionHeld(false);
      setCrossPageDropMode(false);

      // Clear route selections
      setSelectedRoutes(new Set());
      setRouteSelectionOrder([]);
      setIsRouteSelectMode(false);
      setShowFloatingRoutePanel(false);

      // Clear split mode selections
      setIsSplitMode(false);
      setSelectedRouteForSplit(null);
      setSplitModeEmployees(new Set());

      if (!selectedFacility) {
        toastService.warn("Please select a facility.");
        return;
      }
      if (selectedShifts.length === 0) {
        toastService.warn("Please select at least one shift.");
        return;
      }
      const validateResponse = await ManageRouteService.sp_validateEmpRoster({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
      });
      let parsedValidateResponse;
      if (typeof validateResponse === "string") {
        if (validateResponse.includes("[") && validateResponse.includes("]")) {
          const parsedArray = JSON.parse(validateResponse);
          parsedValidateResponse = parsedArray[0]?.Result;
        } else {
          parsedValidateResponse = parseInt(validateResponse);
        }
      } else if (Array.isArray(validateResponse)) {
        parsedValidateResponse = validateResponse[0]?.Result;
      } else {
        parsedValidateResponse = validateResponse;
      }

      if (parsedValidateResponse === 1) {
        const response = await ManageRouteService.GetRoutesByOrder({
          sDate: shiftDate,
          eDate: shiftDate,
          FacilityID: selectedFacility,
          TripType: selectedTripType,
          Shifttimes: selectedShifts,
          OrderBy: "Routeno",
          Direction: "ASC",
          Routeid: "",
          occ_seater: -2,
        });

        const parsedResponse =
          typeof response === "string" ? JSON.parse(response) : response;
        setTableData(parsedResponse || []);
        toastService.success("Route data loaded successfully.");

        const params = {
          sdate: shiftDate,
          edate: shiftDate,
          triptype: selectedTripType,
          facilityid: selectedFacility,
          shifttime: selectedShifts,
        };
        let vendorData = await ManageRouteService.getvehtypeCountVendorwise(
          params
        );
        if (typeof vendorData === "string") {
          try {
            vendorData = JSON.parse(vendorData);
          } catch {
            vendorData = [];
          }
        }
        setVendorSummary(vendorData);

        const statsResponse = await ManageRouteService.GetRoutesStatistics({
          sdate: shiftDate,
          edate: shiftDate,
          triptype: selectedTripType,
          facilityid: selectedFacility,
          shifttime: selectedShifts,
        });

        const parsedStatsResponse =
          typeof statsResponse === "string"
            ? JSON.parse(statsResponse)
            : statsResponse;
        setStatsDetails(parsedStatsResponse);
        if (parsedStatsResponse && parsedStatsResponse.length > 0) {
          setRouteStats({
            TotalEmps: parsedStatsResponse[0].TotalEmps || 0,
            TotalRoutes: parsedStatsResponse[0].TotalRoutes || 0,
            AvgOccupancy: parsedStatsResponse[0].AvgOccupancy || 0,
          });
        } else {
          setRouteStats({
            TotalEmps: 0,
            TotalRoutes: 0,
            AvgOccupancy: 0,
          });
        }
        setShowButtons(true);
      } else if (parsedValidateResponse === 2) {
        setTableData([]);
        setRouteStats({
          TotalEmps: 0,
          TotalRoutes: 0,
          AvgOccupancy: 0,
        });
        toastService.error("The Roster is not available.");
        setShowButtons(false);
      } else if (parsedValidateResponse === 0) {
        setShowGenerateRouteDialog(true);
        setShowButtons(false);
      } else {
        console.error(
          "Unexpected validation response:",
          parsedValidateResponse
        );
        toastService.error("Invalid response from server");
      }
    } catch (error) {
      console.error("Failed to process request:", error);
      setIsLoading(false);
      setVendorSummary([]);
      setTableData([]);
      setRouteStats({
        TotalEmps: 0,
        TotalRoutes: 0,
        AvgOccupancy: 0,
      });
      toastService.error("Failed to process request");
      setShowButtons(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedFacility, selectedShifts, shiftDate, selectedTripType, userID]);

  const handleRouteIdClick = useCallback(
    async (clickedRouteId) => {
      setIsSubmitting(true);
      // toastService.info('Checking Route Status - Please wait...'); // ✅ Changed

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
          ); // ✅ Changed

          const recalculateResponse = await fetch(
            "https://ftqbvxxmpm.ap-south-1.awsapprunner.com/api/route-generation/recalculate",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(inputJsonForRecalc),
            }
          );

          if (!recalculateResponse.ok) {
            throw new Error(
              `Recalculation server failed: ${recalculateResponse.status}`
            );
          }

          const recalculatedRouteJson = await recalculateResponse.json();

          await ManageRouteService.updateRouteMapbased({
            facilityid: selectedFacility,
            sDate: shiftDate,
            triptype: selectedTripType,
            shifttime: selectedShifts,
            jsonstring: JSON.stringify(recalculatedRouteJson),
            updatedBy: userID,
          });

          // Clear the route details for this specific route
          setRouteDetails((prev) => {
            const updated = { ...prev };
            delete updated[clickedRouteId];
            return updated;
          });

          // Refresh route details immediately
          try {
            const updatedRouteDetailsResponse =
              await ManageRouteService.GetRoutesDetailsnew({
                RouteID: clickedRouteId,
                isAdd: 0,
              });

            const parsedRouteDetails =
              typeof updatedRouteDetailsResponse === "string"
                ? JSON.parse(updatedRouteDetailsResponse)
                : updatedRouteDetailsResponse;

            setRouteDetails((prev) => ({
              ...prev,
              [clickedRouteId]: parsedRouteDetails,
            }));
          } catch (detailsError) {
            console.error("Error refreshing route details:", detailsError);
          }

          // Refresh table data
          try {
            const response = await ManageRouteService.GetRoutesByOrder({
              sDate: shiftDate,
              eDate: shiftDate,
              FacilityID: selectedFacility,
              TripType: selectedTripType,
              Shifttimes: selectedShifts,
              OrderBy: "Routeno",
              Direction: "ASC",
              Routeid: "",
              occ_seater: -2,
            });

            const parsedResponse =
              typeof response === "string" ? JSON.parse(response) : response;
            setTableData(parsedResponse || []);
          } catch (refreshError) {
            console.error("Error refreshing table data:", refreshError);
          }

          toastService.success(
            "Route updated with latest ETAs. Opening map..."
          ); // ✅ Changed
        }

        setOffcanvasRefreshKey((prevKey) => prevKey + 1);
        setSelectedRouteId(clickedRouteId);
        setShowOffcanvas(true);
      } catch (error) {
        console.error("Error processing route click:", error);
        toastService.error(`Failed to open route details: ${error.message}`); // ✅ Changed
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedFacility, shiftDate, selectedTripType, selectedShifts, userID]
  );

  const checkIfRecalculationNeeded = useCallback(async () => {
    try {
      // Use the same API call as handleRecalculateModifiedRoutes
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

      // If there are routes to be recalculated, return true
      return !!(
        inputJsonData &&
        inputJsonData.routes &&
        inputJsonData.routes.length > 0
      );
    } catch (error) {
      console.error("Error checking recalculation status:", error);
      // On error, assume recalculation might be needed to be safe
      return true;
    }
  }, [shiftDate, selectedShifts, selectedFacility, selectedTripType]);

  // ✅ FIX 4: Memoize template functions
  const routeIdTemplate = useCallback(
    (rowData) => {
      return (
        <span
          className="cursor-pointer text-primary"
          onClick={() => handleRouteIdClick(rowData.RouteID)} // ✅ Changed to call the new handler
          style={{ cursor: "pointer", color: "#4285F4", fontWeight: "bold" }}
        >
          {rowData.RouteID}
        </span>
      );
    },
    [handleRouteIdClick]
  ); // ✅ Add the new handler as a dependency

  const durationTemplate = useCallback((rowData) => {
    const minutes = parseInt(rowData.duration);
    if (isNaN(minutes)) return "";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = remainingMinutes.toString().padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}`;
  }, []);

  // ✅ FIX 5: Memoize table data properly
  const memoizedTableData = useMemo(() => tableData, [tableData]);

  // ✅ FIX 6: Optimize getRowClassName
  const getRowClassName = useCallback(
    (rowData) => {
      let className = "";
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
      if (selectedRoutes.has(rowData.RouteID)) {
        className += "route-selected ";
        // Add first-selected class for the first selected route
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

      // Add split mode classes
      if (isSplitMode) {
        className += "route-split-mode ";
        if (selectedRouteForSplit === rowData.RouteID) {
          className += "split-selected ";
        }
        console.log("getRowClassName called:", { className, rowData });
        // Highlight routes that can't be split
        if (rowData.RouteID?.endsWith("S")) {
          className += "split-disabled ";
        }
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
      isSplitMode,
      selectedRouteForSplit,
    ]
  );

  // ✅ FIX 7: Create separate sort handler
  const handleSortChange = useCallback(async () => {
    if (
      !selectedFacility ||
      selectedShifts.length === 0 ||
      !sortField ||
      !sortOrder
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await ManageRouteService.GetRoutesByOrder({
        sDate: shiftDate,
        eDate: shiftDate,
        FacilityID: selectedFacility,
        TripType: selectedTripType,
        Shifttimes: selectedShifts,
        OrderBy: sortField,
        Direction: sortOrder === 1 ? "ASC" : "DESC",
        Routeid: "",
        occ_seater: -2,
      });

      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      setTableData(parsedResponse || []);
    } catch (error) {
      console.error("Failed to sort data:", error);
      toastService.error("Failed to sort data");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedFacility,
    selectedShifts,
    shiftDate,
    selectedTripType,
    sortField,
    sortOrder,
  ]);

  // ✅ FIX 8: Stable onSort handler
  const handleSort = useCallback((e) => {
    setSortField(e.sortField);
    setSortOrder(e.sortOrder);
  }, []);

  // NEW: Route Split Mode Handlers
  const handleToggleSplitMode = useCallback(() => {
    setIsSplitMode((prev) => {
      const newMode = !prev;
      if (!newMode) {
        // Clear split mode selections when exiting
        setSelectedRouteForSplit(null);
        selectedRouteForSplitRef.current = null; // Clear the ref
        setSplitModeEmployees(new Set());
        setSelectedEmployees(new Set());
      } else {
        // When entering split mode, disable other modes
        setIsMultiSelectMode(false);
        setIsRouteSelectMode(false);
        handleClearSelection();
        handleClearRouteSelection();
      }
      return newMode;
    });
  }, []);

  // Handle route selection for splitting
  const handleRouteSelectionForSplit = useCallback(
    (routeId) => {
      if (!isSplitMode) return;

      console.log("handleRouteSelectionForSplit called:", {
        routeId,
        currentSelectedRouteForSplit: selectedRouteForSplit,
        currentSelectedRouteForSplitRef: selectedRouteForSplitRef.current,
      });

      // Check if route already ends with 'S'
      if (routeId.endsWith("S")) {
        toastService.warn('Cannot split a route that already ends with "S"');
        return;
      }

      // Toggle route selection - if same route is clicked again, unselect it
      if (selectedRouteForSplit === routeId) {
        console.log("Unselecting route:", routeId);
        setSelectedRouteForSplit(null);
        selectedRouteForSplitRef.current = null;
        setSplitModeEmployees(new Set());
        setSelectedEmployees(new Set());
        toastService.info(
          "Route selection cleared. Click on a route to select it for splitting."
        );
      } else {
        console.log("Selecting route:", routeId);
        setSelectedRouteForSplit(routeId);
        selectedRouteForSplitRef.current = routeId;
        setSplitModeEmployees(new Set());
        setSelectedEmployees(new Set());

        // Auto-expand the selected route
        setExpandedRows((prev) => ({
          ...prev,
          [routeId]: true,
        }));

        toastService.info(
          `Route ${routeId} selected for splitting. Now select employees to move to the new route.`
        );
      }
    },
    [isSplitMode, selectedRouteForSplit]
  );

  // Handle employee selection in split mode
  // Handle employee selection for split mode
  const handleEmployeeSelectionForSplit = useCallback(
    (employeeKey, routeId) => {
      if (!isSplitMode) return;

      console.log("handleEmployeeSelectionForSplit called:", {
        employeeKey,
        routeId,
        selectedRouteForSplit,
        selectedRouteForSplitRef: selectedRouteForSplitRef.current,
      });

      // If no route is selected yet, allow selecting from any route
      if (!selectedRouteForSplit) {
        // Auto-select the route for split when first employee is selected
        setSelectedRouteForSplit(routeId);
        selectedRouteForSplitRef.current = routeId;
        setSplitModeEmployees(new Set([employeeKey]));
        setSelectedEmployees(new Set([employeeKey]));
        setExpandedRows((prev) => ({
          ...prev,
          [routeId]: true,
        }));
        toastService.info(
          `Route ${routeId} selected for splitting. Now select employees to move to the new route.`
        );
        return;
      }

      // If a route is already selected, restrict selection to that route only
      if (routeId !== selectedRouteForSplit) {
        console.log("Restriction applied:", {
          selectedRouteForSplit,
          routeId,
          condition: routeId !== selectedRouteForSplit,
        });
        toastService.warn(
          `You can only select employees from Route ${selectedRouteForSplit} while splitting.`
        );
        return;
      }

      // Toggle employee selection within the selected route
      setSplitModeEmployees((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(employeeKey)) {
          newSelection.delete(employeeKey);
          // If this was the last employee being unselected, clear the route selection
          if (newSelection.size === 0) {
            console.log("All employees unselected, clearing route selection");
            setSelectedRouteForSplit(null);
            selectedRouteForSplitRef.current = null;
            toastService.info(
              "Route selection cleared. Click on a route or employee to start splitting."
            );
          }
        } else {
          newSelection.add(employeeKey);
        }
        return newSelection;
      });

      // Also update the main selected employees for visual consistency
      setSelectedEmployees((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(employeeKey)) {
          newSelection.delete(employeeKey);
        } else {
          newSelection.add(employeeKey);
        }
        return newSelection;
      });
    },
    [isSplitMode, selectedRouteForSplit]
  ); // Added selectedRouteForSplit back to dependencies

  // Handle route split execution
  const handleSplitRoute = useCallback(() => {
    if (!selectedRouteForSplit || splitModeEmployees.size === 0) {
      toastService.warn(
        "Please select a route and at least one employee to split"
      );
      return;
    }

    // Check if trying to split all employees (should leave at least one)
    const routeEmployees = routeDetails[selectedRouteForSplit] || [];
    if (splitModeEmployees.size >= routeEmployees.length) {
      toastService.warn(
        "Cannot split all employees. At least one employee must remain in the original route."
      );
      return;
    }

    // Prepare employee IDs for the API
    const employeeIds = Array.from(splitModeEmployees).map((employeeKey) => {
      const [, employeeId] = employeeKey.split("-");
      return employeeId;
    });

    // Get employee details for confirmation dialog
    const selectedEmployeeDetails = [];
    employeeIds.forEach((employeeId) => {
      const employee = routeEmployees.find(
        (emp) => (emp.id || emp.empID || emp.empId) === employeeId
      );
      if (employee) {
        selectedEmployeeDetails.push(employee);
      }
    });

    setPendingSplitOperation({
      routeId: selectedRouteForSplit,
      employeeIds: employeeIds,
      employeeDetails: selectedEmployeeDetails,
      newRouteId: selectedRouteForSplit + "S",
    });

    setShowSplitConfirmDialog(true);
  }, [selectedRouteForSplit, splitModeEmployees, routeDetails]);

  // Confirm split operation
  const confirmSplitOperation = useCallback(async () => {
    if (!pendingSplitOperation) return;

    try {
      setShowSplitConfirmDialog(false);
      setIsLoading(true);

      const requestPayload = {
        RouteIDs: pendingSplitOperation.routeId,
        empIDs: pendingSplitOperation.employeeIds.join(","),
      };

      console.log("Route split payload:", requestPayload);

      const response = await ManageRouteService.SplitRoute(requestPayload);

      // Parse response - it comes as a string array
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

          // Clear split mode selections
          setSelectedRouteForSplit(null);
          setSplitModeEmployees(new Set());
          setSelectedEmployees(new Set());
          setIsSplitMode(false);

          // Refresh the table to show the new split route
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
      setIsLoading(false);
      setPendingSplitOperation(null);
    }
  }, [pendingSplitOperation]);

  // Cancel split operation
  const cancelSplitOperation = useCallback(() => {
    setShowSplitConfirmDialog(false);
    setPendingSplitOperation(null);
  }, []);

  // Clear split mode selections
  const handleClearSplitSelection = useCallback(() => {
    setSelectedRouteForSplit(null);
    setSplitModeEmployees(new Set());
    setSelectedEmployees(new Set());
  }, []);

  // UPDATED Route Selection Handlers
  const handleRouteSelection = useCallback((routeId) => {
    setSelectedRoutes((prev) => {
      const newSelection = new Set(prev);

      if (newSelection.has(routeId)) {
        newSelection.delete(routeId);
        setRouteSelectionOrder((prevOrder) =>
          prevOrder.filter((id) => id !== routeId)
        );
        if (newSelection.size === 0) {
          setShowFloatingRoutePanel(false);
        }
      } else {
        newSelection.add(routeId);
        setRouteSelectionOrder((prevOrder) => [...prevOrder, routeId]);
        setShowFloatingRoutePanel(true);
      }

      return newSelection;
    });
  }, []);

  const handleClearRouteSelection = useCallback(() => {
    setSelectedRoutes(new Set());
    setRouteSelectionOrder([]);
    setShowFloatingRoutePanel(false);
  }, []);

  // UPDATED: Changed to use first selected as target
  const handleMergeRoutes = useCallback(() => {
    if (selectedRoutes.size < 2) {
      toastService.warn("Please select at least 2 routes to merge");
      return;
    }

    const routeArray = Array.from(routeSelectionOrder); // Use order array
    const targetRoute = routeArray[0]; // CHANGED: First selected becomes target
    const sourceRoutes = routeArray.slice(1); // CHANGED: All others are source

    setPendingMergeOperation({
      sourceRoutes,
      targetRoute,
      routeArray,
    });

    setShowRouteMergeDialog(true);
  }, [routeSelectionOrder, selectedRoutes.size]);

  const confirmMergeOperation = useCallback(async () => {
    if (!pendingMergeOperation) return;

    try {
      setShowRouteMergeDialog(false);
      setIsLoading(true);

      const requestPayload = {
        RouteIDs: pendingMergeOperation.routeArray.join(","),
        userid: Number(parseInt(userID) || 0),
      };

      console.log("Route merge payload:", requestPayload);

      const response = await ManageRouteService.MergeRoute(requestPayload);

      toastService.success(
        `Routes merged successfully! All routes merged into Route ${pendingMergeOperation.targetRoute} (first selected)`
      );

      // Clear selection after successful merge
      handleClearRouteSelection();

      // Refresh the main table to reflect the changes
      await handleSubmit();
    } catch (error) {
      console.error("Error merging routes:", error);
      toastService.error(`Failed to merge routes: ${error.message}`);
    } finally {
      setIsLoading(false);
      setPendingMergeOperation(null);
    }
  }, [pendingMergeOperation, userID, handleClearRouteSelection]);

  const cancelMergeOperation = useCallback(() => {
    setShowRouteMergeDialog(false);
    setPendingMergeOperation(null);
  }, []);

  // Auto-expand functions
  const handleRouteRowEnter = useCallback(
    (event) => {
      // Only auto-expand during drag operations
      if (!activeId) return;

      const routeId = event.data.RouteID;
      setHoveredRouteId(routeId);

      // Clear any existing timer
      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
      }

      // Check if already expanded
      if (expandedRows && expandedRows[routeId]) {
        return; // Already expanded, no need to do anything
      }

      // Set a new timer for auto-expansion
      const timer = setTimeout(() => {
        setExpandedRows((prev) => ({
          ...prev,
          [routeId]: true,
        }));

        // Show a subtle toast for user feedback
        toastService.info(`Route ${routeId} expanded for dropping`);
      }, AUTO_EXPAND_DELAY);

      setAutoExpandTimer(timer);
    },
    [activeId, expandedRows, autoExpandTimer]
  );

  const handleRouteRowLeave = useCallback(
    (event) => {
      // Clear the auto-expand timer if user moves away
      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
        setAutoExpandTimer(null);
      }
      setHoveredRouteId(null);
    },
    [autoExpandTimer]
  );

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
      }
    };
  }, [autoExpandTimer]);

  // UPDATED Enhanced Employee Selection Handler to work with split mode
  const handleEmployeeSelection = useCallback(
    (employeeKey, routeId) => {
      // Centralize the mode check here. Do nothing if not in a selection mode.
      if (!isSplitMode && !isMultiSelectMode) {
        return;
      }

      // If in split mode, use the split-specific handler
      if (isSplitMode) {
        handleEmployeeSelectionForSplit(employeeKey, routeId);
        return;
      }

      // If not in split mode, it must be multi-select mode.
      // This logic now correctly only runs for multi-select.
      setSelectedEmployees((prev) => {
        const newSelection = new Set(prev);

        if (newSelection.has(employeeKey)) {
          newSelection.delete(employeeKey);
          const remainingFromStartRoute = Array.from(newSelection).some((key) =>
            key.startsWith(`${selectionStartRoute}-`)
          );
          if (!remainingFromStartRoute && selectionStartRoute === routeId) {
            setSelectionStartRoute(null);
          }
          if (newSelection.size === 0) {
            setSelectionStartRoute(null);
            setShowFloatingPanel(false);
            setIsSelectionHeld(false);
            setCrossPageDropMode(false);
          }
        } else {
          newSelection.add(employeeKey);
          if (!selectionStartRoute) {
            setSelectionStartRoute(routeId);
          }
          setShowFloatingPanel(true);
        }

        return newSelection;
      });
    },
    [
      isSplitMode,
      isMultiSelectMode,
      selectionStartRoute,
      handleEmployeeSelectionForSplit,
    ]
  );

  // Toggle hold functionality
  const handleToggleHold = useCallback(() => {
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

  // Modified Cross-page drop handler to show confirmation dialog
  const handleCrossPageDrop = useCallback(
    async (targetRouteId, targetPosition) => {
      if (!isSelectionHeld || selectedEmployees.size === 0) return;

      // Prepare data similar to drag-drop confirmation but for cross-page drop
      const employeeData = [];
      const routeIds = [];
      const selectedEmployeeDetails = [];

      for (const employeeKey of selectedEmployees) {
        const [routeId, employeeId] = employeeKey.split("-");
        employeeData.push(employeeId);
        routeIds.push(routeId);

        // Find employee details for the dialog
        const routeEmployees = routeDetails[routeId] || [];
        const emp = routeEmployees.find(
          (e) => (e.id || e.empID || e.empId) === employeeId
        );
        if (emp) {
          selectedEmployeeDetails.push(emp);
        }
      }

      // Create a mock activeData similar to drag operation for consistency
      const mockActiveData = {
        employee: selectedEmployeeDetails[0], // Use first employee for display
        sourceRouteId: routeIds[0], // Use first route
        type: "employee",
        isMultiSelect: selectedEmployees.size > 1,
        selectedCount: selectedEmployees.size,
      };

      // Create mock overData
      const mockOverData = {
        targetRouteId: targetRouteId,
        targetPosition: targetPosition,
        type: "position",
      };

      // Set up the pending operation for the confirmation dialog
      setPendingDragOperation({
        employeeKeys: Array.from(selectedEmployees),
        targetRouteId: targetRouteId,
        targetPosition: targetPosition,
        activeData: mockActiveData,
        overData: mockOverData,
        isCrossPageDrop: true, // Flag to identify this as cross-page drop
      });

      // Show the confirmation dialog
      setShowDragDropConfirmDialog(true);
    },
    [isSelectionHeld, selectedEmployees, routeDetails]
  );

  // Clear selection handler
  const handleClearSelection = useCallback(() => {
    setSelectedEmployees(new Set());
    setSelectionStartRoute(null);
    setShowFloatingPanel(false);
    setIsSelectionHeld(false);
    setCrossPageDropMode(false);
  }, []);

  // Enhanced Drag and Drop Handlers
  const handleDragStart = useCallback(
    (event) => {
      setActiveId(event.active.id);
      const activeData = event.active.data.current;

      if (activeData && activeData.type === "employee") {
        setDraggedEmployee(activeData.employee);

        const employeeKey = `${activeData.sourceRouteId}-${activeData.employee.id}`;

        if (isMultiSelectMode) {
          // If in multi-select mode and this employee is not selected
          if (!selectedEmployees.has(employeeKey)) {
            // Auto-select the dragged employee
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
          // In single select mode, just drag the employee
          setSelectedEmployees(new Set([employeeKey]));
          setSelectionStartRoute(activeData.sourceRouteId);
        }
      }
    },
    [selectedEmployees, isMultiSelectMode, selectionStartRoute]
  );

  // Enhanced handleDragEnd to work with both cross-route and same-route moves

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over, delta } = event; // Get delta for swipe detection

      // Clean up auto-expand timer and states
      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
        setAutoExpandTimer(null);
      }
      setHoveredRouteId(null);
      setActiveId(null);
      setDraggedEmployee(null);
      setHoveredDropZone(null);

      const activeData = active.data.current;

      // --- SWIPE TO DELETE LOGIC ---
      if (
        delta.x > SWIPE_DELETE_THRESHOLD &&
        activeData.type === "employee" &&
        !isSplitMode
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

      // --- REORDER LOGIC ---
      // This guard is crucial. If 'over' is null, the drop happened outside a valid zone.
      if (!over) {
        console.log("Drag ended over no valid drop zone. Aborting.");
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
          // This is a cross-route move, always requires confirmation.
          shouldShowConfirmation = true;
        } else if (
          sourceRoutes.length === 1 &&
          sourceRoutes[0] === targetRouteId
        ) {
          // This is a same-route reorder. Now we check if it's a real move.
          const routeEmployees = routeDetails[targetRouteId] || [];
          const currentPositions = employeesToMove.map((employeeKey) => {
            const [, employeeId] = employeeKey.split("-");
            const employeeIndex = routeEmployees.findIndex(
              (emp) => String(emp.id || emp.empID || emp.empId) === employeeId
            );
            return employeeIndex + 1; // 1-based position
          });

          // ⭐ CRUCIAL DEBUGGING AND LOGIC BLOCK
          const isSingleEmployee = employeesToMove.length === 1;
          const isSamePosition =
            isSingleEmployee && currentPositions[0] === targetPosition;
          const isNoOp = isSingleEmployee && isSamePosition;

          console.log(
            "%c --- Drag End Analysis ---",
            "color: blue; font-weight: bold;"
          );
          console.log(
            `Target Route: ${targetRouteId}, Target Position: ${targetPosition}`
          );
          console.log(
            `Current Employee Position(s): [${currentPositions.join(", ")}]`
          );
          console.log(`Is this a single employee drag? ${isSingleEmployee}`);
          console.log(
            `Is it being dropped in the same position? ${isSamePosition}`
          );
          console.log(
            `CONCLUSION: Is this a No-Op (should do nothing)? ${isNoOp}`
          );

          // Only show confirmation if it is NOT a no-op.
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
    [selectedEmployees, autoExpandTimer, routeDetails, isSplitMode]
  );
  // Modified confirmDragDropOperation to handle both regular and cross-page drops
  const confirmDragDropOperation = useCallback(async () => {
    if (!pendingDragOperation) return;

    try {
      setShowDragDropConfirmDialog(false);
      setIsLoading(true);

      // Parse employee data from selection
      const employeeData = [];
      const routeIds = [];
      const employeeNames = [];

      for (const employeeKey of pendingDragOperation.employeeKeys) {
        const [routeId, employeeId] = employeeKey.split("-");
        employeeData.push(employeeId);
        routeIds.push(routeId);

        // Find employee name for toast message
        const routeEmployees = routeDetails[routeId] || [];
        const emp = routeEmployees.find(
          (e) => (e.id || e.empID || e.empId) === employeeId
        );
        if (emp) {
          employeeNames.push(emp.empCode);
        }
      }

      // Prepare API payload with comma-separated values
      const requestPayload = {
        OldRouteid: routeIds.join(","),
        oldemployeeid: employeeData.join(","),
        newrouteid: String(pendingDragOperation.targetRouteId),
        stopno: Number(pendingDragOperation.targetPosition),
        userid: Number(parseInt(userID) || 0),
      };

      console.log("Employee move payload:", requestPayload);

      const response = await ManageRouteService.UpdateCutPaste(requestPayload);

      // Create appropriate success message
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

      // Clear selection after successful move
      setSelectedEmployees(new Set());
      setSelectionStartRoute(null);

      // If this was a cross-page drop, also clear the held state
      if (pendingDragOperation.isCrossPageDrop) {
        setShowFloatingPanel(false);
        setIsSelectionHeld(false);
        setCrossPageDropMode(false);
      }

      // Refresh affected routes
      const affectedRoutes = [
        ...new Set([...routeIds, pendingDragOperation.targetRouteId]),
      ];
      for (const routeId of affectedRoutes) {
        await refreshRouteDetails(routeId);
      }

      // Refresh main table
      await handleSubmit();
    } catch (error) {
      console.error("Error moving employees:", error);
      toastService.error(`Failed to move employees: ${error.message}`);
    } finally {
      setIsLoading(false);
      setPendingDragOperation(null);
    }
  }, [pendingDragOperation, userID, routeDetails]);

  // Function to cancel the drag and drop operation
  const cancelDragDropOperation = useCallback(() => {
    setShowDragDropConfirmDialog(false);
    setPendingDragOperation(null);
  }, []);

  // Function to refresh route details
  const refreshRouteDetails = useCallback(async (routeId) => {
    try {
      const response = await ManageRouteService.GetRoutesDetailsnew({
        RouteID: routeId,
        isAdd: 0,
      });
      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      setRouteDetails((prev) => ({
        ...prev,
        [routeId]: parsedResponse,
      }));
    } catch (error) {
      console.error(`Error refreshing route details for ${routeId}:`, error);
    }
  }, []);

  // ✅ FIX 9: Optimize fetchFacilities and fetchShifts
  const fetchFacilities = useCallback(async () => {
    try {
      const response = await ManageRouteService.SelectBaseFacility({
        userid: userID,
      });

      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;

      const formattedData = Array.isArray(parsedResponse)
        ? parsedResponse.map((item) => ({
            label: item.facility || item.facilityName,
            value: item.Id,
          }))
        : [];

      setFacilities(formattedData);
    } catch (error) {
      console.error("Failed to fetch facilities:", error);
      toastService.error("An error occurred while loading facilities.");
    }
  }, [userID]);

  const fetchShifts = useCallback(async () => {
    try {
      if (selectedFacility && selectedTripType) {
        const response = await ManageRouteService.GetShiftByFacilityType({
          facid: selectedFacility,
          type: selectedTripType,
        });

        const parsedResponse =
          typeof response === "string" ? JSON.parse(response) : response;

        const formattedShifts = Array.isArray(parsedResponse)
          ? parsedResponse.map((shift) => ({
              label: shift.shiftTime || shift.ShiftTime,
              value: shift.shiftTime || shift.ShiftTime,
            }))
          : [];

        setShifts(formattedShifts);
      }
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
      toastService.error("An error occurred while loading shifts.");
    }
  }, [selectedFacility, selectedTripType]);

  // ✅ FIX 11: Separate effect for sort changes only
  useEffect(() => {
    if (
      sortField &&
      sortOrder &&
      selectedFacility &&
      selectedShifts.length > 0
    ) {
      handleSortChange();
    }
  }, [sortField, sortOrder, handleSortChange]);

  // Effects for fetching data
  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  useEffect(() => {
    if (selectedFacility && selectedTripType) {
      fetchShifts();
    }
  }, [selectedFacility, selectedTripType, fetchShifts]);

  // ✅ FIX 12: Enhanced row expansion template with proper memoization
  const rowExpansionTemplate = useCallback(
    (rowData) => {
      // Fetch details if not already loaded
      if (!routeDetails[rowData.RouteID]) {
        // Add a loading flag to prevent multiple API calls
        setRouteDetails((prev) => ({
          ...prev,
          [rowData.RouteID]: { loading: true },
        }));

        ManageRouteService.GetRoutesDetailsnew({
          RouteID: rowData.RouteID,
          isAdd: 0,
        })
          .then((response) => {
            const parsedResponse =
              typeof response === "string" ? JSON.parse(response) : response;
            console.log("Employee details structure:", parsedResponse[0]); // Debug log
            setRouteDetails((prev) => ({
              ...prev,
              [rowData.RouteID]: parsedResponse,
            }));
          })
          .catch((error) => {
            console.error("Error fetching route details:", error);
            // Remove the loading flag on error
            setRouteDetails((prev) => {
              const newState = { ...prev };
              delete newState[rowData.RouteID];
              return newState;
            });
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: "Failed to load route details",
              life: 3000,
            });
          });
      }

      const routeData = routeDetails[rowData.RouteID];
      const employees = Array.isArray(routeData) ? routeData : [];

      // Show loading state if data is being fetched
      if (routeData && routeData.loading) {
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

      return (
        <div className="bg-custom">
          <div className="p-0">
            <table className="table table-sm employee-table">
              <thead>
                <tr>
                  <th
                    style={{
                      width:
                        isMultiSelectMode || isSplitMode ? "120px" : "80px",
                    }}
                  >
                    {isMultiSelectMode || isSplitMode
                      ? "Select/Actions"
                      : "Actions"}
                  </th>
                  <th>Employee</th>
                  <th style={{ width: "50px" }}></th>
                  <th>Address</th>
                  <th>Location</th>
                  <th>Shift</th>
                  <th>Trip</th>
                  <th style={{ width: "70px" }}>Stop</th>
                  <th style={{ width: "120px" }}>ETA</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <>
                    <tr>
                      <td colSpan="9" style={{ padding: 0, border: "none" }}>
                        <CrossPageDropZone
                          routeId={rowData.RouteID}
                          position={1}
                          isActive={crossPageDropMode}
                          onDrop={handleCrossPageDrop}
                          selectedEmployees={selectedEmployees}
                        />
                        {!isSplitMode && (
                          <DropZoneIndicator
                            routeId={rowData.RouteID}
                            position={1}
                            isOver={
                              activeId &&
                              hoveredDropZone ===
                                `dropzone-${rowData.RouteID}-1`
                            }
                          />
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="9"
                        className="text-center p-4"
                        style={{ color: "#666" }}
                      >
                        No employees in this route.
                        {crossPageDropMode ? (
                          <span className="text-primary">
                            {" "}
                            Click above to drop employees here.
                          </span>
                        ) : isSplitMode ? (
                          <span>
                            {" "}
                            Select another route with employees to split.
                          </span>
                        ) : (
                          <span>
                            {" "}
                            Drag employees from other routes to add them here.
                          </span>
                        )}
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    {/* Drop zones before first employee */}
                    <tr>
                      <td colSpan="9" style={{ padding: 0, border: "none" }}>
                        <CrossPageDropZone
                          routeId={rowData.RouteID}
                          position={1}
                          isActive={crossPageDropMode}
                          onDrop={handleCrossPageDrop}
                          selectedEmployees={selectedEmployees}
                        />
                        {!isSplitMode && (
                          <DropZoneIndicator
                            routeId={rowData.RouteID}
                            position={1}
                            isOver={
                              activeId &&
                              hoveredDropZone ===
                                `dropzone-${rowData.RouteID}-1`
                            }
                          />
                        )}
                      </td>
                    </tr>

                    {employees.map((employee, index) => {
                      const employeeKey = `${rowData.RouteID}-${
                        employee.id || employee.empID
                      }`;
                      const isSelected = selectedEmployees.has(employeeKey);

                      return (
                        <React.Fragment key={employeeKey}>
                          <DraggableEmployeeRow
                            employee={employee}
                            routeId={rowData.RouteID}
                            index={index}
                            isSelected={isSelected}
                            onSelectionChange={handleEmployeeSelection}
                            isMultiSelectMode={isMultiSelectMode}
                            selectedCount={selectedEmployees.size}
                            activeId={activeId}
                            selectedEmployees={selectedEmployees}
                            isDragInProgress={!!activeId}
                            isSplitMode={isSplitMode}
                            onDeleteEmployee={(employee, routeId) => {
                              setPendingDeleteEmployee({ employee, routeId });
                              setShowDeleteEmployeeDialog(true);
                            }}
                          />
                          {/* Drop zones after each employee - Hide in split mode */}
                          {!isSplitMode && (
                            <tr>
                              <td
                                colSpan="9"
                                style={{ padding: 0, border: "none" }}
                              >
                                <CrossPageDropZone
                                  routeId={rowData.RouteID}
                                  position={index + 2}
                                  isActive={crossPageDropMode}
                                  onDrop={handleCrossPageDrop}
                                  selectedEmployees={selectedEmployees}
                                />
                                <DropZoneIndicator
                                  routeId={rowData.RouteID}
                                  position={index + 2}
                                  isOver={
                                    activeId &&
                                    hoveredDropZone ===
                                      `dropzone-${rowData.RouteID}-${index + 2}`
                                  }
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>

            {/* Add Employee Button - Positioned at bottom-left of each route */}
            <div
              className="d-flex justify-content-between align-items-center p-3 border-top"
              style={{ backgroundColor: "#f8f9fa" }}
            >
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                  onClick={() => handleOpenAddEmployeeModal(rowData.RouteID)}
                  style={{
                    borderRadius: "20px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "500",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow =
                      "0 2px 8px rgba(40, 167, 69, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
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

            <Tooltip target="[data-pr-tooltip]" />
          </div>
        </div>
      );
    },
    [
      routeDetails,
      crossPageDropMode,
      activeId,
      hoveredDropZone,
      selectedEmployees,
      isMultiSelectMode,
      handleEmployeeSelection,
      handleCrossPageDrop,
      isSplitMode,
    ]
  );

  const handleRecalculateModifiedRoutes = useCallback(async () => {
    setIsLoading(true);
    toastService.info("Fetching data for all modified routes..."); // ✅ Changed

    try {
      // Step 1: Get the input JSON for all modified routes
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

      // ✨ UPDATED LOGIC: Check if the 'routes' property inside the object is empty
      if (
        !inputJsonData ||
        !inputJsonData.routes ||
        inputJsonData.routes.length === 0
      ) {
        toastService.info("No routes to be recalculated."); // ✅ Changed
        setIsLoading(false);
        return; // Stop execution here
      }

      toastService.info("Sending data for recalculation..."); // ✅ Changed

      // Step 2: Call the external recalculation API (this part is now conditional)
      const recalculateResponse = await fetch(
        "https://ftqbvxxmpm.ap-south-1.awsapprunner.com/api/route-generation/recalculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(inputJsonData),
        }
      );

      if (!recalculateResponse.ok) {
        const errorText = await recalculateResponse.text();
        throw new Error(
          `Recalculation server failed: ${recalculateResponse.status} ${errorText}`
        );
      }

      const recalculatedRouteJson = await recalculateResponse.json();

      // Step 3: Save the recalculated route data
      await ManageRouteService.updateRouteMapbased({
        facilityid: selectedFacility,
        sDate: shiftDate,
        triptype: selectedTripType,
        shifttime: selectedShifts,
        jsonstring: JSON.stringify(recalculatedRouteJson),
        updatedBy: userID,
      });

      toastService.success("Modified routes recalculated! Refreshing table..."); // ✅ Changed

      // Step 4: Refresh the main table to show updated data
      await handleSubmit();
    } catch (error) {
      console.error("Error recalculating modified routes:", error);
      toastService.error(`Failed to recalculate routes: ${error.message}`); // ✅ Changed
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedFacility,
    shiftDate,
    selectedTripType,
    selectedShifts,
    userID,
    handleSubmit,
  ]);

  // Add other handlers that were in the original code...
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

  // button
  const handleFinalizeRoute = useCallback(async () => {
    // First check if recalculation is needed
    const needsRecalculation = await checkIfRecalculationNeeded();

    if (needsRecalculation) {
      // Show the modal asking user to recalculate first
      setShowRecalcBeforeFinalizeDialog(true);
      return;
    }

    // If no recalculation needed, proceed with finalization
    await proceedWithFinalization();
  }, [checkIfRecalculationNeeded]);

  // Separate the actual finalization logic
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

      const bulkRouteData = await ManageRouteService.WBS_GetBulkRouteData(
        params
      );

      if (bulkRouteData && bulkRouteData.length > 0) {
        await pushDataToUpdateTripsheetDetail(bulkRouteData);
        toastService.success(
          "Route finalization and data push completed successfully."
        );
      } else {
        toastService.warn("No route data available to finalize.");
      }
    } catch (error) {
      console.error("Error finalizing routes:", error);
      toastService.error(
        "Finalization and data push failed. Please try again."
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

      // Step 1: Get the input JSON for all modified routes
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
        // If no routes to recalculate, proceed with finalization
        toastService.info(
          "No routes need recalculation. Proceeding with finalization..."
        );
        await proceedWithFinalization();
        return;
      }

      toastService.info("Sending data for recalculation...");

      // Step 2: Call the external recalculation API
      const recalculateResponse = await fetch(
        "https://ftqbvxxmpm.ap-south-1.awsapprunner.com/api/route-generation/recalculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(inputJsonData),
        }
      );

      if (!recalculateResponse.ok) {
        const errorText = await recalculateResponse.text();
        throw new Error(
          `Recalculation server failed: ${recalculateResponse.status} ${errorText}`
        );
      }

      const recalculatedRouteJson = await recalculateResponse.json();

      // Step 3: Save the recalculated route data
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

      // Step 4: Refresh the main table to show updated data
      await handleSubmit();

      // Step 5: Proceed with finalization
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
      const pushUrl = "/etmsApi/UpdateTripsheetDetail";
      const response = await axios.post(pushUrl, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 201) {
        // Success
      } else {
        console.error(
          "Failed to push data:",
          response.status,
          response.statusText
        );
        toastService.error(
          `Failed to push data. Status:  ${response.status} ${response.statusText}`
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
    try {
      setShowAutoVendorAllocationDialog(false);
      setIsLoading(true);
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
      await handleSubmit();
    } catch (error) {
      console.error("Error during auto vendor allocation:", error);
      toastService.error("Vendor allocation process failed to complete.");
      setVendorAllocated(false);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

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

  // Handle employee deletion from route
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

      // Parse the response - it comes as a stringified JSON array
      let parsedResponse;
      try {
        parsedResponse =
          typeof response === "string" ? JSON.parse(response) : response;
        // If it's an array, take the first element
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

        // Refresh the main route table data
        try {
          const tableResponse = await ManageRouteService.GetRoutesByOrder({
            sDate: shiftDate,
            eDate: shiftDate,
            FacilityID: selectedFacility,
            TripType: selectedTripType,
            Shifttimes: selectedShifts,
            OrderBy: "Routeno",
            Direction: "ASC",
            Routeid: "",
            occ_seater: -2,
          });

          const parsedTableResponse =
            typeof tableResponse === "string"
              ? JSON.parse(tableResponse)
              : tableResponse;
          setTableData(parsedTableResponse || []);
        } catch (refreshError) {
          console.error("Error refreshing route data:", refreshError);
        }

        // Refresh the specific route details to update the expanded row
        try {
          await refreshRouteDetails(routeId);
        } catch (refreshError) {
          console.error("Error refreshing route details:", refreshError);
        }

        // Clear any selections that might include the deleted employee
        setSelectedEmployees((prev) => {
          const newSelection = new Set(prev);
          const employeeKey = `${routeId}-${employee.id || employee.empID}`;
          newSelection.delete(employeeKey);
          return newSelection;
        });
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

  // Add Employee Modal Handlers
  const handleOpenAddEmployeeModal = useCallback((routeId) => {
    // Set the selected route ID for this specific route
    setSelectedRouteId(routeId);

    setShowAddEmployeeModal(true);
    setEmployeeSearchQuery("");
    setSearchResults([]);
    setSelectedEmployee(null);
    setSelectedStopNo(null);
    setAvailableStopNumbers([]);
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

      // Generate available stop numbers based on the current number of employees in the route
      const currentRouteEmployees = routeDetails[selectedRouteId];
      if (currentRouteEmployees && Array.isArray(currentRouteEmployees)) {
        const currentEmployeeCount = currentRouteEmployees.length;
        const stopNumbers = [];
        // Generate stop numbers from 1 to currentEmployeeCount + 1
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
    [routeDetails, selectedRouteId]
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

        // Refresh the main route table data
        try {
          const tableResponse = await ManageRouteService.GetRoutesByOrder({
            sDate: shiftDate,
            eDate: shiftDate,
            FacilityID: selectedFacility,
            TripType: selectedTripType,
            Shifttimes: selectedShifts,
            OrderBy: "Routeno",
            Direction: "ASC",
            Routeid: "",
            occ_seater: -2,
          });

          const parsedTableResponse =
            typeof tableResponse === "string"
              ? JSON.parse(tableResponse)
              : tableResponse;
          setTableData(parsedTableResponse || []);
        } catch (refreshError) {
          console.error("Error refreshing route data:", refreshError);
        }

        // Refresh the specific route details to update the expanded row
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
  ]);

  // Helper Component for Swipe-to-Delete Background
  // const SwipeToDeleteBackground = ({ isActive, swipeProgress }) => {
  //   const opacity = Math.min(Math.abs(swipeProgress) / 100, 1);
  //   return (
  //     <div
  //       style={{
  //         position: 'absolute',
  //         top: '1px',
  //         left: '1px',
  //         right: '1px',
  //         bottom: '1px',
  //         backgroundColor: '#dc3545',
  //         color: 'white',
  //         display: 'flex',
  //         alignItems: 'center',
  //         justifyContent: 'flex-end',
  //         paddingRight: '30px',
  //         opacity: isActive ? opacity : 0,
  //         transition: 'opacity 0.2s ease',
  //         zIndex: 1, // Behind the foreground
  //       }}
  //     >
  //       <i className="material-symbols-outlined me-2">delete</i>
  //       <strong>Delete</strong>
  //     </div>
  //   );
  // };

  const handleGenerateRoute = async () => {
    try {
      setShowGenerateRouteDialog(false);
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

      const osrmResponse = await fetch(
        "https://ftqbvxxmpm.ap-south-1.awsapprunner.com/api/route-generation/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: "http://localhost:5173",
          },
          mode: "cors",
          credentials: "omit",
          body: JSON.stringify(routeInputData),
        }
      );
      if (!osrmResponse.ok) {
        throw new Error(
          `Failed to generate route from OSRM server: ${osrmResponse.status} ${osrmResponse.statusText}`
        );
      }
      const generatedRouteJson = await osrmResponse.json();
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
      });
      setProgressStatus((prev) => ({
        ...prev,
        step: 4,
        message: "Finalizing route generation...",
        progress: 100,
      }));

      const response = await ManageRouteService.GetRoutesByOrder({
        sDate: shiftDate,
        eDate: shiftDate,
        FacilityID: selectedFacility,
        TripType: selectedTripType,
        Shifttimes: selectedShifts,
        OrderBy: "Routeno",
        Direction: "ASC",
        Routeid: "",
        occ_seater: -2,
      });

      const parsedResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      setTableData(parsedResponse || []);

      const params = {
        sdate: shiftDate,
        edate: shiftDate,
        triptype: selectedTripType,
        facilityid: selectedFacility,
        shifttime: selectedShifts,
      };
      let vendorData = await ManageRouteService.getvehtypeCountVendorwise(
        params
      );
      if (typeof vendorData === "string") {
        try {
          vendorData = JSON.parse(vendorData);
        } catch {
          vendorData = [];
        }
      }
      if (!Array.isArray(vendorData)) {
        vendorData = [];
      }
      setVendorSummary(vendorData);

      const statsResponse = await ManageRouteService.GetRoutesStatistics({
        sdate: shiftDate,
        edate: shiftDate,
        triptype: selectedTripType,
        facilityid: selectedFacility,
        shifttime: selectedShifts,
      });

      const parsedStatsResponse =
        typeof statsResponse === "string"
          ? JSON.parse(statsResponse)
          : statsResponse;
      setStatsDetails(parsedStatsResponse);
      if (parsedStatsResponse && parsedStatsResponse.length > 0) {
        setRouteStats({
          TotalEmps: parsedStatsResponse[0].TotalEmps || 0,
          TotalRoutes: parsedStatsResponse[0].TotalRoutes || 0,
          AvgOccupancy: parsedStatsResponse[0].AvgOccupancy || 0,
        });
      } else {
        setRouteStats({ TotalEmps: 0, TotalRoutes: 0, AvgOccupancy: 0 });
      }

      setProgressStatus((prev) => ({
        ...prev,
        message: "Routes generated successfully!",
        progress: 100,
      }));
      setShowButtons(true);
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
          .drop-zone {
            position: relative;
            overflow: hidden;
            will-change: transform, background-color, border-color;
            transform: translateZ(0);
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

          /* Auto-expand CSS */
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

          .drag-in-progress .p-datatable-tbody tr:hover {
            background-color: rgba(156, 39, 176, 0.1) !important;
            cursor: pointer;
          }

          .drag-overlay {
            will-change: transform;
            transform: translateZ(100px);
            pointer-events: none;
            transition: none;
          }

          .multi-employee-stack {
            position: relative;
            animation: stackFloat 0.6s ease-out;
          }

          @keyframes stackFloat {
            0% {
              transform: scale(0.9) rotate(0deg);
              opacity: 0.7;
            }
            100% {
              transform: scale(1) rotate(2deg);
              opacity: 1;
            }
          }

          .employee-count-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff4444;
            color: white;
            border-radius: 10px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            z-index: 10;
          }

          .employee-card-stack {
            will-change: transform;
          }

          .single-employee-drag {
            will-change: transform;
          }

          .employee-table {
            transform: translateZ(0);
          }

          .employee-table tbody tr {
            will-change: transform;
          }

          .dragging-over {
            background-color: #f5f5f5;
            border: 2px dashed #2196F3;
          }

          .multi-drag-container {
            position: relative;
          }

          /* Floating Selection Panel Styles */
          .floating-selection-panel {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }

          .floating-selection-panel.held {
            border-color: #ff9800;
            box-shadow: 0 8px 32px rgba(255, 152, 0, 0.3);
          }

          .floating-selection-panel .panel-header {
            border-radius: 10px 10px 0 0;
            user-select: none;
          }

          .employee-item {
            transition: background-color 0.2s ease;
          }

          .employee-item:hover {
            background-color: #f5f5f5;
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

          /* Enhanced visual feedback for hold mode */
          .held-selection-active {
            background: linear-gradient(45deg, #fff3e0, #ffe0b2);
            border-left: 4px solid #ff9800;
          }

          /* Route Selection Styles */
          .route-selected {
            background-color: #fff3e0 !important;
            border-left: 4px solid #ff9800 !important;
          }

          .route-selected:hover {
            background-color: #ffe0b2 !important;
          }

          /* UPDATED: Enhanced first-selected route styling */
          .route-selected.first-selected {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%) !important;
            border-left: 8px solid #28a745 !important;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
            position: relative;
          }

          @keyframes targetGlow {
            0%, 100% {
              opacity: 0.9;
              transform: translateY(-50%) scale(1);
              box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
            }
            50% {
              opacity: 1;
              transform: translateY(-50%) scale(1.02);
              box-shadow: 0 4px 12px rgba(40, 167, 69, 0.5);
            }
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

          .route-item {
            transition: background-color 0.2s ease;
          }

          .route-item:hover {
            background-color: rgba(255, 152, 0, 0.1) !important;
          }

          .merge-info {
            border-radius: 8px;
            margin: 4px;
          }

          /* Route merge mode styling */
          .route-merge-mode .p-datatable-tbody tr {
            cursor: pointer;
            transition: background-color 0.2s ease;
          }

          .route-merge-mode .p-datatable-tbody tr:hover {
            background-color: rgba(255, 152, 0, 0.1) !important;
          }

          /* Enhanced dialog styling */
          .route-merge-dialog .card {
            transition: all 0.3s ease;
          }

          .route-merge-dialog .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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

          /* Route Split Mode Styles */
          .route-split-mode .p-datatable-tbody tr {
            cursor: pointer;
            transition: background-color 0.2s ease;
            position: relative; /* Ensure pseudo-elements position correctly per row */
          }

          .route-split-mode .p-datatable-tbody tr:hover {
            background-color: rgba(23, 162, 184, 0.1) !important;
          }

          .split-selected {
            background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%) !important;
            border-left: 4px solid #17a2b8 !important;
            box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
          }

          .split-selected::after {
            content: 'SELECTED FOR SPLIT';
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #17a2b8, #138496);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            z-index: 10;
            box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
          }

          .split-disabled {
            background-color: #f8f9fa !important;
            color: #6c757d !important;
            opacity: 0.6;
            cursor: not-allowed !important;
            position: relative; /* Anchor ::after badge to the row */
          }

          .split-disabled::after {
            content: 'Cannot split (ends with S)';
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: #6c757d;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            z-index: 10;
          }

          .route-split-dialog .card {
            transition: all 0.3s ease;
          }

          .route-split-dialog .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          /* Responsive styles for the table when Route Merge Mode is active */
          .route-merge-table-active .p-datatable-thead > tr > th {
            /* Allow long headers like "Farthest Employee Dist.(Km)" to wrap */
            white-space: normal;
            /* Reduce font size to save space */
            font-size: 12px;
            /* Reduce padding to make columns narrower */
            padding: 0.6rem 0.4rem;
            text-align: center;
            vertical-align: middle;
          }

          .route-merge-table-active .p-datatable-tbody > tr > td {
            /* Reduce padding on the data cells */
            padding: 0.6rem 0.4rem;
            font-size: 13px;
          }

          /* Set minimum widths for specific columns to prevent them from becoming too small */
          .route-merge-table-active .p-column-header-content {
            justify-content: center; /* Center the header text */
          }

          .route-merge-table-active th:nth-child(4), /* Route ID */
          .route-merge-table-active th:nth-child(5) { /* Shift */
            min-width: 90px;
          }

          .route-merge-table-active th:nth-child(10), /* Stops */
          .route-merge-table-active th:nth-child(11) { /* Vendor */
            min-width: 70px;
          }

          /* Modern Modal Styles */
          // .modern-modal .p-dialog-header {
          //   background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          //   color: white;
          //   border-radius: 8px 8px 0 0;
          //   padding: 1rem;
          //   border-bottom: none;
          // }

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

          // .modern-modal .table {
          //   border-radius: 6px;
          //   overflow: hidden;
          //   box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          //   margin-bottom: 0;
          // }

          // .modern-modal .table thead th {
          //   background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          //   border-bottom: 1px solid #dee2e6;
          //   font-weight: 600;
          //   color: #495057;
          //   padding: 0.5rem;
          // }

          // .modern-modal .table tbody tr {
          //   transition: all 0.2s ease;
          // }

          // .modern-modal .table tbody tr:hover {
          //   background-color: #f8f9fa;
          //   transform: translateY(-1px);
          //   box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          // }

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

          // .modern-modal .btn {
          //   border-radius: 6px;
          //   font-weight: 500;
          //   transition: all 0.2s ease;
          //   border: 1px solid transparent;
          // }

          // .modern-modal .btn:hover {
          //   transform: translateY(-1px);
          //   box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          // }

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
        <div className="middle">
          <div className="row">
            <div className="col-8">
              <div className="card_tb p-3">
                <div className="row">
                  <div className="col">
                    <label htmlFor="">Shift Date</label>
                    <InputText
                      type="date"
                      className="w-100"
                      placeholder="Trips for the Day"
                      value={shiftDate}
                      onChange={(e) => setShiftDate(e.target.value)}
                    />
                  </div>
                  <div className="col">
                    <label htmlFor="">Facility Name</label>
                    <Dropdown
                      id="facility"
                      placeholder="Select Facility"
                      className="w-100"
                      filter
                      value={selectedFacility || null}
                      onChange={(e) => setSelectedFacility(e.value)}
                      options={facilities}
                      optionLabel="label"
                      optionValue="value"
                    />
                  </div>
                  <div className="col">
                    <label htmlFor="tripType">Trip Type</label>
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
                  <div className="col">
                    <label htmlFor="shift">Shift</label>
                    <Dropdown
                      filter
                      id="shift"
                      value={selectedShifts || []}
                      options={shifts}
                      onChange={(e) => setSelectedShifts(e.value)}
                      optionLabel="label"
                      placeholder="Select Shifts"
                      className="w-full md:w-20rem w-100"
                    />
                  </div>
                  <div className="col no-label">
                    {/* <Button
                      className="p-button-sm"
                      label={isLoading ? "Loading..." : "Submit"}
                      rounded
                      raised
                      // outlined
                      severity="primary"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    /> */}
                    <button
                      class="btn btn-dark p-button p-component"
                      label={isLoading ? "Loading..." : "Submit"}
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-4">
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

          {/* Enhanced Multi-Select Controls with Route Merge and Split */}
          {showButtons && (
            <div className="row mt-3">
              <div className="col-12 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  {/* Employee Multi-Select - Hide in split mode */}
                  {!isSplitMode && (
                    <div className="d-flex align-items-center gap-2">
                      <Button
                        label="Employee Multi-Select"
                        icon={`pi ${
                          isMultiSelectMode ? "pi-check-square" : "pi-square"
                        }`}
                        className="btn btn-outline-secondary"
                        //severity={isMultiSelectMode ? "primary" : "secondary"}
                        // outlined
                        //raised
                        //rounded
                        // text
                        onClick={() => {
                          setIsMultiSelectMode(!isMultiSelectMode);
                          if (isMultiSelectMode) handleClearSelection();
                        }}
                      />

                      {selectedEmployees.size > 0 && (
                        <>
                          {/* <span className="badge bg-primary me-2">
                            {selectedEmployees.size} employees
                          </span> */}

                          <Button
                            label={isSelectionHeld ? "Release" : "Hold"}
                            icon="pi pi-thumbtack"
                            className="btn btn-outline-secondary"
                            //severity={isSelectionHeld ? "warning" : "secondary"}
                            outlined={!isSelectionHeld}
                            onClick={handleToggleHold}
                            raised={!isSelectionHeld}
                            rounded={!isSelectionHeld}
                          />

                          <Button
                            label="Clear Employees"
                            icon="pi pi-times"
                            className="btn btn-outline-secondary"
                            //severity="danger"
                            //outlined
                            onClick={handleClearSelection}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Route Multi-Select - Hide in split mode */}
                  {!isSplitMode && (
                    <div className="d-flex align-items-center border-start ps-3">
                      <Button
                        label="Route Merge Mode"
                        icon="pi pi-share-alt"
                        className="btn btn-outline-secondary"
                        severity={isRouteSelectMode ? "warning" : "secondary"}
                        // outlined={!isRouteSelectMode}
                        raised
                        rounded
                        onClick={() => {
                          setIsRouteSelectMode(!isRouteSelectMode);
                          if (isRouteSelectMode) handleClearRouteSelection();
                        }}
                      />

                      {selectedRoutes.size > 0 && (
                        <>
                          {/* <span className="badge bg-warning text-dark me-2">
                            {selectedRoutes.size} routes
                          </span> */}

                          <Button
                            label="Merge Routes"
                            icon="pi pi-arrows-h"
                            className="btn btn-outline-secondary ms-2"
                            //severity="success"
                            onClick={handleMergeRoutes}
                            rounded
                            raised
                            // outlined
                            disabled={selectedRoutes.size < 2}
                          />

                          <Button
                            label="Clear Routes"
                            icon="pi pi-times"
                            className="btn btn-outline-secondary ms-2"
                            severity="danger"
                            outlined
                            raised
                            rounded
                            onClick={handleClearRouteSelection}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Route Split Mode */}
                  <div
                    className={`d-flex align-items-center ${
                      !isSplitMode && (isMultiSelectMode || isRouteSelectMode)
                        ? "border-start ps-3"
                        : ""
                    }`}
                  >
                    <Button
                      label="Route Split Mode"
                      icon="pi pi-sitemap"
                      className="btn btn-outline-secondary"
                      severity={isSplitMode ? "info" : "secondary"}
                      // outlined={!isSplitMode}
                      onClick={handleToggleSplitMode}
                      raised
                      rounded
                      disabled={isMultiSelectMode || isRouteSelectMode}
                    />

                    {isSplitMode && (
                      <>
                        {splitModeEmployees.size > 0 && (
                          <>
                            <Button
                              label="Split Route"
                              //icon="pi pi-sitemap"
                              className="btn btn-outline-secondary ms-2"
                              severity="success"
                              outlined
                              raised
                              rounded
                              onClick={handleSplitRoute}
                              disabled={
                                !selectedRouteForSplit ||
                                splitModeEmployees.size === 0
                              }
                            />

                            <Button
                              label="Clear Selection"
                              //icon="pi pi-times"
                              className="btn btn-outline-secondary ms-2"
                              severity="danger"
                              outlined
                              raised
                              rounded
                              onClick={handleClearSplitSelection}
                            />

                            <span className="ms-5">
                              <strong className="text-primary fw-bold">
                                {splitModeEmployees.size}
                              </strong>{" "}
                              employees to split
                            </span>
                            <span className="mx-3">|</span>
                          </>
                        )}

                        {selectedRouteForSplit && (
                          <span>
                            Route{" "}
                            <strong className="text-primary fw-bold">
                              {selectedRouteForSplit}
                            </strong>{" "}
                            selected
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Existing buttons - Hide in split mode */}
                {!isSplitMode && (
                  <div>
                    <Button
                      label="Recalculate"
                      icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-sync"}
                      className="btn btn-primary me-2"
                      severity="warning"
                      raised
                      rounded
                      onClick={handleRecalculateModifiedRoutes}
                      disabled={isLoading}
                      tooltip="Recalculates ETA and distance for all modified routes in this shift"
                      tooltipOptions={{ position: "top" }}
                    />

                    <Button
                      label={
                        isLoading ? "Allocating..." : "Auto Vendor Allocation"
                      }
                      icon="pi pi-cog"
                      className="btn btn-primary me-2"
                      //severity="warning"
                      // outlined
                      raised
                      rounded
                      onClick={handleAutoVendorAllocation}
                      disabled={isLoading}
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
                )}
              </div>

              {/* Split Mode Instructions */}
              {isSplitMode && (
                <div className="col-12 mt-2">
                  <div className="alert alert-info d-flex align-items-center">
                    <span
                      className="material-icons me-2"
                      style={{ fontSize: "20px" }}
                    >
                      info
                    </span>
                    <div>
                      <strong>Route Split Mode Active:</strong>
                      {!selectedRouteForSplit ? (
                        <span>
                          {" "}
                          Click on a route (not ending with 'S') to select it
                          for splitting.
                        </span>
                      ) : splitModeEmployees.size === 0 ? (
                        <span>
                          {" "}
                          Now select employees from Route{" "}
                          {selectedRouteForSplit} to move to the new route{" "}
                          {selectedRouteForSplit}S.
                        </span>
                      ) : (
                        <span>
                          {" "}
                          {splitModeEmployees.size} employee(s) selected to move
                          from Route {selectedRouteForSplit} to new Route{" "}
                          {selectedRouteForSplit}S.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Table with Cross-Page Mode, Route Selection, and Split Mode */}
          <div className="row">
            <div className="col-12">
              <div className="card_tb">
                <div className="row">
                  <div className="col-12 text-end d-flex justify-content-end">
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
                  value={memoizedTableData}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  dataKey="RouteID"
                  onRowExpand={(e) =>
                    console.log("Expanded RouteID:", e.data.RouteID)
                  }
                  onRowMouseEnter={handleRouteRowEnter}
                  onRowMouseLeave={handleRouteRowLeave}
                  emptyMessage="No Record Found."
                  paginator
                  rows={50}
                  rowsPerPageOptions={[50, 100, 150, 200, 250]}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                  className={`p-datatable-sm ${
                    isRouteSelectMode ? "route-merge-table-active" : ""
                  }`}
                  rowClassName={getRowClassName}
                  onRowClick={
                    isRouteSelectMode
                      ? (e) => {
                          e.preventDefault();
                          handleRouteSelection(e.data.RouteID);
                        }
                      : isSplitMode
                      ? (e) => {
                          e.preventDefault();
                          handleRouteSelectionForSplit(e.data.RouteID);
                        }
                      : undefined
                  }
                >
                  <Column expander style={{ width: "3rem" }} />

                  {/* Add Route Selection Column */}
                  {isRouteSelectMode && (
                    <Column
                      header="Select"
                      style={{ width: "4rem" }}
                      body={(rowData) => (
                        <input
                          type="checkbox"
                          checked={selectedRoutes.has(rowData.RouteID)}
                          onChange={() => handleRouteSelection(rowData.RouteID)}
                          className="form-check-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
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
                  ></Column>
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
                  <Column field="totalStop" header="Stops" sortable />
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
                  ></Column>
                </DataTable>
                <Tooltip target="[data-pr-tooltip]" />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Selection Panel */}
        <FloatingSelectionPanel
          selectedEmployees={selectedEmployees}
          routeDetails={routeDetails}
          onClearSelection={handleClearSelection}
          onToggleHold={handleToggleHold}
          isHeld={isSelectionHeld}
          onDrop={handleCrossPageDrop}
          isVisible={showFloatingPanel}
        />

        {/* UPDATED: Floating Route Selection Panel with routeSelectionOrder */}
        <FloatingRouteSelectionPanel
          selectedRoutes={selectedRoutes}
          tableData={memoizedTableData}
          onClearSelection={handleClearRouteSelection}
          onMergeRoutes={handleMergeRoutes}
          isVisible={showFloatingRoutePanel}
          routeSelectionOrder={routeSelectionOrder}
        />

        <OffcanvasRouteDetails
          key={offcanvasRefreshKey}
          show={showOffcanvas}
          onClose={() => setShowOffcanvas(false)}
          routeId={selectedRouteId}
        />

        <Dialog
          visible={showProgressDialog}
          onHide={() => {}}
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
        </Dialog>

        <Dialog
          visible={showGenerateRouteDialog}
          onHide={() => setShowGenerateRouteDialog(false)}
          header="Are you sure?"
          footer={
            <div className="d-flex gap-2 justify-content-end">
              <Button
                label="No"
                onClick={() => setShowGenerateRouteDialog(false)}
                severity="secondary"
                raised
              />
              <Button
                label="Yes"
                onClick={handleGenerateRoute}
                severity="primary"
                raised
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
        </Dialog>

        {/* Enhanced Drag and Drop Confirmation Dialog */}
        <Dialog
          visible={showDragDropConfirmDialog}
          onHide={cancelDragDropOperation}
          style={{ width: "692px", height: "auto" }}
          header={
            <div className="d-flex align-items-center">
              {/* <i
                className="material-icons me-2"
                style={{ color: "#dc3545", fontSize: "20px" }}
              >
                warning
              </i> */}
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
              <Button
                label="Cancel"
                onClick={cancelDragDropOperation}
                className="btn btn-outline-dark"
              />
              <Button
                label={
                  pendingDragOperation?.isSameRouteReorder
                    ? "Confirm Reorder"
                    : "Confirm Move"
                }
                onClick={confirmDragDropOperation}
                disabled={isLoading}
                className="btn btn-dark ms-3"
              />
            </>
          }
          //style={{ width: "500px", height: "auto" }}
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
        </Dialog>

        {/* UPDATED: Route Merge Confirmation Dialog */}
        <Dialog
          visible={showRouteMergeDialog}
          onHide={cancelMergeOperation}
          header="Confirm Route Merge"
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
                className="btn btn-dark ms-3"
              />
            </>
          }
          style={{ width: "692px" }}
          className="route-merge-dialog"
        >
          {pendingMergeOperation && (
            <div className="p-0">
              <div className="alert alert-warning mb-3">
                <strong>Warning:</strong> This action cannot be undone!
              </div>

              <p className="mb-3">
                You are about to merge{" "}
                <strong>{pendingMergeOperation.sourceRoutes.length}</strong>{" "}
                route(s) into Route{" "}
                <strong className="text-primary">
                  {pendingMergeOperation.targetRoute}
                </strong>{" "}
                <span className="badge bg-success ms-2">FIRST SELECTED</span>.
              </p>

              <div className="row d-flex">
                <div className="col-6">
                  <div className="card border-primary h-100">
                    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                      <strong className="mb-0">
                        Target Route (Preserved):
                      </strong>
                      <span
                        className="badge bg-light text-primary"
                        style={{ fontSize: "10px" }}
                      >
                        FIRST
                      </span>
                    </div>
                    <div className="card-body bg-primary-subtle">
                      <div className="d-flex align-items-center">
                        <span className="badge bg-primary me-2">KEEP</span>
                        <strong>
                          Route {pendingMergeOperation.targetRoute}
                        </strong>
                      </div>
                      <small className="d-block mt-2">
                        <strong>First selected route</strong> - will receive all
                        employees from other routes
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-6">
                  <div className="card border-danger h-100">
                    <div className="card-header bg-danger text-white">
                      <strong className="mb-0">
                        Source Routes (To Be Deleted):
                      </strong>
                    </div>
                    <div
                      className="card-body bg-danger-subtle"
                      //style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      {pendingMergeOperation.sourceRoutes.map(
                        (routeId, index) => (
                          <div key={routeId} className="  rounded">
                            <div className="">
                              <div>
                                <span className="badge bg-danger me-2">
                                  DELETE
                                </span>
                                <strong>Route {routeId}</strong>
                              </div>
                              <small className="mt-2 d-block">
                                {index + 2}
                                {getOrdinalSuffix(index + 2)} selected
                              </small>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded">
                <strong className="mb-3 d-block">Merge Process:</strong>
                <ol className="m-0">
                  <li>
                    All employees from source routes will be moved to{" "}
                    <strong>Route {pendingMergeOperation.targetRoute}</strong>.
                  </li>
                  <li className="py-2">
                    Source routes (
                    {pendingMergeOperation.sourceRoutes.join(", ")}) will be
                    permanently deleted.
                  </li>
                  <li>
                    Route {pendingMergeOperation.targetRoute} will be updated
                    with the new employee list.
                  </li>
                </ol>
              </div>

              <div className="alert alert-light mt-3">
                <small>
                  <strong>Rule:</strong> The{" "}
                  <span className="text-primary fw-bold">
                    first selected route
                  </span>{" "}
                  becomes the target route that receives all employees.
                </small>
              </div>

              <div className="mt-3 text-center">
                <small className=""></small>
              </div>
            </div>
          )}
        </Dialog>

        {/* NEW: Route Split Confirmation Dialog */}
        <Dialog
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

              <div className="mt-3">
                <strong className="mb-3 d-block">Employees to be moved:</strong>
                <div
                  className="border rounded p-2"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  {pendingSplitOperation.employeeDetails.map(
                    (employee, index) => (
                      <div
                        key={index}
                        className="d-flex justify-content-between align-items-center py-1"
                      >
                        <span>
                          <strong>{employee.empCode}</strong> -{" "}
                          {employee.empName}
                        </span>
                        <div className="d-flex gap-1">
                          {employee.isPWD && (
                            <img
                              src="images/icons/pwd.png"
                              alt="PWD"
                              style={{ width: "16px", height: "16px" }}
                            />
                          )}
                          {employee.isOOB && (
                            <img
                              src="images/icons/oob.png"
                              alt="OOB"
                              style={{ width: "16px", height: "16px" }}
                            />
                          )}
                          {employee.Gender === "F" && (
                            <span
                              className="badge bg-danger-subtle text-dark"
                              style={{ fontSize: "8px" }}
                            >
                              F
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog>

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
                        {(statsDetails?.[0]?.mediumVehicleCount || 0) -
                          (statsDetails?.[0]?.FleetExhaustionCount || 0)}
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

        <Dialog
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
        </Dialog>

        {/* Employee Delete Confirmation Dialog */}
        <Dialog
          visible={showDeleteEmployeeDialog}
          onHide={() => setShowDeleteEmployeeDialog(false)}
          header={
            <div className="d-flex align-items-center">
              <span>Confirm Employee Deletion</span>
            </div>
          }
          //style={{ fontSize: "16px !important", fontWeight: "600" }}
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
              {/* <i
                className="material-icons text-danger"
                style={{ fontSize: "48px", marginBottom: "16px" }}
              >
                warning
              </i> */}
              <p className=" mb-3">
                Are you sure you want to delete{" "}
                <strong class="text-primary fw-bold">
                  {pendingDeleteEmployee.employee.empName}
                </strong>{" "}
                from route{" "}
                <strong class="text-primary fw-bold">
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
        </Dialog>

        {/* Modern Add Employee Modal */}
        <Dialog
          visible={showAddEmployeeModal}
          onHide={handleCloseAddEmployeeModal}
          header={
            <div className="d-flex align-items-center">
              {/* <i
                className="material-icons me-2"
                style={{ color: "#28a745", fontSize: "20px" }}
              >
                person_add
              </i> */}
              <span>Add Employee to Route</span>
            </div>
          }
          style={{ width: "692px", maxWidth: "95vw" }}
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
                // icon={                  isAddingEmployee ? "pi pi-spinner pi-spin" : "pi pi-check"
                // }
              />
            </div>
          }
        >
          <div className="p-3">
            {/* Route Info Header */}
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
                  {routeDetails[selectedRouteId] &&
                    Array.isArray(routeDetails[selectedRouteId]) && (
                      <span className="fw-bold text-primary">
                        {routeDetails[selectedRouteId].length} employee
                        {routeDetails[selectedRouteId].length !== 1 ? "s" : ""}
                      </span>
                    )}
                </div>
              </div>
            )}

            {/* Search Section */}
            <div className="mb-3">
              <div className="d-flex align-items-center mb-2">
                {/* <i
                  className="material-icons me-2"
                  style={{ color: "#6c757d", fontSize: "16px" }}
                >
                  search
                </i> */}
                <span className="fw-semibold" style={{ fontSize: "14px" }}>
                  Search Employee
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
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
                  label={isSearching ? "..." : "Search"}
                  onClick={handleSearchEmployees}
                  className="btn btn-dark me-3 d-flex w-25"
                  //disabled={isSearching || !employeeSearchQuery.trim()}
                  icon={isSearching ? "pi pi-spinner pi-spin" : "pi pi-search"}
                />
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center">
                    {/* <i
                      className="material-icons me-2"
                      style={{ color: "#17a2b8", fontSize: "16px" }}
                    >
                      people
                    </i> */}
                    <span className="fw-semibold" style={{ fontSize: "14px" }}>
                      Search Results
                    </span>
                  </div>
                  <span className="badge bg-primary">
                    {searchResults.length} &nbsp; Found
                  </span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover table-bordered">
                    <thead className="table-dark">
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
                          className={
                            selectedEmployee?.id === employee.id ? "" : ""
                          }
                          //style={{ cursor: "pointer", fontSize: "12px" }}
                          onClick={() => handleSelectEmployee(employee)}
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
                            }}
                          >
                            {employee.address}
                          </td>
                          <td>
                            <Button
                              label="Select"
                              className="btn btn-outline-secondary"
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

            {/* Selected Employee */}
            {selectedEmployee && (
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  {/* <i
                    className="material-icons me-2"
                    style={{ color: "#28a745", fontSize: "16px" }}
                  >
                    check_circle
                  </i> */}
                  <span className="fw-semibold" style={{ fontSize: "14px" }}>
                    Selected Employee
                  </span>
                </div>
                <div
                  className="card p-3"
                  style={{ backgroundColor: "#f8fff9" }}
                >
                  <div className="card-body p-2">
                    <div className="row g-2">
                      <div className="col-6">
                        <small className="text-muted">Employee ID</small>
                        <div className="fw-bold">
                          {selectedEmployee.empCode}
                        </div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Name</small>
                        <div className="fw-bold">
                          {selectedEmployee.empName}
                        </div>
                      </div>
                      <div className="col-12">
                        <small className="text-muted">Address</small>
                        <div className="fw-bold">
                          {selectedEmployee.address}
                        </div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Process</small>
                        <div className="fw-bold">
                          {selectedEmployee.processName}
                        </div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Transport</small>
                        <div>
                          <span
                            className={`badge ${
                              selectedEmployee.TptReq === "Y"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {selectedEmployee.TptReq === "Y"
                              ? "Required"
                              : "Not Required"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stop Selection */}
            {selectedEmployee && availableStopNumbers.length > 0 && (
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  {/* <i
                    className="material-icons me-2"
                    style={{ color: "#ffc107", fontSize: "16px" }}
                  >
                    location_on
                  </i> */}
                  <span className="fw-semibold" style={{ fontSize: "14px" }}>
                    Select Stop Position
                  </span>
                </div>
                <div className="row g-2">
                  <div className="col-8">
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
                  </div>
                  <div className="col-4 d-flex align-items-center">
                    <div className="text-muted" style={{ fontSize: "11px" }}>
                      <i
                        className="material-icons me-1"
                        style={{ fontSize: "12px" }}
                      >
                        info
                      </i>
                      Insert at position
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ready Status */}
            {selectedEmployee && selectedStopNo && (
              <div
                className="alert alert-success py-2"
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
                    Ready to add <strong>{selectedEmployee.empName}</strong> at{" "}
                    <strong>
                      {selectedStopNo}
                      {getOrdinalSuffix(selectedStopNo)} stop
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </Dialog>

        {/* Enhanced Drag Overlay with Multi-Select Support */}
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
                  {/* Stack effect for multiple employees */}
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
                        boxShadow: `0 ${4 + index * 2}px ${
                          16 + index * 4
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
        {/* Recalculate Before Finalize Dialog */}
        <Dialog
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
        </Dialog>
      </DndContext>
    </>
  );
};

export default ManageRoute;

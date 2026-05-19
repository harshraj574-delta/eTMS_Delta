import React, { useCallback, useState, useEffect, useMemo } from "react";
import { ToastContainer } from "react-toastify";
import Loader from "./common/Loader";
import Header from "./Master/Header";
import SidebarMenu from "./Master/SidebarMenu";
import MasterSidebar from "./Master/MasterSidebar";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import AppDialog from "./common/AppDialog";
import AppConfirmDialog from "./common/AppConfirmDialog";
import noReportImage from "../assets/no_report.png";
import { Column } from "primereact/column";
import CustomPaginator from "./common/CustomPaginator";
import { CustomDataTable } from "./common/CustomDataTable";
import useManageColonyLogic from "../hooks/compliance/useManageColonyLogic";
import { useRouteSeqDetailQuery } from "../hooks/compliance/useManageColonyQueries";
import SwipeToDeleteBackground from "./SwipeToDeleteBackground";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragOverlay,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensors,
  useSensor,
} from "@dnd-kit/core";

// ─── Swipe / Drag threshold ──────────────────────────────────────────────────
const SWIPE_DELETE_THRESHOLD = 100;

// ─── Enterprise Cross Colony Drop Zone ─────────────────────────────────────────
const CrossColonyDropZone = React.memo(
  ({ targetItem, positionLabel, isActive, onDrop, selectedItems, onAddClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = useCallback(() => {
      if (isActive) {
        onDrop(targetItem);
      } else if (onAddClick) {
        onAddClick(targetItem);
      }
    }, [isActive, onDrop, onAddClick, targetItem]);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    const style = useMemo(
      () => ({
        height: isHovered ? "44px" : "10px",
        backgroundColor: isActive
          ? isHovered
            ? "rgba(13, 110, 253, 0.12)"
            : "rgba(13, 110, 253, 0.04)"
          : isHovered
            ? "rgba(40, 167, 69, 0.12)" // Green hover for Add Mode
            : "transparent",
        border: isActive
          ? isHovered
            ? "2px dashed #0d6efd"
            : "2px dashed rgba(13, 110, 253, 0.25)"
          : isHovered
            ? "2px dashed #28a745" // Green dash for Add Mode
            : "2px dashed transparent",
        borderRadius: "6px",
        margin: "4px 0",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        color: isActive ? "#0d6efd" : "#28a745",
        letterSpacing: "0.2px",
        fontWeight: "600",
        cursor: "pointer", // always pointer when hovered because both modes are clickable
        boxShadow: isActive 
          ? (isHovered ? "0 2px 6px rgba(13, 110, 253, 0.1)" : "none") 
          : (isHovered ? "0 2px 6px rgba(40, 167, 69, 0.1)" : "none"),
        overflow: "hidden",
      }),
      [isActive, isHovered]
    );

    return (
      <div
        className="cross-colony-drop-zone"
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        title={!isActive ? "Click to insert a new colony here" : undefined}
      >
        <div style={{ opacity: isHovered ? 1 : 0, transition: "opacity 0.2s", display: "flex", alignItems: "center" }}>
          {isActive ? (
            <>
              <i className="material-icons me-2" style={{ fontSize: "18px" }}>arrow_downward</i>
              Drop {selectedItems?.size || 0} colony(s) here (Pos: {positionLabel})
            </>
          ) : (
            <>
              <i className="material-icons me-2" style={{ fontSize: "18px" }}>add_circle_outline</i>
              Insert New Colony Here (Pos: {positionLabel})
            </>
          )}
        </div>
      </div>
    );
  }
);

// ─── Draggable Colony Row ────────────────────────────────────────────────────
const DraggableColonyRow = React.memo(
  ({ rowData, isSelected, onSelectionChange, onSeqIdClick }) => {
    const {
      attributes,
      listeners,
      setNodeRef: setDragRef,
      transform,
      isDragging,
    } = useDraggable({
      id: `colony-drag-${rowData.Id}`,
      data: { rowData, type: "colony" },
    });

    const { isOver, setNodeRef: setDropRef } = useDroppable({
      id: `colony-drop-${rowData.Id}`,
      data: { rowData, type: "colony-target" },
    });

    const swipeX = transform ? transform.x : 0;

    // Combine both refs on the outer wrapper
    const setOuterRef = useCallback(
      (node) => {
        setDropRef(node);
      },
      [setDropRef],
    );

    const outerStyle = useMemo(
      () => ({
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid #dee2e6",
        backgroundColor:
          isOver && !isDragging
            ? "rgba(13, 110, 253, 0.06)"
            : isSelected
              ? "rgba(13, 110, 253, 0.04)"
              : "#ffffff",
        outline:
          isOver && !isDragging
            ? "2px dashed #0d6efd"
            : isSelected
              ? "1px solid rgba(13, 110, 253, 0.3)"
              : "none",
        transition: "background-color 0.15s, outline-color 0.15s",
      }),
      [isOver, isDragging, isSelected],
    );

    const innerStyle = useMemo(
      () => ({
        display: "flex",
        alignItems: "center",
        /* Match PrimeReact p-datatable-sm body cell padding exactly */
        padding: "0.5rem 1rem",
        gap: "6px",
        transform: `translateX(${swipeX}px)`,
        backgroundColor: isDragging ? "#e8f0fe" : "transparent",
        opacity: isDragging ? 0.7 : 1,
        transition: isDragging ? "none" : "transform 0.25s ease",
        willChange: "transform",
        position: "relative",
        zIndex: 2,
        userSelect: "none",
        /* Match custom-html-table tbody font */
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: "11px",
        fontWeight: "500",
        color: "#1C1D20",
        letterSpacing: "-0.02em",
      }),
      [swipeX, isDragging],
    );

    return (
      <div 
        ref={setOuterRef} 
        style={outerStyle} 
        className="colony-detail-row"
      >
        {/* Red delete background visible on right-swipe */}
        {/* <SwipeToDeleteBackground isActive={isDragging} swipeProgress={swipeX} /> */}

        {/* Foreground row content */}
        <div ref={setDragRef} style={innerStyle}>
          {/* ── Actions column: checkbox + drag handle (mirroring ManageRouteDesktop col-1) ── */}
          <div
            style={{
              width: "66px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelectionChange(rowData);
              }}
              onClick={(e) => e.stopPropagation()}
              className="form-check-input"
              style={{ cursor: "pointer", margin: 0, flexShrink: 0 }}
            />
            {/* Drag Handle */}
            <span
              className="material-icons"
              style={{
                fontSize: "18px",
                color: "#adb5bd",
                lineHeight: 1,
                cursor: "grab",
                flexShrink: 0,
              }}
              {...attributes}
              {...listeners}
              title="Drag to reorder"
            >
              drag_indicator
            </span>
          </div>

          {/* ── SeqId (clickable → edit sidebar) ── */}
          <div style={{ width: "52px", flexShrink: 0 }}>
            <a
              href="#!"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSeqIdClick(rowData);
              }}
              className="text-primary fw-semibold"
              style={{ textDecoration: "none", fontSize: "11px" }}
              title="Click to edit"
            >
              {rowData.SeqId}
            </a>
          </div>

          {/* ── Zone ── */}
          <div
            style={{
              flex: 1,
              minWidth: "70px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={rowData.ZoneName}
          >
            {rowData.ZoneName}
          </div>

          {/* ── City ── */}
          <div
            style={{
              flex: 1,
              minWidth: "65px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={rowData.City}
          >
            {rowData.City}
          </div>

          {/* ── Colony (Area) ── */}
          <div
            style={{
              flex: 1.5,
              minWidth: "90px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={rowData.Colony}
          >
            {rowData.Colony}
          </div>

          {/* ── SubColony (Landmark) ── */}
          <div
            style={{
              flex: 2,
              minWidth: "110px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={rowData.SubColony}
          >
            {rowData.SubColony}
          </div>

          {/* ── Metro ── */}
          <div style={{ width: "52px", flexShrink: 0, textAlign: "center" }}>
            {rowData.Metro === "Yes" || rowData.Metro === true ? (
              <span
                className="badge bg-success-subtle text-success"
                style={{ fontSize: "0.8rem" }}
              >
                Yes
              </span>
            ) : (
              <span
                className="badge bg-secondary-subtle text-secondary"
                style={{ fontSize: "0.8rem" }}
              >
                No
              </span>
            )}
          </div>

          {/* ── Travel Time ── */}
          <div
            style={{
              width: "44px",
              flexShrink: 0,
              textAlign: "center",
            }}
          >
            {rowData.travelTime}
          </div>

          {/* ── Travel Km ── */}
          <div
            style={{
              width: "44px",
              flexShrink: 0,
              textAlign: "center",
            }}
          >
            {rowData.travelKm}
          </div>
        </div>
      </div>
    );
  },
);

// ─── Route Detail Table ───────────────────────────────────────
const RouteDetailTable = React.memo(
  ({ routeId, facilityId, locationId, selectedItems, actions, isMoveMode }) => {
    const { data: details = [], isLoading } = useRouteSeqDetailQuery(
      routeId,
      locationId,
      facilityId,
    );

    // ── Early returns ──
    if (isLoading) {
      return (
        <div className="text-center py-4">
          <span className="spinner-border spinner-border-sm me-2" />
          Loading details…
        </div>
      );
    }

    if (details.length === 0) {
      return (
        <div className="text-center text-muted p-3">
          No route sequence details available
        </div>
      );
    }

    return (
      <div
        style={{
           border: "none",
           borderRadius: "0",
           overflow: "hidden",
        }}
      >
        {/* ── Sticky Header — exactly matches custom-html-table thead th ── */}
        <div
          className="d-flex align-items-center"
          style={{
            /* Match custom-html-table thead */
            padding: "0.5rem 1rem",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "12px",
            fontWeight: "800",
            color: "#545557",
            letterSpacing: "-0.03em",
            backgroundColor: "#f8f9fa",
            borderTop: "1px solid #e9ecef",
            borderBottom: "1px solid #e9ecef",
            position: "sticky",
            top: 0,
            zIndex: 3,
            userSelect: "none",
            gap: "6px",
          }}
        >
          <div style={{ width: "66px", flexShrink: 0 }}>Actions</div>
          <div style={{ width: "52px", flexShrink: 0 }}>SeqID</div>
          <div style={{ flex: 1, minWidth: "70px" }}>Zone</div>
          <div style={{ flex: 1, minWidth: "65px" }}>City</div>
          <div style={{ flex: 1.5, minWidth: "90px" }}>Area</div>
          <div style={{ flex: 2, minWidth: "110px" }}>Landmark</div>
          <div style={{ width: "52px", flexShrink: 0, textAlign: "center" }}>Metro</div>
          <div style={{ width: "44px", flexShrink: 0, textAlign: "center" }}>Time</div>
          <div style={{ width: "44px", flexShrink: 0, textAlign: "center" }}>Km</div>
        </div>

        {/* ── Rows ── */}
        {details.map((rowData, index) => (
          <React.Fragment key={rowData.Id}>
            <CrossColonyDropZone
              targetItem={rowData}
              positionLabel={index + 1}
              isActive={isMoveMode}
              onDrop={actions.handleMoveTarget}
              selectedItems={selectedItems}
              onAddClick={actions.handleAddClick}
            />
            <DraggableColonyRow
              rowData={rowData}
              isSelected={selectedItems?.has(rowData.Id)}
              onSelectionChange={actions.handleItemSelection}
              onSeqIdClick={actions.handleEditClick}
            />
            {/* Last drop zone after the end */}
            {index === details.length - 1 && (
              <CrossColonyDropZone
                targetItem={{...rowData, isAppend: true}}
                positionLabel={index + 2}
                isActive={isMoveMode}
                onDrop={actions.handleMoveTarget}
                selectedItems={selectedItems}
                onAddClick={actions.handleAddClick}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  },
);

// ─── Floating Colony Selection Panel ────────────────────────────────────────
const FloatingColonyPanel = React.memo(
  ({
    selectedItems,
    onClearSelection,
    onDeleteSelected,
    onDeleteItem,
    onSplitRoute,
    isMoveMode,
    onToggleMoveMode,
    isVisible,
  }) => {
    const [position, setPosition] = useState({ x: 120, y: 200 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = useCallback(
      (e) => {
        if (e.target.closest(".colony-panel-header")) {
          setIsDragging(true);
          setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
          });
        }
      },
      [position],
    );

    const handleMouseMove = useCallback(
      (e) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      },
      [isDragging, dragStart],
    );

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    useEffect(() => {
      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // Keep all hooks above — early return after hooks
    if (!isVisible) return null;

    const items = Array.from(selectedItems.values());

    return (
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "fixed",
          top: `${position.y}px`,
          left: `${position.x}px`,
          width: "520px",
          height: "30vh",
          zIndex: 1200,
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "white",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
          willChange: "transform",
          transition: "box-shadow 0.2s ease-in-out",
          userSelect: "none",
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {/* ── Panel Header — identical layout to ManageRouteDesktop PanelContent header ── */}
        <div
          className="colony-panel-header draggable-panel-header"
          style={{
            background: "linear-gradient(90deg, #f5f7fa, #e4e7ec)",
            padding: "12px 16px",
            borderBottom: "1px solid #ddd",
            cursor: "move",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 5,
            flexShrink: 0,
          }}
        >
          {/* Left: action buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className={`btn btn-sm ${isMoveMode ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center gap-2`}
              onClick={onToggleMoveMode}
              disabled={items.length === 0}
            >
              <i className={isMoveMode ? "pi pi-lock" : "pi pi-arrows-alt"}></i>
              Move Colonies
            </button>
            {/* <button
              className="btn btn-sm btn-danger d-flex align-items-center gap-2"
              onClick={onDeleteSelected}
              disabled={items.length === 0}
            >
              <i className="pi pi-trash"></i>
              Delete Selected
            </button> */}
            <button
              className="btn btn-sm btn-primary d-flex align-items-center gap-2"
              onClick={onSplitRoute}
              disabled={items.length === 0}
            >
              <i className="pi pi-sitemap"></i>
              Split Route
            </button>
          </div>

          {/* Right: close button — exact size from ManageRouteDesktop */}
          <button
            className="btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
            onClick={onClearSelection}
            title="Close"
            style={{ width: "30px", height: "30px", flexShrink: 0 }}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* ── Selected Items List — identical structure to ManageRouteDesktop employeeItemTemplate ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#fafafa",
            padding: "8px 12px",
          }}
        >
          {items.map((item) => (
            <div
              key={item.Id}
              className="d-flex align-items-center p-2 border-bottom"
              style={{ background: "white" }}
            >
              <div className="flex-grow-1 d-flex align-items-center justify-content-between">
                {/* Left: name + zone/city */}
                <div>
                  <p className="fw-bold mb-0">
                    {item.Colony || item.SubColony || `Seq #${item.SeqId}`}
                  </p>
                  <p
                    className="mb-0"
                    style={{ fontSize: "11px", color: "#666" }}
                  >
                    {item.ZoneName}
                    {item.City ? ` · ${item.City}` : ""}
                  </p>
                </div>

                {/* Right: SeqId + PrimeReact trash button with tooltip */}
                <div className="d-flex align-items-center">
                  <p
                    className="ms-3 mb-0"
                    style={{ fontSize: "11px", color: "#555" }}
                  >
                    #{item.SeqId}
                  </p>
                  {/* <Button
                    icon="pi pi-trash"
                    className="p-button-sm p-button-danger p-button-text ms-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem && onDeleteItem(item);
                    }}
                    tooltip="Remove colony"
                    tooltipOptions={{ position: "top" }}
                  /> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

// ─── Main Component ─────────────────────────────────────────────────────────
const ManageColony = () => {
  const { data, state, actions } = useManageColonyLogic();

  // ─── Drag State (Lifted to allow cross-route drops) ───
  const [activeRowData, setActiveRowData] = useState(null);
  const [pendingDragOp, setPendingDragOp] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  );

  const handleDragStart = useCallback((event) => {
    const dragData = event.active?.data?.current;
    if (dragData?.type === "colony") {
      setActiveRowData(dragData.rowData);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over, delta } = event;
      const activeData = active?.data?.current;

      setActiveRowData(null); // Always clear ghost overlay

      // Disable swipe-to-delete temporarily per request
      // if (delta.x > SWIPE_DELETE_THRESHOLD && activeData?.type === "colony") {
      //   actions.handleDeleteClick(activeData.rowData);
      //   return;
      // }

      if (
        over &&
        active.id !== over.id &&
        activeData?.type === "colony" &&
        over.data?.current?.type === "colony-target"
      ) {
        setPendingDragOp({
          sourceRow: activeData.rowData,
          targetRow: over.data.current.rowData,
        });
      }
    },
    [actions],
  );

  const handleConfirmDrag = useCallback(() => {
    if (pendingDragOp) {
      actions.handleDragReorder(
        pendingDragOp.sourceRow,
        pendingDragOp.targetRow,
      );
      setPendingDragOp(null);
    }
  }, [pendingDragOp, actions]);

  const handleCancelDrag = useCallback(() => {
    setPendingDragOp(null);
  }, []);


  // ── Expand/Collapse toggle icon ──
  const actionTemplate = useCallback(
    (rowData) => {
      const isExpanded = !!state.expandedRows[rowData.RouteID];
      return (
        <a
          href="#!"
          className="cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            actions.handleToggleRow(rowData);
          }}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <span
            className="material-icons text-primary"
            style={{ fontSize: "20px" }}
          >
            {isExpanded ? "remove_circle" : "add_circle"}
          </span>
        </a>
      );
    },
    [state.expandedRows, actions],
  );

  // ── Expanded row template ──
  const expandedRowTemplate = useCallback(
    (rowData) => {
      return (
        <div className="leftStrip" style={{ padding: 0, margin: 0 }}>
          <div className="expanded-content" style={{ margin: "0 0 0 16px", padding: 0 }}>
            <div className="table-responsive border-0">
              <RouteDetailTable
                routeId={rowData.RouteID}
                facilityId={state.selectedFacility}
                locationId={state.userLocationId}
                selectedItems={state.selectedItems}
                actions={actions}
                isMoveMode={state.isMoveMode}
              />
            </div>
          </div>
        </div>
      );
    },
    [
      state.selectedFacility,
      state.userLocationId,
      state.selectedItems,
      actions,
    ],
  );


  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="container-fluid p-0">
      <ToastContainer position="top-right" autoClose={3000} />
      <Loader isVisible={data.isLoading} fullScreen={true} />
      <Header pageTitle={"Shuttle Route Master"} mainTitle={"Admin"} />
      <SidebarMenu />

      {/* ── Floating Selection Panel ── */}
      <FloatingColonyPanel
        selectedItems={state.selectedItems}
        onClearSelection={actions.handleClearSelection}
        onDeleteSelected={actions.handleDeleteSelected}
        onDeleteItem={actions.handleDeleteClick}
        onSplitRoute={actions.handleSplitClick}
        isMoveMode={state.isMoveMode}
        onToggleMoveMode={actions.handleToggleMoveMode}
        isVisible={state.selectedItems.size > 0}
      />

      <div className="middle">
        {/* ── Filter Bar ── */}
        <div className="card_tb p-3">
          <div className="row">
            <div className="col-12 col-md-6 col-lg-3 col-xl-2">
              <label className="form-label">
                Facility <span className="text-danger">*</span>
              </label>
              <Dropdown
                id="facility"
                placeholder="Select Facility"
                className="w-100"
                value={state.selectedFacility}
                options={data.facilities}
                onChange={(e) => actions.handleFacilityChange(e.value)}
                optionLabel="facilityName"
                optionValue="Id"
              />
            </div>
          </div>
        </div>

        {/* ── Data Area ── */}
        <div className="row">
          <div className="col-12">
            <div className="card_tb">
              {/* No search yet */}
              {!state.hasSearched && (
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
                    Please select above parameter to show Route Sequence
                  </p>
                </div>
              )}

              {/* Searched but no data */}
              {state.hasSearched &&
                data.routeSeqData.length === 0 &&
                !data.isLoading && (
                  <div
                    className="d-flex flex-column align-items-center justify-content-center p-5"
                    style={{ minHeight: "70vh" }}
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
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "0.9rem" }}
                    >
                      No Route Sequence found for the selected criteria
                    </p>
                  </div>
                )}

              {/* Data table */}
              {state.hasSearched && data.routeSeqData.length > 0 && (
                <div className="table-responsive border-0">
                  <CustomDataTable
                    className="p-datatable-sm clean-expansion-table border-0"
                    emptyMessage="No route data"
                    value={data.routeSeqData}
                    dataKey="RouteID"
                    expandedRows={state.expandedRows}
                    rowExpansionTemplate={expandedRowTemplate}
                    onRowClick={(e) => {
                      if (state.isMoveMode && !state.expandedRows[e.data.RouteID]) {
                        actions.handleToggleRow(e.data);
                      }
                    }}
                    onRowMouseEnter={(e) => {
                      if (activeRowData && !state.expandedRows[e.data.RouteID]) {
                        window.autoExpandTimeout = window.setTimeout(() => {
                          actions.handleToggleRow(e.data);
                        }, 800);
                      }
                    }}
                    onRowMouseLeave={(e) => {
                      if (window.autoExpandTimeout) window.clearTimeout(window.autoExpandTimeout);
                    }}
                    rowClassName={(data) => ({
                      "cursor-pointer": state.isMoveMode && !state.expandedRows[data.RouteID],
                    })}
                  >
                    <Column
                      body={actionTemplate}
                      header=""
                      style={{ width: "50px" }}
                    />
                    <Column field="RouteID" header="Route No" />
                    <Column field="ZoneName" header="Zone" />
                    <Column field="City" header="City" />
                    <Column field="Colony" header="Colony" />
                  </CustomDataTable>
                  <CustomPaginator
                    first={state.first}
                    rows={state.rowsPerPage}
                    totalRecords={data.routeSeqData.length}
                    onPageChange={actions.onPageChange}
                    rowsPerPageOptions={[50, 100, 150, 200]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      <AppConfirmDialog
        visible={state.deleteDialogVisible}
        onHide={actions.handleDeleteCancel}
        title="Confirm Delete"
        variant="delete"
        message="Delete this colony?"
        detail={`${state.deletingItem?.Colony || state.deletingItem?.SubColony || "Selected colony"} will be permanently removed.`}
        onConfirm={actions.handleDeleteConfirm}
      />

      {/* ── Split Route Confirmation Dialog ── */}
      <AppDialog
        visible={state.splitDialogVisible}
        onHide={actions.handleSplitCancel}
        title="Confirm Split"
        icon="pi pi-sitemap"
        iconColor="#3b82f6"
        size="sm"
        variant="info"
        onCancel={actions.handleSplitCancel}
        onConfirm={actions.handleSplitConfirm}
        confirmLabel="Split"
      >
        <p className="app-dialog-body-message">Split selected colonies into a new route?</p>
        <p className="app-dialog-body-detail">
          {state.pendingSplitItems.length}{" "}
          {state.pendingSplitItems.length === 1 ? "colony" : "colonies"} will be moved to a newly created route.
        </p>
        <div style={{ maxHeight: "150px", overflowY: "auto", fontSize: "0.85rem" }}>
          {(state.pendingSplitItems || []).map((item) => (
            <div key={item.Id} className="d-flex align-items-center gap-2 py-1 border-bottom">
              <span className="fw-semibold">#{item.SeqId}</span>
              <span className="text-muted">{item.Colony || item.SubColony || "—"}</span>
            </div>
          ))}
        </div>
      </AppDialog>

      {/* ── Move Colonies Confirmation Dialog ── */}
      <AppDialog
        visible={state.showMoveConfirmDialog}
        onHide={actions.handleMoveCancel}
        title="Confirm Multi-Move"
        icon="pi pi-arrows-v"
        iconColor="#3b82f6"
        size="sm"
        variant="info"
        onCancel={actions.handleMoveCancel}
        onConfirm={actions.handleMoveConfirm}
        confirmLabel="Move Items"
      >
        <p className="app-dialog-body-message">Move colonies?</p>
        <p className="app-dialog-body-detail">
          Move {state.pendingMoveOperation?.items?.length}{" "}
          {state.pendingMoveOperation?.items?.length === 1 ? "colony" : "colonies"} to the position of:
          <br />
          <strong>
            #{state.pendingMoveOperation?.targetItem?.SeqId}&nbsp;
            {state.pendingMoveOperation?.targetItem?.Colony ||
             state.pendingMoveOperation?.targetItem?.SubColony ||
             "colony"}
          </strong>
        </p>
      </AppDialog>

      {/* ── Edit Sidebar ── */}
      <MasterSidebar
        title={`Edit Colony — Seq ${state.editingItem?.SeqId || ""}`}
        show={state.editSidebarOpen}
        onClose={actions.handleEditCancel}
        className="sidebar-responsive"
        footer={
          <div className="offcanvas-footer">
            <Button
              label="Cancel"
              className="btn btn-outline-secondary"
              onClick={actions.handleEditCancel}
            />
            <Button
              label="Update"
              className="btn btn-success ms-3"
              onClick={actions.handleEditSave}
            />
          </div>
        }
      >
        <div className="p-3">
          {state.editingItem && (
            <>
              {/* SeqID — read only */}
              <div className="mb-3">
                <label className="form-label">Seq ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={state.editingItem.SeqId || ""}
                  disabled
                />
              </div>

              {/* Zone */}
              <div className="mb-3">
                <label className="form-label">Zone</label>
                <Dropdown
                  className="w-100"
                  value={state.editingItem.ZoneName}
                  options={(data.zones || []).map((z) => ({
                    label: z.zoneName || z.ZoneName,
                    value: z.zoneName || z.ZoneName,
                  }))}
                  onChange={(e) =>
                    actions.handleEditFieldChange("ZoneName", e.value)
                  }
                  placeholder="Select Zone"
                />
              </div>

              {/* City */}
              <div className="mb-3">
                <label className="form-label">City</label>
                <Dropdown
                  className="w-100"
                  value={state.editingItem.City}
                  options={(data.cities || []).map((c) => ({
                    label: c.City || c.city,
                    value: c.City || c.city,
                  }))}
                  onChange={(e) =>
                    actions.handleEditFieldChange("City", e.value)
                  }
                  placeholder="Select City"
                  disabled
                />
              </div>

              {/* Colony (Area) */}
              <div className="mb-3">
                <label className="form-label">
                  Area (Colony) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={state.editingItem.Colony || ""}
                  onChange={(e) =>
                    actions.handleEditFieldChange("Colony", e.target.value)
                  }
                  placeholder="Enter colony name"
                />
              </div>

              {/* SubColony (Landmark) */}
              <div className="mb-3">
                <label className="form-label">
                  Landmark (Sub-Colony) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={state.editingItem.SubColony || ""}
                  onChange={(e) =>
                    actions.handleEditFieldChange("SubColony", e.target.value)
                  }
                  maxLength={100}
                  placeholder="Enter landmark"
                />
              </div>

              {/* Metro */}
              <div className="mb-3">
                <label className="form-label">Metro</label>
                <Dropdown
                  className="w-100"
                  value={state.editingItem.Metro?.toString()}
                  options={[
                    { label: "No", value: "False" },
                    { label: "Yes", value: "True" },
                  ]}
                  onChange={(e) =>
                    actions.handleEditFieldChange("Metro", e.value)
                  }
                />
              </div>

              {/* Travel Time */}
              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label">
                    Travel Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={state.editingItem.travelTime || ""}
                    onChange={(e) =>
                      actions.handleEditFieldChange(
                        "travelTime",
                        e.target.value,
                      )
                    }
                    min={1}
                    max={999}
                    placeholder="Minutes"
                  />
                </div>

                {/* Travel Km */}
                <div className="col-6 mb-3">
                  <label className="form-label">
                    Travel Km <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={state.editingItem.travelKm || ""}
                    onChange={(e) =>
                      actions.handleEditFieldChange("travelKm", e.target.value)
                    }
                    min={1}
                    max={999}
                    step="0.1"
                    placeholder="Km"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </MasterSidebar>

      {/* ── Add Sidebar ── */}
      <MasterSidebar
        title={`Add Colony — After Seq ${state.addingTargetPos?.SeqId || ""}`}
        show={state.addSidebarOpen}
        onClose={actions.handleAddCancel}
        className="sidebar-responsive"
        footer={
          <div className="offcanvas-footer">
            <Button
              label="Cancel"
              className="btn btn-outline-secondary"
              onClick={actions.handleAddCancel}
            />
            <Button
              label="Add Colony"
              className="btn btn-success ms-3"
              onClick={actions.handleAddSave}
            />
          </div>
        }
      >
        <div className="p-3">
          {state.addingItem && (
            <>
              {/* Zone */}
              <div className="mb-3">
                <label className="form-label">Zone</label>
                <Dropdown
                  className="w-100"
                  value={state.addingItem.ZoneName}
                  options={(data.zones || []).map((z) => ({
                    label: z.zoneName || z.ZoneName,
                    value: z.zoneName || z.ZoneName,
                  }))}
                  onChange={(e) =>
                    actions.handleAddFieldChange("ZoneName", e.value)
                  }
                  placeholder="Select Zone"
                />
              </div>

              {/* City */}
              <div className="mb-3">
                <label className="form-label">City</label>
                <Dropdown
                  className="w-100"
                  value={state.addingItem.City}
                  options={(data.cities || []).map((c) => ({
                    label: c.City || c.city,
                    value: c.City || c.city,
                  }))}
                  onChange={(e) =>
                    actions.handleAddFieldChange("City", e.value)
                  }
                  placeholder="Select City"
                />
              </div>

              {/* Colony (Area) */}
              <div className="mb-3">
                <label className="form-label">
                  Area (Colony) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={state.addingItem.Colony || ""}
                  onChange={(e) =>
                    actions.handleAddFieldChange("Colony", e.target.value)
                  }
                  placeholder="Enter colony name"
                />
              </div>

              {/* SubColony (Landmark) */}
              <div className="mb-3">
                <label className="form-label">
                  Landmark (Sub-Colony) <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={state.addingItem.SubColony || ""}
                  onChange={(e) =>
                    actions.handleAddFieldChange("SubColony", e.target.value)
                  }
                  maxLength={100}
                  placeholder="Enter landmark"
                />
              </div>

              {/* Metro */}
              <div className="mb-3">
                <label className="form-label">Metro</label>
                <Dropdown
                  className="w-100"
                  value={state.addingItem.Metro?.toString()}
                  options={[
                    { label: "No", value: "False" },
                    { label: "Yes", value: "True" },
                  ]}
                  onChange={(e) =>
                    actions.handleAddFieldChange("Metro", e.value)
                  }
                />
              </div>

              {/* Travel Time */}
              <div className="row">
                <div className="col-6 mb-3">
                  <label className="form-label">
                    Travel Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={state.addingItem.travelTime || ""}
                    onChange={(e) =>
                      actions.handleAddFieldChange(
                        "travelTime",
                        e.target.value,
                      )
                    }
                    min={1}
                    max={999}
                    placeholder="Minutes"
                  />
                </div>

                {/* Travel Km */}
                <div className="col-6 mb-3">
                  <label className="form-label">
                    Travel Km <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={state.addingItem.travelKm || ""}
                    onChange={(e) =>
                      actions.handleAddFieldChange("travelKm", e.target.value)
                    }
                    min={1}
                    max={999}
                    step="0.1"
                    placeholder="Km"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </MasterSidebar>


      {/* ── Drag Overlay — the "ghost" card that follows the cursor ── */}
      <DragOverlay
        dropAnimation={{
          duration: 300,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeRowData ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              backgroundColor: "#fff",
              border: "2px solid #2196F3",
              borderRadius: "8px",
              cursor: "grabbing",
              boxShadow: "0 8px 24px rgba(33,150,243,0.25)",
              fontSize: "13px",
              fontWeight: "600",
              willChange: "transform",
              minWidth: "220px",
              maxWidth: "360px",
              color: "#333",
            }}
          >
            <span
              className="material-icons"
              style={{ fontSize: "18px", color: "#2196F3", flexShrink: 0 }}
            >
              drag_indicator
            </span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              #{activeRowData.SeqId}&nbsp;·&nbsp;
              {activeRowData.Colony || activeRowData.SubColony || "Colony"}
            </span>
            <span className="ms-auto" style={{ color: "#666" }}>
              <i className="pi pi-arrows-alt" style={{ fontSize: "12px" }}></i>
            </span>
          </div>
        ) : null}
      </DragOverlay>

      {/* ── Confirmation Dialog for Drag & Drop Reorder ── */}
      <AppConfirmDialog
        visible={!!pendingDragOp}
        onHide={handleCancelDrag}
        title="Confirm Move"
        variant="info"
        confirmLabel="Move"
        message={
          <>
            Move <strong>{pendingDragOp?.sourceRow?.Colony || pendingDragOp?.sourceRow?.SubColony}</strong> to the position of{" "}
            <strong>{pendingDragOp?.targetRow?.Colony || pendingDragOp?.targetRow?.SubColony}</strong>?
          </>
        }
        onConfirm={handleConfirmDrag}
      />

      {/* ── Responsive Sidebar + Utility Styles ── */}
      <style>{`
                .sidebar-responsive {
                    width: 35% !important;
                }
                @media (max-width: 992px) {
                    .sidebar-responsive { width: 45% !important; }
                }
                @media (max-width: 768px) {
                    .sidebar-responsive { width: 60% !important; }
                }
                @media (max-width: 576px) {
                    .sidebar-responsive { width: 85% !important; }
                }

                /* Drag-and-drop row visual feedback */
                .colony-draggable-row:hover { background-color: rgba(0,0,0,0.02); }
                /* Tooltip above floating panel (z-index 1200) */
                .p-tooltip { z-index: 1300 !important; }

                /* PrimeReact DataTable body row hover — matches .p-datatable .p-datatable-tbody > tr:hover */
                .colony-detail-row:hover > div {
                    background-color: #f1f1fa !important;
                }
            `}</style>
      </div>
    </DndContext>
  );
};

export default ManageColony;

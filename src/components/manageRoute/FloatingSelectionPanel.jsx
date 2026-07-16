import React, { useState, useRef, useMemo, useCallback } from "react";
import { Button } from "primereact/button";
import { DataScroller } from "primereact/datascroller";
import { manageRouteKeys } from "../../hooks/compliance/useManageRouteQueries";

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
          className="d-flex align-items-center p-2 border-bottom mr-panel-item"
        >
          <div className="flex-grow-1 d-flex align-items-center justify-content-between">
            <div>
              <p className="fw-bold mb-0">
                {employee.empCode} - {employee.empName}
              </p>
              <p className="mb-0 mr-panel-item-sub">
                {employee.Location}
              </p>
            </div>
            <div className="d-flex align-items-center">
              <p className="ms-3 mb-0 mr-panel-item-route">
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
      <div className="draggable-panel-header mr-panel-header">
        <div className="d-flex gap-2">
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
          className="btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 mr-panel-close"
          onClick={onClearSelection}
          title="Close"
        >
          <i className="pi pi-times"></i>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="mr-panel-body">
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

// Draggable floating panel showing the current employee selection with
// hold / split actions. Details are resolved from the React Query cache.
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
        className={`mr-floating-panel ${isDragging ? "mr-floating-panel--dragging" : ""}`}
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
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

export default FloatingSelectionPanel;

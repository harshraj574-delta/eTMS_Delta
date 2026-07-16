import React, { useState, useRef, useMemo, useCallback } from "react";
import { DataView } from "primereact/dataview";

// Draggable floating panel for Route Merge Mode: shows the ordered route
// selection (first = TARGET, rest = SOURCE) and triggers the merge.
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

    const selectedRouteDetails = useMemo(() => {
      return routeSelectionOrder.map((routeId) => {
        const route = tableData.find((r) => r.RouteID === routeId);
        return route || { RouteID: routeId };
      });
    }, [routeSelectionOrder, tableData]);

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
          className="d-flex align-items-center p-2 border-bottom mr-panel-item"
        >
          <div className="flex-grow-1 d-flex align-items-center justify-content-between">
            <div>
              <p className="fw-bold mb-0">
                Route {route.RouteID} {isTarget && <span className="badge bg-success ms-2">TARGET</span>}
                {!isTarget && selectedRoutes.size >= 2 && <span className="badge bg-danger ms-2">SOURCE</span>}
              </p>
              <p className="mb-0 mr-panel-item-sub">
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
                    className="mr-icon-img-12"
                  />
                )}
                {route.isOOBRoute && (
                  <img
                    src="images/icons/oob.png"
                    alt="OOB"
                    className="mr-icon-img-12"
                  />
                )}
                {route.isNMTRoute && (
                  <img
                    src="images/icons/non-motorable.png"
                    alt="NMT"
                    className="mr-icon-img-12"
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
        className="mr-floating-panel"
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
      >
        {/* Sticky Header - Same styling as FloatingSelectionPanel */}
        <div
          className={`draggable-panel-header mr-panel-header ${isDragging ? "mr-panel-header--dragging" : ""}`}
          onMouseDown={handleMouseDown}
        >
          <div className="d-flex gap-2">
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
            className="btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 mr-panel-close"
            onClick={onClearSelection}
            title="Close"
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        {/* Scrollable Content - Same styling as FloatingSelectionPanel */}
        <div className="mr-panel-body">
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

export default FloatingRouteSelectionPanel;

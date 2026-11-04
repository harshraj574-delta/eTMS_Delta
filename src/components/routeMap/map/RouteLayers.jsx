import React, { useState, useMemo, useCallback } from "react";
import {
  Polyline,
  Marker,
  Popup,
  LayerGroup,
  CircleMarker,
  Tooltip as LeafletTooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { toastService } from "../../../services/toastService";
import { findRouteNearPoint, bestInsertionPosition } from "../editing/map/geo";
import {
  hexToRgb,
  groupMarkersByLocation,
  createColoredMarker,
  createMultiStopMarker,
  facilityIcon,
} from "./markerIcons";

// react-leaflet compares `position` by reference and calls setLatLng when it changes;
// a fresh array on every render would snap a marker back home in the middle of a drag.
function StopMarker({ lat, lng, children, ...props }) {
  const position = useMemo(() => [lat, lng], [lat, lng]);
  return <Marker position={position} {...props}>{children}</Marker>;
}

const DRAG_HIT_PX = 30;
const MIN_DRAG_PX = 12;

/**
 * Route lines, stop markers and facility markers. In edit mode stop markers
 * become selectable and draggable: dropping one on a route line moves the
 * employee(s) to that route at the cheapest-insertion position for their home
 * location (or at the drop position when reordering within the same route).
 */
export default function RouteLayers({
  routes,
  colorFor,
  tripType,
  isEditMode,
  selectedStopKeys,
  staleRouteIds,
  onSelectStops,
  onClearSelection,
  onMoveRequest,
}) {
  const map = useMap();
  const [hoverTargetId, setHoverTargetId] = useState(null);

  const project = useCallback((latlng) => map.latLngToContainerPoint(latlng), [map]);

  const editableTargets = useMemo(
    () =>
      routes
        .filter((r) => !r.isLocked)
        .map((r) => ({ routeId: r.routeid, path: r.path, stops: r.stops })),
    [routes]
  );

  useMapEvents({
    click: (e) => {
      if (isEditMode && !e.originalEvent.shiftKey) onClearSelection();
    },
  });

  // Runs on every drag frame; React skips the re-render when the target is unchanged.
  const handleDrag = (e) => {
    const { lat, lng } = e.target.getLatLng();
    setHoverTargetId(findRouteNearPoint([lat, lng], editableTargets, project, DRAG_HIT_PX));
  };

  const handleDragEnd = (e, group) => {
    const marker = e.target;
    const { lat, lng } = marker.getLatLng();
    // The employee's home doesn't move; the drag only chooses a target route.
    marker.setLatLng([group.lat, group.lng]);
    setHoverTargetId(null);

    const dropPoint = project([lat, lng]);
    const homePoint = project([group.lat, group.lng]);
    if (Math.hypot(dropPoint.x - homePoint.x, dropPoint.y - homePoint.y) < MIN_DRAG_PX) return;

    const targetId = findRouteNearPoint([lat, lng], editableTargets, project, DRAG_HIT_PX);
    if (!targetId) {
      toastService.info("Drop the stop on a route line to move it there.");
      return;
    }

    const movingKeys = new Set(group.stops.map((s) => s.key));
    const target = routes.find((r) => r.routeid === targetId);
    const remaining = [...target.stops]
      .sort((a, b) => Number(a.stopNo) - Number(b.stopNo))
      .filter((s) => !movingKeys.has(s.key));
    const isSameRoute = group.stops.every((s) => s.routeId === targetId);
    const position = bestInsertionPosition(
      isSameRoute ? [lat, lng] : [group.lat, group.lng],
      remaining,
      project
    );

    if (isSameRoute && group.stops.length === 1 && Number(group.stops[0].stopNo) === position) return;

    onMoveRequest(group.stops, targetId, position);
  };

  return (
    <>
      {routes.map((route) => {
        const routeColor = colorFor(route.routeid);
        const routeColorRgb = hexToRgb(routeColor);
        const stopGroups = groupMarkersByLocation(route.stops, 'locationY', 'locationX');
        const isStale = staleRouteIds.has(route.routeid);
        const isDropTarget = hoverTargetId === route.routeid;
        const facilityPoint =
          route.facility?.facilityGeoY && route.facility?.facilityGeoX
            ? [parseFloat(route.facility.facilityGeoY), parseFloat(route.facility.facilityGeoX)]
            : null;

        // Straight-line preview of the new stop order until the route is recalculated
        // (also used for a freshly split route that has no road geometry yet).
        let previewPath = null;
        if (isStale || !route.path) {
          const ordered = [...route.stops]
            .sort((a, b) => Number(a.stopNo) - Number(b.stopNo))
            .filter((s) => !isNaN(s.lat) && !isNaN(s.lng))
            .map((s) => [s.lat, s.lng]);
          previewPath = facilityPoint
            ? tripType === "D" ? [facilityPoint, ...ordered] : [...ordered, facilityPoint]
            : ordered;
        }

        return (
          <LayerGroup key={route.routeid}>
            {route.path && (
              <Polyline
                positions={route.path}
                pathOptions={{
                  color: routeColor,
                  weight: isDropTarget ? 9 : 4,
                  opacity: isStale ? 0.3 : 0.8,
                }}
              />
            )}
            {previewPath && previewPath.length > 1 && (
              <Polyline
                positions={previewPath}
                pathOptions={{ color: routeColor, weight: 3, opacity: 0.95, dashArray: "6 8" }}
              />
            )}
            {stopGroups.map((group, gidx) => {
              const isMulti = group.stops.length > 1;
              const markerIcon = isMulti
                ? createMultiStopMarker(routeColor, group.stops.length)
                : createColoredMarker(routeColor, group.stops[0].stopNo, group.stops[0].gender);
              const isSelected = group.stops.some((s) => selectedStopKeys.has(s.key));
              const canDrag = isEditMode && !route.isLocked;
              return (
                <React.Fragment key={`${route.routeid}-group-${gidx}`}>
                  {isEditMode && isSelected && (
                    <CircleMarker
                      center={[group.lat, group.lng]}
                      radius={22}
                      pathOptions={{ color: "#111827", weight: 3, dashArray: "4 3", fill: false }}
                      interactive={false}
                    />
                  )}
                  <StopMarker
                    lat={group.lat}
                    lng={group.lng}
                    icon={markerIcon}
                    draggable={canDrag}
                    eventHandlers={
                      isEditMode
                        ? {
                            click: (e) => {
                              L.DomEvent.stopPropagation(e);
                              const oe = e.originalEvent;
                              onSelectStops(group.stops, { toggle: oe.ctrlKey || oe.metaKey || oe.shiftKey });
                            },
                            drag: handleDrag,
                            dragend: (e) => handleDragEnd(e, group),
                          }
                        : {}
                    }
                  >
                    {isEditMode ? (
                      <LeafletTooltip direction="top" offset={[0, -18]}>
                        {group.stops.map((s) => `#${s.stopNo} ${s.empName || s.empCode}`).join(", ")}
                        {route.isLocked && " (finalized)"}
                      </LeafletTooltip>
                    ) : (
                      <Popup maxWidth={isMulti ? 272 : 220}>
                        <div
                          className={`info-window${isMulti ? " multi-window" : ""}`}
                          style={{
                            "--route-color": routeColor,
                            "--route-color-rgb": routeColorRgb,
                          }}
                        >
                          <div className="info-header">
                            <div className="stop-route-info">
                              {isMulti ? (
                                <span className="stop-label">{group.stops.length} Employees</span>
                              ) : (
                                <span className="stop-label">
                                  Stop <span className="stop-number">{group.stops[0].stopNo}</span>
                                </span>
                              )}
                              <span className="route-label">
                                Route <span className="route-number">{route.routeid}</span>
                              </span>
                            </div>
                          </div>
                          {isMulti ? (
                            <div className="multi-stop-list">
                              {group.stops.map((stop, si) => (
                                <div key={si} className="multi-stop-item">
                                  <span className="stop-badge">#{stop.stopNo}</span>
                                  <div className="stop-emp-info">
                                    <div className="stop-emp-name">{stop.empName || "N/A"}</div>
                                    <div className="stop-emp-meta">{stop.empCode} · {stop.gender || "N/A"} · ETA: {stop.eta || "N/A"}</div>
                                    <div className="stop-emp-meta">{stop.address || "No address"}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <ul className="employee-details">
                              <li><strong>Emp Name</strong><span>{group.stops[0].empName || "N/A"}</span></li>
                              <li><strong>Emp Code</strong><span>{group.stops[0].empCode || "N/A"}</span></li>
                              <li><strong>Address</strong><span>{group.stops[0].address || "No address"}</span></li>
                              <li><strong>ETA</strong><span>{group.stops[0].eta || "N/A"}</span></li>
                              <li><strong>Gender</strong><span>{group.stops[0].gender || "N/A"}</span></li>
                            </ul>
                          )}
                        </div>
                      </Popup>
                    )}
                  </StopMarker>
                </React.Fragment>
              );
            })}
            {facilityPoint && (
              <Marker position={facilityPoint} icon={facilityIcon}>
                <Popup><b>Facility</b></Popup>
              </Marker>
            )}
          </LayerGroup>
        );
      })}
    </>
  );
}

import React, { memo, useState, useMemo, useCallback, useRef } from "react";
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
import { projectRoutes, findRouteNearProjected, bestInsertionPosition } from "../editing/map/geo";
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

const facilityPointOf = (route) =>
  route.facility?.facilityGeoY && route.facility?.facilityGeoX
    ? [parseFloat(route.facility.facilityGeoY), parseFloat(route.facility.facilityGeoX)]
    : null;

const StopPopup = ({ route, group, color }) => {
  const isMulti = group.stops.length > 1;
  return (
    <Popup maxWidth={isMulti ? 272 : 220}>
      <div
        className={`info-window${isMulti ? " multi-window" : ""}`}
        style={{ "--route-color": color, "--route-color-rgb": hexToRgb(color) }}
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
            {group.stops.map((stop) => (
              <div key={stop.key} className="multi-stop-item">
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
  );
};

/**
 * One route's line, preview line and stop markers. Memoized: during a drag only
 * the routes whose highlight changes re-render, not every route on the shift.
 * `selectedSig` is this route's selected stop keys joined, so the memo compares
 * a string instead of the shared selection Set.
 */
const RouteLayer = memo(function RouteLayer({
  route,
  color,
  tripType,
  isEditMode,
  isDropTarget,
  isStale,
  selectedSig,
  handlers,
}) {
  const stopGroups = useMemo(() => groupMarkersByLocation(route.stops, "locationY", "locationX"), [route.stops]);
  const selected = useMemo(() => new Set(selectedSig ? selectedSig.split("|") : []), [selectedSig]);

  // Straight-line preview of the new stop order until the route is recalculated
  // (also used for a freshly split route that has no road geometry yet).
  const previewPath = useMemo(() => {
    if (!isStale && route.path) return null;
    const facility = facilityPointOf(route);
    const ordered = [...route.stops]
      .sort((a, b) => Number(a.stopNo) - Number(b.stopNo))
      .filter((s) => !isNaN(s.lat) && !isNaN(s.lng))
      .map((s) => [s.lat, s.lng]);
    if (!facility) return ordered;
    return tripType === "D" ? [facility, ...ordered] : [...ordered, facility];
  }, [isStale, route, tripType]);

  const canDrag = isEditMode && !route.isLocked;

  return (
    <LayerGroup>
      {route.path && (
        <Polyline
          positions={route.path}
          pathOptions={{ color, weight: isDropTarget ? 9 : 4, opacity: isStale ? 0.3 : 0.8 }}
        />
      )}
      {previewPath && previewPath.length > 1 && (
        <Polyline positions={previewPath} pathOptions={{ color, weight: 3, opacity: 0.95, dashArray: "6 8" }} />
      )}
      {stopGroups.map((group) => {
        const groupKey = group.stops[0].key;
        const isMulti = group.stops.length > 1;
        const icon = isMulti
          ? createMultiStopMarker(color, group.stops.length)
          : createColoredMarker(color, group.stops[0].stopNo, group.stops[0].gender);
        const isSelected = group.stops.some((s) => selected.has(s.key));
        return (
          <React.Fragment key={groupKey}>
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
              icon={icon}
              draggable={canDrag}
              eventHandlers={
                isEditMode
                  ? {
                      click: (e) => handlers.onStopClick(e, group),
                      dragstart: handlers.onDragStart,
                      drag: handlers.onDrag,
                      dragend: (e) => handlers.onDragEnd(e, group),
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
                <StopPopup route={route} group={group} color={color} />
              )}
            </StopMarker>
          </React.Fragment>
        );
      })}
    </LayerGroup>
  );
});

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

  // Handlers stay referentially stable (so RouteLayer's memo holds) and read
  // the latest props through this ref.
  const latest = useRef(null);
  latest.current = { routes, onSelectStops, onMoveRequest };
  // Editable routes projected to pixels at drag start; reused for every drag frame.
  const projectedRef = useRef([]);

  const project = useCallback((latlng) => map.latLngToContainerPoint(latlng), [map]);

  useMapEvents({
    click: (e) => {
      if (isEditMode && !e.originalEvent.shiftKey) onClearSelection();
    },
  });

  const handlers = useMemo(() => {
    const projectEditable = () =>
      projectRoutes(
        latest.current.routes
          .filter((r) => !r.isLocked)
          .map((r) => ({ routeId: r.routeid, path: r.path, stops: r.stops })),
        project
      );

    return {
      onStopClick: (e, group) => {
        L.DomEvent.stopPropagation(e);
        const oe = e.originalEvent;
        latest.current.onSelectStops(group.stops, { toggle: oe.ctrlKey || oe.metaKey || oe.shiftKey });
      },
      onDragStart: () => {
        projectedRef.current = projectEditable();
      },
      onDrag: (e) => {
        const { lat, lng } = e.target.getLatLng();
        setHoverTargetId(findRouteNearProjected(project([lat, lng]), projectedRef.current, DRAG_HIT_PX));
      },
      onDragEnd: (e, group) => {
        const marker = e.target;
        const { lat, lng } = marker.getLatLng();
        // The employee's home doesn't move; the drag only chooses a target route.
        marker.setLatLng([group.lat, group.lng]);
        setHoverTargetId(null);

        const dropPoint = project([lat, lng]);
        const homePoint = project([group.lat, group.lng]);
        if (Math.hypot(dropPoint.x - homePoint.x, dropPoint.y - homePoint.y) < MIN_DRAG_PX) return;

        const projected = projectedRef.current.length ? projectedRef.current : projectEditable();
        projectedRef.current = [];
        const targetId = findRouteNearProjected(dropPoint, projected, DRAG_HIT_PX);
        if (!targetId) {
          toastService.info("Drop the stop on a route line to move it there.");
          return;
        }

        const movingKeys = new Set(group.stops.map((s) => s.key));
        const target = latest.current.routes.find((r) => r.routeid === targetId);
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

        latest.current.onMoveRequest(group.stops, targetId, position);
      },
    };
  }, [project]);

  // One facility marker per distinct facility, not one per route.
  const facilityPoints = useMemo(() => {
    const seen = new Map();
    routes.forEach((route) => {
      const point = facilityPointOf(route);
      if (point) seen.set(point.join(","), point);
    });
    return [...seen.values()];
  }, [routes]);

  return (
    <>
      {routes.map((route) => (
        <RouteLayer
          key={route.routeid}
          route={route}
          color={colorFor(route.routeid)}
          tripType={tripType}
          isEditMode={isEditMode}
          isDropTarget={hoverTargetId === route.routeid}
          isStale={staleRouteIds.has(route.routeid)}
          selectedSig={route.stops.filter((s) => selectedStopKeys.has(s.key)).map((s) => s.key).join("|")}
          handlers={handlers}
        />
      ))}
      {facilityPoints.map((point) => (
        <Marker key={point.join(",")} position={point} icon={facilityIcon}>
          <Popup><b>Facility</b></Popup>
        </Marker>
      ))}
    </>
  );
}

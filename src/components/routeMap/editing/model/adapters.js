import polylineUtil from '@mapbox/polyline';

/**
 * The single place that knows the raw API shapes. Everything else in the map
 * and editing code works with the normalized Stop / route objects below, so a
 * backend field rename is a one-line change here.
 */

/** Stable employee id from a GetRoutesDetailsnew row (the API is inconsistent about the field name). */
export const employeeIdOf = (row) => String(row.id ?? row.empID ?? row.empId ?? row.empCode);

/** Identity of an employee on a route; used for selection, caching and dnd. */
export const stopKey = (routeId, empId) => `${routeId}-${empId}`;

export const rowStopKey = (routeId, row) => stopKey(routeId, employeeIdOf(row));

/**
 * GetRoutesDetailsnew row -> Stop
 * { key, routeId, empId, stopNo, empCode, empName, address, eta, gender, lat, lng, locationX, locationY }
 */
export const toStop = (routeId, row) => {
    const empId = employeeIdOf(row);
    return {
        key: stopKey(routeId, empId),
        routeId,
        empId,
        stopNo: row.stopNo,
        address: row.address,
        empCode: row.empCode,
        empName: row.empName,
        eta: row.ETA,
        gender: row.Gender,
        // raw strings kept for groupMarkersByLocation
        locationX: row.GeoX,
        locationY: row.GeoY,
        lat: parseFloat(row.GeoY),
        lng: parseFloat(row.GeoX),
    };
};

/** Encoded polyline -> [[lat, lng], ...], or null when missing/invalid. */
export const decodePath = (geometry) => {
    if (!geometry) return null;
    try {
        return polylineUtil.decode(geometry).map(([lat, lng]) => [lat, lng]);
    } catch (e) {
        console.error('Error decoding route polyline:', e);
        return null;
    }
};

/**
 * GetRoutesByOrder meta + GetRoutesDetailsnew rows + Get_RouteGeometry row -> route
 * used by the map, sidebar and edit session.
 */
export const toRoute = (meta, detailRows, geometryRow) => {
    const routeId = meta.RouteID;
    return {
        ...meta,
        routeid: routeId,
        routeId,
        geometry: geometryRow?.geometry ?? null,
        path: decodePath(geometryRow?.geometry),
        stops: detailRows.map((row) => toStop(routeId, row)),
        facility: {
            facilityGeoX: detailRows[0]?.facGeoX,
            facilityGeoY: detailRows[0]?.facGeoY,
        },
        isLocked: meta.isRouteFinalized === 1,
        plannedGuard: meta.PlannedGuard == 1,
    };
};

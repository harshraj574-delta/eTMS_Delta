/**
 * Screen-space helpers for map editing. Callers pass `project` (latlng -> {x, y}
 * in pixels, e.g. map.latLngToContainerPoint) so these stay pure and testable.
 */

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const pointToSegment = (p, a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return dist(p, a);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
};

const distanceToPath = (p, points) => {
    if (points.length === 1) return dist(p, points[0]);
    let best = Infinity;
    for (let i = 1; i < points.length; i++) {
        best = Math.min(best, pointToSegment(p, points[i - 1], points[i]));
    }
    return best;
};

/**
 * Project routes to screen pixels once (e.g. at drag start) so per-frame hit
 * testing doesn't re-project every route line on every pointer move.
 * @param {{ routeId: string, path: [number, number][] | null, stops: { lat, lng }[] }[]} routes
 * @returns {{ routeId: string, path: {x, y}[], stops: {x, y}[] }[]}
 */
export const projectRoutes = (routes, project) =>
    routes.map((route) => ({
        routeId: route.routeId,
        path: route.path?.length ? route.path.map(project) : [],
        stops: (route.stops || []).filter((s) => !isNaN(s.lat) && !isNaN(s.lng)).map((s) => project([s.lat, s.lng])),
    }));

/** Nearest projected route (line or stop) to pixel point p within maxPx, or null. */
export const findRouteNearProjected = (p, projectedRoutes, maxPx = 30, excludeRouteIds = []) => {
    let bestId = null;
    let bestDist = maxPx;
    projectedRoutes.forEach((route) => {
        if (excludeRouteIds.includes(route.routeId)) return;
        let d = route.path.length ? distanceToPath(p, route.path) : Infinity;
        route.stops.forEach((s) => {
            d = Math.min(d, dist(p, s));
        });
        if (d <= bestDist) {
            bestDist = d;
            bestId = route.routeId;
        }
    });
    return bestId;
};

/**
 * The route whose line or stops are closest to the drop point, within maxPx.
 * @param {[number, number]} latlng
 * @param {{ routeId: string, path: [number, number][], stops: { lat, lng }[] }[]} routes
 * @returns {string | null}
 */
export const findRouteNearPoint = (latlng, routes, project, maxPx = 30, excludeRouteIds = []) =>
    findRouteNearProjected(project(latlng), projectRoutes(routes, project), maxPx, excludeRouteIds);

/**
 * Cheapest-insertion position (1-based stop number) for a point in an ordered
 * stop list: the slot whose detour (prev->p + p->next - prev->next) is smallest.
 */
export const bestInsertionPosition = (latlng, orderedStops, project) => {
    if (!orderedStops.length) return 1;
    const p = project(latlng);
    const pts = orderedStops.map((s) => project([s.lat, s.lng]));
    let bestSlot = 0;
    let bestCost = dist(p, pts[0]);
    for (let slot = 1; slot <= pts.length; slot++) {
        const prev = pts[slot - 1];
        const next = pts[slot];
        const cost = next ? dist(prev, p) + dist(p, next) - dist(prev, next) : dist(prev, p);
        if (cost < bestCost) {
            bestCost = cost;
            bestSlot = slot;
        }
    }
    return bestSlot + 1;
};

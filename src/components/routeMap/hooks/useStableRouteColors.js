import { useCallback, useMemo, useRef } from 'react';
import { ROUTE_COLORS } from '../map/markerIcons';

/**
 * Pure: extend an existing routeId -> palette index assignment with new ids.
 * Known ids keep their colour; a new id (e.g. after a split) takes the first
 * colour no currently-listed route is using, so nothing else changes colour.
 */
export const assignRouteColors = (routeIds, previous = new Map(), paletteSize = ROUTE_COLORS.length) => {
    const next = new Map();
    routeIds.forEach((id) => {
        if (previous.has(id)) next.set(id, previous.get(id));
    });
    routeIds.forEach((id, i) => {
        if (next.has(id)) return;
        const used = new Set(next.values());
        let index = 0;
        while (used.has(index) && index < paletteSize) index++;
        next.set(id, index < paletteSize ? index : i % paletteSize);
    });
    return next;
};

/** colorFor(routeId) that stays stable while routes are added or removed. */
const useStableRouteColors = (routeIds) => {
    const assignmentRef = useRef(new Map());
    const key = routeIds.join(',');

    const assignment = useMemo(() => {
        assignmentRef.current = assignRouteColors(routeIds, assignmentRef.current);
        return assignmentRef.current;
        // key is the value-equality stand-in for routeIds
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    return useCallback((routeId) => ROUTE_COLORS[assignment.get(routeId) ?? 0], [assignment]);
};

export default useStableRouteColors;

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
    useRoutesQuery,
    useRouteStatisticsQuery,
    usePendingRecalcQuery,
    routeDetailsQueryOptions,
    routeGeometryQueryOptions,
} from '../../manageRoute/hooks/useManageRouteQueries';
import { toRoute } from '../editing/model/adapters';

const sumBy = (rows, field, parse) => rows.reduce((sum, row) => sum + (parse(row[field]) || 0), 0);

/**
 * Everything RouteMap loads and derives for one shift: the route list, which
 * routes are visible (and therefore fetched), location filter, totals and
 * load/error state. Details and geometry are fetched per *visible* route and
 * share Manage Route's cache entries.
 *
 * @param {{ sDate, FacilityID, TripType, Shifttimes?, Direction? }} params URL params
 */
const useRouteMapData = (params) => {
    const hasParams = !!(params.sDate && params.FacilityID && params.TripType);
    const shiftTime = params.Shifttimes || '0900';

    const [routeVisible, setRouteVisible] = useState({});
    const [selectedLocation, setSelectedLocation] = useState([]);

    const shift = useMemo(
        () => ({ sDate: params.sDate, facilityId: params.FacilityID, tripType: params.TripType, shiftTime }),
        [params.sDate, params.FacilityID, params.TripType, shiftTime]
    );

    const routesQuery = useRoutesQuery(
        useMemo(
            () => ({
                sDate: shift.sDate,
                eDate: shift.sDate,
                FacilityID: shift.facilityId,
                TripType: shift.tripType,
                Shifttimes: shiftTime,
                OrderBy: 'Colony',
                Direction: params.Direction || 'ASC',
            }),
            [shift, shiftTime, params.Direction]
        ),
        hasParams
    );
    const allRouteMetas = useMemo(
        () => (Array.isArray(routesQuery.data) ? routesQuery.data : []),
        [routesQuery.data]
    );

    const statsQuery = useRouteStatisticsQuery(
        {
            sdate: shift.sDate,
            edate: shift.sDate,
            triptype: shift.tripType,
            facilityid: shift.facilityId,
            shifttime: shiftTime,
        },
        hasParams
    );
    const avgOccupancy = Array.isArray(statsQuery.data) ? statsQuery.data[0]?.AvgOccupancy : undefined;

    const allRouteIds = useMemo(() => allRouteMetas.map((r) => r.RouteID), [allRouteMetas]);
    const pendingRecalcQuery = usePendingRecalcQuery(allRouteIds.join(','));

    // Show the first route on first load.
    const initialisedRef = useRef(false);
    useEffect(() => {
        if (initialisedRef.current || !allRouteMetas.length) return;
        initialisedRef.current = true;
        setRouteVisible({ [allRouteMetas[0].RouteID]: true });
    }, [allRouteMetas]);

    const locationOptions = useMemo(
        () =>
            [...new Set(allRouteMetas.map((r) => r.Location).filter((l) => l && l.trim() !== ''))]
                .sort()
                .map((location) => ({ label: location, value: location })),
        [allRouteMetas]
    );

    const filteredRouteMetas = useMemo(
        () =>
            selectedLocation.length
                ? allRouteMetas.filter((r) => selectedLocation.includes(r.Location))
                : allRouteMetas,
        [allRouteMetas, selectedLocation]
    );

    const visibleIds = useMemo(
        () => filteredRouteMetas.filter((m) => routeVisible[m.RouteID]).map((m) => m.RouteID),
        [filteredRouteMetas, routeVisible]
    );

    const detailQueries = useQueries({ queries: visibleIds.map(routeDetailsQueryOptions) });
    const geometryQueries = useQueries({ queries: visibleIds.map(routeGeometryQueryOptions) });
    // useQueries returns new arrays every render; this string changes only when data does.
    const queriesVersion =
        detailQueries.map((q) => q.dataUpdatedAt).join() + '|' + geometryQueries.map((q) => q.dataUpdatedAt).join();

    /** routeId -> loaded route, for visible routes whose details have arrived. */
    const routesById = useMemo(() => {
        const metaById = Object.fromEntries(allRouteMetas.map((m) => [m.RouteID, m]));
        const out = {};
        visibleIds.forEach((routeId, i) => {
            const details = detailQueries[i]?.data;
            if (!Array.isArray(details) || !metaById[routeId]) return;
            out[routeId] = toRoute(metaById[routeId], details, geometryQueries[i]?.data);
        });
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleIds, allRouteMetas, queriesVersion]);

    /** Sidebar rows: loaded route when available, otherwise just the meta. */
    const displayRoutes = useMemo(
        () =>
            filteredRouteMetas.map(
                (meta) =>
                    routesById[meta.RouteID] ?? {
                        ...meta,
                        routeid: meta.RouteID,
                        routeId: meta.RouteID,
                        stops: [],
                        geometry: null,
                        facility: {},
                        isLocked: meta.isRouteFinalized === 1,
                    }
            ),
        [filteredRouteMetas, routesById]
    );

    /** Routes drawn on the map (a fresh split route has stops but no geometry yet). */
    const routesForMap = useMemo(
        () => visibleIds.map((id) => routesById[id]).filter((r) => r && (r.path || r.stops.length)),
        [visibleIds, routesById]
    );

    const totals = useMemo(
        () => ({
            routes: filteredRouteMetas.length,
            distanceKm: sumBy(filteredRouteMetas, 'totaldist', parseFloat),
            employees: sumBy(filteredRouteMetas, 'totalStop', (v) => parseInt(v, 10)),
            avgOccupancy,
        }),
        [filteredRouteMetas, avgOccupancy]
    );

    const visibility = useMemo(
        () => ({
            isVisible: (routeId) => !!routeVisible[routeId],
            showAll: filteredRouteMetas.length > 0 && visibleIds.length === filteredRouteMetas.length,
            setAll: (checked) =>
                setRouteVisible(Object.fromEntries(filteredRouteMetas.map((m) => [m.RouteID, checked]))),
            toggle: (routeId) => setRouteVisible((prev) => ({ ...prev, [routeId]: !prev[routeId] })),
            show: (routeId) => setRouteVisible((prev) => ({ ...prev, [routeId]: true })),
        }),
        [routeVisible, filteredRouteMetas, visibleIds.length]
    );

    const locationFilter = {
        value: selectedLocation,
        options: locationOptions,
        onChange: (value) => {
            setSelectedLocation(value ?? []);
            setRouteVisible({});
        },
    };

    const firstError =
        routesQuery.error || detailQueries.find((q) => q.error)?.error || geometryQueries.find((q) => q.error)?.error;

    return {
        hasParams,
        shift,
        allRouteIds,
        routesById,
        displayRoutes,
        routesForMap,
        totals,
        visibility,
        locationFilter,
        pendingRecalcCount: pendingRecalcQuery.data ?? 0,
        isLoadingRoutes: hasParams && routesQuery.isLoading,
        isLoadingVisible: visibleIds.some((_, i) => detailQueries[i]?.isPending || geometryQueries[i]?.isPending),
        isReady: routesQuery.isSuccess,
        error: firstError ? firstError.message || 'Error loading routes.' : null,
    };
};

export default useRouteMapData;

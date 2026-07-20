import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MapGeocodingService from '../../../services/compliance/MapGeocodingService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const mapGeocodingKeys = {
    all: ['mapGeocoding'],
    empCount: (locationId) => ['mapGeocoding', 'empCount', locationId],
    notGeocoded: (locationId) => ['mapGeocoding', 'notGeocoded', locationId],
    changeCount: (locationId) => ['mapGeocoding', 'changeCount', locationId],
    facilityGeo: (facilityId) => ['mapGeocoding', 'facilityGeo', facilityId],
    cities: (locationId, isAdmin) => ['mapGeocoding', 'cities', locationId, isAdmin],
    colonies: (city) => ['mapGeocoding', 'colonies', city],
    employees: (searchText, facId, type) => ['mapGeocoding', 'employees', searchText, facId, type],
    empGeo: (empId) => ['mapGeocoding', 'empGeo', empId],
    changeGeo: (empId, changeId) => ['mapGeocoding', 'changeGeo', empId, changeId],
};

// ── Summary cards (reactive; refreshed by the save mutations) ────────────────

export const useEmpCountQuery = (locationId) => {
    return useQuery({
        queryKey: mapGeocodingKeys.empCount(locationId),
        queryFn: async () => toArray(await MapGeocodingService.GetEmpCount({ locationid: locationId })),
        enabled: locationId > 0,
        meta: { errorMessage: 'Failed to load summary counts.' },
    });
};

export const useNotGeocodedQuery = (locationId) => {
    return useQuery({
        queryKey: mapGeocodingKeys.notGeocoded(locationId),
        queryFn: async () =>
            toArray(await MapGeocodingService.GetNotGeoCodedCount({ locationid: locationId })),
        enabled: locationId > 0,
        meta: { errorMessage: 'Failed to load summary counts.' },
    });
};

export const useChangeAddressCountQuery = (locationId) => {
    return useQuery({
        queryKey: mapGeocodingKeys.changeCount(locationId),
        queryFn: async () =>
            toArray(await MapGeocodingService.GetNonGeocodedChangeCount({ locationid: locationId })),
        enabled: locationId > 0,
        meta: { silent: true },
    });
};

// Facility center — map fallback when an employee has no coordinates yet
export const useFacilityGeoQuery = (facilityId) => {
    return useQuery({
        queryKey: mapGeocodingKeys.facilityGeo(facilityId),
        queryFn: async () =>
            toArray(await MapGeocodingService.GetFacilityGeo({ facilityid: facilityId })),
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 10,
        meta: { silent: true },
    });
};

// ── Geocode form lookups (reactive, cascading) ───────────────────────────────

export const useCitiesQuery = (locationId, isAdmin) => {
    return useQuery({
        queryKey: mapGeocodingKeys.cities(locationId, isAdmin),
        queryFn: async () => {
            const cities = toArray(
                await MapGeocodingService.GetGeoCity({ locationid: locationId, IsAdmin: isAdmin })
            );
            return cities.map((c) => ({ label: c.city || c.City, value: c.city || c.City }));
        },
        enabled: locationId > 0,
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });
};

// Colonies follow the city selected in the form — no manual fetch on change
export const useColoniesQuery = (city) => {
    return useQuery({
        queryKey: mapGeocodingKeys.colonies(city),
        queryFn: async () => {
            const colonies = toArray(await MapGeocodingService.GetGeoCityColony({ city }));
            return colonies.map((c) => ({ label: c.colony || c.Colony, value: c.colony || c.Colony }));
        },
        enabled: !!city,
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });
};

// ── Imperative reads ─────────────────────────────────────────────────────────

// Click-driven employee grid (search box or KPI-card drilldown); the component
// owns the empty-result/info toasts, so these stay imperative and silent.
export const fetchEmployees = (queryClient, { locationId, searchText, facId, type, isAdmin }) =>
    queryClient.fetchQuery({
        queryKey: mapGeocodingKeys.employees(searchText, facId, type),
        queryFn: async () => {
            if (facId <= 0) {
                return toArray(
                    await MapGeocodingService.EmpSearch({
                        locationid: locationId,
                        empidname: searchText,
                        IsAdmin: isAdmin,
                    })
                );
            }
            if (type === 1) {
                return toArray(await MapGeocodingService.GetEmployeeByFacility({ facilityid: facId }));
            }
            return toArray(
                await MapGeocodingService.GetEmployeeByFacilityChangeAddress({ facilityid: facId })
            );
        },
        staleTime: 0,
        meta: { silent: true },
    });

// Seeds the editable geocode form — never cached, never auto-refetched
export const fetchEmpGeoDetails = (queryClient, empId) =>
    queryClient.fetchQuery({
        queryKey: mapGeocodingKeys.empGeo(empId),
        queryFn: async () =>
            toArray(await MapGeocodingService.GetEmpGeoDetails({ empid: empId, no: 1 })),
        staleTime: 0,
        gcTime: 0,
        meta: { silent: true },
    });

export const fetchChangeAddressGeo = (queryClient, { empId, changeId }) =>
    queryClient.fetchQuery({
        queryKey: mapGeocodingKeys.changeGeo(empId, changeId),
        queryFn: async () =>
            toArray(await MapGeocodingService.GetChangeAddressEmpGeo({ empid: empId, id: changeId })),
        staleTime: 0,
        gcTime: 0,
        meta: { silent: true },
    });

// ── Mutations (both refresh the summary cards) ───────────────────────────────

export const useSaveGeocodeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => MapGeocodingService.SaveMapGeocode(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mapGeocodingKeys.all });
        },
    });
};

export const useSaveAddressChangeGeocodeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params) => MapGeocodingService.SaveAddressChangeMapGeocode(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: mapGeocodingKeys.all });
        },
    });
};

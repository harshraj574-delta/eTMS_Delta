import { useQuery, useMutation } from '@tanstack/react-query';
import ShiftTimeMasterService from '../../../services/compliance/ShiftTimeMaster';
import AdminScheduleService from '../../../services/compliance/AdminScheduleService';
import parseMaybeJson from '../../../services/parseMaybeJson';

const toArray = (data) => {
    const d = parseMaybeJson(data);
    return Array.isArray(d) ? d : [];
};

export const adminScheduleKeys = {
    all: ['adminSchedule'],
    facilities: (userId) => ['adminSchedule', 'facilities', userId],
    shifts: (facilityId, type, weekday) => ['adminSchedule', 'shifts', facilityId, type, weekday],
    schedule: (empIds, startDate) => ['adminSchedule', 'schedule', empIds, startDate],
};

export const useFacilitiesQuery = (userId) => {
    return useQuery({
        queryKey: adminScheduleKeys.facilities(userId),
        queryFn: async () => {
            const facilities = toArray(
                await ShiftTimeMasterService.SelectFacility({ userid: userId })
            );
            return facilities.map((item) => ({
                label: item.facility || item.facilityName,
                value: item.Id,
            }));
        },
        staleTime: 1000 * 60 * 5,
        meta: { errorMessage: 'Failed to load facilities. Please try again.' },
    });
};

// Shift options per (facility, pick/drop, weekday) — used by the header
// selectors (weekday 2) and every day-wise row; 5-min cache means repeated
// facility picks and "Set All" reuse one fetch.
export const fetchShiftsForAdmin = (queryClient, { facilityId, type, weekday }) =>
    queryClient.fetchQuery({
        queryKey: adminScheduleKeys.shifts(facilityId, type, weekday),
        queryFn: async () =>
            toArray(
                await AdminScheduleService.GetShiftForAdmin({
                    facilityId,
                    type,
                    weekday,
                    ProcessId: 0,
                })
            ),
        staleTime: 1000 * 60 * 5,
        meta: { silent: true },
    });

// Click-driven schedule grid (Submit / after-save refresh)
export const fetchAdminSchedule = (queryClient, { empIds, startDate, locationId }) =>
    queryClient.fetchQuery({
        queryKey: adminScheduleKeys.schedule(empIds, startDate),
        queryFn: async () =>
            toArray(
                await AdminScheduleService.GetAdminSchedule({
                    EmpIds: empIds,
                    StartDate: startDate,
                    locationid: locationId,
                })
            ),
        staleTime: 0,
        meta: { silent: true },
    });

export const useInsertScheduleMutation = () => {
    return useMutation({
        mutationFn: (params) => AdminScheduleService.InsertScheduleAdmin(params),
    });
};

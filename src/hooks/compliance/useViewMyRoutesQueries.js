import { useQuery } from '@tanstack/react-query';
import ViewMyRoutesService from '../../services/compliance/ViewMyRoutesService';

// Query Key Factory
export const viewMyRoutesKeys = {
    all: ['viewMyRoutes'],
    employees: (mgrId) => ['viewMyRoutes', 'employees', mgrId],
    trips: (empId, date) => ['viewMyRoutes', 'trips', empId, date],
    tripDetails: (empId, date, routeId) => ['viewMyRoutes', 'tripDetails', empId, date, routeId],
};

// Employees the manager can view (dropdown options, normalized to {id, name})
export const useAdhocEmployeesQuery = (mgrId) => {
    return useQuery({
        queryKey: viewMyRoutesKeys.employees(mgrId),
        queryFn: async () => {
            const data = await ViewMyRoutesService.GetEmployeeForAdhoc({ mgrid: mgrId });
            return Array.isArray(data)
                ? data.map((item) => ({ id: item.EmployeeID, name: item.EmployeeName }))
                : [];
        },
        enabled: !!mgrId,
        staleTime: 1000 * 60 * 10, // team roster changes rarely
    });
};

// Trips for an employee on a date — refetches automatically when either changes
export const useMyTripsQuery = (empId, date) => {
    return useQuery({
        queryKey: viewMyRoutesKeys.trips(empId, date),
        queryFn: async () => {
            const data = await ViewMyRoutesService.GetMyTrips({
                empid: empId,
                sDate: date,
                eDate: '',
            });
            return Array.isArray(data) ? data : [];
        },
        enabled: !!empId && !!date,
    });
};

// Stop-by-stop details of one route (offcanvas)
export const useTripDetailsQuery = ({ empId, date, routeId }) => {
    return useQuery({
        queryKey: viewMyRoutesKeys.tripDetails(empId, date, routeId),
        queryFn: async () => {
            const data = await ViewMyRoutesService.GetMyRoutesDetails({
                empid: empId,
                sDate: date,
                triptype: '',
                routeid: routeId,
            });
            return Array.isArray(data) ? data : [];
        },
        enabled: !!routeId && !!empId,
        staleTime: 1000 * 60,
    });
};

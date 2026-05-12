import { useQuery, useMutation } from '@tanstack/react-query';
import ComplianceCheckService from '../../services/compliance/ComplianceCheckService';

const service = new ComplianceCheckService();

const parse = (res) => (typeof res === 'string' ? JSON.parse(res) : res);
const toArray = (res) => { const d = parse(res); return Array.isArray(d) ? d : []; };

export const complianceCheckKeys = {
    facilities: (userId) => ['complianceCheck', 'facilities', userId],
    vendors: (facilityId) => ['complianceCheck', 'vendors', facilityId],
    vehicles: (facilityId, vendorId) => ['complianceCheck', 'vehicles', facilityId, vendorId],
    checkData: (params) => ['complianceCheck', 'checkData', params],
};

export const useFacilitiesQuery = (userId) =>
    useQuery({
        queryKey: complianceCheckKeys.facilities(userId),
        queryFn: () => service.SelectFacility({ Userid: userId }).then(toArray),
        enabled: !!userId,
        staleTime: 1000 * 60 * 60,
    });

export const useVendorsQuery = (facilityId) =>
    useQuery({
        queryKey: complianceCheckKeys.vendors(facilityId),
        queryFn: () => service.GetVendorByFac({ facilityid: facilityId }).then(toArray),
        enabled: !!facilityId,
        staleTime: 1000 * 60 * 5,
    });

export const useVehiclesQuery = (facilityId, vendorId) =>
    useQuery({
        queryKey: complianceCheckKeys.vehicles(facilityId, vendorId),
        queryFn: () =>
            service.SelectVehicleByVendor({ FacilityId: facilityId, VendorId: vendorId }).then(toArray),
        enabled: !!facilityId && !!vendorId,
        staleTime: 0,
    });

export const useCompCheckDataQuery = (params, enabled = false) =>
    useQuery({
        queryKey: complianceCheckKeys.checkData(params),
        queryFn: async () => {
            const [checkRes, otherRes] = await Promise.all([
                service.GetCompCheckData(params),
                service.GetCompCheckOther(params),
            ]);
            return {
                checkData: toArray(checkRes),
                otherData: toArray(otherRes),
            };
        },
        enabled: enabled && !!params,
        staleTime: 0,
        gcTime: 0,
    });

export const useSaveComplianceMutation = () =>
    useMutation({
        mutationFn: async ({ mainParams, enrichedRows }) => {
            const mainRes = await service.UpdateCompCheckMain(mainParams);
            const mainArr = toArray(mainRes);
            const refID = Number(mainArr[0]?.ID ?? mainArr[0]?.id ?? 0);

            if (refID > 0) {
                for (const row of enrichedRows) {
                    await service.UpdateCompCheckDetail({
                        RefID: refID,
                        HeadID: row.HeadID,
                        Status: row._status,
                        Remark: row._remark,
                    });
                }
                await service.SendVendorPenalty({ Id: refID });
            }

            return refID;
        },
    });

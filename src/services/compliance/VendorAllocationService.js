import { api } from "../axios/api";

class VendorAllocationService {
    async GetShiftByFacilityType(params) {
        try {
            const response = await api.post("/GetShiftByFacilityType", {
                facid: params.facid,
                type: params.type,
            });
            //console.log("GetShiftByFacilityType response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetShiftByFacilityType:", error);
            throw error;
        }
    }
}
export const vendorAllocationService = new VendorAllocationService();
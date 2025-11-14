import { api } from "../axios/api";

class RepCabComplianceService {
    async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching facility data:", error);
            throw error;
        }

    }
    async GetVendorByFacility(params) {
        try {
            const response = await api.post("/GetVendorByFacility", {
                facilityId: params.facilityId,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching vendor data:", error);
            throw error;
        }
    }

    async RptCabCompliance(params) {
        try {
            const response = await api.post("/RptCabCompliance", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
                tripType: params.tripType,
                vendorIDs: params.vendorIDs,
            })
            return response.data;
        }
        catch (error) {
            console.error("Error fetching Cab Compliance report:", error);
            throw error;
        }
    }

    async RptOperationsPenalty(params) {
        try {
            const response = await api.post("/RptOperationsPenalty", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
                tripType: params.tripType,
                vendorIDs: params.vendorIDs,
            })
            return response.data;
        }
        catch (error) {
            console.error("Error fetching Operations Penalty report:", error);
            throw error;
        }
    }
}
export default new RepCabComplianceService();
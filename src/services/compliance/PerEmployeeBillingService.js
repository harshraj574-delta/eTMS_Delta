import { api } from "../axios/api";

class PerEmployeeBillingService {
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

    async SPR_PerEmployeeCost(params) {
        try {
            const response = await api.post("/SPR_PerEmployeeCost", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
                tripType: "",
                vendorId: "",
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching Per Employee Cost report:", error);
            throw error;
        }
    }

    async SPR_ProcessWiseCost(params) {
        try {
            const response = await api.post("/SPR_ProcessWiseCost", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
                tripType: "",
                vendorId: "",
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching Process Wise Cost report:", error);
            throw error;
        }
    }
}
export default new PerEmployeeBillingService();
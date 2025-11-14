import { api } from "../axios/api";

class RepNoShow {
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

    async RptNoshow(params) {
        try {
            const response = await api.post("/RptNoshow", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
                tripType: params.tripType,
                category: 0,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching No Show report:", error);
            throw error;
        }
    }
}
export default new RepNoShow();
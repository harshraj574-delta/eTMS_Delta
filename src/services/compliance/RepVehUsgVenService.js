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

    async RptVehUsgVen(params) {
        try {
            const response = await api.post("/RptVehUsgVen", {
                sDate: params.sDate,
                eDate: params.eDate,
                facilityId: params.facilityId,
                tripType: params.tripType,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching Vehicle Usage Vendor report:", error);
            throw error;
        }
    }
}
export default new RepNoShow();
import { api } from "../axios/api";

class ExportRouteDetailService {
     async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching facility data:", error);
            throw error;
        }

    }

    async SelectAllFacilitys() {
        try {
            const response = await api.post("/SelectAllFacilitys");
            // console.log("SelectAllFacilitys response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in SelectAllFacilitys:", error);
            throw error;
        }
    }

    async RptRouteDetail(params) {
        try {
            const response = await api.post("/RptRouteDetail", {
                sDate: params.sDate,
                eDate: params.eDate,
                shift: params.shift,
                facilityid: params.facilityid,
                triptype: params.triptype
            })
            return response.data;
        }
        catch (error) {
            console.error("Error fetching route detail data:", error);
            throw error;
        }
    }
}

export default new ExportRouteDetailService();
import { api } from "../axios/api";

class RouteDeletionService {
    async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid,
            });
            //console.log("Fetched Facilities:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in GetFacility:", error);
            throw error;
        }
    }
    async GetShiftByFacilityType(params) {
        try {
            const response = await api.post("/GetShiftByFacilityType", {
                facid: params.facid,
                type: params.type,
            })
            return response.data;
        } catch (error) {
            console.error("Error in GetShiftByFacilityType:", error);
            throw error;
        }
    }
    async DeleteRoutes(params) {
        try {
            const response = await api.post("/DeleteRoutes", {
                sDate: params.sDate,
                FacilityID: params.FacilityID,
                TripType: params.TripType,
                Shifttimes: params.Shifttimes,
                RouteID: params.RouteID,
                EmpID: params.EmpID,
                uname: params.uname,
            })
            return response.data;
        } catch (error) {
            console.error("Error in DeleteRoutes:", error);
            throw error;
        }
    }
}
export default new RouteDeletionService();
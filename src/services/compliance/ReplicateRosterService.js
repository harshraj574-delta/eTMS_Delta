import { api } from "../axios/api";

class ReplicateRosterService {
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
    async ReplicateRoster(params){
        try {
            const response = await api.post("/ReplicateRoster", {
                CopyFromDate: params.CopyFromDate,
                CopyToDate: params.CopyToDate,
                facilityid: params.facilityid,
                ShiftTime: params.ShiftTime,
                TripType: params.TripType,
                uname: params.uname,
                isvendor: params.isvendor
            })
            return response.data;
        } catch (error) {
            console.error("Error in ReplicateRoster:", error);
            throw error;
        }
    }
    async GetExceptionCount(params){
        try {
            const response = await api.post("/GetExceptionCount", {
                CopyFromDate: params.CopyFromDate,
                CopyToDate: params.CopyToDate,
                facilityid: params.facilityid,
                ShiftTime: params.ShiftTime,
                TripType: params.TripType
            })
            return response.data;
        } catch (error) {
            console.error("Error in GetExceptionCount:", error);
            throw error;
        }
    }
       
}

export default new ReplicateRosterService();
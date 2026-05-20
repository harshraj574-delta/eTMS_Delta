import { api } from "../axios/api";


class ExportRoster {
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

    async GetShiftByFacilityType(params) {
        try {
            const response = await api.post("/GetShiftByFacilityType", {
                facid: params.facid,
                type: params.type
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching shift data:", error);
            throw error;
        }
    }

    async ExportRoster(params) {
        try {
            const response = await api.post("/ExportRoster", {
                sDate: params.sDate,
                eDate: params.eDate,
                FacilityID: params.FacilityID,
                rType: params.rType,
                ShiftTimes: params.ShiftTimes,
                isActive: params.isActive
            })
            return response.data;
        } catch (error) {
            console.error("Error exporting roster data:", error);
            throw error;
        }
    }
}

export default new ExportRoster();
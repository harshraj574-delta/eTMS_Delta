import { api } from "../axios/api";

class ShiftTimeMasterAdhocService {
    async SelectFacility(params) {
        try {
            const response = await api.post("/SelectFacility", {
                Userid: params.Userid,
            });
            return response.data; // Return the actual data from the response
        } catch (error) {
            console.error("Error in GetFacility:", error);
            throw error;
        }
    }
    async GetAdhocShiftTime(params) {
        try {
            const response = await api.post("/GetAdhocShiftTime", {
                facilityId: params.facilityId,
                TripType: params.TripType,
                Shifttype: params.Shifttype
            });
            return response.data;
        } catch (error) {
            console.error("Error in GetAdhocShiftTime:", error);
            throw error;
        }
    }
    async AddShiftTime(params) {
        try {
            const response = await api.post("/AddShiftTime", {
                shiftTime: params.shiftTime,
                facilityId: params.facilityId,
                shiftType: params.shiftType,
                Day: params.Day,
                buffer: params.buffer,
                type: params.type,
                DayLight: params.DayLight,
                WeekEndType: params.WeekEndType,
                ProcessIds: params.ProcessIds,
                UpdatedBy: params.UpdatedBy,
                Zone: params.Zone,
            });
            return response.data;
        } catch (error) {
            console.error("Error in AddShiftTime:", error);
            throw error;
        }
    }
    async DeleteShiftTime(params) {
        try {
            const response = await api.post("/DeleteShiftTime", {
                ShiftTimeId: params.ShiftTimeId,
                ProcessId: params.ProcessId,
                FacilityId: params.FacilityId,
            });
            return response.data;
        } catch (error) {
            console.error("Error in DeleteShiftTime:", error);
            throw error;
        }
    }
    async UpdateShiftTime(params) {
        try {
            const response = await api.post("/UpdateShiftTime", {
                shiftTime: params.shiftTime,
                facilityId: params.facilityId,
                shiftType: params.shiftType,
                Day: params.Day,
                ID: params.ID,
                buffer: params.buffer,
                type: params.type,
                DayLight: params.DayLight,
                WeekEndType: params.WeekEndType,
                ProcessIds: params.ProcessIds,
                UpdatedBy: params.UpdatedBy,
                Zone: params.Zone,
            });
            return response.data;
        } catch (error) {
            console.error("Error in UpdateShiftTime:", error);
            throw error;
        }
    }
}
export default new ShiftTimeMasterAdhocService();
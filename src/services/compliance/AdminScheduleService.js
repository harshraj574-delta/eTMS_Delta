import { api } from "../axios/api";

class AdminScheduleService {
    async GetAdminSchedule(params) {
        try {
            const response = await api.post("/GetAdminSchedule", {
                EmpIds: params.EmpIds,
                StartDate: params.StartDate,
                locationid: params.locationid,
            })
            // console.log("Admin Schedule Response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching admin schedule:", error);
            throw error;
        }
    }
    async GetShiftForAdmin(params) {
        try {
            const response = await api.post("/GetShiftForAdmin", {
                facilityId: params.facilityId,
                type: params.type,
                weekday: params.weekday,
                ProcessId: params.ProcessId,
            })
            return response.data;
        } catch (error) {
            console.error("Error fetching shift for admin:", error);
            throw error;
        }
    }
    async InsertScheduleAdmin(params) {
        try {
            const response = await api.post("/InsertScheduleAdmin", {
                EmpIds: params.EmpIds,
                StartDate: params.StartDate,
                StartTime: params.StartTime,
                EndDate: params.EndDate,
                EndTime: params.EndTime,
                userName: params.userName,
                updationTime: params.updationTime,
                LeaveCode: params.LeaveCode,
                updationTimeDrop: params.updationTimeDrop,
                pickFacilityID: params.pickFacilityID,
                dropFacilityID: params.dropFacilityID,
                pickadflag: params.pickadflag,
                dropadflag: params.dropadflag,
            })
            return response.data;
        } catch (error) {
            console.error("Error Inserting Schedule for admin:", error);
            throw error;
        }
    }
}
export default new AdminScheduleService();
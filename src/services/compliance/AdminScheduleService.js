import { api } from "../axios/api";

class AdminScheduleService {
    async GetAdminSchedule(params) {
        try {
            const response = await api.post("/GetAdminSchedule", {
                EmpIds: params.EmpIds,
                StartDate: params.StartDate,
                locationid: params.locationid,
            })
            console.log("Admin Schedule Response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error fetching admin schedule:", error);
            throw error;
        }
    }
}
export default new AdminScheduleService();